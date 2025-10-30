'use client';

import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface CardPanelProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  isLoading?: boolean;
  error?: Error | null;
}

export function CardPanel({ title, onClose, children, isLoading, error }: CardPanelProps) {
  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200 last:border-r-0">
      {/* Card Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          aria-label={`Close ${title}`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Card Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-gray-500">Loading...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center max-w-md">
              <p className="text-red-600 font-semibold mb-2">Error loading card</p>
              <p className="text-gray-600 text-sm">{error.message}</p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
