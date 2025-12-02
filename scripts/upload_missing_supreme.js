require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://cbjdasfnwzizfphnwxfd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiamRhc2Zud3ppemZwaG53eGZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk0Nzg4MiwiZXhwIjoyMDc5NTIzODgyfQ.hZT3qtv9P45G6XWXRp4ELLXQi5KuaKdpEv_XiY4B5go';
const BUCKET_NAME = 'game-assets';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function uploadMissingSupremeFiles() {
    console.log('Checking for missing Supreme files...\n');

    const supremeFiles = [
        'boxes/supreme_or_not.png',
        ...Array.from({ length: 29 }, (_, i) => `items/son${i + 1}.png`)
    ];

    let uploadedCount = 0;
    let skippedCount = 0;

    for (const filePath of supremeFiles) {
        const localPath = path.join(__dirname, '..', 'public', 'assets', filePath);

        // Check if local file exists
        if (!fs.existsSync(localPath)) {
            console.log(`⚠️  Local file not found: ${filePath}`);
            continue;
        }

        // Check if file exists in Supabase
        const { data: existingFile } = await supabase.storage
            .from(BUCKET_NAME)
            .list(path.dirname(filePath), {
                search: path.basename(filePath)
            });

        if (existingFile && existingFile.length > 0) {
            console.log(`⏭️  Skipping (already exists): ${filePath}`);
            skippedCount++;
            continue;
        }

        // Upload the file
        const fileBuffer = fs.readFileSync(localPath);
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, fileBuffer, {
                contentType: 'image/png',
                upsert: false
            });

        if (error) {
            console.error(`❌ Failed to upload ${filePath}:`, error.message);
        } else {
            console.log(`✅ Uploaded: ${filePath}`);
            uploadedCount++;
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Uploaded: ${uploadedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total: ${supremeFiles.length}`);
}

uploadMissingSupremeFiles().catch(console.error);
