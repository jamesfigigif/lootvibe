
require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Configuration
const API_KEY = process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;
if (!API_KEY) {
    console.error("❌ Error: GEMINI_API_KEY not found in .env.local or environment variables.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const BOXES_DIR = path.join(__dirname, '../public/assets/boxes');
const ITEMS_DIR = path.join(__dirname, '../public/assets/items');

// Ensure output directories exist
if (!fs.existsSync(BOXES_DIR)) fs.mkdirSync(BOXES_DIR, { recursive: true });
if (!fs.existsSync(ITEMS_DIR)) fs.mkdirSync(ITEMS_DIR, { recursive: true });

const ASSETS_TO_GENERATE = [
    // BOX
    { type: 'box', id: 'supreme_or_not', name: 'Supreme or Not Box', desc: 'Supreme Box Logo, red and white streetwear aesthetic', color: 'red' },

    // ITEMS
    { type: 'item', id: 'son1', name: 'Supreme Meissen Porcelain Cupid', desc: 'Porcelain cupid figurine with Supreme branding', color: 'white' },
    { type: 'item', id: 'son2', name: 'Supreme RIMOWA Topas Suitcase', desc: 'Red Rimowa suitcase with large white Supreme logo', color: 'red' },
    { type: 'item', id: 'son3', name: 'Supreme RIMOWA Cabin Plus', desc: 'Black Rimowa suitcase with Supreme logo', color: 'black' },
    { type: 'item', id: 'son4', name: 'Supreme LV Monogram Scarf', desc: 'Brown Louis Vuitton scarf with Supreme monogram', color: 'brown' },
    { type: 'item', id: 'son5', name: 'Supreme Stone Island Camo Jacket', desc: 'Camo down jacket with Supreme branding', color: 'camo' },
    { type: 'item', id: 'son6', name: 'Supreme TNF RTG Jacket', desc: 'Bright green/yellow North Face jacket with Supreme logo', color: 'green' },
    { type: 'item', id: 'son7', name: 'Supreme TNF S Logo Mountain Jacket', desc: 'Red mountain jacket with large S logo', color: 'red' },
    { type: 'item', id: 'son8', name: 'Supreme TNF S Logo Mountain Jacket Black', desc: 'Black mountain jacket with large S logo', color: 'black' },
    { type: 'item', id: 'son9', name: 'Supreme TNF Cargo Jacket', desc: 'Beige cargo jacket with many pockets', color: 'beige' },
    { type: 'item', id: 'son10', name: 'Supreme Numark Portable Turntable', desc: 'Small red turntable with Supreme logo', color: 'red' },
    { type: 'item', id: 'son11', name: 'Supreme TNF RTG Backpack', desc: 'Black tactical backpack', color: 'black' },
    { type: 'item', id: 'son12', name: 'Nike Supreme SB Dunk Low Stars', desc: 'White and blue sneaker with gold stars', color: 'blue' },
    { type: 'item', id: 'son13', name: 'Supreme Cross Box Logo Hoodie', desc: 'Grey hoodie with cross box logo', color: 'grey' },
    { type: 'item', id: 'son14', name: 'Nike Supreme SB Dunk Low Hyper Royal', desc: 'White and blue sneaker', color: 'blue' },
    { type: 'item', id: 'son15', name: 'Supreme Backpack SS20', desc: 'Red backpack with mesh pockets', color: 'red' },
    { type: 'item', id: 'son16', name: 'Supreme Diamond Plate Tool Box', desc: 'Red metal tool box', color: 'red' },
    { type: 'item', id: 'son17', name: 'Supreme Nike Half Zip Hoodie', desc: 'Black half zip hoodie', color: 'black' },
    { type: 'item', id: 'son18', name: 'Supreme Murakami COVID-19 Tee', desc: 'White tee with Murakami flower box logo', color: 'white' },
    { type: 'item', id: 'son19', name: 'Supreme Smurfs Skateboard', desc: 'Red skateboard deck with Smurfs', color: 'red' },
    { type: 'item', id: 'son20', name: 'Supreme Seiko Marathon Clock', desc: 'Red digital clock', color: 'red' },
    { type: 'item', id: 'son21', name: 'Supreme Pyle Megaphone', desc: 'Red megaphone with white logo', color: 'red' },
    { type: 'item', id: 'son22', name: 'Supreme Wavian Jerry Can', desc: 'Red metal jerry can', color: 'red' },
    { type: 'item', id: 'son23', name: 'Supreme Metal Folding Chair', desc: 'Red folding chair', color: 'red' },
    { type: 'item', id: 'son24', name: 'Supreme Futura Logo Cap', desc: 'Black 5-panel cap', color: 'black' },
    { type: 'item', id: 'son25', name: 'Supreme Distorted Logo Skateboard', desc: 'Black skateboard deck', color: 'black' },
    { type: 'item', id: 'son26', name: 'Supreme Kaws Chalk Logo Skateboard', desc: 'Red skateboard deck with chalk logo', color: 'red' },
    { type: 'item', id: 'son27', name: 'Supreme Watch Plate', desc: 'Ceramic plate with watch face design', color: 'white' },
    { type: 'item', id: 'son28', name: 'Supreme Ty Beanie Baby', desc: 'American flag bear plush', color: 'multi' },
    { type: 'item', id: 'son29', name: 'LootVibe Voucher', desc: 'Golden voucher ticket', color: 'gold' },
];

async function generateSVG(item) {
    console.log(`🎨 Generating asset for: ${item.name}...`);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Create a highly detailed, professional SVG code for a loot box item icon representing: "${item.name}".
            Description: ${item.desc}.
            Theme Color: ${item.color}.
            
            Requirements:
            - The SVG should be square (512x512).
            - Use a transparent background (no background rect).
            - The object should be in the center, high quality vector art.
            - Use gradients and lighting effects in SVG (defs, linearGradient, radialGradient) to make it look premium/3D.
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
        console.error(`❌ Failed to generate ${item.name}:`, error.message);
        return null;
    }
}

async function run() {
    console.log("🚀 Starting Supreme Asset Generation...");

    for (const item of ASSETS_TO_GENERATE) {
        const fileName = item.id + '.svg';
        const dir = item.type === 'box' ? BOXES_DIR : ITEMS_DIR;
        const filePath = path.join(dir, fileName);

        if (fs.existsSync(filePath)) {
            console.log(`⏩ Skipping ${item.name} (already exists)`);
            continue;
        }

        const svgContent = await generateSVG(item);

        if (svgContent) {
            fs.writeFileSync(filePath, svgContent);
            console.log(`✅ Saved ${fileName}`);
        }

        // Rate limit pause
        await new Promise(r => setTimeout(r, 1500));
    }

    console.log("\n✨ Supreme Asset Generation Complete!");
}

run();
