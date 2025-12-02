import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyToken } from 'https://deno.land/x/jose@v4.14.4/index.ts';

const CLERK_PEM_PUBLIC_KEY = Deno.env.get('CLERK_PEM_PUBLIC_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
    // CORS headers
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            },
        });
    }

    try {
        // 1. Verify Clerk JWT
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        const token = authHeader.replace('Bearer ', '');

        let clerkUserId: string;
        try {
            const publicKey = await crypto.subtle.importKey(
                'spki',
                new TextEncoder().encode(CLERK_PEM_PUBLIC_KEY),
                { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
                false,
                ['verify']
            );

            const { payload } = await verifyToken(token, publicKey);
            clerkUserId = payload.sub as string;

            if (!clerkUserId) {
                throw new Error('No user ID in token');
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        // 2. Create Supabase client with service role (bypasses RLS)
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 3. Check if user exists and if they've already claimed the free box
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, username, balance, free_box_claimed')
            .eq('id', clerkUserId)
            .single();

        if (userError) {
            console.error('Error fetching user:', userError);
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        // 4. Validate that the free box hasn't been claimed
        if (user.free_box_claimed) {
            return new Response(JSON.stringify({
                error: 'Free box already claimed',
                alreadyClaimed: true
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        // 5. Award the $10 voucher and mark as claimed (atomic transaction)
        const newBalance = parseFloat(user.balance) + 10;

        const { error: updateError } = await supabase
            .from('users')
            .update({
                balance: newBalance,
                free_box_claimed: true
            })
            .eq('id', clerkUserId)
            .eq('free_box_claimed', false); // Ensure it hasn't been claimed in a race condition

        if (updateError) {
            console.error('Error updating user:', updateError);
            return new Response(JSON.stringify({ error: 'Failed to claim free box' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        // 6. Return success with the winning item details
        const winningItem = {
            id: 'pc12',
            name: 'LootVibe $10 Voucher',
            value: 10,
            rarity: 'COMMON',
            image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pc12.webp'
        };

        return new Response(JSON.stringify({
            success: true,
            item: winningItem,
            newBalance,
            rollResult: {
                item: winningItem,
                serverSeed: 'welcome-bonus-seed',
                serverSeedHash: 'hashed-welcome-seed',
                nonce: 0,
                randomValue: 0.5,
                block: { height: 840000, hash: '0000000000000000000mockhash' }
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }
});
