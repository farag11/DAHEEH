import type { Express, Request, Response } from "express";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "dummy-key",
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const openrouter = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY || "dummy-key",
  baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
});

type ProviderType = "openai" | "deepseek" | "gemini";

interface ProviderConfig {
  name: ProviderType;
  client: OpenAI;
  model: string;
}

function getAvailableProviders(): ProviderConfig[] {
  const providers: ProviderConfig[] = [];
  
  if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    providers.push({
      name: "openai",
      client: openai,
      model: "gpt-4o-mini",
    });
  }
  
  if (process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY) {
    providers.push({
      name: "deepseek",
      client: openrouter,
      model: "deepseek/deepseek-chat",
    });
  }
  
  return providers;
}

async function callWithFallback<T>(
  operation: (provider: ProviderConfig) => Promise<T>
): Promise<{ result: T; provider: ProviderType }> {
  const providers = getAvailableProviders();
  
  if (providers.length === 0) {
    throw new Error("No AI providers available");
  }
  
  let lastError: Error | null = null;
  
  for (const provider of providers) {
    try {
      const result = await operation(provider);
      return { result, provider: provider.name };
    } catch (error: any) {
      console.error(`Provider ${provider.name} failed:`, error.message);
      lastError = error;
    }
  }
  
  throw lastError || new Error("All providers failed");
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

export function registerAIRoutes(app: Express): void {
  app.post("/api/ai/summarize", async (req: Request, res: Response) => {
    try {
      const { text, complexity, count, images } = req.body;

      const hasImages = Array.isArray(images) && images.length > 0;
      
      if (!text && !hasImages) {
        return res.status(400).json({ error: "Text or images required" });
      }

      const validComplexity = ["simple", "detailed", "comprehensive"];
      const level = validComplexity.includes(complexity) ? complexity : "detailed";

      const userRequestedCount = typeof count === "number" && count > 0 ? count : null;

      const buildPrompt = (bulletCount: number | null, complexityLevel: string): string => {
        const countInstruction = bulletCount 
          ? `You MUST generate EXACTLY ${bulletCount} main bullet points. Not more, not less. This is a strict requirement.`
          : `Determine the optimal number of bullet points based on the text length and complexity. Cover all important concepts thoroughly.`;

        if (complexityLevel === "simple") {
          return `You are a study summary generator. Your task is to create a brief, hierarchical summary.

CRITICAL INSTRUCTIONS:
- ${countInstruction}
- Each main point should have 1-2 supporting sub-points.
- Do NOT stop early. Do NOT summarize or group multiple concepts into one point.

Structure it with main points and supporting sub-points beneath each main point.
Keep it concise and focus on the most important ideas. Use bullet points or dashes for clarity.

Text:\n${text}`;
        }

        if (complexityLevel === "comprehensive") {
          return `You are a study summary generator. Your task is to create a comprehensive study summary.

CRITICAL INSTRUCTIONS:
- ${countInstruction}
- Each section should have multiple detailed points with sub-points.
- Do NOT stop early. Do NOT be lazy. Generate comprehensive content.

Organize it into sections:
1. Overview - brief description of the topic
2. Key Concepts - main concepts with explanations as sub-points
3. Important Definitions - key terms and their meanings
4. Main Points - detailed points with supporting information
5. Common Misconceptions - things to avoid misunderstanding
6. Study Tips - advice for learning this material

Use a hierarchical structure with main points and indented sub-points throughout.

Text:\n${text}`;
        }

        return `You are a study summary generator. Your task is to create a detailed, hierarchical summary.

CRITICAL INSTRUCTIONS:
- ${countInstruction}
- Each main point should have 2-3 supporting sub-points with examples.
- Do NOT stop early. Do NOT summarize or group multiple concepts into one point.

Structure it as:
- Main topics as top-level points
- Supporting details, explanations, and examples as indented sub-points
- Include key concepts, definitions, and relationships

Make it clear and organized for studying.

Text:\n${text}`;
      };

      const basePrompt = buildPrompt(userRequestedCount, level);
      const visionPrompt = hasImages 
        ? `First, analyze the image(s) provided and extract all relevant educational content. Then:\n\n${basePrompt}`
        : basePrompt;

      const maxTokens = userRequestedCount && userRequestedCount > 20 ? 8192 : 4096;

      const { result, provider } = await callWithFallback(async (config) => {
        let messageContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] | string;
        
        if (hasImages) {
          const parts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
            { type: "text", text: visionPrompt }
          ];
          for (const img of images) {
            parts.push({
              type: "image_url",
              image_url: {
                url: img.startsWith("data:") ? img : `data:image/png;base64,${img}`,
              },
            });
          }
          messageContent = parts;
        } else {
          messageContent = visionPrompt;
        }

        const completion = await config.client.chat.completions.create({
          model: config.model,
          messages: [{ role: "user", content: messageContent }],
          max_tokens: maxTokens,
        });
        return cleanTextResponse(completion.choices[0]?.message?.content || "");
      });

      res.json({ summary: result, provider, visionUsed: hasImages });
    } catch (error: any) {
      console.error("Summarize error:", error);
      res.status(500).json({ error: error.message || "Failed to generate summary" });
    }
  });

  app.post("/api/ai/questions", async (req: Request, res: Response) => {
    try {
      const { text, types, count, images } = req.body;
      const hasImages = Array.isArray(images) && images.length > 0;

      if (!text && !hasImages) {
        return res.status(400).json({ error: "Text or images required" });
      }

      const validTypes = ["mcq", "trueFalse", "shortAnswer"];
      const questionTypes = Array.isArray(types) 
        ? types.filter((t: string) => validTypes.includes(t)) 
        : ["mcq"];
      const questionCount = typeof count === "number" && count > 0 && count <= 25 ? count : 25;

      console.log(`[Quiz API] Received request - types: ${JSON.stringify(questionTypes)}, count: ${questionCount}`);

      const buildTypeSpecificInstructions = (selectedTypes: string[]): string => {
        const instructions: string[] = [];
        
        if (selectedTypes.includes("mcq")) {
          instructions.push(`
**MULTIPLE CHOICE (mcq)**:
- "type": "mcq"
- "options": MUST be an array of EXACTLY 4 distinct options labeled implicitly (the AI should provide 4 options, frontend handles A/B/C/D display)
- "correctAnswer": Must match one of the 4 options exactly
- Example: {"question": "What is...?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": "Option A", "explanation": "...", "type": "mcq"}`);
        }
        
        if (selectedTypes.includes("trueFalse")) {
          instructions.push(`
**TRUE/FALSE (trueFalse)**:
- "type": "trueFalse"
- "options": MUST be EXACTLY ["صح", "خطأ"] (Arabic for True/False). DO NOT use English. DO NOT use A/B/C/D. DO NOT invent other options.
- "correctAnswer": MUST be either "صح" or "خطأ" (nothing else)
- The question should be a statement that is either true or false
- Example: {"question": "الأرض كوكب في المجموعة الشمسية.", "options": ["صح", "خطأ"], "correctAnswer": "صح", "explanation": "...", "type": "trueFalse"}`);
        }
        
        if (selectedTypes.includes("shortAnswer")) {
          instructions.push(`
**SHORT ANSWER (shortAnswer)**:
- "type": "shortAnswer"
- "options": MUST be an empty array []
- "correctAnswer": The expected short answer (a word, phrase, or brief sentence)
- The question should require a brief written response
- Example: {"question": "What is the capital of France?", "options": [], "correctAnswer": "Paris", "explanation": "...", "type": "shortAnswer"}`);
        }
        
        return instructions.join("\n");
      };

      const getTypeDistribution = (selectedTypes: string[], totalCount: number): string => {
        const perType = Math.floor(totalCount / selectedTypes.length);
        const remainder = totalCount % selectedTypes.length;
        return selectedTypes.map((t, i) => {
          const count = perType + (i < remainder ? 1 : 0);
          return `${count} ${t} questions`;
        }).join(", ");
      };

      const buildPrompt = (targetCount: number, existingCount: number = 0) => {
        const typeInstructions = buildTypeSpecificInstructions(questionTypes);
        const distribution = getTypeDistribution(questionTypes, targetCount);
        
        if (existingCount > 0) {
          return `You previously generated only ${existingCount} questions. You MUST now continue and generate questions ${existingCount + 1} through ${targetCount}.

CRITICAL: Generate EXACTLY ${targetCount - existingCount} MORE questions now. Do NOT repeat previous questions.

STRICT TYPE-SPECIFIC FORMAT REQUIREMENTS:
${typeInstructions}

Return ONLY a valid JSON array of ${targetCount - existingCount} question objects. No markdown, no code blocks.

Text to base questions on:
${text}`;
        }

        return `You are an exam generator. Your task is to generate EXACTLY ${targetCount} practice questions.

CRITICAL INSTRUCTIONS:
- You MUST generate EXACTLY ${targetCount} questions. Not less, not more.
- Generate approximately: ${distribution}
- Do NOT stop early. Generate all ${targetCount} questions.
- Return a JSON array with exactly ${targetCount} elements.

STRICT TYPE-SPECIFIC FORMAT REQUIREMENTS (FOLLOW EXACTLY):
${typeInstructions}

VALIDATION RULES:
- For trueFalse: options MUST be ["صح", "خطأ"] - NEVER use English True/False, NEVER use A/B/C/D
- For mcq: options MUST have exactly 4 items
- For shortAnswer: options MUST be empty []

Return ONLY a valid JSON array of ${targetCount} question objects. No markdown, no code blocks, no other text.

Text to base questions on:
${text}`;
      };

      const parseQuestions = (responseText: string): any[] => {
        const cleaned = stripMarkdownFences(responseText);
        const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error("No JSON array found in response");
        }
        return JSON.parse(jsonMatch[0]);
      };

      const normalizeQuestion = (q: any): any => {
        if (!q || typeof q !== "object") return q;
        
        const normalized = { ...q };
        
        if (normalized.type === "trueFalse") {
          normalized.options = ["صح", "خطأ"];
          
          const answer = String(normalized.correctAnswer).toLowerCase().trim();
          if (answer === "true" || answer === "صح" || answer === "a" || answer === "صحيح") {
            normalized.correctAnswer = "صح";
          } else if (answer === "false" || answer === "خطأ" || answer === "b" || answer === "خاطئ") {
            normalized.correctAnswer = "خطأ";
          } else {
            normalized.correctAnswer = "صح";
          }
          
          console.log(`[Quiz API] Normalized trueFalse question: options=${JSON.stringify(normalized.options)}, answer=${normalized.correctAnswer}`);
        }
        
        if (normalized.type === "shortAnswer") {
          normalized.options = [];
        }
        
        if (normalized.type === "mcq") {
          if (!Array.isArray(normalized.options) || normalized.options.length !== 4) {
            console.log(`[Quiz API] Warning: MCQ question has ${normalized.options?.length || 0} options instead of 4`);
          }
        }
        
        return normalized;
      };

      const generateWithRetry = async (config: ProviderConfig): Promise<any[]> => {
        let allQuestions: any[] = [];
        const maxRetries = 3;
        let retryCount = 0;

        while (allQuestions.length < questionCount && retryCount < maxRetries) {
          const basePrompt = buildPrompt(questionCount, allQuestions.length);
          const visionPrompt = hasImages && retryCount === 0
            ? `First, analyze the image(s) to understand the educational content. Then generate questions based on what you see.\n\n${basePrompt}`
            : basePrompt;
          
          let messageContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] | string;
          
          if (hasImages && retryCount === 0) {
            const parts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
              { type: "text", text: visionPrompt }
            ];
            for (const img of images) {
              parts.push({
                type: "image_url",
                image_url: {
                  url: img.startsWith("data:") ? img : `data:image/png;base64,${img}`,
                },
              });
            }
            messageContent = parts;
          } else {
            messageContent = visionPrompt;
          }
          
          const completion = await config.client.chat.completions.create({
            model: config.model,
            messages: [{ role: "user", content: messageContent }],
            max_tokens: 8192,
          });

          const responseText = completion.choices[0]?.message?.content || "";
          const rawQuestions = parseQuestions(responseText);
          const newQuestions = rawQuestions.map(normalizeQuestion);

          if (allQuestions.length === 0) {
            allQuestions = newQuestions;
          } else {
            allQuestions = [...allQuestions, ...newQuestions];
          }

          console.log(`[Quiz API] Questions generated: ${allQuestions.length}/${questionCount} (attempt ${retryCount + 1})`);

          if (allQuestions.length >= questionCount) {
            break;
          }

          retryCount++;
        }

        return allQuestions.slice(0, questionCount);
      };

      const { result, provider } = await callWithFallback(async (config) => {
        return generateWithRetry(config);
      });

      res.json({ questions: result, provider });
    } catch (error: any) {
      console.error("Generate questions error:", error);
      res.status(500).json({ error: error.message || "Failed to generate questions" });
    }
  });

  app.post("/api/ai/explain", async (req: Request, res: Response) => {
    try {
      const { concept, level, images } = req.body;
      const hasImages = Array.isArray(images) && images.length > 0;

      if (!concept && !hasImages) {
        return res.status(400).json({ error: "Concept or images required" });
      }

      const validLevels = ["beginner", "intermediate", "advanced"];
      const explainLevel = validLevels.includes(level) ? level : "intermediate";

      const levelDescriptions: Record<string, string> = {
        beginner: "Explain this like you're teaching a complete beginner. Use simple language, everyday analogies, and avoid jargon.",
        intermediate: "Explain this for someone with basic knowledge. Include some technical terms but explain them.",
        advanced: "Provide an in-depth explanation for someone with good foundational knowledge. Include technical details and nuances.",
      };

      const basePrompt = concept 
        ? `Explain the concept: "${concept}"`
        : "Identify the concept or topic shown in the image(s) and explain it.";

      const prompt = `${levelDescriptions[explainLevel]}

${hasImages ? "First, analyze the image(s) to understand the concept being shown. Then:\n\n" : ""}${basePrompt}

Include:
1. Simple Definition
2. Real-World Analogy
3. Step-by-Step Explanation
4. Common Misconceptions
5. Practical Applications
6. Related Concepts

Use clear formatting with headers and bullet points. Return plain text only, no markdown code blocks.`;

      const { result, provider } = await callWithFallback(async (config) => {
        let messageContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] | string;
        
        if (hasImages) {
          const parts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
            { type: "text", text: prompt }
          ];
          for (const img of images) {
            parts.push({
              type: "image_url",
              image_url: {
                url: img.startsWith("data:") ? img : `data:image/png;base64,${img}`,
              },
            });
          }
          messageContent = parts;
        } else {
          messageContent = prompt;
        }

        const completion = await config.client.chat.completions.create({
          model: config.model,
          messages: [{ role: "user", content: messageContent }],
          max_tokens: 2048,
        });
        return cleanTextResponse(completion.choices[0]?.message?.content || "");
      });

      res.json({ explanation: result, provider, visionUsed: hasImages });
    } catch (error: any) {
      console.error("Explain concept error:", error);
      res.status(500).json({ error: error.message || "Failed to generate explanation" });
    }
  });

  app.post("/api/ai/study-plan", async (req: Request, res: Response) => {
    try {
      const { topics, daysAvailable, hoursPerDay } = req.body;

      if (!Array.isArray(topics) || topics.length === 0) {
        return res.status(400).json({ error: "Topics array is required" });
      }

      const days = typeof daysAvailable === "number" && daysAvailable > 0 ? daysAvailable : 7;
      const hours = typeof hoursPerDay === "number" && hoursPerDay > 0 ? hoursPerDay : 2;

      const prompt = `Create a detailed study plan with the following parameters:

Topics to cover: ${topics.join(", ")}
Total days available: ${days}
Hours per day: ${hours}
Total study time: ${days * hours} hours

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

      const { result, provider } = await callWithFallback(async (config) => {
        const completion = await config.client.chat.completions.create({
          model: config.model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 4096,
        });
        return cleanTextResponse(completion.choices[0]?.message?.content || "");
      });

      res.json({ plan: result, provider });
    } catch (error: any) {
      console.error("Create study plan error:", error);
      res.status(500).json({ error: error.message || "Failed to create study plan" });
    }
  });

  app.post("/api/ai/follow-up", async (req: Request, res: Response) => {
    try {
      const { messages, context } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      const systemPrompt = `You are a helpful study assistant. The user has been studying a topic and has asked follow-up questions about the content.
${context ? `\nContext about the conversation:\n${context}\n` : ""}
Provide clear, helpful answers to their questions. Keep your responses focused and educational. If they ask to explain more about something, provide detailed explanations. If they ask what something means, give clear definitions with examples.`;

      const formattedMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemPrompt },
      ];

      for (const msg of messages) {
        if (msg.type === "user" && msg.content) {
          formattedMessages.push({ role: "user", content: msg.content });
        } else if (msg.type === "assistant" && msg.content) {
          formattedMessages.push({ role: "assistant", content: msg.content });
        }
      }

      const { result, provider } = await callWithFallback(async (config) => {
        const completion = await config.client.chat.completions.create({
          model: config.model,
          messages: formattedMessages,
          max_tokens: 2048,
        });
        return cleanTextResponse(completion.choices[0]?.message?.content || "");
      });

      res.json({ response: result, provider });
    } catch (error: any) {
      console.error("Follow-up error:", error);
      res.status(500).json({ error: error.message || "Failed to generate response" });
    }
  });
}
