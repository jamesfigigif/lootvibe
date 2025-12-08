const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use the correct project URL and Key
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hpflcuyxmwzrknxjgavd.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Pokemon Budget Box items updated
const POKEMON_BUDGET_ITEMS = [
    { id: 'pb1', name: 'Charizard UPC Promo Card', value: 25, rarity: 'LEGENDARY', odds: 0.3, image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p11.webp' },
    { id: 'pb2', name: 'Pokemon 151 ETB', value: 899, rarity: 'LEGENDARY', odds: 0.1, image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pb1.webp' },
    { id: 'pb3', name: 'Iono Full Art', value: 18, rarity: 'LEGENDARY', odds: 0.8, image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pb2.webp' },
    { id: 'pb4', name: '3-Pack Blister (Random)', value: 15, rarity: 'EPIC', odds: 2.5, image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p14.webp' },
    { id: 'pb5', name: 'Booster Bundle (3 Packs)', value: 12, rarity: 'EPIC', odds: 3, image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pb3.webp' },
    { id: 'pb6', name: 'Holo Rare (Random)', value: 5, rarity: 'EPIC', odds: 7, image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pb4.webp' },
    { id: 'pb7', name: 'Single Booster Pack', value: 4, rarity: 'RARE', odds: 18, image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pb5.webp' },
    { id: 'pb8', name: 'Pokemon Sticker Pack', value: 2, rarity: 'COMMON', odds: 25, image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p15.webp' },
    { id: 'pb9', name: 'Reverse Holo Rare', value: 2, rarity: 'COMMON', odds: 28, image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pb6.webp' },
    { id: 'pb10', name: 'Single Holo Rare Card', value: 1, rarity: 'COMMON', odds: 15.3, image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p16.webp' }
];

async function updatePokemonBudgetBox() {
    console.log('🔄 Updating Pokemon Budget Box in database...\n');

    try {
        // First, check if the box exists
        const { data: existingBox, error: fetchError } = await supabase
            .from('boxes')
            .select('*')
            .eq('id', 'pokemon_budget')
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
            console.error('❌ Error fetching box:', fetchError);
            return;
        }

        const boxData = {
            id: 'pokemon_budget',
            name: 'POKEMON BUDGET BOX',
            category: 'POKEMON',
            price: 5.00, // Updated to $5
            image_url: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/pokemon_budget.png',
            description: 'Affordable Pokemon packs with a chance for a $899 GRAIL!',
            tags: ['NEW', 'HOT'],
            color: 'from-yellow-400 to-yellow-600',
            items: POKEMON_BUDGET_ITEMS,
            updated_at: new Date().toISOString()
        };

        if (existingBox) {
            // Update existing box
            console.log('📝 Updating existing Pokemon Budget Box...');
            const { data, error } = await supabase
                .from('boxes')
                .update(boxData)
                .eq('id', 'pokemon_budget')
                .select();

            if (error) {
                console.error('❌ Error updating box:', error);
                return;
            }

            console.log('✅ Successfully updated Pokemon Budget Box!');
            console.log(`   Items count: ${POKEMON_BUDGET_ITEMS.length}`);
            console.log(`   Price: $${boxData.price}`);
            console.log(`   Top Prize: ${POKEMON_BUDGET_ITEMS[0].name} ($${POKEMON_BUDGET_ITEMS[0].value})`);

            // Calculate EV
            const ev = POKEMON_BUDGET_ITEMS.reduce((sum, item) => sum + (item.value * item.odds / 100), 0);
            const profitability = ((boxData.price - ev) / boxData.price * 100).toFixed(1);
            console.log(`   Expected Value: $${ev.toFixed(2)}`);
            console.log(`   Profitability: ${profitability}%`);
        } else {
            // Insert new box
            console.log('➕ Creating new Pokemon Budget Box...');
            boxData.created_at = new Date().toISOString();

            const { data, error } = await supabase
                .from('boxes')
                .insert(boxData)
                .select();

            if (error) {
                console.error('❌ Error creating box:', error);
                return;
            }

            console.log('✅ Successfully created Pokemon Budget Box!');
        }

        console.log('\n✨ Done! The Pokemon Budget Box is now $5 with an $899 Jackpot!');
        console.log('   Refresh your browser to see the changes.\n');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

updatePokemonBudgetBox().catch(console.error);

