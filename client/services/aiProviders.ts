import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { getApiUrl } from "@/lib/query-client";

const STORAGE_KEYS = {
  geminiApiKey: "gemini_api_key",
  deepseekApiKey: "deepseek_api_key",
  claudeApiKey: "claude_api_key",
  mistralApiKey: "mistral_api_key",
  grokApiKey: "grok_api_key",
  cohereApiKey: "cohere_api_key",
  anthropicApiKey: "anthropic_api_key",
  openaiApiKey: "openai_api_key",
  useCustomGemini: "use_custom_gemini",
  useCustomDeepseek: "use_custom_deepseek",
  selectedProvider: "selected_ai_provider",
};

export type AIProviderType = "builtin" | "gemini" | "deepseek" | "claude" | "mistral" | "grok" | "cohere" | "anthropic" | "openai";

export type AIProviderName = "gemini" | "deepseek" | "claude" | "mistral" | "grok" | "cohere" | "anthropic" | "openai";

export interface AIProviderInfo {
  id: AIProviderName;
  name: string;
  hasKey: boolean;
}

export interface AISettings {
  geminiApiKey: string | null;
  deepseekApiKey: string | null;
  claudeApiKey: string | null;
  mistralApiKey: string | null;
  grokApiKey: string | null;
  cohereApiKey: string | null;
  anthropicApiKey: string | null;
  openaiApiKey: string | null;
  useCustomGemini: boolean;
  useCustomDeepseek: boolean;
  selectedProvider: AIProviderName | null;
}

export async function getAISettings(): Promise<AISettings> {
  const [
    geminiApiKey,
    deepseekApiKey,
    claudeApiKey,
    mistralApiKey,
    grokApiKey,
    cohereApiKey,
    anthropicApiKey,
    openaiApiKey,
    useCustomGemini,
    useCustomDeepseek,
    selectedProvider
  ] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.geminiApiKey),
    AsyncStorage.getItem(STORAGE_KEYS.deepseekApiKey),
    AsyncStorage.getItem(STORAGE_KEYS.claudeApiKey),
    AsyncStorage.getItem(STORAGE_KEYS.mistralApiKey),
    AsyncStorage.getItem(STORAGE_KEYS.grokApiKey),
    AsyncStorage.getItem(STORAGE_KEYS.cohereApiKey),
    AsyncStorage.getItem(STORAGE_KEYS.anthropicApiKey),
    AsyncStorage.getItem(STORAGE_KEYS.openaiApiKey),
    AsyncStorage.getItem(STORAGE_KEYS.useCustomGemini),
    AsyncStorage.getItem(STORAGE_KEYS.useCustomDeepseek),
    AsyncStorage.getItem(STORAGE_KEYS.selectedProvider),
  ]);
  return { 
    geminiApiKey, 
    deepseekApiKey,
    claudeApiKey,
    mistralApiKey,
    grokApiKey,
    cohereApiKey,
    anthropicApiKey,
    openaiApiKey,
    useCustomGemini: useCustomGemini === "true",
    useCustomDeepseek: useCustomDeepseek === "true",
    selectedProvider: selectedProvider as AIProviderName | null,
  };
}

export async function saveGeminiApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.geminiApiKey, key);
}

export async function saveDeepSeekApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.deepseekApiKey, key);
}

export async function setUseCustomGemini(useCustom: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.useCustomGemini, useCustom ? "true" : "false");
}

export async function setUseCustomDeepseek(useCustom: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.useCustomDeepseek, useCustom ? "true" : "false");
}

export async function clearGeminiApiKey(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.geminiApiKey);
  await AsyncStorage.removeItem(STORAGE_KEYS.useCustomGemini);
}

export async function clearDeepSeekApiKey(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.deepseekApiKey);
  await AsyncStorage.removeItem(STORAGE_KEYS.useCustomDeepseek);
}

export async function hasGeminiApiKey(): Promise<boolean> {
  const key = await AsyncStorage.getItem(STORAGE_KEYS.geminiApiKey);
  return !!key && key.length > 0;
}

export async function hasDeepSeekApiKey(): Promise<boolean> {
  const key = await AsyncStorage.getItem(STORAGE_KEYS.deepseekApiKey);
  return !!key && key.length > 0;
}

export async function saveProviderApiKey(provider: AIProviderName, key: string): Promise<void> {
  const storageKey = getStorageKeyForProvider(provider);
  if (storageKey) {
    await AsyncStorage.setItem(storageKey, key);
  }
}

export async function getProviderApiKey(provider: AIProviderName): Promise<string | null> {
  const storageKey = getStorageKeyForProvider(provider);
  if (storageKey) {
    return await AsyncStorage.getItem(storageKey);
  }
  return null;
}

export async function hasProviderApiKey(provider: AIProviderName): Promise<boolean> {
  const key = await getProviderApiKey(provider);
  return !!key && key.length > 0;
}

export async function clearProviderApiKey(provider: AIProviderName): Promise<void> {
  const storageKey = getStorageKeyForProvider(provider);
  if (storageKey) {
    await AsyncStorage.removeItem(storageKey);
  }
}

export async function setSelectedProvider(provider: AIProviderName | null): Promise<void> {
  if (provider) {
    await AsyncStorage.setItem(STORAGE_KEYS.selectedProvider, provider);
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.selectedProvider);
  }
}

export async function getSelectedProvider(): Promise<AIProviderName | null> {
  const provider = await AsyncStorage.getItem(STORAGE_KEYS.selectedProvider);
  return provider as AIProviderName | null;
}

function getStorageKeyForProvider(provider: AIProviderName): string | null {
  switch (provider) {
    case "gemini": return STORAGE_KEYS.geminiApiKey;
    case "deepseek": return STORAGE_KEYS.deepseekApiKey;
    case "claude": return STORAGE_KEYS.claudeApiKey;
    case "mistral": return STORAGE_KEYS.mistralApiKey;
    case "grok": return STORAGE_KEYS.grokApiKey;
    case "cohere": return STORAGE_KEYS.cohereApiKey;
    case "anthropic": return STORAGE_KEYS.anthropicApiKey;
    case "openai": return STORAGE_KEYS.openaiApiKey;
    default: return null;
  }
}

export async function getConfiguredProviders(): Promise<AIProviderInfo[]> {
  const settings = await getAISettings();
  const providers: AIProviderName[] = ["gemini", "deepseek", "claude", "mistral", "grok", "cohere", "anthropic", "openai"];
  
  return providers.map(id => ({
    id,
    name: getProviderDisplayName(id),
    hasKey: hasKeyForProvider(id, settings),
  }));
}

function hasKeyForProvider(provider: AIProviderName, settings: AISettings): boolean {
  switch (provider) {
    case "gemini": return !!settings.geminiApiKey;
    case "deepseek": return !!settings.deepseekApiKey;
    case "claude": return !!settings.claudeApiKey;
    case "mistral": return !!settings.mistralApiKey;
    case "grok": return !!settings.grokApiKey;
    case "cohere": return !!settings.cohereApiKey;
    case "anthropic": return !!settings.anthropicApiKey;
    case "openai": return !!settings.openaiApiKey;
    default: return false;
  }
}

export function getProviderDisplayName(provider: AIProviderName): string {
  switch (provider) {
    case "gemini": return "Google Gemini";
    case "deepseek": return "DeepSeek";
    case "claude": return "Claude";
    case "mistral": return "Mistral AI";
    case "grok": return "Grok";
    case "cohere": return "Cohere";
    case "anthropic": return "Anthropic";
    case "openai": return "OpenAI";
    default: return provider;
  }
}

function stripMarkdownFences(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "");
  cleaned = cleaned.replace(/\n?```\s*$/i, "");
  return cleaned.trim();
}

function cleanTextResponse(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:markdown|md)?\s*\n?/gi, "");
  cleaned = cleaned.replace(/\n?```\s*$/gi, "");
  return cleaned.trim();
}

export interface SummarizeParams {
  text: string;
  complexity: "simple" | "detailed" | "comprehensive";
  count?: number;
  images?: string[];
}

export interface QuestionsParams {
  text: string;
  types: ("mcq" | "trueFalse" | "shortAnswer")[];
  count: number;
  images?: string[];
}

export interface ExplainParams {
  concept: string;
  level: "beginner" | "intermediate" | "advanced";
  images?: string[];
}

export interface StudyPlanParams {
  topics: string[];
  daysAvailable: number;
  hoursPerDay: number;
}

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  type: "mcq" | "trueFalse" | "shortAnswer";
}

export interface ProviderResult<T> {
  data: T;
  provider: AIProviderType;
}

export interface AIProvider {
  name: AIProviderType;
  summarize(params: SummarizeParams): Promise<string>;
  generateQuestions(params: QuestionsParams): Promise<GeneratedQuestion[]>;
  explain(params: ExplainParams): Promise<string>;
  createStudyPlan(params: StudyPlanParams): Promise<string>;
}

export class BuiltInProvider implements AIProvider {
  name: AIProviderType = "builtin";

  private async makeRequest<T>(endpoint: string, body: object): Promise<T> {
    const baseUrl = getApiUrl();
    const url = new URL(endpoint, baseUrl);
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    return response.json();
  }

  async summarize(params: SummarizeParams): Promise<string> {
    const result = await this.makeRequest<{ summary: string; visionUsed?: boolean }>("/api/ai/summarize", params);
    return result.summary;
  }

  async generateQuestions(params: QuestionsParams): Promise<GeneratedQuestion[]> {
    const result = await this.makeRequest<{ questions: GeneratedQuestion[]; visionUsed?: boolean }>("/api/ai/questions", params);
    return result.questions;
  }

  async explain(params: ExplainParams): Promise<string> {
    const result = await this.makeRequest<{ explanation: string; visionUsed?: boolean }>("/api/ai/explain", params);
    return result.explanation;
  }

  async createStudyPlan(params: StudyPlanParams): Promise<string> {
    const result = await this.makeRequest<{ plan: string }>("/api/ai/study-plan", params);
    return result.plan;
  }
}

export class GeminiProvider implements AIProvider {
  name: AIProviderType = "gemini";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getModel() {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async summarize(params: SummarizeParams): Promise<string> {
    const model = this.getModel();
    const prompts = {
      simple: `Create a brief, easy-to-understand summary of the following text in bullet points. Keep it concise and focus on the main ideas. Return plain text only, no markdown code blocks:\n\n${params.text}`,
      detailed: `Create a detailed summary of the following text. Include:\n- Key concepts\n- Important definitions\n- Main points (numbered)\n- Examples if applicable\n\nReturn plain text only, no markdown code blocks.\n\nText:\n${params.text}`,
      comprehensive: `Create a comprehensive study summary of the following text. Include:\n1. Overview\n2. Key Concepts with explanations\n3. Important Definitions\n4. Main Points (detailed)\n5. Examples and Applications\n6. Common Misconceptions to Avoid\n7. Study Tips\n\nReturn plain text only, no markdown code blocks.\n\nText:\n${params.text}`,
    };

    const result = await model.generateContent(prompts[params.complexity]);
    const response = await result.response;
    return cleanTextResponse(response.text());
  }

  async generateQuestions(params: QuestionsParams): Promise<GeneratedQuestion[]> {
    const model = this.getModel();
    const typeDescriptions = params.types.map((t) => {
      switch (t) {
        case "mcq": return "Multiple Choice Questions (with 4 options)";
        case "trueFalse": return "True/False Questions";
        case "shortAnswer": return "Short Answer Questions";
      }
    });

    const prompt = `Based on the following text, generate exactly ${params.count} practice questions.
Include these question types: ${typeDescriptions.join(", ")}

For each question, provide a JSON object with:
- "question": the question text
- "options": array of options (for MCQ: 4 options, for True/False: ["True", "False"], for short answer: empty array)
- "correctAnswer": the correct answer
- "explanation": brief explanation of why this is correct
- "type": one of "mcq", "trueFalse", or "shortAnswer"

IMPORTANT: Return ONLY a valid JSON array of question objects. No markdown, no code blocks, no other text.

Text to base questions on:
${params.text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = stripMarkdownFences(response.text());

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in response");
    }

    return JSON.parse(jsonMatch[0]);
  }

  async explain(params: ExplainParams): Promise<string> {
    const model = this.getModel();
    const levelDescriptions = {
      beginner: "Explain this like you're teaching a complete beginner. Use simple language, everyday analogies, and avoid jargon.",
      intermediate: "Explain this for someone with basic knowledge. Include some technical terms but explain them.",
      advanced: "Provide an in-depth explanation for someone with good foundational knowledge. Include technical details and nuances.",
    };

    const prompt = `${levelDescriptions[params.level]}

Explain the concept: "${params.concept}"

Include:
1. Simple Definition
2. Real-World Analogy
3. Step-by-Step Explanation
4. Common Misconceptions
5. Practical Applications
6. Related Concepts

Use clear formatting with headers and bullet points. Return plain text only, no markdown code blocks.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return cleanTextResponse(response.text());
  }

  async createStudyPlan(params: StudyPlanParams): Promise<string> {
    const model = this.getModel();
    const prompt = `Create a detailed study plan with the following parameters:

Topics to cover: ${params.topics.join(", ")}
Total days available: ${params.daysAvailable}
Hours per day: ${params.hoursPerDay}
Total study time: ${params.daysAvailable * params.hoursPerDay} hours

Create a structured day-by-day schedule that includes:
1. Daily study goals
2. Time allocation per topic
3. Short breaks
4. Review sessions
5. Practice/quiz time
6. Progress checkpoints

Format it clearly with:
- Day headers
- Time slots
- Topics for each slot
- Daily objectives
- Tips for effective studying

Make it practical and achievable. Return plain text only, no markdown code blocks.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return cleanTextResponse(response.text());
  }
}

export class DeepSeekProvider implements AIProvider {
  name: AIProviderType = "deepseek";
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://api.deepseek.com",
    });
  }

  async summarize(params: SummarizeParams): Promise<string> {
    const prompts = {
      simple: `Create a brief, easy-to-understand summary of the following text in bullet points. Keep it concise and focus on the main ideas. Return plain text only, no markdown code blocks:\n\n${params.text}`,
      detailed: `Create a detailed summary of the following text. Include:\n- Key concepts\n- Important definitions\n- Main points (numbered)\n- Examples if applicable\n\nReturn plain text only, no markdown code blocks.\n\nText:\n${params.text}`,
      comprehensive: `Create a comprehensive study summary of the following text. Include:\n1. Overview\n2. Key Concepts with explanations\n3. Important Definitions\n4. Main Points (detailed)\n5. Examples and Applications\n6. Common Misconceptions to Avoid\n7. Study Tips\n\nReturn plain text only, no markdown code blocks.\n\nText:\n${params.text}`,
    };

    const completion = await this.client.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompts[params.complexity] }],
    });

    return cleanTextResponse(completion.choices[0]?.message?.content || "");
  }

  async generateQuestions(params: QuestionsParams): Promise<GeneratedQuestion[]> {
    const typeDescriptions = params.types.map((t) => {
      switch (t) {
        case "mcq": return "Multiple Choice Questions (with 4 options)";
        case "trueFalse": return "True/False Questions";
        case "shortAnswer": return "Short Answer Questions";
      }
    });

    const prompt = `Based on the following text, generate exactly ${params.count} practice questions.
Include these question types: ${typeDescriptions.join(", ")}

For each question, provide a JSON object with:
- "question": the question text
- "options": array of options (for MCQ: 4 options, for True/False: ["True", "False"], for short answer: empty array)
- "correctAnswer": the correct answer
- "explanation": brief explanation of why this is correct
- "type": one of "mcq", "trueFalse", or "shortAnswer"

IMPORTANT: Return ONLY a valid JSON array of question objects. No markdown, no code blocks, no other text.

Text to base questions on:
${params.text}`;

    const completion = await this.client.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
    });

    let responseText = stripMarkdownFences(completion.choices[0]?.message?.content || "");
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in response");
    }

    return JSON.parse(jsonMatch[0]);
  }

  async explain(params: ExplainParams): Promise<string> {
    const levelDescriptions = {
      beginner: "Explain this like you're teaching a complete beginner. Use simple language, everyday analogies, and avoid jargon.",
      intermediate: "Explain this for someone with basic knowledge. Include some technical terms but explain them.",
      advanced: "Provide an in-depth explanation for someone with good foundational knowledge. Include technical details and nuances.",
    };

    const prompt = `${levelDescriptions[params.level]}

Explain the concept: "${params.concept}"

Include:
1. Simple Definition
2. Real-World Analogy
3. Step-by-Step Explanation
4. Common Misconceptions
5. Practical Applications
6. Related Concepts

Use clear formatting with headers and bullet points. Return plain text only, no markdown code blocks.`;

    const completion = await this.client.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
    });

    return cleanTextResponse(completion.choices[0]?.message?.content || "");
  }

  async createStudyPlan(params: StudyPlanParams): Promise<string> {
    const prompt = `Create a detailed study plan with the following parameters:

Topics to cover: ${params.topics.join(", ")}
Total days available: ${params.daysAvailable}
Hours per day: ${params.hoursPerDay}
Total study time: ${params.daysAvailable * params.hoursPerDay} hours

Create a structured day-by-day schedule that includes:
1. Daily study goals
2. Time allocation per topic
3. Short breaks
4. Review sessions
5. Practice/quiz time
6. Progress checkpoints

Format it clearly with:
- Day headers
- Time slots
- Topics for each slot
- Daily objectives
- Tips for effective studying

Make it practical and achievable. Return plain text only, no markdown code blocks.`;

    const completion = await this.client.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
    });

    return cleanTextResponse(completion.choices[0]?.message?.content || "");
  }
}

export async function getAvailableProviders(): Promise<AIProvider[]> {
  const providers: AIProvider[] = [];
  const settings = await getAISettings();

  if (settings.useCustomGemini && settings.geminiApiKey) {
    providers.push(new GeminiProvider(settings.geminiApiKey));
  }

  if (settings.useCustomDeepseek && settings.deepseekApiKey) {
    providers.push(new DeepSeekProvider(settings.deepseekApiKey));
  }

  providers.push(new BuiltInProvider());

  return providers;
}
