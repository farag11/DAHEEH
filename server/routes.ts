import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { registerAIRoutes } from "./ai-routes";
import { registerOCRRoutes } from "./ocr-routes";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerUploadRoutes } from "./upload-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  registerAIRoutes(app);
  registerOCRRoutes(app);
  registerChatRoutes(app);
  registerUploadRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
