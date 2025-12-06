import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHash, createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
        // Create Supabase client (matches box-open pattern)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // Create a service role client for DB writes (secure)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Parse request body (userId comes from body, like box-open)
        let requestBody;
        try {
            requestBody = await req.json();
        } catch (e) {
            requestBody = {};
        }

        const { userId } = requestBody;

        if (!userId) {
            throw new Error('Missing userId parameter');
        }

        console.log('🎁 Claim free box request for user:', userId);

        // Check if user has already claimed the free box
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('free_box_claimed, balance, id, client_seed, nonce, server_seed_hash')
            .eq('id', userId)
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

        // Get user's client seed and nonce
        const clientSeed = user.client_seed || generateRandomHex(32);
        const nonce = user.nonce || 0;

        // Generate server seed and hash (provably fair)
        const serverSeed = generateRandomHex(64);
        const serverSeedHash = createHash('sha256').update(serverSeed).digest('hex');

        // Get the Welcome Gift box items
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

        // 9. Mark as claimed and update provably fair state (DO NOT add balance yet)
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
                free_box_claimed: true,
                client_seed: clientSeed, // Store the seed that was used
                nonce: nonce + 1, // Increment nonce for next roll
                server_seed_hash: serverSeedHash // Store hash for provably fair verification
            })
            .eq('id', userId)
            .eq('free_box_claimed', false);

        if (updateError) {
            console.error('Error updating user:', updateError);
            return new Response(JSON.stringify({ error: 'Failed to claim free box' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }

        // 10. Create opening record (for item-exchange edge function to use later)
        const openingId = `opening_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const { error: openingError } = await supabaseAdmin
            .from('box_openings')
            .insert({
                id: openingId,
                box_id: 'welcome_gift',
                user_id: userId,
                item_won: winningItem,
                box_price: 0, // Free box
                item_value: winningItem.value,
                profit_loss: winningItem.value, // All profit since box is free
                client_seed: clientSeed,
                server_seed: serverSeed,
                nonce: nonce,
                random_value: randomValue,
                outcome: 'KEPT', // Default to KEPT (added to inventory)
                created_at: new Date().toISOString()
            });

        if (openingError) {
            console.error('Failed to save box opening:', openingError);
            // Don't fail the request, just log it
        }

        // 11. Add item to inventory (user can exchange for balance later via item-exchange)
        const inventoryId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const { error: invError } = await supabaseAdmin
            .from('inventory_items')
            .insert({
                id: inventoryId,
                user_id: userId,
                item_data: winningItem,
                created_at: new Date().toISOString()
            });

        if (invError) {
            console.error('Failed to add item to inventory:', invError);
            // Don't fail the request
        }

        return new Response(JSON.stringify({
            success: true,
            item: winningItem,
            newBalance: parseFloat(user.balance), // Current balance (unchanged)
            rollResult: {
                item: winningItem,
                serverSeed: serverSeed,
                serverSeedHash: serverSeedHash,
                clientSeed: clientSeed,
                nonce: nonce,
                randomValue: randomValue,
                openingId: openingId, // CRITICAL: Return openingId for item-exchange
                block: { height: 840000, hash: hmac.substring(0, 64) }
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
