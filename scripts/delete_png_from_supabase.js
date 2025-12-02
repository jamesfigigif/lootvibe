const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://cbjdasfnwzizfphnwxfd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiamRhc2Zud3ppemZwaG53eGZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk0Nzg4MiwiZXhwIjoyMDc5NTIzODgyfQ.hZT3qtv9P45G6XWXRp4ELLXQi5KuaKdpEv_XiY4B5go';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BUCKET_NAME = 'game-assets';
const WEBP_DIR = path.resolve(__dirname, '../public/assets/items-webp');

async function deletePNGsFromSupabase() {
    console.log('🗑️  Starting PNG deletion from Supabase...\n');

    if (!fs.existsSync(WEBP_DIR)) {
        console.error(`❌ WebP directory not found at ${WEBP_DIR}`);
        console.log('Cannot determine which PNGs to delete without WebP reference.');
        process.exit(1);
    }

    // Get list of WebP files (these are the ones we want to keep as WebP)
    const webpFiles = fs.readdirSync(WEBP_DIR).filter(file => file.endsWith('.webp'));

    if (webpFiles.length === 0) {
        console.log('No WebP files found. Nothing to delete.');
        return;
    }

    console.log(`Found ${webpFiles.length} WebP files. Will delete corresponding PNGs from Supabase.\n`);

    let successCount = 0;
    let failCount = 0;
    let notFoundCount = 0;

    for (let i = 0; i < webpFiles.length; i++) {
        const webpFile = webpFiles[i];
        // Convert filename.webp -> filename.png
        const pngFile = webpFile.replace('.webp', '.png');
        const remotePath = `items/${pngFile}`;

        try {
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .remove([remotePath]);

            if (error) {
                if (error.message.includes('not found') || error.message.includes('does not exist')) {
                    console.log(`⚪ [${i + 1}/${webpFiles.length}] ${pngFile} - Not found (already deleted or never existed)`);
                    notFoundCount++;
                } else {
                    console.error(`✗ [${i + 1}/${webpFiles.length}] ${pngFile}: ${error.message}`);
                    failCount++;
                }
            } else {
                console.log(`✓ [${i + 1}/${webpFiles.length}] Deleted ${pngFile}`);
                successCount++;
            }
        } catch (error) {
            console.error(`✗ [${i + 1}/${webpFiles.length}] ${pngFile}: ${error.message}`);
            failCount++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Deletion Summary:');
    console.log('='.repeat(60));
    console.log(`Successfully deleted: ${successCount}/${webpFiles.length}`);
    console.log(`Not found (skipped): ${notFoundCount}`);
    console.log(`Failed: ${failCount}`);
    console.log('='.repeat(60));

    if (successCount > 0) {
        console.log('\n✅ PNG cleanup complete!');
        console.log(`💾 Estimated space saved: ~${((successCount * 350) / 1024).toFixed(2)} MB`);
    }
}

deletePNGsFromSupabase().catch(console.error);
