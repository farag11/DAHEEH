import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// DeepSeek client for text generation
const deepseekClient = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

// Gemini client for image analysis
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Generates a summary using DeepSeek
 * @param text - The text to summarize
 * @param options - Additional options for summarization
 * @returns Promise<string> - The generated summary
 */
export async function generateSummary(
  text: string,
  options: {
    complexity?: 'simple' | 'detailed' | 'comprehensive';
    count?: number;
  } = {}
): Promise<string> {
  try {
    const { complexity = 'detailed', count } = options;

    let prompt = `Please summarize the following text`;
    if (count) {
      prompt += ` in exactly ${count} main bullet points`;
    }
    prompt += ` with a ${complexity} level of detail:\n\n${text}`;

    const completion = await deepseekClient.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error('DeepSeek summary generation error:', error);
    throw new Error('Failed to generate summary with DeepSeek');
  }
}

/**
 * Generates an image description using Gemini
 * @param imageData - Base64 encoded image data or image URL
 * @param prompt - Optional custom prompt for analysis
 * @returns Promise<string> - The generated image description
 */
export async function generateImageDescription(
  imageData: string,
  prompt: string = "Describe this image in detail, including any text, objects, and context."
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    // Prepare image data for Gemini
    let imagePart;
    if (imageData.startsWith('data:')) {
      // Base64 data URL
      const base64Data = imageData.split(',')[1];
      imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: imageData.split(':')[1].split(';')[0],
        },
      };
    } else {
      // Assume it's a URL
      imagePart = {
        inlineData: {
          data: imageData,
          mimeType: 'image/png', // Default fallback
        },
      };
    }

    const result = await model.generateContent([
      prompt,
      imagePart,
    ]);

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini image analysis error:', error);
    throw new Error('Failed to analyze image with Gemini');
  }
}

/**
 * General chat completion using DeepSeek
 * @param messages - Array of chat messages
 * @param options - Additional options for chat completion
 * @returns Promise<string> - The AI response
 */
export async function chatCompletion(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options: { maxTokens?: number } = {}
): Promise<string> {
  try {
    const { maxTokens = 2048 } = options;

    const completion = await deepseekClient.chat.completions.create({
      model: "deepseek-chat",
      messages,
      max_tokens: maxTokens,
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error('DeepSeek chat completion error:', error);
    throw new Error('Failed to generate chat response with DeepSeek');
  }
}