import React, { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UploadZoneProps {
  onFilesSelected: (files: FileList) => void;
}

export function UploadZone({ onFilesSelected }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Validate file types
      const files = e.dataTransfer.files;
      const validFiles = validateFiles(files);
      
      if (validFiles) {
        onFilesSelected(files);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Validate file types
      const files = e.target.files;
      const validFiles = validateFiles(files);
      
      if (validFiles) {
        onFilesSelected(files);
      }
    }
  };

  const validateFiles = (files: FileList): boolean => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (!['exe', 'bat', 'zip'].includes(extension || '')) {
        toast({
          title: "Invalid file type",
          description: "Only EXE, BAT, and ZIP files are allowed.",
          variant: "destructive",
        });
        return false;
      }
      
      if (file.size > 100 * 1024 * 1024) { // 100MB
        toast({
          title: "File too large",
          description: "Files must be less than 100MB.",
          variant: "destructive",
        });
        return false;
      }
    }
    
    return true;
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      className={`upload-zone rounded-md p-10 text-center cursor-pointer transition-all duration-200 ${
        dragOver ? 'border-primary-500 bg-primary-50' : 'border-2 border-dashed border-gray-300'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <div className="space-y-2">
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="flex justify-center text-sm text-gray-600">
          <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
            <span>Upload a file</span>
            <input 
              id="file-upload" 
              name="file-upload" 
              type="file" 
              className="sr-only" 
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".exe,.bat,.zip"
              multiple
            />
          </label>
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs text-gray-500">
          EXE, BAT, ZIP files up to 100MB
        </p>
      </div>
    </div>
  );
}
