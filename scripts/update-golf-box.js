const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    'https://cbjdasfnwzizfphnwxfd.supabase.co',
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiamRhc2Zud3ppemZwaG53eGZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk0Nzg4MiwiZXhwIjoyMDc5NTIzODgyfQ.hZT3qtv9P45G6XWXRp4ELLXQi5KuaKdpEv_XiY4B5go'
);

// Golf Box items with adjusted odds for 40% profitability
const GOLF_ITEMS = [
    { id: 'gf1', name: 'Titleist TSR4 Driver', value: 649, rarity: 'LEGENDARY', odds: 0.1, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf1.webp' },
    { id: 'gf2', name: 'TaylorMade Stealth 2 Plus Driver', value: 599, rarity: 'LEGENDARY', odds: 0.15, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf2.webp' },
    { id: 'gf3', name: 'Callaway Paradym Ai Smoke Driver', value: 599, rarity: 'LEGENDARY', odds: 0.15, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf3.webp' },
    { id: 'gf4', name: 'Titleist T200 Iron Set (4-PW)', value: 1599, rarity: 'LEGENDARY', odds: 0.05, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf4.webp' },
    { id: 'gf5', name: 'Scotty Cameron Phantom X Putter', value: 499, rarity: 'EPIC', odds: 0.3, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf5.webp' },
    { id: 'gf6', name: 'Ping G430 Max Driver', value: 549, rarity: 'EPIC', odds: 0.25, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf6.webp' },
    { id: 'gf7', name: 'TaylorMade Spider Tour X Putter', value: 449, rarity: 'EPIC', odds: 0.4, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf7.webp' },
    { id: 'gf8', name: 'Titleist Pro V1 Golf Balls (4 Dozen)', value: 219.96, rarity: 'RARE', odds: 3.5, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf8.webp' },
    { id: 'gf9', name: 'FootJoy Pro SL Carbon Golf Shoes', value: 199, rarity: 'RARE', odds: 4.5, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf9.webp' },
    { id: 'gf10', name: 'Callaway Chrome Soft Golf Balls (3 Dozen)', value: 164.97, rarity: 'RARE', odds: 6, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf10.webp' },
    { id: 'gf11', name: 'Bushnell Pro XE Rangefinder', value: 499, rarity: 'RARE', odds: 2, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf11.webp' },
    { id: 'gf12', name: 'LootVibe Golf Tees Pack', value: 5, rarity: 'COMMON', odds: 82.6, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf12.webp' }
];

async function updateGolfBox() {
    console.log('🔄 Updating Golf Box in database...\n');

    try {
        // First, check if the box exists
        const { data: existingBox, error: fetchError } = await supabase
            .from('boxes')
            .select('*')
            .eq('id', 'golf_box')
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
            console.error('❌ Error fetching box:', fetchError);
            return;
        }

        const boxData = {
            id: 'golf_box',
            name: 'GOLF BOX',
            category: 'SPORTS',
            price: 79.99,
            image_url: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/golf_box.png',
            description: 'Titleist, TaylorMade, Callaway - premium golf equipment',
            tags: ['NEW'],
            color: 'from-green-500 to-green-700',
            items: GOLF_ITEMS,
            updated_at: new Date().toISOString()
        };

        if (existingBox) {
            // Update existing box
            console.log('📝 Updating existing Golf Box...');
            const { data, error } = await supabase
                .from('boxes')
                .update(boxData)
                .eq('id', 'golf_box')
                .select();

            if (error) {
                console.error('❌ Error updating box:', error);
                return;
            }

            console.log('✅ Successfully updated Golf Box!');
            console.log(`   Items count: ${GOLF_ITEMS.length}`);
            
            // Calculate EV
            const ev = GOLF_ITEMS.reduce((sum, item) => sum + (item.value * item.odds / 100), 0);
            const profitability = ((79.99 - ev) / 79.99 * 100).toFixed(1);
            console.log(`   Expected Value: $${ev.toFixed(2)}`);
            console.log(`   Profitability: ${profitability}%`);
        } else {
            // Insert new box
            console.log('➕ Creating new Golf Box...');
            boxData.created_at = new Date().toISOString();
            
            const { data, error } = await supabase
                .from('boxes')
                .insert(boxData)
                .select();

            if (error) {
                console.error('❌ Error creating box:', error);
                return;
            }

            console.log('✅ Successfully created Golf Box!');
        }

        console.log('\n✨ Done! The Golf Box now has 40% profitability.');
        console.log('   Refresh your browser to see the changes.\n');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

updateGolfBox().catch(console.error);

