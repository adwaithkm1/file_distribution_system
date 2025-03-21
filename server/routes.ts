import { type Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import { insertFileSchema, FileTypeEnum } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Define Multer Request type extension
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configure multer for in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for file operations
  const apiRouter = express.Router();

  // Get all files
  apiRouter.get('/files', async (req: Request, res: Response) => {
    try {
      const files = await storage.getAllFiles();
      res.json(files);
    } catch (error) {
      console.error('Error fetching files:', error);
      res.status(500).json({ message: 'Failed to fetch files' });
    }
  });

  // Upload a file
  apiRouter.post('/files', upload.single('file'), async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Determine file type from extension
      const ext = path.extname(req.file.originalname).toLowerCase().substring(1);
      let fileType = 'other';
      
      if (ext === 'exe') fileType = 'exe';
      else if (ext === 'bat') fileType = 'bat';
      else if (ext === 'zip') fileType = 'zip';

      // Validate file type
      try {
        FileTypeEnum.parse(fileType);
      } catch (error) {
        return res.status(400).json({ 
          message: 'Invalid file type. Only .exe, .bat, and .zip files are allowed.' 
        });
      }

      // Save the actual file data
      const storedFilename = await storage.saveFileData(
        req.file.originalname, 
        req.file.buffer
      );

      // Create file metadata
      const fileData = {
        name: storedFilename,
        originalName: req.file.originalname,
        description: req.body.description || `${req.file.originalname} file`,
        type: fileType,
        size: req.file.size,
      };

      try {
        // Validate file metadata
        const validFileData = insertFileSchema.parse(fileData);
        const newFile = await storage.createFile(validFileData);
        res.status(201).json(newFile);
      } catch (error) {
        // Clean up saved file if metadata validation fails
        await storage.deleteFileData(storedFilename);
        
        if (error instanceof z.ZodError) {
          const validationError = fromZodError(error);
          return res.status(400).json({ message: validationError.message });
        }
        
        throw error;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ message: 'Failed to upload file' });
    }
  });

  // Delete a file
  apiRouter.delete('/files/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid file ID' });
      }

      const success = await storage.deleteFile(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: 'File not found' });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ message: 'Failed to delete file' });
    }
  });

  // Download a file
  apiRouter.get('/files/:id/download', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid file ID' });
      }

      const file = await storage.getFile(id);
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      const fileData = await storage.getFileData(file.name);
      if (!fileData) {
        return res.status(404).json({ message: 'File data not found' });
      }

      // Increment download count
      await storage.incrementDownloadCount(id);

      // Check if this is a direct download request
      const isDirect = req.query.direct === 'true';
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/octet-stream');
      
      // For direct downloads, use 'inline' to open directly in the browser
      // For normal downloads, use 'attachment' to prompt download
      const disposition = isDirect ? 'inline' : 'attachment';
      res.setHeader('Content-Disposition', `${disposition}; filename="${file.originalName}"`);
      
      res.setHeader('Content-Length', fileData.length);
      
      res.send(fileData);
    } catch (error) {
      console.error('Error downloading file:', error);
      res.status(500).json({ message: 'Failed to download file' });
    }
  });

  // Special endpoint to download the code ZIP file
  apiRouter.get('/download-code', (req: Request, res: Response) => {
    try {
      const zipPath = '/home/runner/file_distribution_system.zip';
      
      if (!fs.existsSync(zipPath)) {
        return res.status(404).json({ message: 'Code ZIP file not found' });
      }
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="file_distribution_system.zip"');
      
      // Create read stream and pipe to response
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error downloading code ZIP:', error);
      res.status(500).json({ message: 'Failed to download code ZIP file' });
    }
  });

  // Mount API routes
  app.use('/api', apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
