const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    'https://cbjdasfnwzizfphnwxfd.supabase.co',
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiamRhc2Zud3ppemZwaG53eGZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk0Nzg4MiwiZXhwIjoyMDc5NTIzODgyfQ.hZT3qtv9P45G6XWXRp4ELLXQi5KuaKdpEv_XiY4B5go'
);

// 2025 Apple Box items with adjusted odds for 40% profitability
const APPLE_2025_ITEMS = [
    { id: 'ap25_1', name: 'iPhone 17 Pro Max Cosmic Orange', value: 1599, rarity: 'LEGENDARY', odds: 0.05, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_1.webp' },
    { id: 'ap25_2', name: 'iPhone 17 Pro Deep Blue', value: 1499, rarity: 'LEGENDARY', odds: 0.05, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_2.webp' },
    { id: 'ap25_3', name: 'iPhone 17 Pro Silver', value: 1499, rarity: 'LEGENDARY', odds: 0.05, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_3.webp' },
    { id: 'ap25_4', name: 'iPhone Air Cloud White', value: 1399, rarity: 'LEGENDARY', odds: 0.05, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_4.webp' },
    { id: 'ap25_5', name: 'iPhone Air Space Light Gold', value: 1399, rarity: 'LEGENDARY', odds: 0.05, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_5.webp' },
    { id: 'ap25_6', name: 'iPhone Air Space Sky Blue', value: 1399, rarity: 'LEGENDARY', odds: 0.05, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_6.webp' },
    { id: 'ap25_7', name: 'iPhone Air Space Black', value: 1399, rarity: 'LEGENDARY', odds: 0.05, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_7.webp' },
    { id: 'ap25_8', name: 'iPhone 17 Black', value: 1029, rarity: 'LEGENDARY', odds: 0.08, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_8.webp' },
    { id: 'ap25_9', name: 'iPhone 17 Mist Blue', value: 1029, rarity: 'LEGENDARY', odds: 0.08, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_9.webp' },
    { id: 'ap25_10', name: 'iPhone 17 Sage', value: 1029, rarity: 'LEGENDARY', odds: 0.08, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_10.webp' },
    { id: 'ap25_11', name: 'iPhone 17 White', value: 1029, rarity: 'LEGENDARY', odds: 0.08, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_11.webp' },
    { id: 'ap25_12', name: 'iPhone 17 Lavender', value: 1029, rarity: 'LEGENDARY', odds: 0.08, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_12.webp' },
    { id: 'ap25_13', name: 'Watch Ultra 3 Titanium Milanese Loop Black', value: 899, rarity: 'EPIC', odds: 0.15, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_13.webp' },
    { id: 'ap25_14', name: 'Watch Ultra 3 Titanium Milanese Loop Natural', value: 899, rarity: 'EPIC', odds: 0.15, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_14.webp' },
    { id: 'ap25_15', name: 'Watch Ultra 3 Natural Ocean Band Neon Green', value: 799, rarity: 'EPIC', odds: 0.2, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_15.webp' },
    { id: 'ap25_16', name: 'Watch Ultra 3 Alpine Loop Black', value: 799, rarity: 'EPIC', odds: 0.2, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_16.webp' },
    { id: 'ap25_17', name: 'Watch Series 11 Titanium Milanese Loop Slate', value: 774, rarity: 'EPIC', odds: 0.2, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_17.webp' },
    { id: 'ap25_18', name: 'Watch Series 11 Titanium Milanese Loop Gold', value: 774, rarity: 'EPIC', odds: 0.2, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_18.webp' },
    { id: 'ap25_19', name: 'Watch Series 11 Titanium Milanese Loop Natural', value: 774, rarity: 'EPIC', odds: 0.2, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_19.webp' },
    { id: 'ap25_20', name: 'Watch Series 11 Aluminum Jet Black Sport Band', value: 414, rarity: 'EPIC', odds: 0.5, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_20.webp' },
    { id: 'ap25_21', name: 'Watch Series 11 Aluminum Rose Gold Pride Edition', value: 414, rarity: 'EPIC', odds: 0.5, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_21.webp' },
    { id: 'ap25_22', name: 'Watch Series 11 Aluminum Silver Nike Veiled Grey', value: 414, rarity: 'RARE', odds: 0.5, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_22.webp' },
    { id: 'ap25_23', name: 'Watch Series 11 Aluminum Space Gray Anchor Blue', value: 414, rarity: 'RARE', odds: 0.5, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_23.webp' },
    { id: 'ap25_24', name: 'Watch SE 3 Rubber Sport Band Light Blush', value: 279, rarity: 'RARE', odds: 1, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_24.webp' },
    { id: 'ap25_25', name: 'Watch SE 3 Rubber Sport Band Midnight', value: 279, rarity: 'RARE', odds: 1, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_25.webp' },
    { id: 'ap25_26', name: 'AirPods Pro 3', value: 249, rarity: 'RARE', odds: 2, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_26.webp' },
    { id: 'ap25_27', name: 'Apple Gift Card $250', value: 229.99, rarity: 'RARE', odds: 3.5, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_27.webp' },
    { id: 'ap25_28', name: 'Red Delicious Apple', value: 0.99, rarity: 'COMMON', odds: 88.45, image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_28.webp' }
];

async function updateApple2025Box() {
    console.log('🔄 Updating 2025 Apple Box in database...\n');

    try {
        // First, check if the box exists
        const { data: existingBox, error: fetchError } = await supabase
            .from('boxes')
            .select('*')
            .eq('id', 'apple_2025')
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
            console.error('❌ Error fetching box:', fetchError);
            return;
        }

        const boxData = {
            id: 'apple_2025',
            name: '2025 APPLE BOX',
            category: 'TECH',
            price: 75.99,
            image_url: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/apple_2025.png',
            description: 'iPhone 17 lineup, Watch Ultra 3, and latest Apple tech',
            tags: ['NEW', 'HOT'],
            color: 'from-slate-400 to-slate-600',
            items: APPLE_2025_ITEMS,
            updated_at: new Date().toISOString()
        };

        if (existingBox) {
            // Update existing box
            console.log('📝 Updating existing 2025 Apple Box...');
            const { data, error } = await supabase
                .from('boxes')
                .update(boxData)
                .eq('id', 'apple_2025')
                .select();

            if (error) {
                console.error('❌ Error updating box:', error);
                return;
            }

            console.log('✅ Successfully updated 2025 Apple Box!');
            console.log(`   Items count: ${APPLE_2025_ITEMS.length}`);
            
            // Calculate EV
            const ev = APPLE_2025_ITEMS.reduce((sum, item) => sum + (item.value * item.odds / 100), 0);
            const profitability = ((75.99 - ev) / 75.99 * 100).toFixed(1);
            console.log(`   Expected Value: $${ev.toFixed(2)}`);
            console.log(`   Profitability: ${profitability}%`);
        } else {
            // Insert new box
            console.log('➕ Creating new 2025 Apple Box...');
            boxData.created_at = new Date().toISOString();
            
            const { data, error } = await supabase
                .from('boxes')
                .insert(boxData)
                .select();

            if (error) {
                console.error('❌ Error creating box:', error);
                return;
            }

            console.log('✅ Successfully created 2025 Apple Box!');
        }

        console.log('\n✨ Done! The 2025 Apple Box odds have been fixed for profitability.');
        console.log('   Refresh your browser to see the changes.\n');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

updateApple2025Box().catch(console.error);

