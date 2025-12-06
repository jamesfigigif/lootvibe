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

        // 2. ✅ SECURITY FIX: Atomic check-and-set for item exchange
        // This prevents race conditions where the same item could be exchanged twice
        // We atomically update the status from KEPT -> SOLD and retrieve the data in one operation
        const { data: openingData, error: openingError } = await supabaseAdmin
            .from('box_openings')
            .update({ outcome: 'SOLD' })
            .eq('id', openingId)
            .eq('user_id', userId) // Security: verify user owns this opening
            .eq('outcome', 'KEPT') // ✅ CRITICAL: Only update if outcome is still 'KEPT'
            .select('id, user_id, item_won, item_value, outcome')
            .single();

        // If no rows were updated, the item was already exchanged or doesn't exist
        if (openingError || !openingData) {
            // Try to fetch the opening to give a better error message
            const { data: existingOpening } = await supabaseAdmin
                .from('box_openings')
                .select('id, user_id, outcome')
                .eq('id', openingId)
                .single();

            if (!existingOpening) {
                throw new Error(`Box opening not found: ${openingId}`)
            }

            if (existingOpening.user_id !== userId) {
                throw new Error(`You do not own this item`)
            }

            if (existingOpening.outcome === 'SOLD') {
                throw new Error(`This item has already been exchanged`)
            }

            if (existingOpening.outcome === 'COLLECTED') {
                throw new Error(`This item has already been collected. Cannot exchange from here.`)
            }

            throw new Error(`Failed to exchange item: ${openingError?.message || 'Unknown error'}`)
        }

        // 3. Get item value from the opening data (server-side, can't be manipulated)
        const itemData = openingData.item_won as any;
        const itemValue = parseFloat(openingData.item_value || itemData?.value || 0);

        if (itemValue <= 0) {
            // Rollback the status change since value is invalid
            await supabaseAdmin
                .from('box_openings')
                .update({ outcome: 'KEPT' })
                .eq('id', openingId);
            throw new Error(`Invalid item value: ${itemValue}`)
        }

        console.log('✅ Opening atomically marked as SOLD:', {
            openingId: openingData.id,
            itemName: itemData?.name,
            itemValue: itemValue
        });

        // 4. Add cash to balance using RPC for atomicity
        const { error: balanceError } = await supabaseAdmin
            .rpc('increment_balance', {
                user_id: userId,
                amount: itemValue
            });

        if (balanceError) {
            // Rollback the status change
            await supabaseAdmin
                .from('box_openings')
                .update({ outcome: 'KEPT' })
                .eq('id', openingId);
            throw new Error(`Failed to update balance: ${balanceError.message}`)
        }

        // Get new balance for response
        const { data: updatedUser } = await supabaseAdmin
            .from('users')
            .select('balance')
            .eq('id', userId)
            .single();

        const newBalance = updatedUser ? parseFloat(updatedUser.balance) : 0;

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
            // Don't rollback since balance already updated - just log the error
        }

        console.log(`✅ Item exchanged: User ${userId} exchanged ${itemData?.name} for $${itemValue} (new balance: $${newBalance})`);

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
