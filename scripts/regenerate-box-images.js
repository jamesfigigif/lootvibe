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

// Read constants.ts to get item names
const constantsPath = path.join(__dirname, '../constants.ts');
const constantsContent = fs.readFileSync(constantsPath, 'utf8');

// Extract item info from constants
function extractItemInfo() {
    const items = {};
    const createItemRegex = /createItem\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"][^)]+\)/g;
    let match;
    
    while ((match = createItemRegex.exec(constantsContent)) !== null) {
        const itemId = match[1];
        const itemName = match[2];
        items[itemId] = itemName;
    }
    
    return items;
}

const itemNames = extractItemInfo();

// Box item IDs
const BOX_ITEMS = {
    'BIG_MIX': ['bm1', 'bm2', 'bm3', 'bm4', 'bm5', 'bm6', 'bm7', 'bm8', 'bm9', 'bm10', 'bm11', 'bm12', 'bm13', 'bm14', 'bm15', 'bm16', 'bm17', 'bm18', 'bm19', 'bm20', 'bm21', 'bm22', 'bm23', 'bm24', 'bm25', 'bm26', 'bm27', 'bm28', 'bm29', 'bm30', 'bm31', 'bm32', 'bm33', 'bm34', 'bm35', 'bm36', 'bm37', 'bm38'],
    'RICH_CLUB': ['rc1', 'rc2', 'rc3', 'rc4', 'rc5', 'rc6', 'rc7', 'rc8', 'rc9', 'rc10', 'rc11', 'rc12', 'rc13', 'rc14'],
    'POKER': ['pk1', 'pk2', 'pk3', 'pk4', 'pk5', 'pk6', 'pk7', 'pk8', 'pk9', 'pk10', 'pk11', 'pk12', 'pk13', 'pk14', 'pk15', 'pk16', 'pk17', 'pk18', 'pk19', 'pk20', 'pk21', 'pk22', 'pk23', 'pk24', 'pk25', 'pk26', 'pk27', 'pk28', 'pk29', 'pk30', 'pk31', 'pk32', 'pk33', 'pk34'],
    'MIXED_SPORTS': ['ms1', 'ms2', 'ms3', 'ms4', 'ms5', 'ms6', 'ms7', 'ms8', 'ms9', 'ms10', 'ms11', 'ms12', 'ms13', 'ms14', 'ms15', 'ms16', 'ms17', 'ms18', 'ms19', 'ms20'],
    'BIG_BALLER': ['bb1', 'bb2', 'bb3', 'bb4', 'bb5', 'bb6', 'bb7', 'bb8', 'bb9', 'bb10', 'bb11', 'bb12', 'bb13', 'bb14', 'bb15', 'bb16', 'bb17', 'bb18', 'bb19', 'bb20', 'bb21', 'bb22', 'bb23', 'bb24', 'bb25']
};

// Generate clear, descriptive prompts
function generatePrompt(itemId, itemName) {
    // Create a clear, detailed prompt that makes the item obvious
    const basePrompt = `${itemName}. `;
    
    // Add specific details based on item type
    let details = '';
    
    if (itemName.includes('Watch') || itemName.includes('Rolex') || itemName.includes('Tudor')) {
        details = 'Luxury timepiece, premium watch, detailed dial, floating in void, ';
    } else if (itemName.includes('Sneaker') || itemName.includes('Jordan') || itemName.includes('Dunk') || itemName.includes('Yeezy')) {
        details = 'Premium sneakers, basketball shoes, detailed design, floating in void, ';
    } else if (itemName.includes('Bag') || itemName.includes('Pouch') || itemName.includes('Cardholder')) {
        details = 'Luxury handbag or accessory, premium leather, detailed craftsmanship, floating in void, ';
    } else if (itemName.includes('Hoodie') || itemName.includes('Shirt') || itemName.includes('T-shirt') || itemName.includes('Vest') || itemName.includes('Jacket')) {
        details = 'Premium clothing item, streetwear fashion, detailed design, floating in void, ';
    } else if (itemName.includes('Poker') || itemName.includes('Chip') || itemName.includes('Card') || itemName.includes('Table')) {
        details = 'Poker equipment, casino gear, professional gaming item, floating in void, ';
    } else if (itemName.includes('Basketball') || itemName.includes('Football') || itemName.includes('Pool') || itemName.includes('Sports')) {
        details = 'Sports equipment, athletic gear, detailed design, floating in void, ';
    } else if (itemName.includes('Diamond') || itemName.includes('Gold') || itemName.includes('Platinum') || itemName.includes('Jewelry') || itemName.includes('Bracelet') || itemName.includes('Chain') || itemName.includes('Earrings')) {
        details = 'Luxury jewelry, precious metals and gems, exquisite craftsmanship, floating in void, ';
    } else if (itemName.includes('Porsche') || itemName.includes('Yamaha') || itemName.includes('Motorcycle')) {
        details = 'Luxury vehicle, premium automobile, detailed design, floating in void, ';
    } else if (itemName.includes('Macbook') || itemName.includes('RTX') || itemName.includes('GPU') || itemName.includes('PS5') || itemName.includes('Xbox') || itemName.includes('Gaming')) {
        details = 'Premium tech device, high-end electronics, detailed components, floating in void, ';
    } else if (itemName.includes('Gift Card') || itemName.includes('Voucher')) {
        details = 'Digital gift card or voucher, premium design, floating in void, ';
    } else {
        details = 'Premium item, luxury product, detailed design, floating in void, ';
    }
    
    return basePrompt + details + BRAND_STYLE;
}

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

        const candidates = result.candidates || (result.response && result.response.candidates);
        if (candidates && candidates[0].content && candidates[0].content.parts) {
            for (const part of candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    return part.inlineData.data;
                }
            }
        }

        return null;
    } catch (error) {
        console.error("   ❌ Vertex AI Error:", error.message);
        return null;
    }
}

// Convert PNG to WebP with compression
async function convertToWebP(pngPath, webpPath) {
    try {
        await sharp(pngPath)
            .resize(512, 512, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .webp({
                quality: 85,
                alphaQuality: 90,
                lossless: false,
                effort: 6
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
        
        await supabase.storage
            .from(BUCKET_NAME)
            .remove([remotePath]);

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
        console.error(`   ❌ Failed to upload:`, error.message);
        return false;
    }
}

// Main function
async function run() {
    const allItems = [
        ...BOX_ITEMS.BIG_MIX,
        ...BOX_ITEMS.RICH_CLUB,
        ...BOX_ITEMS.POKER,
        ...BOX_ITEMS.MIXED_SPORTS,
        ...BOX_ITEMS.BIG_BALLER
    ];

    console.log(`🚀 Regenerating ${allItems.length} images with clear, descriptive prompts...\n`);

    let generated = 0;
    let converted = 0;
    let uploaded = 0;
    let failed = 0;

    for (const itemId of allItems) {
        const itemName = itemNames[itemId];
        if (!itemName) {
            console.log(`⚠️  Skipping ${itemId}: name not found`);
            continue;
        }

        const prompt = generatePrompt(itemId, itemName);
        const pngPath = path.join(ITEMS_DIR, `${itemId}.png`);
        const webpPath = path.join(OUTPUT_WEBP_DIR, `${itemId}.webp`);
        const remotePath = `items/${itemId}.webp`;

        // Force regeneration
        if (fs.existsSync(pngPath)) fs.unlinkSync(pngPath);
        if (fs.existsSync(webpPath)) fs.unlinkSync(webpPath);

        console.log(`\n[${generated + 1}/${allItems.length}] Processing: ${itemId}`);
        console.log(`   Item: ${itemName}`);
        console.log(`   Prompt: ${prompt.substring(0, 100)}...`);

        try {
            // Generate PNG
            console.log("   Generating image...");
            const imageBase64 = await generateWithVertex(prompt);
            
            if (!imageBase64) {
                console.log(`   ⚠️ Failed to generate`);
                failed++;
                continue;
            }

            fs.writeFileSync(pngPath, imageBase64, 'base64');
            generated++;
            console.log(`   ✅ PNG generated`);

            // Convert to WebP
            console.log("   Converting to WebP (compressed)...");
            const convertedSuccess = await convertToWebP(pngPath, webpPath);
            if (!convertedSuccess) {
                failed++;
                continue;
            }
            converted++;
            console.log(`   ✅ Converted to WebP`);

            // Upload to Supabase
            console.log("   Uploading to Supabase...");
            const uploadedSuccess = await uploadToSupabase(webpPath, remotePath);
            if (!uploadedSuccess) {
                failed++;
                continue;
            }
            uploaded++;
            console.log(`   ✅ Uploaded`);

            // Rate limit pause
            await new Promise(r => setTimeout(r, 2000));

        } catch (error) {
            console.error(`   ❌ Error:`, error.message);
            failed++;
        }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Generation Summary:");
    console.log("=".repeat(60));
    console.log(`✅ PNGs generated: ${generated}/${allItems.length}`);
    console.log(`✅ WebP converted: ${converted}/${allItems.length}`);
    console.log(`✅ Uploaded: ${uploaded}/${allItems.length}`);
    console.log(`❌ Failed: ${failed}`);
    console.log("=".repeat(60));
    console.log("\n✨ All images regenerated with clear prompts!");
}

run().catch(console.error);


