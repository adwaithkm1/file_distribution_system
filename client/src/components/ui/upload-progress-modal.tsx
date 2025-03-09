import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatFileSize } from '@/lib/utils';

interface UploadProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  progress: number;
  isComplete: boolean;
  error: string | null;
}

export function UploadProgressModal({
  isOpen,
  onClose,
  file,
  progress,
  isComplete,
  error
}: UploadProgressModalProps) {
  const [uploadedSize, setUploadedSize] = useState<number>(0);
  
  useEffect(() => {
    if (file) {
      setUploadedSize(Math.round((progress / 100) * file.size));
    }
  }, [progress, file]);
  
  return (
    <Dialog open={isOpen} onOpenChange={() => {
      // Only allow closing if upload is complete or there was an error
      if (isComplete || error) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="ml-4">
              <DialogTitle className="text-lg">
                {error ? 'Upload Failed' : isComplete ? 'Upload Complete' : 'Uploading Files'}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>
        
        <DialogDescription>
          {error ? error : (
            isComplete 
              ? `${file?.name} has been successfully uploaded.` 
              : `Uploading ${file?.name} to the server`
          )}
        </DialogDescription>

        {!error && (
          <div className="mt-4 w-full">
            <Progress value={progress} className="h-2.5" />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">
                {file ? `${formatFileSize(uploadedSize)} / ${formatFileSize(file.size)}` : ''}
              </span>
              <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button 
            onClick={onClose} 
            disabled={!isComplete && !error}
            variant={error ? "destructive" : "default"}
          >
            {error ? 'Close' : isComplete ? 'Done' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
