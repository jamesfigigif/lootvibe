/**
 * ASSET GENERATION SCRIPT
 * Uses Google Gemini (gemini-1.5-flash) to generate professional SVG assets for LootBoxes.
 */

require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Configuration
const API_KEY = process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;
if (!API_KEY) {
    console.error("❌ Error: GEMINI_API_KEY not found in .env.local or environment variables.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const OUTPUT_DIR = path.join(__dirname, '../public/assets/boxes');

// Load boxes from parsed JSON
const boxesPath = path.join(__dirname, 'parsed_boxes.json');
let BOXES = [];

if (fs.existsSync(boxesPath)) {
    const rawData = fs.readFileSync(boxesPath);
    BOXES = JSON.parse(rawData);
    console.log(`Loaded ${BOXES.length} boxes from parsed_boxes.json`);
} else {
    console.log("⚠️ parsed_boxes.json not found, using default list.");
    // Boxes to generate assets for (default list)
    BOXES = [
        { name: 'Hypebeast Box', desc: 'Supreme, Off-White, and high-end streetwear.', color: 'red' },
        { name: 'Kicks Collection', desc: 'Rare Jordans, Yeezys, and Dunks.', color: 'orange' },
        { name: 'Tech Setup', desc: 'RTX 4090s, Keyboards, and Monitors.', color: 'purple' },
        { name: 'Pokemon Vault', desc: 'First edition boosters and Charizards.', color: 'yellow' },
        { name: 'Apple Ecosystem', desc: 'MacBooks, iPads, and iPhones.', color: 'gray' },
        { name: 'Crypto Whale', desc: 'Hardware wallets and physical coins.', color: 'gold' },
        { name: 'Gamer Fuel', desc: 'Energy drinks and snacks.', color: 'green' },
        { name: 'Watch Club', desc: 'Rolex, Patek, and luxury timepieces.', color: 'slate' },
        { name: 'Satoshi Stack', desc: 'Bitcoin themed collectibles.', color: 'orange' },
        { name: 'Metaverse', desc: 'VR Headsets and digital land.', color: 'blue' },
    ];
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generateSVG(box) {
    console.log(`🎨 Generating asset for: ${box.name}...`);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Create a highly detailed, professional SVG code for a loot box icon representing: "${box.name}".
            Description: ${box.desc}.
            Theme Color: ${box.color}.
            
            Requirements:
            - The SVG should be square (512x512).
            - Use a dark, cyberpunk/gaming aesthetic background (dark gradients).
            - The main object (box/item) should be in the center, glowing.
            - Use gradients and lighting effects in SVG (defs, linearGradient, radialGradient).
            - Do NOT use external images, only vector paths/shapes.
            - Return ONLY the raw SVG code, starting with <svg and ending with </svg>.
            - No markdown formatting (no \`\`\`xml).
        `;

        const result = await model.generateContent(prompt);
        let svgCode = result.response.text();

        // Cleanup markdown if present
        svgCode = svgCode.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();

        // Validate SVG start/end
        if (!svgCode.startsWith('<svg') || !svgCode.endsWith('</svg>')) {
            // Try to find the svg tag
            const startIndex = svgCode.indexOf('<svg');
            const endIndex = svgCode.indexOf('</svg>') + 6;
            if (startIndex !== -1 && endIndex !== -1) {
                svgCode = svgCode.substring(startIndex, endIndex);
            } else {
                throw new Error("Invalid SVG generated");
            }
        }

        return svgCode;

    } catch (error) {
        console.error(`❌ Failed to generate ${box.name}:`, error.message);
        return null;
    }
}

async function run() {
    console.log("🚀 Starting Asset Generation with Google Gemini...");

    for (const box of BOXES) {
        const fileName = box.name.toLowerCase().replace(/ /g, '_') + '.svg'; // Saving as SVG
        const filePath = path.join(OUTPUT_DIR, fileName);

        // Optional: Skip if exists
        // if (fs.existsSync(filePath)) { console.log(`⏩ Skipping ${box.name}`); continue; }

        const svgContent = await generateSVG(box);

        if (svgContent) {
            fs.writeFileSync(filePath, svgContent);
            console.log(`✅ Saved ${fileName}`);
        }

        // Rate limit pause
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log("\n✨ Asset Generation Complete! Check public/assets/boxes");
}

run();