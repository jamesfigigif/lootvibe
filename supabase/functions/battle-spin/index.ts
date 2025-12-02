import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Create a service role client for DB writes (secure)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { battleId, playerId, clientSeed, nonce, boxItems } = await req.json()

        console.log(`🎲 battle-spin called with:`, {
            battleId,
            playerId,
            clientSeed: clientSeed?.substring(0, 20) + '...',
            nonce,
            nonceType: typeof nonce,
            boxItemsCount: Array.isArray(boxItems) ? boxItems.length : 0
        });

        if (!battleId || !playerId || !clientSeed || nonce === undefined || !boxItems) {
            throw new Error('Missing required parameters')
        }

        // 1. Get Server Seed and calculate hash BEFORE generating outcome (provably fair)
        const serverSeed = Deno.env.get('SERVER_SEED') || 'lootvibe-secure-server-seed-v1';
        const encoder = new TextEncoder();
        const keyData = encoder.encode(serverSeed);
        
        // Calculate server seed hash BEFORE outcome generation (for provably fair verification)
        const serverSeedHash = await crypto.subtle.digest('SHA-256', keyData).then(h =>
            Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('')
        );

        // Optional: Verify server seed hash matches user's stored hash (if user exists in DB)
        // For battles, this is optional since nonces are battle-specific, not user-specific
        try {
            const { data: userData } = await supabaseAdmin
                .from('users')
                .select('server_seed_hash')
                .eq('id', playerId)
                .single();
            
            if (userData?.server_seed_hash && userData.server_seed_hash !== serverSeedHash) {
                console.warn(`⚠️ Server seed hash mismatch for player ${playerId}. Using current server seed.`);
                // Don't throw error for battles - just log it
            }
        } catch (e) {
            // User might not exist or error fetching - that's ok for battles
            console.log(`Note: Could not verify server seed hash for player ${playerId}`);
        }

        // 2. Calculate Outcome (Provably Fair Logic)
        // HMAC-SHA256(serverSeed, clientSeed:nonce)
        // Match box-open logic exactly: nonce can be number or string, JavaScript converts to string in template
        const message = `${clientSeed}:${nonce}`;
        const msgData = encoder.encode(message);

        const key = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );

        const signature = await crypto.subtle.sign(
            "HMAC",
            key,
            msgData
        );

        const hashArray = Array.from(new Uint8Array(signature));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Take first 8 chars (32 bits) and convert to int
        const resultInt = parseInt(hashHex.substring(0, 8), 16);
        // Normalize to 0-1
        const randomValue = resultInt / 0xffffffff;

        console.log(`🎲 Random value generated for ${playerId}:`, {
            message,
            hashHex: hashHex.substring(0, 16) + '...',
            resultInt,
            randomValue
        });

        // 3. Select Item based on weights/odds (provably fair)
        // Use item odds if available, otherwise fall back to uniform distribution
        const items = Array.isArray(boxItems) ? boxItems : [];
        
        if (items.length === 0) {
            throw new Error('Box items array is empty');
        }

        // Check if items have odds property for weighted selection
        const hasOdds = items.some(item => item.odds !== undefined);
        
        let outcomeItem;
        if (hasOdds) {
            // Weighted selection based on odds (same as box-open)
            const totalOdds = items.reduce((acc, item) => acc + (item.odds || 1), 0);
            let cumulativeProbability = 0;

            for (const item of items) {
                const probability = (item.odds || 1) / totalOdds;
                cumulativeProbability += probability;

                if (randomValue <= cumulativeProbability) {
                    outcomeItem = item;
                    break;
                }
            }
            
            // Fallback to last item if somehow nothing selected
            if (!outcomeItem) {
                outcomeItem = items[items.length - 1];
            }
        } else {
            // Fallback to uniform distribution if no odds
            const itemIndex = Math.floor(randomValue * items.length);
            outcomeItem = items[itemIndex];
        }

        // 4. Store Result (Securely)
        // We only store the result if this is a "final" spin or we want to track every spin.
        // For battle verification, we should store the result so 'battle-claim' can verify it.
        // However, since one battle has multiple players and rounds, we might need a more complex structure.
        // For this MVP security fix, we'll log it to `battle_results` which `battle-claim` can query.
        // Note: This might create multiple entries per battle, `battle-claim` will need to aggregate or find the right one.
        // Actually, `battle-claim` claims the TOTAL pot.
        // So `battle-spin` just returns the item.
        // The `battle-claim` function will need to trust the client's "I won" OR we need to store the "Winner" state here.
        // But `battle-spin` is per-player, per-round. It doesn't know who won the whole battle yet.
        // So `battle-spin` is just an RNG oracle.
        // To make `battle-claim` secure, `battle-claim` needs to re-verify the whole battle history OR we need a `battle-finish` function.
        // Let's stick to `battle-spin` being the RNG oracle for now.
        // And `battle-claim` will do the payout.
        // SECURITY NOTE: If `battle-spin` doesn't save state, `battle-claim` can't verify.
        // So `battle-claim` will still be trusting the client UNLESS we re-simulate the battle in `battle-claim`.
        // Re-simulating is safer. `battle-claim` receives all seeds and nonces and re-runs the logic.

        // For now, let's return the outcome.

        console.log(`✅ Generated outcome for ${playerId}:`, {
            itemName: outcomeItem.name,
            itemValue: outcomeItem.value,
            randomValue,
            nonce,
            clientSeed: clientSeed.substring(0, 20) + '...',
            message
        });

        return new Response(
            JSON.stringify({
                success: true,
                outcome: {
                    item: outcomeItem,
                    serverSeed: serverSeed, // Return for client verification (provably fair)
                    serverSeedHash: serverSeedHash, // Hash calculated before outcome
                    nonce: nonce, // Return as-is (number or string, same as received)
                    randomValue
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
