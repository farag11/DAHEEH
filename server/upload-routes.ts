import type { Express, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadFile } from "./services/storageService";

// Configure multer for file uploads
const upload = multer({
  dest: 'temp/', // Temporary directory for uploaded files
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and documents
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  }
});

export function registerUploadRoutes(app: Express): void {
  // Create temp directory if it doesn't exist
  if (!fs.existsSync('temp')) {
    fs.mkdirSync('temp');
  }

  app.post("/api/upload", upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const filePath = req.file.path;

      // Upload to Cloudinary
      const secureUrl = await uploadFile(filePath);

      // Clean up temporary file
      fs.unlinkSync(filePath);

      res.json({
        url: secureUrl,
        success: true
      });
    } catch (error: any) {
      console.error("Upload error:", error);

      // Clean up temporary file if it exists
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        error: error.message || "Failed to upload file",
        success: false
      });
    }
  });
}