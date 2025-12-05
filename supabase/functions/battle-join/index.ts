import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { importSPKI, jwtVerify } from 'https://deno.land/x/jose@v4.14.4/index.ts';

const CLERK_PEM_PUBLIC_KEY = Deno.env.get('CLERK_PEM_PUBLIC_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Verify Clerk JWT
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            console.error('❌ Missing authorization header');
            return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }

        const token = authHeader.replace('Bearer ', '');
        let clerkUserId: string;

        try {
            const publicKey = await importSPKI(CLERK_PEM_PUBLIC_KEY, 'RS256');
            const { payload } = await jwtVerify(token, publicKey);
            clerkUserId = payload.sub as string;

            if (!clerkUserId) {
                throw new Error('No user ID in token');
            }
            console.log('✅ Token verified for user:', clerkUserId);
        } catch (error) {
            console.error('❌ Token verification failed:', error);
            return new Response(JSON.stringify({ error: 'Invalid token', details: error.message }), {
                status: 401,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }

        // 2. Initialize Supabase Admin Client
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 3. Get request body
        const { battleId } = await req.json();

        if (!battleId) {
            throw new Error('Missing battleId');
        }

        // 4. Get battle details
        const { data: battle, error: battleError } = await supabaseAdmin
            .from('battles')
            .select('*')
            .eq('id', battleId)
            .single();

        if (battleError || !battle) {
            throw new Error('Battle not found');
        }

        // Parse players
        const players = typeof battle.players === 'string' ? JSON.parse(battle.players) : battle.players;

        // 5. Check if user already in battle
        if (players.some((p: any) => p?.id === clerkUserId)) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Already in this battle'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }

        // 6. Check if battle is full
        const emptyIndex = players.findIndex((p: any) => p === null);
        if (emptyIndex === -1) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Battle is full'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }

        const cost = parseFloat(battle.price);

        // 7. Get user and check balance
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', clerkUserId)
            .single();

        if (userError || !user) {
            throw new Error('User not found');
        }

        const currentBalance = parseFloat(user.balance);
        if (currentBalance < cost) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Insufficient funds',
                required: cost,
                current: currentBalance
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }

        // 8. Deduct balance
        const newBalance = currentBalance - cost;
        const { error: balanceError } = await supabaseAdmin
            .from('users')
            .update({ balance: newBalance })
            .eq('id', clerkUserId);

        if (balanceError) {
            console.error('Error updating balance:', balanceError);
            throw new Error('Failed to deduct balance');
        }

        // 9. Create transaction record
        const battleType = battle.player_count === 2 ? '1v1' : battle.player_count === 4 ? '2v2' : '3v3';
        const { error: txError } = await supabaseAdmin
            .from('transactions')
            .insert({
                id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                user_id: clerkUserId,
                type: 'BET',
                amount: cost,
                description: `Battle entry: ${battle.round_count} round${battle.round_count > 1 ? 's' : ''} - ${battleType}`,
                timestamp: Date.now()
            });

        if (txError) {
            console.error('Error creating transaction:', txError);
            // Continue anyway - balance already deducted
        }

        // 10. Add user to battle
        players[emptyIndex] = {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            balance: newBalance,
            inventory: [],
            shipments: []
        };

        const isNowFull = players.every((p: any) => p !== null);
        const newStatus = isNowFull ? 'ACTIVE' : 'WAITING';

        const { error: updateError } = await supabaseAdmin
            .from('battles')
            .update({
                players: JSON.stringify(players),
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', battleId);

        if (updateError) {
            console.error('Error updating battle:', updateError);
            throw new Error('Failed to join battle');
        }

        console.log(`✅ User ${clerkUserId} joined battle ${battleId}`);

        return new Response(JSON.stringify({
            success: true,
            battle: {
                ...battle,
                players,
                status: newStatus
            },
            newBalance
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Internal server error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }
});
