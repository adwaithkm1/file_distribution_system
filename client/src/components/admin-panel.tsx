import { useState } from 'react';
import { File } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { UploadZone } from '@/components/ui/upload-zone';
import { UploadProgressModal } from '@/components/ui/upload-progress-modal';
import { Button } from '@/components/ui/button';
import { formatFileSize, formatDate } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Info, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminPanelProps {
  files: File[];
}

export function AdminPanel({ files }: AdminPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadComplete, setIsUploadComplete] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const xhr = new XMLHttpRequest();
      
      return new Promise<File>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            setIsUploadComplete(true);
            resolve(response);
          } else {
            let errorMessage = 'Upload failed';
            try {
              const response = JSON.parse(xhr.responseText);
              errorMessage = response.message || errorMessage;
            } catch (e) {
              // If parsing fails, use the status text
              errorMessage = xhr.statusText || errorMessage;
            }
            reject(new Error(errorMessage));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });

        xhr.open('POST', '/api/files');
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      toast({
        title: 'File Uploaded',
        description: 'The file has been successfully uploaded.',
      });
    },
    onError: (error: Error) => {
      setUploadError(error.message);
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // File delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      await apiRequest('DELETE', `/api/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      toast({
        title: 'File Deleted',
        description: 'The file has been successfully deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFilesSelected = (fileList: FileList) => {
    const file = fileList[0]; // Just handle one file for now
    
    if (file) {
      setSelectedFile(file as unknown as File);
      setIsUploadModalOpen(true);
      setUploadProgress(0);
      setIsUploadComplete(false);
      setUploadError(null);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', `${file.name} file`);
      
      uploadMutation.mutate(formData);
    }
  };

  const handleDeleteFile = (fileId: number) => {
    if (confirm('Are you sure you want to delete this file?')) {
      deleteMutation.mutate(fileId);
    }
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploadComplete(false);
    setUploadError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow mb-8 p-6">
      <div className="border-b border-gray-200 pb-5 mb-5">
        <h2 className="text-lg leading-6 font-medium text-gray-900">Admin File Upload</h2>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">Upload new files to make them available for distribution.</p>
      </div>
      
      <UploadZone onFilesSelected={handleFilesSelected} />
      
      <UploadProgressModal
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
        file={selectedFile as unknown as File}
        progress={uploadProgress}
        isComplete={isUploadComplete}
        error={uploadError}
      />
      
      <div className="mt-6 border border-gray-200 rounded-md overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 flex items-center">
          <h3 className="text-sm font-medium text-gray-700">Recent Uploads</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {files.length === 0 ? (
            <li className="px-4 py-6 text-center text-gray-500">No files uploaded yet</li>
          ) : (
            files.map((file) => (
              <li key={file.id} className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-primary-100 rounded p-2 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.originalName}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {file.type.charAt(0).toUpperCase() + file.type.slice(1)} • 
                      Uploaded {formatDate(file.uploadDate)}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon">
                    <Info className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteFile(file.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-5 w-5 text-gray-400 hover:text-red-500" />
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
