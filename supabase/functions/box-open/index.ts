import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
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

        // Parse and validate request body
        let requestBody;
        try {
            requestBody = await req.json();
        } catch (e) {
            throw new Error(`Invalid JSON in request body: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }

        const { boxId, userId, clientSeed, nonce } = requestBody;

        console.log('📥 Request received:', { boxId, userId, clientSeed: clientSeed?.substring(0, 10) + '...', nonce });

        if (!boxId || !userId || !clientSeed || nonce === undefined) {
            throw new Error(`Missing required parameters. Received: boxId=${!!boxId}, userId=${!!userId}, clientSeed=${!!clientSeed}, nonce=${nonce !== undefined}`)
        }

        // 1. Verify user exists and get current balance
        console.log('🔍 Looking up user:', userId);
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, balance, client_seed, nonce, server_seed_hash')
            .eq('id', userId)
            .single()

        if (userError) {
            console.error('❌ User lookup error:', userError);
            throw new Error(`User lookup failed: ${userError.message}`)
        }

        if (!userData) {
            throw new Error(`User not found: ${userId}`)
        }

        console.log('✅ User found:', {
            id: userData.id,
            balance: userData.balance,
            dbNonce: userData.nonce,
            requestNonce: nonce,
            dbClientSeed: userData.client_seed?.substring(0, 10) + '...',
            requestClientSeed: clientSeed?.substring(0, 10) + '...'
        });

        // Verify client seed matches (security check)
        if (userData.client_seed !== clientSeed) {
            throw new Error(`Invalid client seed. Expected: ${userData.client_seed?.substring(0, 20)}..., Got: ${clientSeed?.substring(0, 20)}...`)
        }

        // Verify nonce matches (prevents replay attacks) - convert both to numbers for comparison
        const dbNonce = typeof userData.nonce === 'string' ? parseInt(userData.nonce) : userData.nonce;
        const requestNonce = typeof nonce === 'string' ? parseInt(nonce) : nonce;

        if (dbNonce !== requestNonce) {
            throw new Error(`Invalid nonce. Expected ${dbNonce} (type: ${typeof dbNonce}), got ${requestNonce} (type: ${typeof requestNonce})`)
        }

        // 2. Verify box exists and is enabled/active
        console.log('🔍 Looking up box:', boxId);
        // Select all columns to handle both schema versions (enabled vs active)
        const { data: boxData, error: boxError } = await supabaseAdmin
            .from('boxes')
            .select('*')
            .eq('id', boxId)
            .single()

        if (boxError) {
            console.error('❌ Box lookup error:', boxError);
            throw new Error(`Box lookup failed: ${boxError.message}`)
        }

        if (!boxData) {
            throw new Error(`Box not found: ${boxId}`)
        }

        // Check if box is enabled/active (handle both schema versions)
        // Some schemas use 'enabled', others use 'active', default to true if neither exists
        const isEnabled = boxData.enabled !== undefined
            ? boxData.enabled
            : (boxData.active !== undefined ? boxData.active : true);

        console.log('✅ Box found:', {
            id: boxData.id,
            name: boxData.name,
            enabled: boxData.enabled,
            active: boxData.active,
            isEnabled: isEnabled,
            itemCount: Array.isArray(boxData.items) ? boxData.items.length : 0
        });

        if (!isEnabled) {
            throw new Error(`Box is disabled: ${boxData.name}`)
        }

        if (!boxData.items || !Array.isArray(boxData.items) || boxData.items.length === 0) {
            throw new Error(`Box has no items: ${boxData.name}`)
        }

        // 3. Calculate box price (use sale_price if available, otherwise price)
        const boxPrice = boxData.sale_price || boxData.price
        const currentBalance = parseFloat(userData.balance)

        // 4. Verify user has sufficient balance
        if (currentBalance < boxPrice) {
            throw new Error(`Insufficient balance. Required: $${boxPrice}, Available: $${currentBalance}`)
        }

        // 5. Get Server Seed and calculate hash BEFORE generating outcome (provably fair)
        const serverSeed = Deno.env.get('SERVER_SEED') || 'lootvibe-secure-server-seed-v1'
        const encoder = new TextEncoder();
        const keyData = encoder.encode(serverSeed);
        
        // Calculate server seed hash BEFORE outcome generation (for provably fair verification)
        const serverSeedHash = await crypto.subtle.digest('SHA-256', keyData).then(h =>
            Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('')
        );
        
        // Verify server seed hash matches user's stored hash (if exists)
        // This ensures the seed was committed before the outcome
        if (userData.server_seed_hash && userData.server_seed_hash !== serverSeedHash) {
            throw new Error(`Server seed hash mismatch. This indicates the server seed was changed. Please contact support.`);
        }
        
        // Update user's server_seed_hash if not set (initial setup)
        if (!userData.server_seed_hash) {
            await supabaseAdmin
                .from('users')
                .update({ server_seed_hash: serverSeedHash })
                .eq('id', userId);
        }

        // 6. Calculate Outcome (Provably Fair Logic)
        // HMAC-SHA256(serverSeed, clientSeed:nonce)
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

        // 7. Select Item based on weights/odds (provably fair)
        const items = boxData.items as any[];

        // Calculate total odds
        const totalOdds = items.reduce((acc, item) => acc + (item.odds || 1), 0);

        // Select item based on cumulative probability
        let cumulativeProbability = 0;
        let selectedItem = items[items.length - 1]; // Fallback to last item

        for (const item of items) {
            const probability = (item.odds || 1) / totalOdds;
            cumulativeProbability += probability;

            if (randomValue <= cumulativeProbability) {
                selectedItem = item;
                break;
            }
        }

        // 8. Calculate profit/loss
        const itemValue = parseFloat(selectedItem.value || 0);
        const profitLoss = itemValue - boxPrice;

        // 9. Deduct balance atomically (using service role)
        const newBalance = currentBalance - boxPrice;
        const { error: balanceError } = await supabaseAdmin
            .from('users')
            .update({
                balance: newBalance,
                nonce: nonce + 1 // Increment nonce to prevent replay
            })
            .eq('id', userId);

        if (balanceError) {
            throw new Error(`Failed to deduct balance: ${balanceError.message}`)
        }

        // 10. Create transaction record
        const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const { error: txError } = await supabaseAdmin
            .from('transactions')
            .insert({
                id: transactionId,
                user_id: userId,
                type: 'PURCHASE',
                amount: boxPrice,
                description: `Opened box: ${boxData.name}`,
                timestamp: Date.now()
            });

        if (txError) {
            console.error('Failed to create transaction record:', txError);
            // Don't fail the request, but log it
        }

        // 11. Save to box_openings table (audit trail)
        const openingId = `opening_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Note: serverSeedHash was already calculated before outcome generation for provably fair

        console.log('💾 Saving to box_openings table...');
        const { error: openingError } = await supabaseAdmin
            .from('box_openings')
            .insert({
                id: openingId,
                box_id: boxId,
                user_id: userId,
                item_won: selectedItem,
                box_price: boxPrice,
                item_value: itemValue,
                profit_loss: profitLoss,
                client_seed: clientSeed,
                server_seed: serverSeed, // Store actual seed for verification
                nonce: nonce,
                random_value: randomValue,
                outcome: 'KEPT', // Default to KEPT, user can change later
                created_at: new Date().toISOString()
            });

        if (openingError) {
            console.error('❌ Failed to save box opening:', openingError);
            console.error('❌ Opening error details:', JSON.stringify(openingError, null, 2));
            // If table doesn't exist, this will fail but we'll continue
            // The user should run the boxes_schema.sql migration
            if (openingError.message?.includes('relation') || openingError.message?.includes('does not exist')) {
                console.warn('⚠️ box_openings table may not exist. Run supabase/boxes_schema.sql migration.');
            }
            // Don't fail the request, but log it
        } else {
            console.log('✅ Box opening saved to audit trail');
        }

        // 12. Add to inventory
        const inventoryId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const { error: invError } = await supabaseAdmin
            .from('inventory_items')
            .insert({
                id: inventoryId,
                user_id: userId,
                item_data: selectedItem,
                created_at: new Date().toISOString()
            });

        if (invError) {
            console.error('Failed to add item to inventory:', invError);
            // Don't fail the request, but log it
        } else {
            // Create notification when item is successfully added to inventory
            try {
                const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                await supabaseAdmin
                    .from('notifications')
                    .insert({
                        id: notificationId,
                        user_id: userId,
                        type: 'INVENTORY_ADDED',
                        title: 'Item Added to Inventory',
                        message: `${selectedItem.name} has been added to your inventory!`,
                        data: {
                            item_id: inventoryId,
                            item_name: selectedItem.name,
                            item_image: selectedItem.image,
                            item_value: itemValue,
                            box_id: boxId,
                            box_name: boxData.name
                        },
                        read: false,
                        created_at: new Date().toISOString()
                    });
                console.log('✅ Notification created for inventory addition');
            } catch (notifError) {
                console.error('Failed to create notification:', notifError);
                // Don't fail the request, but log it
            }
        }

        // 13. Add to live_drops (for real-time feed)
        try {
            const { data: userInfo } = await supabaseAdmin
                .from('users')
                .select('username, avatar')
                .eq('id', userId)
                .single();

            if (userInfo) {
                await supabaseAdmin
                    .from('live_drops')
                    .insert({
                        user_name: userInfo.username,
                        item_name: selectedItem.name,
                        item_image: selectedItem.image,
                        box_name: boxData.name,
                        value: itemValue
                    });
            }
        } catch (e) {
            console.error('Failed to add live drop:', e);
            // Don't fail the request
        }

        console.log(`✅ Secure box opening: User ${userId} opened ${boxData.name}, won ${selectedItem.name} ($${itemValue})`);

        return new Response(
            JSON.stringify({
                success: true,
                outcome: {
                    item: selectedItem,
                    serverSeed: serverSeed, // Return for client verification
                    serverSeedHash: serverSeedHash,
                    nonce: nonce + 1, // Return incremented nonce (already updated in DB)
                    randomValue: randomValue,
                    boxPrice: boxPrice,
                    itemValue: itemValue,
                    profitLoss: profitLoss,
                    newBalance: newBalance,
                    openingId: openingId // Return opening ID for tracking exchanges
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        // Enhanced error logging
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const errorStack = error instanceof Error ? error.stack : 'No stack trace';

        console.error('❌ Box opening error:', errorMessage);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        console.error('❌ Stack trace:', errorStack);

        return new Response(
            JSON.stringify({
                success: false,
                error: errorMessage,
                details: error instanceof Error ? errorStack : undefined
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})

