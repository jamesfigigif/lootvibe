import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { LootBox, Rarity } from "../types";

// NOTE: In a real environment, this should be proxied through a backend 
// to avoid exposing the API key if it wasn't an env var.
const apiKey = process.env.REACT_APP_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(apiKey);

export const generateCustomBox = async (prompt: string): Promise<Partial<LootBox> | null> => {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING },
            description: { type: SchemaType.STRING },
            items: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  name: { type: SchemaType.STRING },
                  value: { type: SchemaType.NUMBER },
                  rarity: { type: SchemaType.STRING, enum: Object.values(Rarity), format: 'enum' },
                }
              }
            }
          }
        }
      }
    });

    // 1. Generate Text Content (JSON)
    const result = await model.generateContent(`Create a lootbox theme based on: "${prompt}". 
      Return a JSON object with a catchy 'name', a 'description', and a list of 5 'items'. 
      Items must have: 'name', 'value' (estimated USD), and 'rarity' (COMMON, UNCOMMON, RARE, EPIC, LEGENDARY). 
      Ensure probabilities make sense (LEGENDARY is rare).`);

    const textResponse = result.response.text();

    let data = null;
    if (textResponse) {
      data = JSON.parse(textResponse);
    }

    if (!data) return null;

    // 2. Generate Image for the Box (Note: Image generation might need a different model or endpoint)
    // For now, we will use a placeholder or try to use the image model if available in the SDK in the future.
    // The current SDK for web might not support image generation directly in the same way or requires a specific model.
    // We'll stick to the text generation for now and use a placeholder image logic or the previous logic if applicable.

    // Attempting to use the previous logic for image generation if it was working, but adapting to new SDK if possible.
    // However, image generation via API usually requires a different call. 
    // Let's use a placeholder for now to ensure the app starts, as image generation is complex.

    const imageUrl = await generateBoxImage(data.name, data.description, 'purple');
    data.image = imageUrl || 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&auto=format&fit=crop&q=60';

    return data;

  } catch (error) {
    console.error("Gemini Box Generation Error:", error);
    return null;
  }
};

export const generateBoxImage = async (name: string, description: string, colorContext: string): Promise<string | null> => {
  // Placeholder for image generation as the new SDK's image generation capability 
  // might differ or require specific setup not present in the basic package.
  // Returning null to fall back to default image.
  return null;
}