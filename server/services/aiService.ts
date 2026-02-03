import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;
const groqApiKey = process.env.GROQ_API_KEY;

// Groq client for ultra-fast text generation (PRIMARY for text)
export const groqClient = groqApiKey
  ? new Groq({ apiKey: groqApiKey })
  : null;

// DeepSeek client (fallback for text generation)
export const deepseekClient = deepseekApiKey
  ? new OpenAI({
      baseURL: "https://api.deepseek.com",
      apiKey: deepseekApiKey,
      timeout: 90000,
    })
  : null;

// OpenAI client (secondary fallback)
export const openaiClient = openaiApiKey
  ? new OpenAI({
      apiKey: openaiApiKey,
    })
  : null;

// Gemini client for image analysis ONLY
const genAI = geminiApiKey
  ? new GoogleGenerativeAI(geminiApiKey)
  : null;

// Groq model for text operations
const GROQ_MODEL = "llama3-70b-8192";

/**
 * Generates a summary using Groq (ultra-fast) with DeepSeek fallback
 * @param text - The text to summarize
 * @param options - Additional options for summarization
 * @returns Promise<string | null> - The generated summary or null if no API key configured
 */
export async function generateSummary(
  text: string,
  options: {
    complexity?: 'simple' | 'detailed' | 'comprehensive';
    count?: number;
  } = {}
): Promise<string | null> {
  const { complexity = 'detailed', count } = options;

  const systemPrompt = `CRITICAL LANGUAGE RULE: Detect the language of the input. If the input is in Arabic, respond ENTIRELY in Arabic. If in English, respond in English. NEVER translate.

You are a concise summarizer. Your goal is to extract KEY POINTS ONLY.

Rules:
- Use bullet points (•)
- Keep it under 150 words unless asked otherwise
- No long introductions or conclusions
- Be direct and to the point
- Match the complexity level requested`;

  let userPrompt = `Summarize this with ${complexity} detail`;
  if (count) {
    userPrompt += ` in exactly ${count} bullet points`;
  }
  userPrompt += `:\n\n${text}`;

  // Try Groq first (ultra-fast)
  if (groqClient) {
    try {
      const completion = await groqClient.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 2048,
        temperature: 0.7,
      });
      console.log("[AI] Summary generated with Groq");
      return completion.choices[0]?.message?.content || "";
    } catch (error) {
      console.warn("Groq summary generation failed, falling back to DeepSeek:", error);
    }
  }

  // Fallback to DeepSeek
  if (deepseekClient) {
    try {
      const completion = await deepseekClient.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 2048,
      });
      console.log("[AI] Summary generated with DeepSeek");
      return completion.choices[0]?.message?.content || "";
    } catch (error) {
      console.error('DeepSeek summary generation error:', error);
      throw new Error('Failed to generate summary');
    }
  }

  console.warn("No AI API keys configured for summary generation.");
  return null;
}

/**
 * Summarizes content with vision support using Gemini 2.0 Flash
 * This is the ONLY function that uses Gemini - for image analysis
 */
export async function summarizeWithVision(
  text: string,
  images: string[],
  options: {
    complexity?: 'simple' | 'detailed' | 'comprehensive';
    count?: number;
  } = {}
): Promise<string> {
  if (!genAI) {
    throw new Error("Gemini API key is not configured");
  }

  const { complexity = 'detailed', count } = options;
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const systemPrompt = `CRITICAL LANGUAGE RULE: Detect the language of ANY text in the images or input. If the text is in Arabic, respond ENTIRELY in Arabic. If in English, respond in English. NEVER translate.

You are a concise summarizer. Your goal is to extract KEY POINTS ONLY from the provided content (text and/or images).

Rules:
- First, read and understand ALL text visible in the images
- Use bullet points (•)
- Keep it under 150 words unless asked otherwise
- No long introductions or conclusions
- Be direct and to the point
- If images contain educational content, summarize the main concepts
- Match the complexity level: ${complexity}`;

  let userPrompt = `Summarize this content`;
  if (count) {
    userPrompt += ` in exactly ${count} bullet points`;
  }
  if (text && text.trim()) {
    userPrompt += `:\n\n${text}`;
  } else {
    userPrompt += `. Analyze the image(s) and summarize the key points.`;
  }

  const parts: any[] = [systemPrompt + "\n\n" + userPrompt];

  for (const imageData of images) {
    if (imageData.startsWith('data:')) {
      const base64Data = imageData.split(',')[1];
      const mimeType = imageData.split(':')[1].split(';')[0];
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      });
    } else {
      parts.push({
        inlineData: {
          data: imageData,
          mimeType: 'image/png',
        },
      });
    }
  }

  const result = await model.generateContent(parts);
  const response = await result.response;
  console.log("[AI] Vision summary generated with Gemini");
  return response.text();
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let imagePart;
    if (imageData.startsWith('data:')) {
      const base64Data = imageData.split(',')[1];
      imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: imageData.split(':')[1].split(';')[0],
        },
      };
    } else {
      imagePart = {
        inlineData: {
          data: imageData,
          mimeType: 'image/png',
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
 * General chat completion using Groq (ultra-fast) with DeepSeek fallback
 * @param messages - Array of chat messages
 * @param options - Additional options for chat completion
 * @returns Promise<string | null> - The AI response or null if no API key configured
 */
export async function chatCompletion(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options: { maxTokens?: number } = {}
): Promise<string | null> {
  const { maxTokens = 2048 } = options;

  // Try Groq first (ultra-fast)
  if (groqClient) {
    try {
      const completion = await groqClient.chat.completions.create({
        model: GROQ_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      });
      console.log("[AI] Chat completed with Groq");
      return completion.choices[0]?.message?.content || "";
    } catch (error) {
      console.warn("Groq chat completion failed, falling back to DeepSeek:", error);
    }
  }

  // Fallback to DeepSeek
  if (deepseekClient) {
    try {
      const completion = await deepseekClient.chat.completions.create({
        model: "deepseek-chat",
        messages,
        max_tokens: maxTokens,
      });
      console.log("[AI] Chat completed with DeepSeek");
      return completion.choices[0]?.message?.content || "";
    } catch (error) {
      console.error('DeepSeek chat completion error:', error);
      throw new Error('Failed to generate chat response');
    }
  }

  console.warn("No AI API keys configured for chat completion.");
  return null;
}
