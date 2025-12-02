const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hpflcuyxmwzrknxjgavd.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET_NAME = 'game-assets';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Box images to convert
const BOX_IMAGES = [
    'pokemon_box',
    'food_box',
    'sneaker_box',
    'steam_box',
    'tech_box',
    'supreme_box',
    'apple_budget',
    'samsung_budget',
    'gamer_budget',
    'charizard_chase',
    'pokemon_budget',
    'modern_hits',
    'vintage_vault',
    'apple_2025',
    'pc_components',
    'switch_2',
    'rtx_1_percent',
    'supreme_or_not',
    'big_mix',
    'rich_club',
    'poker_box',
    'golf_box',
    'big_baller',
    'mixed_sports',
    'football_box',
    'basketball_box',
    'artsy_hustle',
    'luxury_sneakers',
    'free_box'
];

// Directories
const TEMP_DIR = path.join(__dirname, 'temp_boxes');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// Download from Supabase
async function downloadFromSupabase(remotePath, localPath) {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .download(remotePath);

        if (error) throw error;

        const buffer = Buffer.from(await data.arrayBuffer());
        fs.writeFileSync(localPath, buffer);
        return true;
    } catch (error) {
        console.error(`   ❌ Download failed:`, error.message);
        return false;
    }
}

// Convert PNG to WebP
async function convertToWebP(pngPath, webpPath) {
    try {
        await sharp(pngPath)
            .resize(512, 512, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .webp({
                quality: 90,
                alphaQuality: 100,
                lossless: false
            })
            .toFile(webpPath);
        return true;
    } catch (error) {
        console.error(`   ❌ Conversion failed:`, error.message);
        return false;
    }
}

// Upload to Supabase
async function uploadToSupabase(webpPath, remotePath) {
    try {
        const fileBuffer = fs.readFileSync(webpPath);

        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(remotePath, fileBuffer, {
                contentType: 'image/webp',
                cacheControl: '31536000',
                upsert: true
            });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error(`   ❌ Upload failed:`, error.message);
        return false;
    }
}

async function run() {
    console.log(`🔄 Converting ${BOX_IMAGES.length} box images to WebP...\n`);

    let converted = 0;
    let uploaded = 0;
    let failed = 0;

    for (const boxName of BOX_IMAGES) {
        const pngRemotePath = `boxes/${boxName}.png`;
        const webpRemotePath = `boxes/${boxName}.webp`;
        const pngLocalPath = path.join(TEMP_DIR, `${boxName}.png`);
        const webpLocalPath = path.join(TEMP_DIR, `${boxName}.webp`);

        console.log(`\n[${converted + failed + 1}/${BOX_IMAGES.length}] Processing: ${boxName}`);

        try {
            // Step 1: Download PNG
            console.log('   Downloading PNG...');
            const downloaded = await downloadFromSupabase(pngRemotePath, pngLocalPath);
            if (!downloaded) {
                console.log('   ⚠️ PNG not found, skipping');
                failed++;
                continue;
            }
            console.log('   ✅ Downloaded');

            // Step 2: Convert to WebP
            console.log('   Converting to WebP...');
            const convertedSuccess = await convertToWebP(pngLocalPath, webpLocalPath);
            if (!convertedSuccess) {
                failed++;
                continue;
            }
            converted++;
            console.log('   ✅ Converted');

            // Step 3: Upload WebP
            console.log('   Uploading WebP...');
            const uploadedSuccess = await uploadToSupabase(webpLocalPath, webpRemotePath);
            if (!uploadedSuccess) {
                failed++;
                continue;
            }
            uploaded++;
            console.log('   ✅ Uploaded');

            // Cleanup
            if (fs.existsSync(pngLocalPath)) fs.unlinkSync(pngLocalPath);
            if (fs.existsSync(webpLocalPath)) fs.unlinkSync(webpLocalPath);

        } catch (error) {
            console.error(`   ❌ Error:`, error.message);
            failed++;
        }
    }

    // Cleanup temp dir
    if (fs.existsSync(TEMP_DIR)) {
        fs.rmdirSync(TEMP_DIR);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Conversion Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Converted: ${converted}/${BOX_IMAGES.length}`);
    console.log(`✅ Uploaded:  ${uploaded}/${BOX_IMAGES.length}`);
    console.log(`❌ Failed:    ${failed}`);
    console.log('='.repeat(60));
    console.log('\n✨ Conversion Complete!');
}

run().catch(console.error);
