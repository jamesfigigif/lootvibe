require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');
const { OpenAI } = require('openai');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const gcpProjectId = process.env.GCP_PROJECT_ID;
const gcpLocation = process.env.GCP_LOCATION || 'us-central1';
const openaiApiKey = process.env.OPENAI_API_KEY;

const SUPABASE_URL = 'https://cbjdasfnwzizfphnwxfd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiamRhc2Zud3ppemZwaG53eGZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk0Nzg4MiwiZXhwIjoyMDc5NTIzODgyfQ.hZT3qtv9P45G6XWXRp4ELLXQi5KuaKdpEv_XiY4B5go';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BUCKET_NAME = 'game-assets';

// Initialize clients
let vertexClient = null;
let openai = null;

if (gcpProjectId) {
    try {
        vertexClient = new GoogleGenAI({
            vertexai: true,
            project: gcpProjectId,
            location: 'global'
        });
        console.log(`✅ Vertex AI initialized (Project: ${gcpProjectId})`);
    } catch (e) {
        console.error("Failed to initialize Vertex AI:", e.message);
    }
}

if (openaiApiKey) {
    openai = new OpenAI({ apiKey: openaiApiKey });
    console.log("✅ OpenAI initialized");
}

// Directories
const ITEMS_DIR = path.join(__dirname, '../public/assets/items');
const COMPRESSED_DIR = path.join(__dirname, '../public/assets/items-compressed');
const WEBP_DIR = path.join(__dirname, '../public/assets/items-webp');

// Ensure directories exist
[ITEMS_DIR, COMPRESSED_DIR, WEBP_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Apple sticker configuration
const APPLE_STICKER = {
    name: 'ab10',
    prompt: 'Apple logo sticker. White Apple logo on a glossy vinyl sticker with subtle drop shadow, minimalistic and clean, floating in void, Cyberpunk style, dark background, glowing neon effects, high contrast, 3D render, 8k resolution, unreal engine 5 style.'
};

// Download helper
const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
};

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

        const candidates = result.candidates || (result.response && result.response.candidates);
        if (candidates && candidates[0].content && candidates[0].content.parts) {
            for (const part of candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    return part.inlineData.data; // Return base64 string
                }
            }
        }
        return null;
    } catch (error) {
        console.error("   ❌ Vertex AI Error:", error.message);
        return null;
    }
}

// Generate with OpenAI
async function generateWithOpenAI(prompt) {
    if (!openai) return null;
    try {
        console.log("   Generating with DALL-E 3...");
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
        });
        return response.data[0].url;
    } catch (error) {
        console.error("   ❌ OpenAI Error:", error.message);
        return null;
    }
}

// Compress image
async function compressImage(inputPath, outputPath) {
    try {
        const stats = fs.statSync(inputPath);
        const originalSize = stats.size;

        await sharp(inputPath)
            .resize(800, 800, {
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

        console.log(`✓ Compressed: ${(originalSize / 1024).toFixed(1)}KB → ${(newSize / 1024).toFixed(1)}KB (${savings}% reduction)`);
        return true;
    } catch (error) {
        console.error(`✗ Compression error:`, error.message);
        return false;
    }
}

// Convert to WebP
async function convertToWebP(inputPath, outputPath) {
    try {
        const stats = fs.statSync(inputPath);
        const originalSize = stats.size;

        await sharp(inputPath)
            .webp({
                quality: 90,
                alphaQuality: 100,
                lossless: false,
                nearLossless: false,
                smartSubsample: true
            })
            .toFile(outputPath);

        const newStats = fs.statSync(outputPath);
        const newSize = newStats.size;
        const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);

        console.log(`✓ Converted to WebP: ${(originalSize / 1024).toFixed(1)}KB → ${(newSize / 1024).toFixed(1)}KB (${savings}% reduction)`);
        return true;
    } catch (error) {
        console.error(`✗ WebP conversion error:`, error.message);
        return false;
    }
}

// Upload to Supabase
async function uploadToSupabase(filePath, remotePath) {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(remotePath, fileBuffer, {
                contentType: 'image/webp',
                cacheControl: '31536000',
                upsert: true
            });

        if (error) {
            console.error(`✗ Upload error:`, error.message);
            return false;
        }

        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${remotePath}`;
        console.log(`✓ Uploaded to Supabase: ${publicUrl}`);
        return true;
    } catch (error) {
        console.error(`✗ Upload error:`, error.message);
        return false;
    }
}

// Main function
async function run() {
    console.log('🚀 Generating Apple Sticker (ab10)...\n');

    const pngPath = path.join(ITEMS_DIR, `${APPLE_STICKER.name}.png`);
    const compressedPath = path.join(COMPRESSED_DIR, `${APPLE_STICKER.name}.png`);
    const webpPath = path.join(WEBP_DIR, `${APPLE_STICKER.name}.webp`);

    // Step 1: Generate image
    console.log('📸 Step 1: Generating image...');
    let imageBase64 = null;
    let imageUrl = null;

    if (vertexClient) {
        imageBase64 = await generateWithVertex(APPLE_STICKER.prompt);
    }

    if (!imageBase64 && openai) {
        imageUrl = await generateWithOpenAI(APPLE_STICKER.prompt);
    }

    if (imageBase64) {
        fs.writeFileSync(pngPath, imageBase64, 'base64');
        console.log(`✅ Generated: ${pngPath}\n`);
    } else if (imageUrl) {
        await downloadImage(imageUrl, pngPath);
        console.log(`✅ Generated: ${pngPath}\n`);
    } else {
        console.error('❌ Failed to generate image. No AI provider available.');
        process.exit(1);
    }

    // Step 2: Compress
    console.log('🗜️  Step 2: Compressing image...');
    const compressed = await compressImage(pngPath, compressedPath);
    if (!compressed) {
        console.error('❌ Compression failed');
        process.exit(1);
    }
    console.log('');

    // Step 3: Convert to WebP
    console.log('🔄 Step 3: Converting to WebP...');
    const converted = await convertToWebP(compressedPath, webpPath);
    if (!converted) {
        console.error('❌ WebP conversion failed');
        process.exit(1);
    }
    console.log('');

    // Step 4: Upload to Supabase
    console.log('☁️  Step 4: Uploading to Supabase...');
    const uploaded = await uploadToSupabase(webpPath, `items/${APPLE_STICKER.name}.webp`);
    if (!uploaded) {
        console.error('❌ Upload failed');
        process.exit(1);
    }
    console.log('');

    console.log('✨ All done! Apple sticker is ready at:');
    console.log(`   ${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/items/${APPLE_STICKER.name}.webp`);
}

run().catch(console.error);

