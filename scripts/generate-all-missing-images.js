require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const gcpProjectId = process.env.GCP_PROJECT_ID;
const SUPABASE_URL = 'https://cbjdasfnwzizfphnwxfd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiamRhc2Zud3ppemZwaG53eGZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk0Nzg4MiwiZXhwIjoyMDc5NTIzODgyfQ.hZT3qtv9P45G6XWXRp4ELLXQi5KuaKdpEv_XiY4B5go';
const BUCKET_NAME = 'game-assets';

// Missing item IDs from the check
const MISSING_ITEM_IDS = [
    'bm1', 'rc10', 'rc11', 'pk2', 'pk33', 'bb6', 'bb7', 'ms13', 'fb10', 'bk10',
    'ah6', 'ah7', 'ah11', 'ah26', 'ah29', 'ah30', 'ah38', 'ah41', 'ah42', 'ah55', 'ah62',
    'ls9', 'ls20', 'ls51', 'ls54'
];

// Initialize Clients
let vertexClient = null;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

if (gcpProjectId) {
    try {
        vertexClient = new GoogleGenAI({
            vertexai: true,
            project: gcpProjectId,
            location: 'global'
        });
        console.log(`✅ Vertex AI initialized (Project: ${gcpProjectId})`);
    } catch (e) {
        console.error("❌ Failed to initialize Vertex AI:", e.message);
        process.exit(1);
    }
} else {
    console.error("❌ GCP_PROJECT_ID not found in .env.local");
    process.exit(1);
}

// Brand Style
const BRAND_STYLE = "Cyberpunk style, dark background, glowing neon effects, high contrast, 3D render, 8k resolution, unreal engine 5 style";

// Load all prompts
const boxes = require('./prompts/boxes.json');
const pokemonItems = require('./prompts/pokemon_items.json');
const techItems = require('./prompts/tech_items.json');
const streetwearItems = require('./prompts/streetwear_items.json');
const sportsItems = require('./prompts/sports_items.json');
const miscItems = require('./prompts/misc_items.json');

const ALL_PROMPTS = [
    ...boxes,
    ...pokemonItems,
    ...techItems,
    ...streetwearItems,
    ...sportsItems,
    ...miscItems
].map(asset => ({
    ...asset,
    prompt: asset.prompt.replace('${BRAND_STYLE}', BRAND_STYLE)
}));

// Filter for missing items
const ASSETS_TO_GENERATE = ALL_PROMPTS.filter(asset => MISSING_ITEM_IDS.includes(asset.name));

console.log(`\n📋 Found prompts for ${ASSETS_TO_GENERATE.length}/${MISSING_ITEM_IDS.length} missing items\n`);

// Directories
const ITEMS_DIR = path.join(__dirname, '../public/assets/items');
const OUTPUT_WEBP_DIR = path.join(__dirname, '../public/assets/items-webp');

// Ensure directories exist
if (!fs.existsSync(ITEMS_DIR)) fs.mkdirSync(ITEMS_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_WEBP_DIR)) fs.mkdirSync(OUTPUT_WEBP_DIR, { recursive: true });

// Generate with Vertex AI
async function generateWithVertex(prompt) {
    if (!vertexClient) return null;
    try {
        console.log("   Generating with Gemini 3 Pro Image...");

        const result = await vertexClient.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: [{
                role: 'user',
                parts: [{ text: prompt }]
            }],
            config: {
                temperature: 1,
                topP: 0.95,
                maxOutputTokens: 32768,
                responseModalities: ['TEXT', 'IMAGE'],
                safetySettings: [
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'OFF' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'OFF' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'OFF' },
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'OFF' }
                ],
                imageConfig: {
                    aspectRatio: '1:1',
                    imageSize: '1K',
                    outputMimeType: 'image/png'
                }
            }
        });

        // Extract image
        const candidates = result.candidates || (result.response && result.response.candidates);
        if (candidates && candidates[0].content && candidates[0].content.parts) {
            for (const part of candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    return part.inlineData.data; // Return base64 string
                }
            }
        }

        console.log("   ⚠️ No image found in Vertex AI response");
        return null;

    } catch (error) {
        console.error("   ❌ Vertex AI Error:", error.message);
        if (error.response) {
            console.error("   Details:", JSON.stringify(error.response, null, 2));
        }
        return null;
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
        console.error(`   ❌ Failed to convert to WebP:`, error.message);
        return false;
    }
}

// Upload to Supabase
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
        console.error(`   ❌ Failed to upload:`, error.message);
        return false;
    }
}

// Main function
async function run() {
    if (ASSETS_TO_GENERATE.length === 0) {
        console.log('⚠️  No prompts found for missing items. Please check prompts files.');
        console.log(`Missing items without prompts: ${MISSING_ITEM_IDS.filter(id => !ASSETS_TO_GENERATE.find(a => a.name === id)).join(', ')}`);
        return;
    }

    console.log(`🚀 Generating ${ASSETS_TO_GENERATE.length} missing images...\n`);

    let generated = 0;
    let converted = 0;
    let uploaded = 0;
    let failed = 0;

    for (const asset of ASSETS_TO_GENERATE) {
        const pngPath = path.join(ITEMS_DIR, `${asset.name}.png`);
        const webpPath = path.join(OUTPUT_WEBP_DIR, `${asset.name}.webp`);
        const remotePath = `items/${asset.name}.webp`;

        // Force regeneration by deleting existing files
        if (fs.existsSync(pngPath)) {
            fs.unlinkSync(pngPath);
        }
        if (fs.existsSync(webpPath)) {
            fs.unlinkSync(webpPath);
        }

        console.log(`\n[${generated + 1}/${ASSETS_TO_GENERATE.length}] Processing: ${asset.name}`);

        try {
            // Step 1: Generate PNG with Vertex AI
            console.log("   Generating image...");
            const imageBase64 = await generateWithVertex(asset.prompt);
            
            if (!imageBase64) {
                console.log(`   ⚠️ Failed to generate image`);
                failed++;
                continue;
            }

            // Save PNG
            fs.writeFileSync(pngPath, imageBase64, 'base64');
            generated++;
            console.log(`   ✅ PNG generated`);

            // Step 2: Convert to WebP
            console.log("   Converting to WebP...");
            const convertedSuccess = await convertToWebP(pngPath, webpPath);
            if (!convertedSuccess) {
                failed++;
                continue;
            }
            converted++;
            console.log(`   ✅ Converted to WebP`);

            // Step 3: Upload to Supabase
            console.log("   Uploading to Supabase...");
            const uploadedSuccess = await uploadToSupabase(webpPath, remotePath);
            if (!uploadedSuccess) {
                failed++;
                continue;
            }
            uploaded++;
            console.log(`   ✅ Uploaded to Supabase`);

            // Rate limit pause
            await new Promise(r => setTimeout(r, 2000));

        } catch (error) {
            console.error(`   ❌ Error processing ${asset.name}:`, error.message);
            failed++;
        }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Generation Summary:");
    console.log("=".repeat(60));
    console.log(`✅ PNGs generated: ${generated}/${ASSETS_TO_GENERATE.length}`);
    console.log(`✅ WebP converted: ${converted}/${ASSETS_TO_GENERATE.length}`);
    console.log(`✅ Uploaded: ${uploaded}/${ASSETS_TO_GENERATE.length}`);
    console.log(`❌ Failed: ${failed}`);
    console.log("=".repeat(60));
    console.log("\n✨ Generation Complete!");
}

run().catch(console.error);


