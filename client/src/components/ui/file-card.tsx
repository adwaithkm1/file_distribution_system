import { File } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatFileSize, formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FileCardProps {
  file: File;
  onDownloadStart: (file: File) => void;
}

export function FileCard({ file, onDownloadStart }: FileCardProps) {
  const { toast } = useToast();
  
  // Get the appropriate icon based on file type
  const getFileIcon = () => {
    switch (file.type) {
      case 'exe':
        return (
          <div className="bg-primary-100 rounded p-2">
            <svg className="h-6 w-6 text-primary-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
        );
      case 'bat':
        return (
          <div className="bg-amber-100 rounded p-2">
            <svg className="h-6 w-6 text-amber-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'zip':
        return (
          <div className="bg-emerald-100 rounded p-2">
            <svg className="h-6 w-6 text-emerald-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 rounded p-2">
            <svg className="h-6 w-6 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
    }
  };

  // Get the badge color based on file type
  const getFileTypeBadge = () => {
    switch (file.type) {
      case 'exe':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Executable
          </span>
        );
      case 'bat':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Batch File
          </span>
        );
      case 'zip':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            Archive
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            File
          </span>
        );
    }
  };

  // Handle file download
  const handleDownload = async () => {
    try {
      onDownloadStart(file);
      
      // Create a link to download the file
      const link = document.createElement('a');
      link.href = `/api/files/${file.id}/download`;
      link.setAttribute('download', file.originalName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the file.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="overflow-hidden" data-file-type={file.type}>
      <div className="p-5">
        <div className="flex items-center justify-between">
          {getFileIcon()}
          {getFileTypeBadge()}
        </div>
        <div className="mt-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{file.originalName}</h3>
          <div className="mt-2 text-sm text-gray-500 space-y-1">
            <p>{file.description || 'No description available'}</p>
            <p>Size: {formatFileSize(file.size)}</p>
            <p>Updated: {file.uploadDate ? formatDate(file.uploadDate) : 'N/A'}</p>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="text-gray-500">Downloads: </span>
            <span className="font-medium text-gray-900">{file.downloads}</span>
          </div>
          <Button 
            size="sm" 
            className="inline-flex items-center"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </div>
    </Card>
  );
}
