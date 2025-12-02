require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

// Configuration
const gcpProjectId = process.env.GCP_PROJECT_ID;

if (!gcpProjectId) {
    console.error("❌ Error: GCP_PROJECT_ID not found in .env.local");
    process.exit(1);
}

console.log(`🚀 Testing Gemini 3 Pro Image Generation`);
console.log(`   Project: ${gcpProjectId}`);

async function testGeneration() {
    try {
        // Initialize the client with Vertex AI
        const client = new GoogleGenAI({
            vertexai: true,
            project: gcpProjectId,
            location: 'global'
        });

        console.log("\n🎨 Generating test image: 'Pokemon Budget Box'...");

        const prompt = "A high-quality, 3D-rendered loot box icon for 'Pokemon Budget Box'. Blue and white theme, simple sleek design, Pokemon booster packs visible. Cyberpunk style, dark background, glowing neon effects, high contrast, 3D render, 8k resolution.";

        // Generate image using Gemini 3 Pro Image
        const result = await client.models.generateContent({
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

        console.log("✅ Response received!");

        // Save full response to file for debugging
        fs.writeFileSync(path.join(__dirname, 'debug_response.json'), JSON.stringify(result, null, 2));
        console.log("Debug response saved to scripts/debug_response.json");

        // Try to extract and save image
        // Note: The SDK might return the response directly or wrapped in a response property
        const candidates = result.candidates || (result.response && result.response.candidates);

        if (candidates) {
            const candidate = candidates[0];
            console.log("Candidate:", JSON.stringify(candidate, null, 2));

            // Look for image data in the response
            if (candidate.content && candidate.content.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                        const imageData = part.inlineData.data;
                        const outputPath = path.join(__dirname, '../public/assets/boxes/test_pokemon_budget_box.png');

                        // Ensure directory exists
                        fs.mkdirSync(path.dirname(outputPath), { recursive: true });

                        // Save image
                        fs.writeFileSync(outputPath, Buffer.from(imageData, 'base64'));
                        console.log(`\n✅ Image saved to: ${outputPath}`);
                        return;
                    }
                }
            }
        }

        console.log("\n⚠️  No image found in response");

    } catch (error) {
        console.error("\n❌ Error occurred:");
        console.error("Message:", error.message);
        console.error("Details:", error);

        if (error.message.includes('authentication') || error.message.includes('credentials')) {
            console.log("\n⚠️  Authentication issue detected.");
            console.log("Please run: gcloud auth application-default login");
        }
    }
}

testGeneration();
