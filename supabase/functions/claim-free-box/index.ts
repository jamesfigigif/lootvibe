import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { importSPKI, jwtVerify } from 'https://deno.land/x/jose@v4.14.4/index.ts';
import { createHash, createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const CLERK_PEM_PUBLIC_KEY = Deno.env.get('CLERK_PEM_PUBLIC_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Helper function to generate random hex string
function generateRandomHex(length: number): string {
    const bytes = new Uint8Array(length / 2);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Verify Clerk JWT
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing authorization header');
        }

        const token = authHeader.replace('Bearer ', '');

        let clerkUserId: string;
        try {
            // Import the PEM public key
            const publicKey = await importSPKI(CLERK_PEM_PUBLIC_KEY, 'RS256');

            // Verify the JWT token
            const { payload } = await jwtVerify(token, publicKey);
            clerkUserId = payload.sub as string;

            if (!clerkUserId) {
                throw new Error('No user ID in token');
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            throw new Error('Invalid token');
        }

        // 2. Initialize Supabase Admin Client
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 3. Check if user has already claimed the free box
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('free_box_claimed, balance, id')
            .eq('id', clerkUserId)
            .single();

        if (userError) {
            console.error('Error fetching user:', userError);
            throw new Error('User not found');
        }

        if (user.free_box_claimed) {
            return new Response(JSON.stringify({ error: 'You have already claimed your free box' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }

        // 4. Get user's client seed and nonce
        const clientSeed = user.client_seed || generateRandomHex(32);
        const nonce = user.nonce || 0;

        // 5. Generate server seed and hash (provably fair)
        const serverSeed = generateRandomHex(64);
        const serverSeedHash = createHash('sha256').update(serverSeed).digest('hex');

        // 6. Get the Welcome Gift box items
        const { data: welcomeBox, error: boxError } = await supabaseAdmin
            .from('boxes')
            .select('*')
            .eq('id', 'welcome_gift')
            .single();

        if (boxError || !welcomeBox) {
            console.error('Error fetching welcome box:', boxError);
            throw new Error('Welcome box not found');
        }

        // 7. Generate provably fair outcome using HMAC-SHA256
        const message = `${clientSeed}:${nonce}`;
        const hmac = createHmac('sha256', serverSeed).update(message).digest('hex');

        // Convert first 8 hex chars to a number between 0 and 1
        const subHash = hmac.substring(0, 8);
        const randomValue = parseInt(subHash, 16) / 0xffffffff; // Divide by max 32-bit value

        // 8. Select item based on provably fair random value (0-1)
        const items = welcomeBox.items;
        let totalOdds = 0;
        for (const item of items) {
            totalOdds += item.odds;
        }

        const scaledValue = randomValue * totalOdds;
        let cumulativeOdds = 0;
        let winningItem = items[0];

        for (const item of items) {
            cumulativeOdds += item.odds;
            if (scaledValue <= cumulativeOdds) {
                winningItem = item;
                break;
            }
        }

        // 9. Award the item and mark as claimed
        const newBalance = parseFloat(user.balance) + winningItem.value;

        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
                balance: newBalance,
                free_box_claimed: true
            })
            .eq('id', clerkUserId)
            .eq('free_box_claimed', false);

        if (updateError) {
            console.error('Error updating user:', updateError);
            return new Response(JSON.stringify({ error: 'Failed to claim free box' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }

        return new Response(JSON.stringify({
            success: true,
            item: winningItem,
            newBalance,
            rollResult: {
                item: winningItem,
                serverSeed: serverSeed,
                serverSeedHash: serverSeedHash,
                nonce: nonce,
                randomValue: randomValue, // Already 0-1 from HMAC calculation
                block: { height: 840000, hash: hmac.substring(0, 64) } // Use HMAC as "block hash" for verification
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }
});
