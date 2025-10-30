'use client';

import { useState, useEffect } from 'react';
import { FilingHistoryPanel } from './FilingHistoryPanel';
import { getDocuments } from '@/app/actions/document';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  History,
  Filter,
  CheckCircle2,
  Edit3,
  FileText,
  Loader2,
  ChevronDown,
} from 'lucide-react';

interface FilingHistoryViewerProps {
  projectId: string;
  className?: string;
}

/**
 * Filing History Viewer - Displays document filing audit trail
 *
 * Features:
 * - Shows all documents with filing metadata
 * - Filter by auto-filed vs manual override
 * - Expandable filing details
 * - Audit trail for each document
 */
export function FilingHistoryViewer({ projectId, className }: FilingHistoryViewerProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'auto' | 'manual'>('all');

  useEffect(() => {
    loadDocuments();
  }, [projectId]);

  useEffect(() => {
    applyFilter();
  }, [documents, filter]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const result = await getDocuments(projectId);
      if (result.success && result.data) {
        // Sort by newest first
        const sorted = result.data.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setDocuments(sorted);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = documents;

    if (filter === 'auto') {
      filtered = documents.filter((doc) => doc.metadata?.autoFiled === true);
    } else if (filter === 'manual') {
      filtered = documents.filter((doc) => doc.metadata?.manuallyOverridden === true);
    }

    setFilteredDocuments(filtered);
  };

  const getStatistics = () => {
    const total = documents.length;
    const autoFiled = documents.filter((d) => d.metadata?.autoFiled === true).length;
    const manuallyOverridden = documents.filter((d) => d.metadata?.manuallyOverridden === true).length;
    const unknown = total - autoFiled - manuallyOverridden;

    return { total, autoFiled, manuallyOverridden, unknown };
  };

  const stats = getStatistics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading filing history...</p>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border border-gray-200 rounded-lg bg-gray-50">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">No Documents Yet</p>
          <p className="text-sm text-gray-500">Upload documents to see their filing history</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header with Statistics */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filing History</h2>
          </div>
          <Button variant="outline" size="sm" onClick={loadDocuments}>
            Refresh
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Total Documents</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-xs text-green-700 mb-1">Auto-Filed</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-green-900">{stats.autoFiled}</p>
              <p className="text-sm text-green-600">
                {stats.total > 0 ? Math.round((stats.autoFiled / stats.total) * 100) : 0}%
              </p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-700 mb-1">Manual Override</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-blue-900">{stats.manuallyOverridden}</p>
              <p className="text-sm text-blue-600">
                {stats.total > 0 ? Math.round((stats.manuallyOverridden / stats.total) * 100) : 0}%
              </p>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Other</p>
            <p className="text-2xl font-bold text-gray-900">{stats.unknown}</p>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">Filter:</span>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({documents.length})
        </Button>
        <Button
          variant={filter === 'auto' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('auto')}
          className={filter === 'auto' ? '' : 'hover:bg-green-50'}
        >
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Auto-Filed ({stats.autoFiled})
        </Button>
        <Button
          variant={filter === 'manual' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('manual')}
          className={filter === 'manual' ? '' : 'hover:bg-blue-50'}
        >
          <Edit3 className="w-3 h-3 mr-1" />
          Manual ({stats.manuallyOverridden})
        </Button>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
            <p className="text-sm text-gray-600">No documents match the selected filter</p>
          </div>
        ) : (
          filteredDocuments.map((document) => (
            <FilingHistoryPanel key={document.id} document={document} />
          ))
        )}
      </div>

      {/* Footer Note */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <History className="w-4 h-4 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">About Filing History</p>
            <p className="text-xs text-blue-700 mt-1">
              This view shows the complete audit trail for all document uploads. Auto-filed documents
              were processed using the AutoFiler service based on filename patterns and upload context.
              Manual overrides allow users to customize filing locations when needed.
            </p>
            <div className="mt-2 text-xs text-blue-600">
              <strong>Acceptance Criteria Coverage:</strong> AC1 (Invoice auto-filing), AC2-AC3 (Tender documents),
              AC4-AC6 (Planning/Cost/General), AC8-AC9 (Card-based filing), AC10 (Manual override)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
