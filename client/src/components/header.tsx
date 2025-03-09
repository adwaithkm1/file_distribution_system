import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  showAdminPanel: boolean;
  onToggleAdminPanel: () => void;
}

export function Header({ showAdminPanel, onToggleAdminPanel }: HeaderProps) {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-primary-600">FileDistributor</h1>
            </div>
          </div>
          <div className="flex items-center">
            <Button
              onClick={onToggleAdminPanel}
              className="inline-flex items-center"
            >
              {showAdminPanel ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  User Mode
                </>
              ) : (
                <>
                  <Settings className="h-5 w-5 mr-2" />
                  Admin Mode
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
