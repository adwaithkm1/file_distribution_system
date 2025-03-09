import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/header';
import { AdminPanel } from '@/components/admin-panel';
import { FileList } from '@/components/file-list';
import { File } from '@shared/schema';

export default function Home() {
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  // Fetch files from the API
  const { data: files = [], isLoading, error } = useQuery<File[]>({
    queryKey: ['/api/files'],
  });

  const toggleAdminPanel = () => {
    setShowAdminPanel(!showAdminPanel);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        showAdminPanel={showAdminPanel} 
        onToggleAdminPanel={toggleAdminPanel} 
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Panel */}
        {showAdminPanel && <AdminPanel files={files} />}
        
        {/* File List Section */}
        {isLoading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Loading files...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 bg-red-50 rounded-lg">
            <p className="text-red-500">Error loading files: {(error as Error).message}</p>
          </div>
        ) : (
          <FileList files={files} />
        )}
      </div>
    </div>
  );
}
