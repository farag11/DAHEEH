import type { Express, Request, Response } from "express";
import { generateSummary, generateImageDescription, chatCompletion, openaiClient, deepseekClient } from "./services/aiService";
import OpenAI from "openai";

interface ProviderConfig {
  client: OpenAI | null;
  model: string;
}

async function callWithFallback<T>(
  fn: (client: OpenAI, model: string) => Promise<T>,
  primaryConfig: { client: OpenAI | null; model: string } = {
    client: deepseekClient,
    model: "deepseek-chat",
  },
  fallbackConfig: { client: OpenAI | null; model: string } = {
    client: openaiClient,
    model: "gpt-4o",
  }
): Promise<{ result: T; provider: string }> {
  if (!primaryConfig.client && !fallbackConfig.client) {
    throw new Error("No AI clients are configured. Please check API keys.");
  }

  let lastError: Error | null = null;

  if (primaryConfig.client) {
    try {
      const result = await fn(primaryConfig.client, primaryConfig.model);
      return { result, provider: primaryConfig.model };
    } catch (error) {
      lastError = error as Error;
      console.warn(`Primary AI provider (${primaryConfig.model}) failed:`, error);
    }
  }

  if (fallbackConfig.client) {
    console.log(`Attempting fallback to ${fallbackConfig.model}...`);
    try {
      const result = await fn(fallbackConfig.client, fallbackConfig.model);
      return { result, provider: fallbackConfig.model };
    } catch (fallbackError) {
      console.error(`Fallback AI provider (${fallbackConfig.model}) also failed:`, fallbackError);
      throw lastError || fallbackError;
    }
  }

  throw lastError || new Error("All AI providers failed or were not configured.");
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

      let finalText = text || "";

      // If images are provided, use Gemini to analyze them and extract text
      if (hasImages) {
        const imageDescriptions: string[] = [];
        for (const image of images) {
          try {
            const description = await generateImageDescription(
              image,
              "Extract and describe all text, diagrams, and educational content from this image in detail."
            );
            imageDescriptions.push(description);
          } catch (error) {
            console.error("Error analyzing image:", error);
          }
        }

        if (imageDescriptions.length > 0) {
          finalText += "\n\nImage Analysis:\n" + imageDescriptions.join("\n\n");
        }
      }

      // Use DeepSeek to generate the summary
      const summary = await generateSummary(finalText, {
        complexity: level as "simple" | "detailed" | "comprehensive",
        count: userRequestedCount || undefined,
      });

      res.json({ summary, provider: "deepseek", visionUsed: hasImages });
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
      const questionCount = typeof count === "number" && count > 0 && count <= 25 ? count : 10;

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

PHRASING RULES:
- Do NOT refer to the input text as "The Summary", "الملخص", or "the passage".
- Instead, quote the text directly or refer to it as "the text" (النص) or "the phrase" (العبارة).
- Example: Ask "ما معنى كلمة 'تحليل'؟" instead of "ما معنى الملخص؟"

STRICT TYPE-SPECIFIC FORMAT REQUIREMENTS (FOLLOW EXACTLY):
${typeInstructions}

VALIDATION RULES:
- For trueFalse: options MUST be ["صح", "خطأ"] - NEVER use English True/False, NEVER use A/B/C/D
- For mcq: options MUST have exactly 4 items
- For shortAnswer: options MUST be empty []

OUTPUT FORMAT: Return Minified JSON array only. No markdown, no code blocks, no explanatory text.

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

      const generateBatch = async (client: OpenAI, model: string, batchSize: number, batchIndex: number, includeImages: boolean): Promise<any[]> => {
        const batchPrompt = buildPrompt(batchSize, 0);
        const visionPrompt = includeImages
          ? `First, analyze the image(s) to understand the educational content. Then generate questions based on what you see.\n\n${batchPrompt}`
          : batchPrompt;
        
        let messageContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] | string;
        
        if (includeImages) {
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
        
        const completion = await client.chat.completions.create(
          {
            model: model,
            messages: [{ role: "user", content: messageContent }],
            max_tokens: 4096,
          },
          { timeout: 60000 }
        );

        const responseText = completion.choices[0]?.message?.content || "";
        const rawQuestions = parseQuestions(responseText);
        const normalizedQuestions = rawQuestions.map(normalizeQuestion);
        console.log(`[Quiz API] Batch ${batchIndex + 1} generated: ${normalizedQuestions.length} questions`);
        return normalizedQuestions;
      };

      const generateWithParallelBatches = async (client: OpenAI, model: string): Promise<any[]> => {
        const BATCH_SIZE = 8;
        // Over-fetch by 1.5x to guarantee exact count after deduplication
        const fetchTarget = Math.ceil(questionCount * 1.5);
        const numBatches = Math.ceil(fetchTarget / BATCH_SIZE);
        
        console.log(`[Quiz API] Over-fetching strategy: requesting ${fetchTarget} (1.5x of ${questionCount}) in ${numBatches} batches of ${BATCH_SIZE}`);
        
        const batchPromises: Promise<any[]>[] = [];
        for (let i = 0; i < numBatches; i++) {
          const remainingQuestions = fetchTarget - (i * BATCH_SIZE);
          const batchSize = Math.min(BATCH_SIZE, remainingQuestions);
          const includeImages = hasImages && i === 0;
          batchPromises.push(generateBatch(client, model, batchSize, i, includeImages));
        }
        
        const batchResults = await Promise.all(batchPromises);
        const allQuestions = batchResults.flat();
        
        // Deduplicate questions by question text
        const seen = new Set<string>();
        const uniqueQuestions = allQuestions.filter(q => {
          const key = q.question?.toLowerCase().trim();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        
        // Slice to exact requested count
        const finalQuestions = uniqueQuestions.slice(0, questionCount);
        console.log(`[Quiz API] Result: ${allQuestions.length} fetched → ${uniqueQuestions.length} unique → ${finalQuestions.length} returned (target: ${questionCount})`);
        return finalQuestions;
      };

      const { result, provider } = await callWithFallback(async (client, model) => {
        return generateWithParallelBatches(client, model);
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

      // Use deepseek-reasoner for high-quality explanations
      const { result, provider } = await callWithFallback(
        async (client, model) => {
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

          const completion = await client.chat.completions.create(
            {
              model: model,
              messages: [{ role: "user", content: messageContent }],
              max_tokens: 4096,
            },
            { timeout: 120000 }
          );
          return cleanTextResponse(completion.choices[0]?.message?.content || "");
        },
        { client: deepseekClient, model: "deepseek-reasoner" },
        { client: openaiClient, model: "gpt-4o" }
      );

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

      const { result, provider } = await callWithFallback(async (client, model) => {
        const completion = await client.chat.completions.create({
          model: model,
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

      const systemPrompt = `You are a helpful study assistant. The user has been studying a topic and has asked follow-up questions about the content.\n${context ? `\nContext about the conversation:\n${context}\n` : ""}\nProvide clear, helpful answers to their questions. Keep your responses focused and educational. If they ask to explain more about something, provide detailed explanations. If they ask what something means, give clear definitions with examples.`;

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

      const response = await chatCompletion(formattedMessages, { maxTokens: 2048 });

      res.json({ response, provider: "deepseek" });
    } catch (error: any) {
      console.error("Follow-up error:", error);
      res.status(500).json({ error: error.message || "Failed to generate response" });
    }
  });
}
