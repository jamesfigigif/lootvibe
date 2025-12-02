const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const OLD_PROJECT_URL = 'https://cbjdasfnwzizfphnwxfd.supabase.co';
const NEW_PROJECT_URL = process.env.VITE_SUPABASE_URL || 'https://hpflcuyxmwzrknxjgavd.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_SERVICE_KEY environment variable');
    process.exit(1);
}

// Initialize Supabase client (new project)
const supabase = createClient(NEW_PROJECT_URL, SERVICE_KEY);

// List of buckets to migrate
const BUCKETS = ['game-assets', 'avatars', 'box-images'];

async function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(destPath, () => { });
            reject(err);
        });
    });
}

async function migrateImages() {
    console.log('🔄 Starting image migration...');
    console.log(`From: ${OLD_PROJECT_URL}`);
    console.log(`To:   ${NEW_PROJECT_URL}\n`);

    // Create temp directory
    const tempDir = path.join(__dirname, 'temp_images');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    // We need to know which files to migrate. 
    // Since we don't have a list, we'll scan constants.ts to find image URLs
    const constantsPath = path.join(__dirname, '../constants.ts');
    const constantsContent = fs.readFileSync(constantsPath, 'utf8');

    // Regex to find old Supabase URLs
    // Matches: https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/BUCKET/PATH
    // Also matches the new URL format if they were already updated in code but missing in storage
    // We'll try to fetch from OLD url regardless of what's in the code
    const urlRegex = /https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/([^\/]+)\/([^"'\s]+)/g;

    const foundFiles = new Set();
    let match;

    while ((match = urlRegex.exec(constantsContent)) !== null) {
        const bucket = match[1];
        const filePath = match[2];
        foundFiles.add(`${bucket}|${filePath}`);
    }

    console.log(`📦 Found ${foundFiles.size} unique image references in constants.ts\n`);

    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;

    for (const item of foundFiles) {
        const [bucket, filePath] = item.split('|');
        const fileName = path.basename(filePath);
        const localPath = path.join(tempDir, fileName);

        // Construct URLs
        const oldUrl = `${OLD_PROJECT_URL}/storage/v1/object/public/${bucket}/${filePath}`;

        try {
            process.stdout.write(`Migrating ${bucket}/${filePath}... `);

            // 1. Download from old project
            try {
                await downloadFile(oldUrl, localPath);
            } catch (e) {
                console.log('❌ Failed to download (might not exist)');
                errorCount++;
                continue;
            }

            // 2. Upload to new project
            const fileContent = fs.readFileSync(localPath);

            // Determine content type
            const ext = path.extname(fileName).toLowerCase();
            let contentType = 'application/octet-stream';
            if (ext === '.png') contentType = 'image/png';
            if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
            if (ext === '.webp') contentType = 'image/webp';
            if (ext === '.svg') contentType = 'image/svg+xml';

            const { error: uploadError } = await supabase
                .storage
                .from(bucket)
                .upload(filePath, fileContent, {
                    contentType,
                    upsert: true
                });

            if (uploadError) {
                // If bucket doesn't exist, try to create it (though we can't via API usually)
                if (uploadError.message.includes('Bucket not found')) {
                    console.log('❌ Bucket not found (create it in dashboard)');
                } else {
                    console.log(`❌ Upload failed: ${uploadError.message}`);
                }
                errorCount++;
            } else {
                console.log('✅ Done');
                successCount++;
            }

            // Cleanup
            fs.unlinkSync(localPath);

        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            errorCount++;
        }
    }

    // Cleanup temp dir
    if (fs.existsSync(tempDir)) {
        fs.rmdirSync(tempDir);
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Migrated: ${successCount} images`);
    console.log(`❌ Failed:   ${errorCount} images`);
    console.log('='.repeat(50) + '\n');
}

migrateImages();
