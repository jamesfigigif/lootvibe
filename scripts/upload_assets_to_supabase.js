const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
require('dotenv').config(); // Fallback to .env

const SUPABASE_URL = 'https://hpflcuyxmwzrknxjgavd.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiamRhc2Zud3ppemZwaG53eGZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk0Nzg4MiwiZXhwIjoyMDc5NTIzODgyfQ.hZT3qtv9P45G6XWXRp4ELLXQi5KuaKdpEv_XiY4B5go';

if (!SUPABASE_KEY) {
    console.error('Error: SUPABASE_KEY, SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY is missing.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BUCKET_NAME = 'game-assets';
// Use compressed images directory
const ASSETS_DIR = path.resolve(__dirname, '../public/assets/items-compressed');

async function uploadFile(filePath, relativePath) {
    const fileContent = fs.readFileSync(filePath);
    // Convert backslashes to forward slashes for storage path
    const storagePath = relativePath.replace(/\\/g, '/');

    console.log(`Uploading ${storagePath}...`);

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileContent, {
            upsert: true,
            contentType: getContentType(filePath)
        });

    if (error) {
        console.error(`Failed to upload ${storagePath}:`, error.message);
    } else {
        console.log(`Successfully uploaded ${storagePath}`);
    }
}

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const map = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm'
    };
    return map[ext] || 'application/octet-stream';
}

async function processDirectory(dir, baseDir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            await processDirectory(fullPath, baseDir);
        } else {
            // Map items-compressed/* to items/* in storage
            let relativePath = path.relative(baseDir, fullPath);
            relativePath = 'items/' + path.basename(fullPath);
            // Skip .DS_Store and hidden files
            if (file.startsWith('.')) continue;
            await uploadFile(fullPath, relativePath);
        }
    }
}

async function main() {
    console.log(`Starting upload to bucket: ${BUCKET_NAME}`);

    if (!fs.existsSync(ASSETS_DIR)) {
        console.error(`Assets directory not found: ${ASSETS_DIR}`);
        process.exit(1);
    }

    try {
        console.log(`Assuming bucket '${BUCKET_NAME}' exists. Proceeding to upload...`);

        // Try uploading a test file first
        console.log('Attempting test upload...');
        const { data: testData, error: testError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload('test_connection.txt', 'Connection successful!', { upsert: true });

        if (testError) {
            console.error('Test upload failed:', testError);
            console.log('Possible causes:');
            console.log('1. RLS policies preventing upload (you need to add an INSERT policy)');
            console.log('2. Wrong Project URL or Anon Key');
            console.log('3. Bucket does not exist');
            process.exit(1);
        }
        console.log('Test upload successful!');

        await processDirectory(ASSETS_DIR, ASSETS_DIR);
        console.log('Upload complete!');
    } catch (err) {
        console.error('Script failed:', err);
        process.exit(1);
    }
}

main();
