import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { importSPKI, jwtVerify } from 'https://deno.land/x/jose@v4.14.4/index.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CLERK_PEM_PUBLIC_KEY = Deno.env.get('CLERK_PEM_PUBLIC_KEY')!;

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Verify Clerk Token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');

        const token = authHeader.replace('Bearer ', '');
        let userId: string;

        try {
            // Import the PEM public key
            const publicKey = await importSPKI(CLERK_PEM_PUBLIC_KEY, 'RS256');

            // Verify the JWT token
            const { payload } = await jwtVerify(token, publicKey);
            userId = payload.sub as string;

            if (!userId) throw new Error('Invalid token: missing sub claim');
            console.log(`✅ Verified Clerk User: ${userId}`);
        } catch (verifyError: any) {
            console.error('Token verification failed:', verifyError);
            throw new Error('Invalid token');
        }

        // 2. Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { battleId, prizeChoice, amount, items } = await req.json();
        if (!battleId || !prizeChoice) throw new Error('Missing required parameters');

        console.log(`Processing claim for User ${userId}, Battle ${battleId}, Type: ${prizeChoice}`);

        // ✅ SECURITY FIX: Verify user is the winner of this battle
        const { data: battle, error: battleError } = await supabaseAdmin
            .from('battles')
            .select('id, winner_id, status, price, player_count')
            .eq('id', battleId)
            .single();

        if (battleError || !battle) {
            throw new Error('Battle not found');
        }

        // Verify battle is finished
        if (battle.status !== 'FINISHED') {
            throw new Error('Battle is not finished yet');
        }

        // Verify user is the winner
        if (battle.winner_id !== userId) {
            console.error(`❌ Unauthorized claim attempt: User ${userId} tried to claim Battle ${battleId} (winner: ${battle.winner_id})`);
            throw new Error('You are not the winner of this battle');
        }

        // Check if prize already claimed
        const { data: existingClaim } = await supabaseAdmin
            .from('battle_results')
            .select('claimed')
            .eq('battle_id', battleId)
            .eq('winner_id', userId)
            .single();

        if (existingClaim && existingClaim.claimed) {
            throw new Error('Prize already claimed');
        }

        console.log(`✅ Verified: User ${userId} is winner of Battle ${battleId}`);

        if (prizeChoice === 'cash') {
            if (!amount || amount <= 0) throw new Error('Invalid amount');

            const { error: txError } = await supabaseAdmin.from('transactions').insert({
                id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                user_id: userId,
                type: 'WIN',
                amount: amount,
                description: `Battle victory prize (Battle ID: ${battleId})`,
                timestamp: Date.now()
            });

            if (txError) throw txError;

            const { data: userData, error: userError } = await supabaseAdmin
                .from('users').select('balance').eq('id', userId).single();

            if (userError) {
                console.error('User not found in Supabase:', userId);
                throw new Error('User not found');
            }

            const newBalance = (parseFloat((userData as any).balance) || 0) + amount;
            const { error: updateError } = await supabaseAdmin
                .from('users').update({ balance: newBalance }).eq('id', userId);
            if (updateError) throw updateError;

        } else if (prizeChoice === 'items') {
            if (!items || !Array.isArray(items) || items.length === 0) throw new Error('Invalid items');

            const inventoryInserts = items.map((item: any) => ({
                id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                user_id: userId,
                item_data: item,
                created_at: new Date().toISOString()
            }));

            const { error: invError } = await supabaseAdmin.from('inventory_items').insert(inventoryInserts);
            if (invError) throw invError;
        } else {
            throw new Error('Invalid prize choice');
        }

        // ✅ Mark prize as claimed in battle_results table
        await supabaseAdmin
            .from('battle_results')
            .update({ claimed: true })
            .eq('battle_id', battleId)
            .eq('winner_id', userId);

        console.log(`✅ Prize claimed successfully for Battle ${battleId} by User ${userId}`);

        return new Response(
            JSON.stringify({ success: true, message: 'Prize claimed successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Claim error:', error);
        return new Response(
            JSON.stringify({ success: false, error: error?.message ?? String(error) }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
