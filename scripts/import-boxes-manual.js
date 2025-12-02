const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
    'https://cbjdasfnwzizfphnwxfd.supabase.co',
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || ''
);

// Read and parse constants.ts manually
function extractBoxesFromConstants() {
    const constantsPath = path.join(__dirname, '../constants.ts');
    const content = fs.readFileSync(constantsPath, 'utf8');
    
    // This is a simplified parser - it extracts the INITIAL_BOXES array
    // For a more robust solution, use tsx or ts-node
    
    const boxes = [];
    const boxRegex = /{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*category:\s*['"]([^'"]+)['"],\s*price:\s*([\d.]+),/g;
    
    let match;
    while ((match = boxRegex.exec(content)) !== null) {
        boxes.push({
            id: match[1],
            name: match[2],
            category: match[3],
            price: parseFloat(match[4])
        });
    }
    
    return boxes;
}

async function importBoxes() {
    console.log('🔄 Starting manual box import...\n');
    console.log('⚠️  This is a simplified importer.');
    console.log('   For full import with items, use: tsx scripts/import-boxes-from-constants.js\n');

    try {
        // Check if boxes already exist
        const { count, error: countError } = await supabase
            .from('boxes')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('❌ Error checking boxes:', countError);
            return;
        }

        if (count > 0) {
            console.log(`⚠️  Found ${count} existing boxes.`);
            console.log('   This script will skip boxes that already exist.\n');
        }

        // Extract boxes (simplified - only basic info)
        const boxes = extractBoxesFromConstants();
        
        if (boxes.length === 0) {
            console.log('⚠️  Could not extract boxes from constants.ts');
            console.log('   Please use: tsx scripts/import-boxes-from-constants.js\n');
            return;
        }

        console.log(`📦 Found ${boxes.length} boxes to import\n`);
        console.log('💡 Note: This simplified script only imports basic box info.');
        console.log('   For full import with items, descriptions, and images, use tsx.\n');

        let successCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const box of boxes) {
            try {
                // Check if box already exists
                const { data: existing } = await supabase
                    .from('boxes')
                    .select('id')
                    .eq('id', box.id)
                    .single();

                if (existing) {
                    skippedCount++;
                    console.log(`⏭️  Skipped (exists): ${box.name}`);
                    continue;
                }

                // Create minimal box entry
                const dbBox = {
                    id: box.id,
                    name: box.name,
                    description: '',
                    price: box.price,
                    image: '',
                    image_url: '',
                    color: 'from-purple-600 to-purple-900', // Default
                    category: box.category,
                    tags: [],
                    items: [], // Empty - needs to be filled manually
                    enabled: true
                };

                // Try with 'enabled' first
                let { error } = await supabase
                    .from('boxes')
                    .insert(dbBox);

                if (error && (error.message?.includes('enabled') || error.code === 'PGRST116')) {
                    // Try with 'active' instead
                    delete dbBox.enabled;
                    dbBox.active = true;
                    const { error: retryError } = await supabase
                        .from('boxes')
                        .insert(dbBox);
                    if (retryError) throw retryError;
                } else if (error) {
                    throw error;
                }

                successCount++;
                console.log(`✅ Imported: ${box.name}`);
            } catch (error) {
                errorCount++;
                console.error(`❌ Failed: ${box.name}:`, error.message);
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log(`✅ Imported: ${successCount} boxes`);
        console.log(`⏭️  Skipped: ${skippedCount} boxes`);
        console.log(`❌ Failed: ${errorCount} boxes`);
        console.log('='.repeat(50) + '\n');

        if (successCount > 0) {
            console.log('💡 Note: Boxes imported without items/descriptions.');
            console.log('   Use the admin panel to edit boxes and add items.\n');
        }

    } catch (error) {
        console.error('❌ Import failed:', error.message);
        process.exit(1);
    }
}

importBoxes();


