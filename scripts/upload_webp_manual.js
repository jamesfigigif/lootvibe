const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Prompt user for credentials
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const WEBP_DIR = path.join(__dirname, '../public/assets/items-webp');
const BUCKET_NAME = 'game-assets';

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function uploadWebPImages() {
    console.log('🔐 Supabase WebP Upload Tool\n');

    const SUPABASE_URL = await question('Enter Supabase URL (https://xxx.supabase.co): ');
    const SUPABASE_KEY = await question('Enter Supabase Service Role Key (or Anon Key): ');

    rl.close();

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('❌ Missing credentials');
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL.trim(), SUPABASE_KEY.trim());

    console.log('\n🚀 Starting WebP upload to Supabase...\n');

    if (!fs.existsSync(WEBP_DIR)) {
        console.error(`❌ WebP directory not found at ${WEBP_DIR}`);
        console.log('Please run convert_to_webp.js first');
        process.exit(1);
    }

    const files = fs.readdirSync(WEBP_DIR).filter(file => file.endsWith('.webp'));

    if (files.length === 0) {
        console.log('No WebP images found to upload.');
        return;
    }

    console.log(`Found ${files.length} WebP images to upload\n`);

    let successCount = 0;
    let failCount = 0;
    let uploadedUrls = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = path.join(WEBP_DIR, file);
        const fileBuffer = fs.readFileSync(filePath);
        const remotePath = `items/${file}`;

        try {
            // Delete existing file if it exists
            await supabase.storage
                .from(BUCKET_NAME)
                .remove([remotePath]);

            // Upload new file
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(remotePath, fileBuffer, {
                    contentType: 'image/webp',
                    cacheControl: '31536000',
                    upsert: true
                });

            if (error) {
                console.error(`✗ [${i + 1}/${files.length}] Failed: ${file} - ${error.message}`);
                failCount++;
            } else {
                const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${remotePath}`;
                console.log(`✓ [${i + 1}/${files.length}] ${file}`);
                uploadedUrls.push({ file, url: publicUrl });
                successCount++;
            }
        } catch (error) {
            console.error(`✗ [${i + 1}/${files.length}] Error: ${file} - ${error.message}`);
            failCount++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Upload Summary:');
    console.log('='.repeat(60));
    console.log(`Successfully uploaded: ${successCount}/${files.length}`);
    console.log(`Failed: ${failCount}`);
    console.log('='.repeat(60));

    if (successCount > 0) {
        console.log('\n✅ Upload complete!');
        console.log('\n📝 Sample URLs:');
        uploadedUrls.slice(0, 3).forEach(({ file, url }) => {
            console.log(`  ${file} → ${url}`);
        });
    }
}

uploadWebPImages().catch(console.error);
