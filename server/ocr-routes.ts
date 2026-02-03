import type { Express, Request, Response } from "express";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "dummy-key",
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB in bytes (base64 string length approximation)

export function registerOCRRoutes(app: Express): void {
  app.post("/api/ai/extract-text", async (req: Request, res: Response) => {
    try {
      const { images } = req.body;

      if (!images || !Array.isArray(images)) {
        return res.status(400).json({
          text: "",
          success: false,
          error: "Images array is required",
        });
      }

      if (images.length === 0) {
        return res.status(400).json({
          text: "",
          success: false,
          error: "At least one image is required",
        });
      }

      if (images.length > MAX_IMAGES) {
        return res.status(400).json({
          text: "",
          success: false,
          error: `Maximum ${MAX_IMAGES} images allowed`,
        });
      }

      for (let i = 0; i < images.length; i++) {
        if (typeof images[i] !== "string") {
          return res.status(400).json({
            text: "",
            success: false,
            error: `Image at index ${i} must be a base64 string`,
          });
        }

        if (images[i].length > MAX_IMAGE_SIZE) {
          return res.status(400).json({
            text: "",
            success: false,
            error: `Image at index ${i} exceeds maximum size of 10MB`,
          });
        }
      }

      const imageContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = images.map(
        (base64Image: string) => ({
          type: "image_url" as const,
          image_url: {
            url: base64Image.startsWith("data:")
              ? base64Image
              : `data:image/png;base64,${base64Image}`,
          },
        })
      );

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert OCR system that extracts text from images. Your task:

1. Extract ALL text from the provided image(s), including:
   - Arabic text (العربية) - preserve right-to-left formatting
   - English text
   - Mixed Arabic-English text
   - Numbers, symbols, and special characters

2. Preserve the original formatting, structure, and paragraph breaks as much as possible.

3. For Arabic text specifically:
   - Maintain proper Arabic character encoding (UTF-8)
   - Preserve diacritical marks (تشكيل) if present
   - Keep Arabic numbers (٠١٢٣٤٥٦٧٨٩) as-is

4. If there are multiple images, combine the text from all images in order.

5. Return ONLY the extracted text with no additional commentary.`,
          },
          {
            role: "user",
            content: imageContent,
          },
        ],
        max_tokens: 4096,
      });

      const extractedText = completion.choices[0]?.message?.content || "";

      res.json({
        text: extractedText,
        success: true,
      });
    } catch (error: any) {
      console.error("OCR extract-text error:", error);
      res.status(500).json({
        text: "",
        success: false,
        error: error.message || "Failed to extract text from image(s)",
      });
    }
  });
}
