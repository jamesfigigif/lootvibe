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

async function importBoxes() {
    console.log('🔄 Starting box import from JSON...\n');

    try {
        // Check for JSON file
        const jsonPath = path.join(__dirname, '../boxes-export.json');
        if (!fs.existsSync(jsonPath)) {
            console.error('❌ boxes-export.json not found!');
            console.error('   First run: tsx scripts/export-boxes-json.js');
            console.error('   Or use: tsx scripts/import-boxes-tsx.js\n');
            return;
        }

        const boxes = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        if (!boxes || boxes.length === 0) {
            console.log('⚠️  No boxes found in JSON file');
            return;
        }

        console.log(`📦 Found ${boxes.length} boxes to import\n`);

        // Check if boxes already exist
        const { count, error: countError } = await supabase
            .from('boxes')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('❌ Error checking boxes:', countError);
            return;
        }

        if (count > 0) {
            console.log(`⚠️  Found ${count} existing boxes in database.`);
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise(resolve => {
                readline.question('   Delete existing and re-import? (yes/no): ', resolve);
            });
            readline.close();

            if (answer.toLowerCase() === 'yes') {
                console.log('🗑️  Deleting existing boxes...');
                const { error: deleteError } = await supabase
                    .from('boxes')
                    .delete()
                    .neq('id', 'dummy');
                if (deleteError) {
                    console.error('❌ Error deleting:', deleteError);
                    return;
                }
                console.log('✅ Deleted existing boxes\n');
            } else {
                console.log('   Skipping import.\n');
                return;
            }
        }

        console.log('📥 Importing boxes...\n');

        let successCount = 0;
        let errorCount = 0;

        for (const box of boxes) {
            try {
                // Map box to database schema
                // Try with image_url first (most common schema)
                let dbBox = {
                    id: box.id,
                    name: box.name,
                    description: box.description || '',
                    price: parseFloat(box.price),
                    sale_price: box.sale_price ? parseFloat(box.sale_price) : null,
                    image_url: box.image || '', // Use image_url (most common)
                    color: box.color,
                    category: box.category,
                    tags: box.tags || [],
                    items: box.items || [], // JSONB
                    enabled: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                // Insert box
                let { error } = await supabase
                    .from('boxes')
                    .insert(dbBox);

                // Handle schema variations
                if (error) {
                    // If 'image_url' doesn't exist, try 'image'
                    if (error.message?.includes('image_url') || error.message?.includes('image')) {
                        delete dbBox.image_url;
                        dbBox.image = box.image || '';
                        const { error: imageError } = await supabase
                            .from('boxes')
                            .insert(dbBox);
                        if (imageError) {
                            // If 'enabled' doesn't exist, try 'active'
                            if (imageError.message?.includes('enabled') || imageError.code === 'PGRST116') {
                                delete dbBox.enabled;
                                dbBox.active = true;
                                const { error: finalError } = await supabase
                                    .from('boxes')
                                    .insert(dbBox);
                                if (finalError) throw finalError;
                            } else {
                                throw imageError;
                            }
                        }
                    } else if (error.message?.includes('enabled') || error.code === 'PGRST116') {
                        // If 'enabled' doesn't exist, try 'active'
                        delete dbBox.enabled;
                        dbBox.active = true;
                        const { error: retryError } = await supabase
                            .from('boxes')
                            .insert(dbBox);
                        if (retryError) throw retryError;
                    } else {
                        throw error;
                    }
                }

                successCount++;
                const itemCount = box.items?.length || 0;
                console.log(`✅ ${box.name} (${itemCount} items)`);
            } catch (error) {
                errorCount++;
                console.error(`❌ ${box.name}:`, error.message);
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log(`✅ Imported: ${successCount} boxes`);
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

importBoxes();

