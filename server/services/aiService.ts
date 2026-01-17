import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY; // For fallback in ai-routes
const geminiApiKey = process.env.GEMINI_API_KEY;

// DeepSeek client for text generation
export const deepseekClient = deepseekApiKey
  ? new OpenAI({
      baseURL: "https://api.deepseek.com",
      apiKey: deepseekApiKey,
      timeout: 90000,
    })
  : null;

// OpenAI client (for fallback if needed directly here, or used via ai-routes)
export const openaiClient = openaiApiKey
  ? new OpenAI({
      apiKey: openaiApiKey,
    })
  : null;

// Gemini client for image analysis
const genAI = geminiApiKey
  ? new GoogleGenerativeAI(geminiApiKey)
  : null;

/**
 * Generates a summary using DeepSeek
 * @param text - The text to summarize
 * @param options - Additional options for summarization
 * @returns Promise<string | null> - The generated summary or null if API key is not configured
 */
export async function generateSummary(
  text: string,
  options: {
    complexity?: 'simple' | 'detailed' | 'comprehensive';
    count?: number;
  } = {}
): Promise<string | null> {
  if (!deepseekClient) {
    console.warn("DeepSeek API key is not configured. Skipping summary generation.");
    return null;
  }
  try {
    const { complexity = 'detailed', count } = options;

    let prompt = `Please summarize the following text`;
    if (count) {
      prompt += ` in exactly ${count} main bullet points`;
    }
    prompt += ` with a ${complexity} level of detail:\n\n${text}`;

    const completion = await deepseekClient.chat.completions.create({
      model: "deepseek-reasoner",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 8192,
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
 * @returns Promise<string | null> - The generated image description or null if API key is not configured
 */
export async function generateImageDescription(
  imageData: string,
  prompt: string = "Describe this image in detail, including any text, objects, and context."
): Promise<string | null> {
  if (!genAI) {
    console.warn("Gemini API key is not configured. Skipping image description generation.");
    return null;
  }
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
 * @returns Promise<string | null> - The AI response or null if API key is not configured
 */
export async function chatCompletion(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options: { maxTokens?: number } = {}
): Promise<string | null> {
  if (!deepseekClient) {
    console.warn("DeepSeek API key is not configured. Skipping chat completion.");
    return null;
  }
  try {
    const { maxTokens = 2048 } = options;

    const completion = await deepseekClient.chat.completions.create({
      model: "deepseek-reasoner",
      messages,
      max_tokens: maxTokens,
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error('DeepSeek chat completion error:', error);
    throw new Error('Failed to generate chat response with DeepSeek');
  }
}
