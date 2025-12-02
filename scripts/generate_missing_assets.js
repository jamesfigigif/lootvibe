require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { OpenAI } = require('openai');

// Configuration
const gcpProjectId = process.env.GCP_PROJECT_ID;
const gcpLocation = process.env.GCP_LOCATION || 'us-central1'; // Default to us-central1 if not set
const openaiApiKey = process.env.OPENAI_API_KEY;

// Initialize Clients
let vertexClient = null;
let openai = null;

if (gcpProjectId) {
    try {
        vertexClient = new GoogleGenAI({
            vertexai: true,
            project: gcpProjectId,
            location: 'global' // Gemini 3 Pro Image is often global
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

// 2. Configuration
// Define the "Brand Style" here to ensure consistency across all images
const BRAND_STYLE = "Cyberpunk style, dark background, glowing neon effects, high contrast, 3D render, 8k resolution, unreal engine 5 style";

// 3. Define ALL Assets
const boxes = require('./prompts/boxes.json');
const pokemonItems = require('./prompts/pokemon_items.json');
const techItems = require('./prompts/tech_items.json');
const streetwearItems = require('./prompts/streetwear_items.json');
const sportsItems = require('./prompts/sports_items.json');
const miscItems = require('./prompts/misc_items.json');

const ASSETS_TO_GENERATE = [
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

// 3. Download Helper
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

// 4. Vertex AI Helper
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

// 5. Main Loop
async function run() {
    console.log(`🚀 Starting generation for ${ASSETS_TO_GENERATE.length} assets...`);

    if (openai) console.log("✅ OpenAI (DALL-E 3) Configured");
    if (vertexClient) console.log("✅ Vertex AI (Gemini) Configured");

    for (const asset of ASSETS_TO_GENERATE) {
        const folderPath = path.join(__dirname, `../public/assets/${asset.folder}`);
        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

        const filePath = path.join(folderPath, `${asset.name}.png`);

        if (fs.existsSync(filePath)) {
            console.log(`⏩ Skipping ${asset.name} (already exists)`);
            continue;
        }

        console.log(`🎨 Generating ${asset.name}...`);

        try {
            let imageUrl;
            let imageBase64;

            // Prefer Vertex AI if available (Free Credits)
            if (vertexClient) {
                console.log("   ...using Vertex AI");
                imageBase64 = await generateWithVertex(asset.prompt);
            }

            // Fallback to OpenAI
            if (!imageBase64 && openai) {
                console.log("   ...using OpenAI (Fallback)");
                const response = await openai.images.generate({
                    model: "dall-e-3",
                    prompt: asset.prompt,
                    n: 1,
                    size: "1024x1024",
                    quality: "standard",
                });
                imageUrl = response.data[0].url;
            }

            if (imageBase64) {
                fs.writeFileSync(filePath, imageBase64, 'base64');
                console.log(`✅ Saved to public/assets/${asset.folder}/${asset.name}.png`);
            } else if (imageUrl) {
                await downloadImage(imageUrl, filePath);
                console.log(`✅ Saved to public/assets/${asset.folder}/${asset.name}.png`);
            } else {
                console.warn("⚠️ Failed to generate image (No provider succeeded)");
            }

        } catch (error) {
            console.error(`❌ Failed to generate ${asset.name}:`, error.message);
        }
    }

    console.log("\n✨ Done! Run 'npm start' to see your new assets.");
}

run();
