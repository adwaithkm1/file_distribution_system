import { files, type File, type InsertFile, users, type User, type InsertUser } from "@shared/schema";
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // File operations
  getAllFiles(): Promise<File[]>;
  getFile(id: number): Promise<File | undefined>;
  getFileByName(name: string): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  deleteFile(id: number): Promise<boolean>;
  incrementDownloadCount(id: number): Promise<File | undefined>;
  
  // File storage (actual binary data)
  saveFileData(filename: string, data: Buffer): Promise<string>;
  getFileData(filename: string): Promise<Buffer | undefined>;
  deleteFileData(filename: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private filesList: Map<number, File>;
  private fileDir: string;
  userCurrentId: number;
  fileCurrentId: number;

  constructor() {
    this.users = new Map();
    this.filesList = new Map();
    this.userCurrentId = 1;
    this.fileCurrentId = 1;
    
    // Create uploads directory if it doesn't exist
    this.fileDir = path.resolve(process.cwd(), "uploads");
    this.initFileDir();
  }

  private async initFileDir() {
    try {
      await fs.mkdir(this.fileDir, { recursive: true });
      
      // On startup, restore any backed up files from the backup location
      await this.restoreFilesFromBackup();
    } catch (error) {
      console.error("Error creating uploads directory:", error);
    }
  }
  
  // Add backup functionality to persist files between deploys
  private async backupFiles() {
    try {
      // Create backup directory if it doesn't exist
      const backupDir = path.resolve(process.cwd(), "file_backups");
      await fs.mkdir(backupDir, { recursive: true });
      
      // Create a backup manifest of all files
      const manifest = Array.from(this.filesList.values());
      await fs.writeFile(
        path.join(backupDir, "manifest.json"), 
        JSON.stringify(manifest, null, 2)
      );
      
      // Copy all files to backup location
      for (const file of manifest) {
        try {
          const fileData = await this.getFileData(file.name);
          if (fileData) {
            await fs.writeFile(path.join(backupDir, file.name), fileData);
          }
        } catch (err) {
          console.error(`Error backing up file ${file.name}:`, err);
        }
      }
      console.log(`Backed up ${manifest.length} files to ${backupDir}`);
    } catch (error) {
      console.error("Error backing up files:", error);
    }
  }
  
  private async restoreFilesFromBackup() {
    try {
      const backupDir = path.resolve(process.cwd(), "file_backups");
      const manifestPath = path.join(backupDir, "manifest.json");
      
      // Check if backup exists
      try {
        await fs.access(manifestPath);
      } catch {
        console.log("No backup found, starting with empty storage");
        return;
      }
      
      // Read and parse manifest
      const manifestData = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestData) as File[];
      
      // Restore files
      let restoredCount = 0;
      for (const file of manifest) {
        try {
          // Restore file metadata
          this.filesList.set(file.id, file);
          if (file.id >= this.fileCurrentId) {
            this.fileCurrentId = file.id + 1;
          }
          
          // Restore file data
          const backupFilePath = path.join(backupDir, file.name);
          const fileData = await fs.readFile(backupFilePath);
          await fs.writeFile(path.join(this.fileDir, file.name), fileData);
          restoredCount++;
        } catch (err) {
          console.error(`Error restoring file ${file.name}:`, err);
        }
      }
      
      console.log(`Restored ${restoredCount} files from backup`);
    } catch (error) {
      console.error("Error restoring files from backup:", error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // File metadata operations
  async getAllFiles(): Promise<File[]> {
    return Array.from(this.filesList.values()).sort((a, b) => 
      new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );
  }

  async getFile(id: number): Promise<File | undefined> {
    return this.filesList.get(id);
  }

  async getFileByName(name: string): Promise<File | undefined> {
    return Array.from(this.filesList.values()).find(
      (file) => file.name === name || file.originalName === name
    );
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.fileCurrentId++;
    const uploadDate = new Date();
    const file: File = { 
      ...insertFile, 
      id, 
      downloads: 0, 
      uploadDate 
    };
    
    this.filesList.set(id, file);
    
    // Backup files after adding a new file
    await this.backupFiles();
    
    return file;
  }

  async deleteFile(id: number): Promise<boolean> {
    const file = this.filesList.get(id);
    if (!file) return false;
    
    try {
      await this.deleteFileData(file.name);
      this.filesList.delete(id);
      
      // Backup files after removing a file
      await this.backupFiles();
      
      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }

  async incrementDownloadCount(id: number): Promise<File | undefined> {
    const file = this.filesList.get(id);
    if (!file) return undefined;
    
    const updatedFile = { ...file, downloads: file.downloads + 1 };
    this.filesList.set(id, updatedFile);
    
    // Backup files periodically after download count changes
    // Only backup every 5 downloads to avoid excessive writes
    if (updatedFile.downloads % 5 === 0) {
      await this.backupFiles();
    }
    
    return updatedFile;
  }

  // File data operations (binary data)
  async saveFileData(originalFilename: string, data: Buffer): Promise<string> {
    const uniqueFilename = `${randomUUID()}${path.extname(originalFilename)}`;
    const filePath = path.join(this.fileDir, uniqueFilename);
    
    try {
      await fs.writeFile(filePath, data);
      return uniqueFilename;
    } catch (error) {
      console.error("Error saving file:", error);
      throw new Error("Failed to save file");
    }
  }

  async getFileData(filename: string): Promise<Buffer | undefined> {
    const filePath = path.join(this.fileDir, filename);
    
    try {
      return await fs.readFile(filePath);
    } catch (error) {
      console.error("Error reading file:", error);
      return undefined;
    }
  }

  async deleteFileData(filename: string): Promise<boolean> {
    const filePath = path.join(this.fileDir, filename);
    
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }
}

export const storage = new MemStorage();
