const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    'https://cbjdasfnwzizfphnwxfd.supabase.co',
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiamRhc2Zud3ppemZwaG53eGZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk0Nzg4MiwiZXhwIjoyMDc5NTIzODgyfQ.hZT3qtv9P45G6XWXRp4ELLXQi5KuaKdpEv_XiY4B5go'
);

// Gamer Budget Box items with tech items from TECH PREMIUM BOX (very low odds)
const GAMER_BUDGET_ITEMS = [
    { id: 'gb1', name: 'iPhone 15 Pro 256GB', value: 999, rarity: 'LEGENDARY', odds: 0.01, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/t3.webp' },
    { id: 'gb2', name: 'iPad Pro 11" M2', value: 799, rarity: 'LEGENDARY', odds: 0.01, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/t4.webp' },
    { id: 'gb3', name: 'AirPods Pro 2nd Gen', value: 249, rarity: 'LEGENDARY', odds: 0.05, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/t8.webp' },
    { id: 'gb4', name: 'Apple Watch Series 9 GPS', value: 399, rarity: 'EPIC', odds: 0.02, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/t7.webp' },
    { id: 'gb5', name: 'Razer Huntsman Mini', value: 120, rarity: 'LEGENDARY', odds: 0.1, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gb1.webp' },
    { id: 'gb6', name: 'Logitech G502 Hero', value: 50, rarity: 'EPIC', odds: 0.5, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gb2.webp' },
    { id: 'gb7', name: 'HyperX Cloud Stinger 2', value: 40, rarity: 'EPIC', odds: 0.8, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gb3.webp' },
    { id: 'gb8', name: 'Xbox Wireless Controller', value: 60, rarity: 'EPIC', odds: 0.4, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gb4.webp' },
    { id: 'gb9', name: 'Steam Gift Card $20', value: 20, rarity: 'RARE', odds: 2.5, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gb5.webp' },
    { id: 'gb10', name: 'Razer Gigantus V2 (Large)', value: 15, rarity: 'RARE', odds: 4, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gb6.webp' },
    { id: 'gb11', name: 'Steam Gift Card $10', value: 10, rarity: 'COMMON', odds: 8, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gb7.webp' },
    { id: 'gb12', name: 'Random Steam Key (Indie)', value: 5, rarity: 'COMMON', odds: 15, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gb8.webp' },
    { id: 'gb13', name: 'Cat 6 Ethernet Cable', value: 5, rarity: 'COMMON', odds: 68.89, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gb9.webp' }
];

async function updateGamerBudgetBox() {
    console.log('🔄 Updating Gamer Budget Box in database...\n');

    try {
        // First, check if the box exists
        const { data: existingBox, error: fetchError } = await supabase
            .from('boxes')
            .select('*')
            .eq('id', 'gamer_budget')
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
            console.error('❌ Error fetching box:', fetchError);
            return;
        }

        const boxData = {
            id: 'gamer_budget',
            name: 'GAMER BUDGET BOX',
            category: 'TECH',
            price: 10.00,
            image_url: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/gamer_budget.png',
            description: 'Peripherals, steam keys, and gaming essentials',
            tags: ['NEW'],
            color: 'from-green-400 to-emerald-600',
            items: GAMER_BUDGET_ITEMS,
            updated_at: new Date().toISOString()
        };

        if (existingBox) {
            // Update existing box
            console.log('📝 Updating existing Gamer Budget Box...');
            const { data, error } = await supabase
                .from('boxes')
                .update(boxData)
                .eq('id', 'gamer_budget')
                .select();

            if (error) {
                console.error('❌ Error updating box:', error);
                return;
            }

            console.log('✅ Successfully updated Gamer Budget Box!');
            console.log(`   Items count: ${GAMER_BUDGET_ITEMS.length}`);
            console.log(`   Tech items from TECH PREMIUM BOX:`);
            console.log(`     - iPhone 15 Pro (0.01% odds)`);
            console.log(`     - iPad Pro (0.01% odds)`);
            console.log(`     - AirPods Pro (0.05% odds)`);
            console.log(`     - Apple Watch (0.02% odds)`);
            
            // Calculate EV
            const ev = GAMER_BUDGET_ITEMS.reduce((sum, item) => sum + (item.value * item.odds / 100), 0);
            const profitability = ((10 - ev) / 10 * 100).toFixed(1);
            console.log(`   Expected Value: $${ev.toFixed(2)}`);
            console.log(`   Profitability: ${profitability}%`);
        } else {
            // Insert new box
            console.log('➕ Creating new Gamer Budget Box...');
            boxData.created_at = new Date().toISOString();
            
            const { data, error } = await supabase
                .from('boxes')
                .insert(boxData)
                .select();

            if (error) {
                console.error('❌ Error creating box:', error);
                return;
            }

            console.log('✅ Successfully created Gamer Budget Box!');
        }

        console.log('\n✨ Done! The Gamer Budget Box now includes ultra-rare tech prizes!');
        console.log('   Refresh your browser to see the changes.\n');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

updateGamerBudgetBox().catch(console.error);

