const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    'https://cbjdasfnwzizfphnwxfd.supabase.co',
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiamRhc2Zud3ppemZwaG53eGZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk0Nzg4MiwiZXhwIjoyMDc5NTIzODgyfQ.hZT3qtv9P45G6XWXRp4ELLXQi5KuaKdpEv_XiY4B5go'
);

// Apple Budget Box items with the sticker
const APPLE_BUDGET_ITEMS = [
    { id: 'ab1', name: 'iPhone 12 (Refurbished)', value: 350, rarity: 'LEGENDARY', odds: 0.01, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ab1.webp' },
    { id: 'ab2', name: 'iPad 9th Gen', value: 250, rarity: 'LEGENDARY', odds: 0.05, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ab2.webp' },
    { id: 'ab3', name: 'AirPods 2nd Gen', value: 99, rarity: 'EPIC', odds: 0.2, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ab3.webp' },
    { id: 'ab4', name: 'Apple Pencil 2nd Gen', value: 89, rarity: 'EPIC', odds: 0.5, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ab4.webp' },
    { id: 'ab5', name: 'AirTag 4-Pack', value: 85, rarity: 'EPIC', odds: 1, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ab5.webp' },
    { id: 'ab6', name: 'MagSafe Charger', value: 39, rarity: 'RARE', odds: 3, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ab6.webp' },
    { id: 'ab7', name: 'Apple AirTag (Single)', value: 29, rarity: 'RARE', odds: 5, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ab7.webp' },
    { id: 'ab8', name: 'Apple Polishing Cloth', value: 19, rarity: 'COMMON', odds: 10, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ab8.webp' },
    { id: 'ab9', name: 'USB-C to Lightning Cable', value: 15, rarity: 'COMMON', odds: 20, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ab9.webp' },
    { id: 'ab10', name: 'Apple Logo Sticker', value: 2, rarity: 'COMMON', odds: 60.24, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ab10.webp' }
];

async function updateAppleBudgetBox() {
    console.log('🔄 Updating Apple Budget Box in database...\n');

    try {
        // First, check if the box exists
        const { data: existingBox, error: fetchError } = await supabase
            .from('boxes')
            .select('*')
            .eq('id', 'apple_budget')
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
            console.error('❌ Error fetching box:', fetchError);
            return;
        }

        const boxData = {
            id: 'apple_budget',
            name: 'APPLE BUDGET BOX',
            category: 'TECH',
            price: 15.00,
            image_url: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/apple_budget.png',
            description: 'Chance for iPhones and AirPods at a budget price',
            tags: ['NEW', 'HOT'],
            color: 'from-gray-200 to-gray-400',
            items: APPLE_BUDGET_ITEMS,
            updated_at: new Date().toISOString()
        };

        if (existingBox) {
            // Update existing box
            console.log('📝 Updating existing Apple Budget Box...');
            const { data, error } = await supabase
                .from('boxes')
                .update(boxData)
                .eq('id', 'apple_budget')
                .select();

            if (error) {
                console.error('❌ Error updating box:', error);
                return;
            }

            console.log('✅ Successfully updated Apple Budget Box!');
            console.log(`   Items count: ${APPLE_BUDGET_ITEMS.length}`);
            console.log(`   Sticker included: ${APPLE_BUDGET_ITEMS.find(i => i.id === 'ab10') ? '✅ YES' : '❌ NO'}`);
        } else {
            // Insert new box
            console.log('➕ Creating new Apple Budget Box...');
            boxData.created_at = new Date().toISOString();
            
            const { data, error } = await supabase
                .from('boxes')
                .insert(boxData)
                .select();

            if (error) {
                console.error('❌ Error creating box:', error);
                return;
            }

            console.log('✅ Successfully created Apple Budget Box!');
            console.log(`   Items count: ${APPLE_BUDGET_ITEMS.length}`);
        }

        console.log('\n✨ Done! The Apple Budget Box now includes the Apple Logo Sticker (60.24% odds).');
        console.log('   Refresh your browser to see the changes.\n');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

updateAppleBudgetBox().catch(console.error);

