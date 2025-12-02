const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hpflcuyxmwzrknxjgavd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiamRhc2Zud3ppemZwaG53eGZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk0Nzg4MiwiZXhwIjoyMDc5NTIzODgyfQ.hZT3qtv9P45G6XWXRp4ELLXQi5KuaKdpEv_XiY4B5go';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BUCKET_NAME = 'game-assets';
const WEBP_DIR = path.resolve(__dirname, '../public/assets/items-webp');

async function uploadWebPImages() {
    console.log('🚀 Starting WebP upload to Supabase...\n');

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

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = path.join(WEBP_DIR, file);
        const fileBuffer = fs.readFileSync(filePath);
        const remotePath = `items/${file}`;

        try {
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(remotePath, fileBuffer, {
                    contentType: 'image/webp',
                    cacheControl: '31536000',
                    upsert: true
                });

            if (error) {
                console.error(`✗ [${i + 1}/${files.length}] ${file}: ${error.message}`);
                failCount++;
            } else {
                console.log(`✓ [${i + 1}/${files.length}] ${file}`);
                successCount++;
            }
        } catch (error) {
            console.error(`✗ [${i + 1}/${files.length}] ${file}: ${error.message}`);
            failCount++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Upload Summary:');
    console.log('='.repeat(60));
    console.log(`Successfully uploaded: ${successCount}/${files.length}`);
    console.log(`Failed: ${failCount}`);
    console.log('='.repeat(60));
    console.log('\n✅ Upload complete!');
    console.log(`\n📝 WebP URLs: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/items/[filename].webp`);
}

uploadWebPImages().catch(console.error);
