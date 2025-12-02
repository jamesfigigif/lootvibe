const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ITEMS_DIR = path.join(__dirname, '../public/assets/items');
const OUTPUT_DIR = path.join(__dirname, '../public/assets/items-compressed');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function compressImage(inputPath, outputPath) {
    try {
        const stats = fs.statSync(inputPath);
        const originalSize = stats.size;

        await sharp(inputPath)
            .resize(800, 800, { // Max dimensions while maintaining aspect ratio
                fit: 'inside',
                withoutEnlargement: true
            })
            .png({
                quality: 85,
                compressionLevel: 9,
                adaptiveFiltering: true
            })
            .toFile(outputPath);

        const newStats = fs.statSync(outputPath);
        const newSize = newStats.size;
        const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);

        console.log(`✓ ${path.basename(inputPath)}: ${(originalSize / 1024).toFixed(1)}KB → ${(newSize / 1024).toFixed(1)}KB (${savings}% reduction)`);

        return { originalSize, newSize, savings };
    } catch (error) {
        console.error(`✗ Error compressing ${path.basename(inputPath)}:`, error.message);
        return null;
    }
}

async function compressAllImages() {
    console.log('🖼️  Starting image compression...\n');

    if (!fs.existsSync(ITEMS_DIR)) {
        console.error(`Error: Items directory not found at ${ITEMS_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(ITEMS_DIR).filter(file =>
        file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
    );

    if (files.length === 0) {
        console.log('No images found to compress.');
        return;
    }

    console.log(`Found ${files.length} images to compress\n`);

    let totalOriginal = 0;
    let totalCompressed = 0;
    let successCount = 0;

    for (const file of files) {
        const inputPath = path.join(ITEMS_DIR, file);
        const outputPath = path.join(OUTPUT_DIR, file);

        const result = await compressImage(inputPath, outputPath);

        if (result) {
            totalOriginal += result.originalSize;
            totalCompressed += result.newSize;
            successCount++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Compression Summary:');
    console.log('='.repeat(60));
    console.log(`Total images processed: ${successCount}/${files.length}`);
    console.log(`Total original size: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total compressed size: ${(totalCompressed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total savings: ${((totalOriginal - totalCompressed) / totalOriginal * 100).toFixed(1)}%`);
    console.log('='.repeat(60));
    console.log(`\n✅ Compressed images saved to: ${OUTPUT_DIR}`);
}

compressAllImages().catch(console.error);
