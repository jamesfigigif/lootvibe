require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const gcpProjectId = process.env.GCP_PROJECT_ID;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hpflcuyxmwzrknxjgavd.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
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

// Prompt for Free Box
const FREE_BOX_PROMPT = `Create a stunning loot box design for a "FREE WELCOME GIFT BOX". 
Style: Cyberpunk futuristic, glowing neon effects, premium luxury feel, dark background with vibrant accents.
The box should look like a high-tech gift package with:
- Holographic ribbons and bows
- Glowing "FREE" text in neon green or gold
- Sparkles and particle effects
- Premium metallic finish with rainbow iridescent reflections
- Floating around the box: small icons of gifts, stars, and celebration confetti
- Dark background (black or deep purple) to make the box pop
- 3D render style, 8k resolution, unreal engine 5 quality
- Make it look EXTREMELY valuable and exciting to open
- The box should be centered, facing forward, slightly tilted for dynamic perspective`;

// Directories
const OUTPUT_DIR = path.join(__dirname, '../public/assets/boxes');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

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

// Convert to PNG (resize and optimize)
async function processPNG(inputPath, outputPath) {
    try {
        await sharp(inputPath)
            .resize(512, 512, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png({ quality: 90 })
            .toFile(outputPath);
        return true;
    } catch (error) {
        console.error(`   ❌ Failed to process PNG:`, error.message);
        return false;
    }
}

// Upload to Supabase
async function uploadToSupabase(filePath, remotePath) {
    try {
        const fileBuffer = fs.readFileSync(filePath);

        // Delete existing file if it exists
        await supabase.storage
            .from(BUCKET_NAME)
            .remove([remotePath]);

        // Upload new file
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(remotePath, fileBuffer, {
                contentType: 'image/png',
                cacheControl: '31536000',
                upsert: true
            });

        if (error) {
            throw error;
        }

        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${remotePath}`;
        console.log(`   📎 Public URL: ${publicUrl}`);
        return true;
    } catch (error) {
        console.error(`   ❌ Failed to upload:`, error.message);
        return false;
    }
}

// Main function
async function run() {
    console.log(`🎁 Generating FREE WELCOME GIFT BOX image...\n`);

    const pngPath = path.join(OUTPUT_DIR, 'free_box_temp.png');
    const finalPath = path.join(OUTPUT_DIR, 'free_box.png');
    const remotePath = 'boxes/free_box.png';

    try {
        // Step 1: Generate PNG with Vertex AI
        console.log("1️⃣ Generating image with AI...");
        const imageBase64 = await generateWithVertex(FREE_BOX_PROMPT);

        if (!imageBase64) {
            console.log(`❌ Failed to generate image`);
            process.exit(1);
        }

        // Save PNG
        fs.writeFileSync(pngPath, imageBase64, 'base64');
        console.log(`   ✅ PNG generated`);

        // Step 2: Process PNG (resize/optimize)
        console.log("\n2️⃣ Processing image...");
        const processedSuccess = await processPNG(pngPath, finalPath);
        if (!processedSuccess) {
            process.exit(1);
        }
        console.log(`   ✅ Image processed`);

        // Step 3: Upload to Supabase
        console.log("\n3️⃣ Uploading to Supabase...");
        const uploadedSuccess = await uploadToSupabase(finalPath, remotePath);
        if (!uploadedSuccess) {
            process.exit(1);
        }
        console.log(`   ✅ Uploaded to Supabase`);

        // Cleanup temp file
        if (fs.existsSync(pngPath)) {
            fs.unlinkSync(pngPath);
        }

        console.log("\n" + "=".repeat(60));
        console.log("🎉 FREE BOX IMAGE GENERATED SUCCESSFULLY!");
        console.log("=".repeat(60));
        console.log(`📁 Local file: ${finalPath}`);
        console.log(`🌐 Supabase URL: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${remotePath}`);
        console.log("=".repeat(60));

    } catch (error) {
        console.error(`❌ Error:`, error.message);
        process.exit(1);
    }
}

run().catch(console.error);
