const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ITEMS_DIR = path.join(__dirname, '../public/assets/items-compressed');
const OUTPUT_DIR = path.join(__dirname, '../public/assets/items-webp');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function convertToWebP(inputPath, outputPath) {
    try {
        const stats = fs.statSync(inputPath);
        const originalSize = stats.size;

        await sharp(inputPath)
            .webp({
                quality: 90,
                alphaQuality: 100, // Preserve transparency perfectly
                lossless: false,
                nearLossless: false,
                smartSubsample: true
            })
            .toFile(outputPath);

        const newStats = fs.statSync(outputPath);
        const newSize = newStats.size;
        const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);

        console.log(`✓ ${path.basename(inputPath)}: ${(originalSize / 1024).toFixed(1)}KB → ${(newSize / 1024).toFixed(1)}KB (${savings}% reduction)`);

        return { originalSize, newSize, savings };
    } catch (error) {
        console.error(`✗ Error converting ${path.basename(inputPath)}:`, error.message);
        return null;
    }
}

async function convertAllImages() {
    console.log('🖼️  Converting images to WebP format...\n');

    if (!fs.existsSync(ITEMS_DIR)) {
        console.error(`Error: Items directory not found at ${ITEMS_DIR}`);
        console.log('Please run compress_images.js first to create compressed PNGs');
        process.exit(1);
    }

    const files = fs.readdirSync(ITEMS_DIR).filter(file =>
        file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
    );

    if (files.length === 0) {
        console.log('No images found to convert.');
        return;
    }

    console.log(`Found ${files.length} images to convert\n`);

    let totalOriginal = 0;
    let totalCompressed = 0;
    let successCount = 0;

    for (const file of files) {
        const inputPath = path.join(ITEMS_DIR, file);
        const outputFileName = file.replace(/\.(png|jpg|jpeg)$/i, '.webp');
        const outputPath = path.join(OUTPUT_DIR, outputFileName);

        const result = await convertToWebP(inputPath, outputPath);

        if (result) {
            totalOriginal += result.originalSize;
            totalCompressed += result.newSize;
            successCount++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 WebP Conversion Summary:');
    console.log('='.repeat(60));
    console.log(`Total images processed: ${successCount}/${files.length}`);
    console.log(`Total PNG size: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total WebP size: ${(totalCompressed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total savings: ${((totalOriginal - totalCompressed) / totalOriginal * 100).toFixed(1)}%`);
    console.log('='.repeat(60));
    console.log(`\n✅ WebP images saved to: ${OUTPUT_DIR}`);
}

convertAllImages().catch(console.error);
