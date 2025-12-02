require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://cbjdasfnwzizfphnwxfd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiamRhc2Zud3ppemZwaG53eGZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk0Nzg4MiwiZXhwIjoyMDc5NTIzODgyfQ.hZT3qtv9P45G6XWXRp4ELLXQi5KuaKdpEv_XiY4B5go';
const BUCKET_NAME = 'game-assets';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Load Supreme items
const supremeItems = require('./prompts/supreme_or_not_items.json');

// Directory
const WEBP_DIR = path.join(__dirname, '../public/assets/items-webp');

async function uploadSupremeItems() {
    console.log(`🚀 Starting upload for ${supremeItems.length} Supreme items...\n`);

    let uploaded = 0;
    let failed = 0;

    for (const item of supremeItems) {
        const fileName = `${item.name}.webp`;
        const localPath = path.join(WEBP_DIR, fileName);
        const remotePath = `items/${fileName}`;

        if (!fs.existsSync(localPath)) {
            console.error(`❌ Local file not found: ${localPath}`);
            failed++;
            continue;
        }

        console.log(`Uploading ${fileName}...`);

        try {
            const fileBuffer = fs.readFileSync(localPath);

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
                throw error;
            }

            console.log(`   ✅ Uploaded to Supabase`);
            uploaded++;

        } catch (error) {
            console.error(`   ❌ Failed to upload:`, error.message);
            failed++;
        }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Upload Summary:");
    console.log("=".repeat(60));
    console.log(`✅ Uploaded: ${uploaded}/${supremeItems.length}`);
    console.log(`❌ Failed: ${failed}`);
    console.log("=".repeat(60));
}

uploadSupremeItems().catch(console.error);
