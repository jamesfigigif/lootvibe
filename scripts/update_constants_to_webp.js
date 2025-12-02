const fs = require('fs');
const path = require('path');

const CONSTANTS_FILE = path.join(__dirname, '../constants.ts');
const SUPABASE_URL = 'https://cbjdasfnwzizfphnwxfd.supabase.co';
const BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/game-assets/items/`;

function updateConstantsToWebP() {
    console.log('📝 Updating constants.ts to use WebP images...\n');

    if (!fs.existsSync(CONSTANTS_FILE)) {
        console.error(`❌ constants.ts not found at ${CONSTANTS_FILE}`);
        process.exit(1);
    }

    let content = fs.readFileSync(CONSTANTS_FILE, 'utf8');
    let changeCount = 0;

    // Replace all .png URLs with .webp URLs
    const regex = new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^'"]+)\\.png`, 'g');

    content = content.replace(regex, (match, filename) => {
        changeCount++;
        return `${BASE_URL}${filename}.webp`;
    });

    if (changeCount === 0) {
        console.log('⚠️  No PNG URLs found to replace');
        return;
    }

    // Write back to file
    fs.writeFileSync(CONSTANTS_FILE, content, 'utf8');

    console.log(`✅ Updated ${changeCount} image URLs from .png to .webp`);
    console.log(`📄 File: ${CONSTANTS_FILE}`);
    console.log('\n🎉 All done! Your constants.ts now uses WebP images.');
}

updateConstantsToWebP();
