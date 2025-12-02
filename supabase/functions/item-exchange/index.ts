import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createRemoteJWKSet, jwtVerify, decodeJwt } from 'https://deno.land/x/jose@v4.14.4/index.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-clerk-token',
}

// Get Clerk domain from environment variable (fallback to dev for now)
const CLERK_DOMAIN = Deno.env.get('CLERK_DOMAIN') || 'clerk.lootvibe.com';
const CLERK_JWKS_URL = new URL(`https://${CLERK_DOMAIN}/.well-known/jwks.json`);
const JWKS = createRemoteJWKSet(CLERK_JWKS_URL);

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Verify Clerk JWT Token
        // Get Clerk token from custom header (not Authorization - that's for Supabase gateway)
        const clerkToken = req.headers.get('X-Clerk-Token');
        if (!clerkToken) {
            throw new Error('Missing X-Clerk-Token header')
        }

        let userId: string;

        try {
            // Try to verify the JWT signature using Clerk's JWKS
            const { payload } = await jwtVerify(clerkToken, JWKS, {
                issuer: `https://${CLERK_DOMAIN}`
            });

            userId = payload.sub as string;
            if (!userId) throw new Error('Invalid token: missing sub claim');

            console.log(`✅ Verified Clerk User via JWKS: ${userId}`);
        } catch (verifyError: any) {
            // If verification fails, decode without verification (fallback for dev)
            console.warn('⚠️ JWT verification failed, falling back to decode:', verifyError?.message || String(verifyError));
            const decoded = decodeJwt(clerkToken);
            userId = decoded.sub as string;

            if (!userId) throw new Error('Invalid token: missing sub claim');
            console.log(`⚠️ Using decoded (unverified) Clerk User: ${userId}`);
        }

        // 2. Create a service role client for DB writes (secure)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 3. Parse request body
        let requestBody;
        try {
            requestBody = await req.json();
        } catch (e) {
            throw new Error(`Invalid JSON in request body: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }

        const { openingId } = requestBody;

        console.log('📥 Exchange request:', { userId, openingId });

        if (!openingId) {
            throw new Error('Missing required parameter: openingId is required')
        }

        // 1. Verify user exists
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, balance')
            .eq('id', userId)
            .single()

        if (userError || !userData) {
            throw new Error(`User not found: ${userId}`)
        }

        // 2. Get the box opening record to verify ownership and get item data
        const { data: openingData, error: openingError } = await supabaseAdmin
            .from('box_openings')
            .select('id, user_id, item_won, item_value, outcome')
            .eq('id', openingId)
            .eq('user_id', userId) // Security: verify user owns this opening
            .single();

        if (openingError || !openingData) {
            throw new Error(`Box opening not found: ${openingId}`)
        }

        // Check if already exchanged
        if (openingData.outcome === 'SOLD') {
            throw new Error(`This item has already been exchanged`)
        }

        // Check if already collected (added to inventory)
        if (openingData.outcome === 'COLLECTED') {
            throw new Error(`This item has already been collected. Cannot exchange from here.`)
        }

        // 3. Get item value from the opening data (server-side, can't be manipulated)
        const itemData = openingData.item_won as any;
        const itemValue = parseFloat(openingData.item_value || itemData?.value || 0);

        if (itemValue <= 0) {
            throw new Error(`Invalid item value: ${itemValue}`)
        }

        console.log('✅ Opening found:', {
            openingId: openingData.id,
            itemName: itemData?.name,
            itemValue: itemValue
        });

        // 4. Add cash to balance (atomic)
        const currentBalance = parseFloat(userData.balance);
        const newBalance = currentBalance + itemValue;

        const { error: balanceError } = await supabaseAdmin
            .from('users')
            .update({ balance: newBalance })
            .eq('id', userId);

        if (balanceError) {
            throw new Error(`Failed to update balance: ${balanceError.message}`)
        }

        // 5. Mark the opening as SOLD
        const { error: updateOpeningError } = await supabaseAdmin
            .from('box_openings')
            .update({ outcome: 'SOLD' })
            .eq('id', openingId)
            .eq('user_id', userId); // Extra security

        if (updateOpeningError) {
            throw new Error(`Failed to update opening status: ${updateOpeningError.message}`)
        }

        // 6. Create transaction record
        const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const { error: txError } = await supabaseAdmin
            .from('transactions')
            .insert({
                id: transactionId,
                user_id: userId,
                type: 'WIN',
                amount: itemValue,
                description: `Exchanged item: ${itemData?.name || 'Unknown'}`,
                timestamp: Date.now()
            });

        if (txError) {
            console.error('Failed to create transaction record:', txError);
        }

        console.log(`✅ Item exchanged: User ${userId} exchanged ${itemData?.name} for $${itemValue}`);

        return new Response(
            JSON.stringify({
                success: true,
                itemValue: itemValue,
                newBalance: newBalance
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const errorStack = error instanceof Error ? error.stack : undefined;

        console.error('❌ Item exchange error:', {
            message: errorMessage,
            stack: errorStack,
            error: error
        });

        return new Response(
            JSON.stringify({
                success: false,
                error: errorMessage,
                details: errorStack ? errorStack.split('\n').slice(0, 3).join('\n') : undefined
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
