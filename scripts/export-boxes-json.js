/**
 * Export boxes from constants.ts to JSON
 * This creates a JSON file that can be imported without TypeScript
 */

const fs = require('fs');
const path = require('path');

// This script should be run with tsx to import TypeScript
// But we'll also provide a fallback

try {
    // Try to use tsx/ts-node
    let INITIAL_BOXES;
    
    try {
        // Try tsx first
        require('tsx/cjs/api');
        INITIAL_BOXES = require('../constants.ts').INITIAL_BOXES;
    } catch (e1) {
        try {
            // Try ts-node
            require('ts-node/register');
            INITIAL_BOXES = require('../constants.ts').INITIAL_BOXES;
        } catch (e2) {
            console.error('❌ Cannot import TypeScript file.');
            console.error('   Install tsx: npm install -g tsx');
            console.error('   Then run: tsx scripts/export-boxes-json.js\n');
            process.exit(1);
        }
    }

    if (!INITIAL_BOXES) {
        console.error('❌ No boxes found in constants.ts');
        process.exit(1);
    }

    // Export to JSON
    const outputPath = path.join(__dirname, '../boxes-export.json');
    fs.writeFileSync(outputPath, JSON.stringify(INITIAL_BOXES, null, 2));

    console.log(`✅ Exported ${INITIAL_BOXES.length} boxes to boxes-export.json`);
    console.log(`   File: ${outputPath}\n`);

} catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
}


