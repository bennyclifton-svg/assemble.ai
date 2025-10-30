'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  File,
  FolderOpen,
  CheckCircle2,
  Edit3,
  Eye,
  Download,
  MoreVertical,
} from 'lucide-react';

interface DocumentWithHistoryProps {
  document: {
    id: string;
    name: string;
    displayName: string;
    path: string;
    size: number;
    mimeType: string;
    metadata?: any;
    createdAt: Date | string;
    url?: string;
  };
  onViewHistory?: (documentId: string) => void;
}

/**
 * Document Row with Filing Status Badge
 *
 * Enhanced document row that shows filing status
 * Can be used in document lists and tables
 */
export function DocumentWithHistory({ document, onViewHistory }: DocumentWithHistoryProps) {
  const metadata = document.metadata || {};
  const isAutoFiled = metadata.autoFiled === true;
  const wasOverridden = metadata.manuallyOverridden === true;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all">
      {/* File Icon */}
      <div className="flex-shrink-0">
        <File className="w-5 h-5 text-gray-400" />
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-gray-900 truncate">{document.displayName}</p>

          {/* Filing Status Badge */}
          <Badge
            variant={isAutoFiled ? 'default' : wasOverridden ? 'secondary' : 'outline'}
            className="text-xs flex-shrink-0"
          >
            {isAutoFiled ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Auto
              </>
            ) : wasOverridden ? (
              <>
                <Edit3 className="w-3 h-3 mr-1" />
                Custom
              </>
            ) : (
              'Manual'
            )}
          </Badge>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <FolderOpen className="w-3 h-3" />
            {document.path}
          </span>
          <span>•</span>
          <span>{formatFileSize(document.size)}</span>
          <span>•</span>
          <span>{formatDate(document.createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {onViewHistory && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewHistory(document.id)}
            title="View Filing History"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}

        {document.url && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(document.url, '_blank')}
            title="Download"
          >
            <Download className="w-4 h-4" />
          </Button>
        )}

        <Button variant="ghost" size="sm" title="More options">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Enhanced Document List with Filing Status
 *
 * Shows documents with their filing status badges
 * Can filter and sort by filing method
 */
interface DocumentListWithHistoryProps {
  documents: any[];
  onViewHistory?: (documentId: string) => void;
}

export function DocumentListWithHistory({
  documents,
  onViewHistory,
}: DocumentListWithHistoryProps) {
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'path'>('date');

  const sortedDocuments = [...documents].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'name':
        return a.displayName.localeCompare(b.displayName);
      case 'path':
        return a.path.localeCompare(b.path);
      default:
        return 0;
    }
  });

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 border border-gray-200 rounded-lg bg-gray-50">
        <File className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">No documents found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sort Controls */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">Sort by:</span>
        <Button
          variant={sortBy === 'date' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('date')}
        >
          Date
        </Button>
        <Button
          variant={sortBy === 'name' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('name')}
        >
          Name
        </Button>
        <Button
          variant={sortBy === 'path' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('path')}
        >
          Path
        </Button>
      </div>

      {/* Document List */}
      <div className="space-y-2">
        {sortedDocuments.map((doc) => (
          <DocumentWithHistory
            key={doc.id}
            document={doc}
            onViewHistory={onViewHistory}
          />
        ))}
      </div>
    </div>
  );
}
