require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const API_KEY = process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;
if (!API_KEY) {
    console.error("❌ Error: GEMINI_API_KEY not found in .env.local or environment variables.");
    process.exit(1);
}

const SUPABASE_URL = 'https://cbjdasfnwzizfphnwxfd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiamRhc2Zud3ppemZwaG53eGZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk0Nzg4MiwiZXhwIjoyMDc5NTIzODgyfQ.hZT3qtv9P45G6XWXRp4ELLXQi5KuaKdpEv_XiY4B5go';
const BUCKET_NAME = 'game-assets';

const genAI = new GoogleGenerativeAI(API_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const ITEMS_DIR = path.join(__dirname, '../public/assets/items');
const OUTPUT_WEBP_DIR = path.join(__dirname, '../public/assets/items-webp');

// Ensure output directories exist
if (!fs.existsSync(ITEMS_DIR)) fs.mkdirSync(ITEMS_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_WEBP_DIR)) fs.mkdirSync(OUTPUT_WEBP_DIR, { recursive: true });

const ASSETS_TO_GENERATE = [
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
    console.log(`🎨 Generating SVG for: ${item.name}...`);

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

async function convertSVGToWebP(svgPath, webpPath) {
    try {
        await sharp(svgPath)
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
        console.error(`❌ Failed to convert ${svgPath} to WebP:`, error.message);
        return false;
    }
}

async function uploadToSupabase(webpPath, remotePath) {
    try {
        const fileBuffer = fs.readFileSync(webpPath);
        
        // Delete existing file if it exists
        await supabase.storage
            .from(BUCKET_NAME)
            .remove([remotePath]);

        // Upload new file
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(remotePath, fileBuffer, {
                contentType: 'image/webp',
                cacheControl: '31536000',
                upsert: true
            });

        if (error) {
            throw error;
        }
        return true;
    } catch (error) {
        console.error(`❌ Failed to upload ${remotePath}:`, error.message);
        return false;
    }
}

async function run() {
    console.log("🚀 Starting Supreme Image Regeneration...\n");
    console.log("This will:");
    console.log("  1. Generate new SVG files for each item");
    console.log("  2. Convert SVGs to WebP format");
    console.log("  3. Upload WebP files to Supabase\n");

    let generated = 0;
    let converted = 0;
    let uploaded = 0;
    let failed = 0;

    for (const item of ASSETS_TO_GENERATE) {
        const svgPath = path.join(ITEMS_DIR, `${item.id}.svg`);
        const webpPath = path.join(OUTPUT_WEBP_DIR, `${item.id}.webp`);
        const remotePath = `items/${item.id}.webp`;

        try {
            // Step 1: Generate SVG
            console.log(`\n[${generated + 1}/${ASSETS_TO_GENERATE.length}] Processing: ${item.name}`);
            
            // Force regeneration by deleting existing SVG
            if (fs.existsSync(svgPath)) {
                fs.unlinkSync(svgPath);
            }

            const svgContent = await generateSVG(item);
            if (!svgContent) {
                failed++;
                continue;
            }

            fs.writeFileSync(svgPath, svgContent);
            generated++;
            console.log(`  ✅ SVG generated`);

            // Step 2: Convert to WebP
            const convertedSuccess = await convertSVGToWebP(svgPath, webpPath);
            if (!convertedSuccess) {
                failed++;
                continue;
            }
            converted++;
            console.log(`  ✅ Converted to WebP`);

            // Step 3: Upload to Supabase
            const uploadedSuccess = await uploadToSupabase(webpPath, remotePath);
            if (!uploadedSuccess) {
                failed++;
                continue;
            }
            uploaded++;
            console.log(`  ✅ Uploaded to Supabase`);

            // Rate limit pause
            await new Promise(r => setTimeout(r, 2000));

        } catch (error) {
            console.error(`  ❌ Error processing ${item.name}:`, error.message);
            failed++;
        }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Regeneration Summary:");
    console.log("=".repeat(60));
    console.log(`✅ SVGs generated: ${generated}/${ASSETS_TO_GENERATE.length}`);
    console.log(`✅ WebP converted: ${converted}/${ASSETS_TO_GENERATE.length}`);
    console.log(`✅ Uploaded: ${uploaded}/${ASSETS_TO_GENERATE.length}`);
    console.log(`❌ Failed: ${failed}`);
    console.log("=".repeat(60));
    console.log("\n✨ Regeneration Complete!");
    console.log(`\n📝 WebP URLs: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/items/son[1-29].webp`);
}

run().catch(console.error);


