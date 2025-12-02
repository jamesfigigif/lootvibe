const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
    'https://cbjdasfnwzizfphnwxfd.supabase.co',
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || ''
);

async function importBoxes() {
    console.log('🔄 Starting box import from constants.ts...\n');

    try {
        // Check if boxes already exist
        const { count, error: countError } = await supabase
            .from('boxes')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('❌ Error checking boxes:', countError);
            console.error('   Make sure the boxes table exists in your database.');
            return;
        }

        if (count > 0) {
            console.log(`⚠️  Found ${count} existing boxes in database.`);
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise(resolve => {
                readline.question('   Do you want to delete existing boxes and re-import? (yes/no): ', resolve);
            });
            readline.close();

            if (answer.toLowerCase() !== 'yes') {
                console.log('   Skipping import.\n');
                return;
            }

            // Delete existing boxes
            console.log('🗑️  Deleting existing boxes...');
            const { error: deleteError } = await supabase
                .from('boxes')
                .delete()
                .neq('id', 'dummy'); // Delete all

            if (deleteError) {
                console.error('❌ Error deleting boxes:', deleteError);
                return;
            }
            console.log('✅ Deleted existing boxes\n');
        }

        // Try to import using tsx if available, otherwise use manual data
        let boxes;
        try {
            // Try to use tsx to import TypeScript
            const tsx = require('tsx');
            const { INITIAL_BOXES } = require('../constants.ts');
            boxes = INITIAL_BOXES;
            console.log(`📦 Found ${boxes.length} boxes in constants.ts\n`);
        } catch (tsError) {
            // Fallback: try using ts-node or manual import
            try {
                // Try ts-node
                require('ts-node/register');
                const { INITIAL_BOXES } = require('../constants.ts');
                boxes = INITIAL_BOXES;
                console.log(`📦 Found ${boxes.length} boxes in constants.ts\n`);
            } catch (tsNodeError) {
                // Last resort: manually read and parse
                console.log('⚠️  Could not import TypeScript directly. Using manual extraction...\n');
                console.log('💡 To use this script, install tsx: npm install -g tsx');
                console.log('   Then run: tsx scripts/import-boxes-from-constants.js\n');
                console.log('   Or use the alternative script: node scripts/import-boxes-manual.js\n');
                return;
            }
        }

        if (!boxes || boxes.length === 0) {
            console.log('⚠️  No boxes found in constants.ts');
            return;
        }

        console.log('📥 Importing boxes to database...\n');

        let successCount = 0;
        let errorCount = 0;

        for (const box of boxes) {
            try {
                // Map the box structure to database schema
                const dbBox = {
                    id: box.id,
                    name: box.name,
                    description: box.description || '',
                    price: parseFloat(box.price),
                    sale_price: box.sale_price ? parseFloat(box.sale_price) : null,
                    // Handle both 'image' and 'image_url' fields
                    image: box.image || box.image_url || '',
                    image_url: box.image || box.image_url || '', // Also set image_url for compatibility
                    color: box.color,
                    category: box.category,
                    tags: box.tags || [],
                    items: box.items || [], // JSONB field
                    enabled: true, // Default to enabled
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                // Insert box
                const { data, error } = await supabase
                    .from('boxes')
                    .insert(dbBox)
                    .select();

                if (error) {
                    // If 'enabled' field doesn't exist, try 'active'
                    if (error.message?.includes('enabled') || error.code === 'PGRST116') {
                        delete dbBox.enabled;
                        dbBox.active = true;
                        
                        const { data: retryData, error: retryError } = await supabase
                            .from('boxes')
                            .insert(dbBox)
                            .select();

                        if (retryError) {
                            throw retryError;
                        }
                    } else {
                        throw error;
                    }
                }

                successCount++;
                console.log(`✅ Imported: ${box.name} (${box.id})`);
            } catch (error) {
                errorCount++;
                console.error(`❌ Failed to import ${box.name} (${box.id}):`, error.message);
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log(`✅ Successfully imported: ${successCount} boxes`);
        console.log(`❌ Failed: ${errorCount} boxes`);
        console.log('='.repeat(50) + '\n');

        if (successCount > 0) {
            console.log('🎉 Import completed!');
            console.log('   Refresh your admin panel to see the boxes.\n');
        }

    } catch (error) {
        console.error('❌ Import failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run import
importBoxes();
