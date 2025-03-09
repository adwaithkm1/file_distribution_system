import { useState, useEffect } from 'react';
import { File } from '@shared/schema';
import { FileCard } from '@/components/ui/file-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActiveDownloadPanel } from '@/components/ui/active-download-panel';
import { Search } from 'lucide-react';

interface FileListProps {
  files: File[];
}

export function FileList({ files }: FileListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [filteredFiles, setFilteredFiles] = useState<File[]>(files);
  const [activeDownload, setActiveDownload] = useState<File | null>(null);
  const [showDownloadPanel, setShowDownloadPanel] = useState(false);

  // Apply filters when files, search, or type filter changes
  useEffect(() => {
    const filtered = files.filter(file => {
      // Type filter
      const matchesType = fileTypeFilter === 'all' || file.type === fileTypeFilter;
      
      // Search filter (case-insensitive)
      const search = searchQuery.toLowerCase();
      const matchesSearch = !search || 
        file.originalName.toLowerCase().includes(search) || 
        (file.description ? file.description.toLowerCase().includes(search) : false);
      
      return matchesType && matchesSearch;
    });
    
    setFilteredFiles(filtered);
  }, [files, searchQuery, fileTypeFilter]);

  const handleDownloadStart = (file: File) => {
    setActiveDownload(file);
    setShowDownloadPanel(true);
  };

  const handleCloseDownloadPanel = () => {
    setShowDownloadPanel(false);
    setActiveDownload(null);
  };

  return (
    <div className="space-y-8">
      {/* Filter/Search Bar */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg leading-6 font-medium text-gray-900">Available Files</h2>
            <p className="mt-1 text-sm text-gray-500">Download files for installation and setup</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  className="pl-10 pr-3"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                  <SelectTrigger className="min-w-[140px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="exe">Executables (.exe)</SelectItem>
                    <SelectItem value="bat">Batch Files (.bat)</SelectItem>
                    <SelectItem value="zip">Archives (.zip)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* File Grid */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <p className="text-gray-500">No files match your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map(file => (
            <FileCard key={file.id} file={file} onDownloadStart={handleDownloadStart} />
          ))}
        </div>
      )}

      {/* Active Download Panel */}
      <ActiveDownloadPanel
        isVisible={showDownloadPanel}
        file={activeDownload}
        onClose={handleCloseDownloadPanel}
      />
    </div>
  );
}
