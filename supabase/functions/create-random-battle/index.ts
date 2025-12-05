import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
        console.log('🎲 Creating random battle...');

        // Create a service role client for DB writes (secure)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log('📦 Fetching boxes...');
        // Get all boxes with price under $250
        const { data: boxes, error: boxesError } = await supabaseAdmin
            .from('boxes')
            .select('id, name, price, sale_price, items')
            .or('enabled.eq.true,active.eq.true')
            .order('created_at', { ascending: false })

        if (boxesError) {
            console.error('❌ Failed to fetch boxes:', boxesError);
            throw new Error(`Failed to fetch boxes: ${boxesError.message}`)
        }

        console.log(`✅ Found ${boxes?.length || 0} boxes`);

        if (!boxes || boxes.length === 0) {
            return new Response(
                JSON.stringify({ success: false, error: 'No boxes available' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // Filter boxes by price (use sale_price if available, otherwise price)
        const affordableBoxes = boxes.filter(box => {
            const price = parseFloat(box.sale_price || box.price || '0')
            return price > 0 && price < 250
        })

        if (affordableBoxes.length === 0) {
            return new Response(
                JSON.stringify({ success: false, error: 'No boxes under $250 available' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // Pick a random box
        const randomBox = affordableBoxes[Math.floor(Math.random() * affordableBoxes.length)]
        const boxPrice = parseFloat(randomBox.sale_price || randomBox.price || '0')

        // Generate realistic bot usernames
        const realisticUsernames = [
            'AlexM', 'JordanK', 'SamT', 'ChrisR', 'TaylorW',
            'MorganL', 'CaseyJ', 'RileyB', 'AveryP', 'QuinnM',
            'DrewH', 'BlakeS', 'CameronN', 'DakotaF', 'EmeryC',
            'FinleyG', 'HarperD', 'HaydenV', 'JamieX', 'KendallB',
            'LoganM', 'MasonT', 'NoahR', 'OwenL', 'ParkerK',
            'ReeseJ', 'RowanH', 'SageP', 'SkylarN', 'TylerF'
        ]

        // Shuffle and pick two random usernames for 1v1
        const shuffled = [...realisticUsernames].sort(() => Math.random() - 0.5)
        const bot1Name = shuffled[0]
        const bot2Name = shuffled[1]

        // Create bot players
        const bot1Id = `bot_${Date.now()}_1_${Math.random().toString(36).substr(2, 9)}`
        const bot2Id = `bot_${Date.now()}_2_${Math.random().toString(36).substr(2, 9)}`

        const bot1 = {
            id: bot1Id,
            username: bot1Name,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${bot1Id}`,
            balance: 10000,
            inventory: [],
            shipments: [],
            clientSeed: bot1Id,
            nonce: 0
        }

        const bot2 = {
            id: bot2Id,
            username: bot2Name,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${bot2Id}`,
            balance: 10000,
            inventory: [],
            shipments: [],
            clientSeed: bot2Id,
            nonce: 0
        }

        // Random round count (1-3 rounds)
        const roundCount = Math.floor(Math.random() * 3) + 1

        // Randomly determine battle state:
        // 40% WAITING (open, ready to join)
        // 40% FINISHED (forfeited/completed)
        // 20% Don't create (deleted - just return success without creating)
        const randomState = Math.random()
        let battleStatus: 'WAITING' | 'FINISHED'
        let playersArray: any[]
        let shouldCreate = true

        if (randomState < 0.4) {
            // 40% - WAITING (open battle with one bot, one empty slot)
            battleStatus = 'WAITING'
            playersArray = [bot1, null]
        } else if (randomState < 0.8) {
            // 40% - FINISHED (forfeited/completed battle with both bots)
            battleStatus = 'FINISHED'
            playersArray = [bot1, bot2]
        } else {
            // 20% - Don't create (simulate deleted)
            shouldCreate = false
            console.log(`🗑️ Skipping battle creation (simulated deletion)`)
            return new Response(
                JSON.stringify({
                    success: true,
                    battle: null,
                    message: 'Battle not created (simulated deletion)'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create battle
        const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const battle = {
            id: battleId,
            box_id: randomBox.id,
            price: boxPrice,
            player_count: 2, // 1v1
            round_count: roundCount,
            mode: 'STANDARD',
            status: battleStatus,
            players: JSON.stringify(playersArray)
        }

        // Insert battle into database
        const { data: insertedBattle, error: insertError } = await supabaseAdmin
            .from('battles')
            .insert(battle)
            .select()
            .single()

        if (insertError) {
            throw new Error(`Failed to create battle: ${insertError.message}`)
        }

        const statusEmoji = battleStatus === 'WAITING' ? '🟢' : '🔴'
        console.log(`${statusEmoji} Created random 1v1 battle: ${battleId} with box ${randomBox.name} ($${boxPrice}) - Status: ${battleStatus}`)

        return new Response(
            JSON.stringify({
                success: true,
                battle: {
                    ...insertedBattle,
                    players: JSON.parse(insertedBattle.players)
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('❌ Error creating random battle:', error)
        const errorDetails = {
            success: false,
            error: error.message,
            stack: error.stack,
            name: error.name,
            details: error
        };
        console.error('Full error details:', JSON.stringify(errorDetails, null, 2));
        return new Response(
            JSON.stringify(errorDetails),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})

