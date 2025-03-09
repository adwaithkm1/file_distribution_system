import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format file size to a human-readable string
 * @param bytes File size in bytes
 * @returns Formatted string like "1.5 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Format date to a human-readable string
 * @param date The date to format
 * @returns Formatted string like "Jan 1, 2023"
 */
export function formatDate(date: Date | string | number): string {
  if (!date) return "N/A";
  return format(new Date(date), "MMM d, yyyy");
}
