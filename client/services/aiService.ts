import {
  AIProvider,
  AIProviderType,
  BuiltInProvider,
  GeminiProvider,
  DeepSeekProvider,
  GeneratedQuestion,
  getAISettings,
  saveGeminiApiKey,
  saveDeepSeekApiKey,
  clearGeminiApiKey,
  clearDeepSeekApiKey,
  hasGeminiApiKey,
  hasDeepSeekApiKey,
  getAvailableProviders,
} from "./aiProviders";
import type { StudyHistoryEntry } from "../contexts/StudyContext";

export type { GeneratedQuestion };
export type QuestionType = "mcq" | "trueFalse" | "shortAnswer";

export {
  saveGeminiApiKey as setApiKey,
  saveGeminiApiKey,
  saveDeepSeekApiKey,
  clearGeminiApiKey,
  clearDeepSeekApiKey,
  hasGeminiApiKey,
  hasDeepSeekApiKey,
  getAISettings,
};

let historyCallback: ((entry: Omit<StudyHistoryEntry, "id" | "createdAt">) => void) | null = null;

export function setHistoryCallback(callback: (entry: Omit<StudyHistoryEntry, "id" | "createdAt">) => void) {
  historyCallback = callback;
}

export async function hasApiKey(): Promise<boolean> {
  return true;
}

export async function getApiKey(): Promise<string | null> {
  const settings = await getAISettings();
  return settings.geminiApiKey;
}

interface ProviderResult<T> {
  data: T;
  provider: AIProviderType;
}

async function executeWithFallback<T>(
  operation: (provider: AIProvider) => Promise<T>,
  operationName: string
): Promise<ProviderResult<T>> {
  const settings = await getAISettings();
  
  const providers: AIProvider[] = [new BuiltInProvider()];
  
  if (settings.geminiApiKey) {
    providers.push(new GeminiProvider(settings.geminiApiKey));
  }
  
  if (settings.deepseekApiKey) {
    providers.push(new DeepSeekProvider(settings.deepseekApiKey));
  }

  const errors: { provider: AIProviderType; error: Error }[] = [];

  for (const provider of providers) {
    try {
      const result = await operation(provider);
      return { data: result, provider: provider.name };
    } catch (error: any) {
      console.warn(`[AI Service] ${operationName} failed with provider ${provider.name}:`, error.message);
      errors.push({ provider: provider.name, error });
    }
  }

  const errorMessages = errors.map((e) => `${e.provider}: ${e.error.message}`).join("; ");
  throw new Error(`All providers failed for ${operationName}. Errors: ${errorMessages}`);
}

export async function summarizeText(
  text: string,
  complexity: "simple" | "detailed" | "comprehensive",
  images?: string[]
): Promise<string> {
  const result = await executeWithFallback(
    (provider) => provider.summarize({ text, complexity, images }),
    "summarize"
  );
  
  return result.data;
}

export async function generateQuestions(
  text: string,
  types: QuestionType[],
  count: number,
  images?: string[]
): Promise<GeneratedQuestion[]> {
  const result = await executeWithFallback(
    (provider) => provider.generateQuestions({ text, types, count, images }),
    "generateQuestions"
  );
  
  const validQuestions = result.data
    .map(validateQuestion)
    .filter((q): q is GeneratedQuestion => q !== null);
  
  if (validQuestions.length === 0) {
    throw new Error("No valid questions generated");
  }
  
  if (historyCallback) {
    const keyword = `Quiz from: ${text.substring(0, 30)}`;
    historyCallback({
      actionType: "quiz",
      keyword,
    });
  }
  
  return validQuestions;
}

export async function explainConcept(
  concept: string,
  level: "beginner" | "intermediate" | "advanced",
  images?: string[]
): Promise<string> {
  const result = await executeWithFallback(
    (provider) => provider.explain({ concept, level, images }),
    "explainConcept"
  );
  
  return result.data;
}

export async function createStudyPlan(
  topics: string[],
  daysAvailable: number,
  hoursPerDay: number
): Promise<string> {
  const result = await executeWithFallback(
    (provider) => provider.createStudyPlan({ topics, daysAvailable, hoursPerDay }),
    "createStudyPlan"
  );
  
  if (historyCallback) {
    const keyword = topics.length > 0 ? topics[0] : "Study Plan";
    historyCallback({
      actionType: "plan",
      keyword,
    });
  }
  
  return result.data;
}

function validateQuestion(q: any): GeneratedQuestion | null {
  if (!q || typeof q !== "object") return null;
  if (typeof q.question !== "string" || !q.question.trim()) return null;
  if (!Array.isArray(q.options)) return null;
  if (typeof q.correctAnswer !== "string") return null;

  const validTypes: QuestionType[] = ["mcq", "trueFalse", "shortAnswer"];
  const type = validTypes.includes(q.type) ? q.type : "mcq";

  return {
    question: q.question.trim(),
    options: q.options.map((o: any) => String(o)),
    correctAnswer: String(q.correctAnswer),
    explanation: typeof q.explanation === "string" ? q.explanation : "",
    type,
  };
}

export async function summarizeTextWithProvider(
  text: string,
  complexity: "simple" | "detailed" | "comprehensive"
): Promise<ProviderResult<string>> {
  const result = await executeWithFallback(
    (provider) => provider.summarize({ text, complexity }),
    "summarize"
  );
  
  if (historyCallback) {
    const keyword = text.substring(0, 50);
    historyCallback({
      actionType: "summary",
      keyword,
    });
  }
  
  return result;
}

export async function generateQuestionsWithProvider(
  text: string,
  types: QuestionType[],
  count: number
): Promise<ProviderResult<GeneratedQuestion[]>> {
  const result = await executeWithFallback(
    (provider) => provider.generateQuestions({ text, types, count }),
    "generateQuestions"
  );
  
  const validQuestions = result.data
    .map(validateQuestion)
    .filter((q): q is GeneratedQuestion => q !== null);
  
  if (validQuestions.length === 0) {
    throw new Error("No valid questions generated");
  }
  
  if (historyCallback) {
    const keyword = `Quiz from: ${text.substring(0, 30)}`;
    historyCallback({
      actionType: "quiz",
      keyword,
    });
  }
  
  return { data: validQuestions, provider: result.provider };
}

export async function explainConceptWithProvider(
  concept: string,
  level: "beginner" | "intermediate" | "advanced"
): Promise<ProviderResult<string>> {
  const result = await executeWithFallback(
    (provider) => provider.explain({ concept, level }),
    "explainConcept"
  );
  
  if (historyCallback) {
    historyCallback({
      actionType: "explain",
      keyword: concept,
    });
  }
  
  return result;
}

export async function createStudyPlanWithProvider(
  topics: string[],
  daysAvailable: number,
  hoursPerDay: number
): Promise<ProviderResult<string>> {
  const result = await executeWithFallback(
    (provider) => provider.createStudyPlan({ topics, daysAvailable, hoursPerDay }),
    "createStudyPlan"
  );
  
  if (historyCallback) {
    const keyword = topics.length > 0 ? topics[0] : "Study Plan";
    historyCallback({
      actionType: "plan",
      keyword,
    });
  }
  
  return result;
}

export interface ConversationMessage {
  type: "user" | "assistant";
  content: string;
}

export async function sendFollowUp(
  messages: ConversationMessage[],
  context?: string
): Promise<string> {
  const { getApiUrl } = await import("@/lib/query-client");
  const baseUrl = getApiUrl();
  const url = new URL("/api/ai/follow-up", baseUrl);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, context }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  const data = await response.json();
  return data.response;
}
