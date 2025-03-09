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
    } catch (error) {
      console.error("Error creating uploads directory:", error);
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
    return file;
  }

  async deleteFile(id: number): Promise<boolean> {
    const file = this.filesList.get(id);
    if (!file) return false;
    
    try {
      await this.deleteFileData(file.name);
      this.filesList.delete(id);
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
