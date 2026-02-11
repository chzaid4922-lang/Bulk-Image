
import { GoogleGenAI } from "@google/genai";
import { AspectRatio, ImageSize, ImageStyle, ImageLighting } from "../types";

export const generateImage = async (
  prompt: string, 
  config: { 
    aspectRatio: AspectRatio, 
    imageSize: ImageSize, 
    highQuality: boolean,
    style: ImageStyle,
    lighting: ImageLighting
  }
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const modelName = config.highQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  
  // Construct a more descriptive prompt based on user selections
  let enhancedPrompt = prompt;
  
  if (config.style !== 'none') {
    enhancedPrompt += `, in ${config.style.replace('-', ' ')} style`;
  }
  
  if (config.lighting !== 'none') {
    enhancedPrompt += `, with ${config.lighting.replace('-', ' ')} lighting`;
  }

  // Safety/Reasoning: Ensuring high quality results with additional keywords if requested
  if (config.highQuality) {
    enhancedPrompt += ", highly detailed, 8k resolution, professional photography";
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: {
      parts: [{ text: enhancedPrompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: config.aspectRatio,
        ...(config.highQuality ? { imageSize: config.imageSize } : {})
      },
    },
  });

  if (!response.candidates?.[0]?.content?.parts) {
    throw new Error("No image data returned from Gemini API");
  }

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Could not find image part in API response");
};
