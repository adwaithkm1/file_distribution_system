import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// File schema
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  description: text("description").default(""),
  type: text("type").notNull(),
  size: integer("size").notNull(),
  downloads: integer("downloads").default(0),
  uploadDate: timestamp("upload_date").defaultNow(),
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  downloads: true,
  uploadDate: true,
});

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

// FileType enum for validation
export const FileTypeEnum = z.enum(["exe", "bat", "zip", "other"]);
export type FileType = z.infer<typeof FileTypeEnum>;
