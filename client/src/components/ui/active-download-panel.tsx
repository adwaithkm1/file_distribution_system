import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { X } from 'lucide-react';
import { File } from '@shared/schema';

interface ActiveDownloadPanelProps {
  isVisible: boolean;
  file: File | null;
  onClose: () => void;
}

export function ActiveDownloadPanel({ isVisible, file, onClose }: ActiveDownloadPanelProps) {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isVisible && file) {
      // Reset progress when a new download starts
      setProgress(0);
      setIsComplete(false);
      
      // Simulate download progress
      const interval = setInterval(() => {
        setProgress(prev => {
          const increment = Math.random() * 15;
          const newProgress = prev + increment;
          
          if (newProgress >= 100) {
            clearInterval(interval);
            setIsComplete(true);
            
            // Auto-hide the panel after completion
            setTimeout(() => {
              onClose();
            }, 2000);
            
            return 100;
          }
          
          return newProgress;
        });
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [isVisible, file, onClose]);

  if (!isVisible || !file) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 pb-2 sm:pb-5 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="bg-white p-2 rounded-lg shadow-lg sm:p-3">
          <div className="flex items-center justify-between flex-wrap">
            <div className="w-full flex-1 flex items-center">
              <span className="flex p-2 rounded-lg bg-primary-100">
                <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </span>
              <p className="ml-3 font-medium text-gray-900 truncate">
                <span className="hidden md:inline">Downloading </span>
                <span>{file.originalName}</span>
              </p>
            </div>
            <div className="w-full sm:w-auto flex-1 flex items-center justify-between sm:justify-end mt-2 sm:mt-0">
              <div className="w-full sm:max-w-xs flex items-center">
                <Progress value={progress} className="h-2.5 w-full" />
                <span className="ml-2 text-sm text-gray-700">{Math.round(progress)}%</span>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button 
                  type="button" 
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={onClose}
                >
                  <span className="sr-only">Close</span>
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
