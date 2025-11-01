'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { File, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { getDocuments } from '@/app/actions/document';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { getDefaultFolderStructure } from '@/services/folderStructure';

interface DocumentCardProps {
  projectId: string;
  documents?: any[]; // Will be properly typed when we fetch from DB
  currentDisciplineId?: string; // Optional: for highlighting saved tender documents for this discipline
}

export function DocumentCard({ projectId, documents: initialDocuments = [], currentDisciplineId }: DocumentCardProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [isLoading, setIsLoading] = useState(!initialDocuments.length);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null); // For Shift+click range selection

  // Get workspace store state and actions
  const {
    selectedFolderPath,
    activeConsultants,
    activeContractors,
    savedTenderDocuments,
    getSelectedDocuments,
    setSelectedDocuments: setSelectedDocsInStore,
    getActiveTenderDiscipline,
  } = useWorkspaceStore();

  const currentPath = selectedFolderPath[projectId] || '';
  const activeDisciplines = activeConsultants[projectId] || [];
  const activeTrades = activeContractors[projectId] || [];

  // Get selected documents from workspace store
  const selectedDocumentsArray = getSelectedDocuments(projectId);
  const selectedDocuments = new Set<string>(selectedDocumentsArray);

  // Helper to update selected documents in store
  const setSelectedDocuments = (newSelection: Set<string>) => {
    setSelectedDocsInStore(projectId, Array.from(newSelection));
  };

  // Get saved documents for the current discipline (from prop OR from active tender discipline in store)
  const effectiveDisciplineId = currentDisciplineId || getActiveTenderDiscipline(projectId);
  const savedDocumentsForCurrentDiscipline = effectiveDisciplineId
    ? new Set(savedTenderDocuments[projectId]?.[effectiveDisciplineId] || [])
    : new Set<string>();

  // Fetch documents if not provided
  useEffect(() => {
    if (!initialDocuments.length && projectId) {
      setIsLoading(true);
      getDocuments(projectId).then((result) => {
        if (result.success) {
          setDocuments(result.data || []);
        }
        setIsLoading(false);
      });
    }
  }, [projectId, initialDocuments.length]);

  // Prevent default drag behavior globally to stop browser from opening dropped files
  // BUT allow events to bubble to drop zones (don't stopPropagation)
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      // Note: NOT calling e.stopPropagation() to allow drop zones to work
    };

    // Prevent default for drag events on document
    document.addEventListener('dragover', preventDefaults);
    document.addEventListener('drop', preventDefaults);

    return () => {
      document.removeEventListener('dragover', preventDefaults);
      document.removeEventListener('drop', preventDefaults);
    };
  }, []);

  const handleDropFiles = useCallback(async (files: File[], folderPath: string) => {
    console.log('Uploading files to:', folderPath, files);

    // Import the upload function dynamically
    const { uploadDocumentsToFolder } = await import('@/app/actions/document');

    try {
      const result = await uploadDocumentsToFolder(projectId, folderPath, Array.from(files));

      if (result.success) {
        // Refresh documents from server to get the complete list
        const refreshResult = await getDocuments(projectId);
        if (refreshResult.success) {
          setDocuments(refreshResult.data || []);
        }
        console.log('Upload successful:', result.data);
      } else {
        console.error('Upload failed:', result.error);
        alert(`Upload failed: ${result.error?.message}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('An error occurred during upload');
    }
  }, [projectId]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
          <p className="text-xs text-gray-600 mt-0.5">
            {selectedDocuments.size > 0
              ? `${selectedDocuments.size} selected • `
              : ''}{documents.length} total documents
          </p>
        </div>
      </div>

      {/* Main content area - Document table only */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto">
          <DocumentTable
            documents={documents}
            folderPath={currentPath}
            projectId={projectId}
            activeDisciplines={activeDisciplines}
            activeTrades={activeTrades}
            selectedDocuments={selectedDocuments}
            savedDocuments={savedDocumentsForCurrentDiscipline}
            setSelectedDocuments={setSelectedDocuments}
            lastSelectedIndex={lastSelectedIndex}
            setLastSelectedIndex={setLastSelectedIndex}
            onClearSelection={() => setSelectedDocuments(new Set())}
            onDropFiles={(files) => handleDropFiles(files, currentPath || 'Documents')}
            onRefresh={() => {
              getDocuments(projectId).then((result) => {
                if (result.success) {
                  setDocuments(result.data || []);
                  setSelectedDocuments(new Set()); // Clear selection on refresh
                }
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}

interface GroupedDocument {
  id: string;
  name: string;
  displayName: string | null;
  path: string;
  size: number;
  version: number;
  createdAt: Date | string;
  tier1: string;
  tier2: string;
}

interface DocumentTableProps {
  documents: any[];
  folderPath: string;
  projectId: string;
  activeDisciplines: string[];
  activeTrades: string[];
  selectedDocuments: Set<string>;
  savedDocuments: Set<string>; // Documents saved to tender for current discipline
  lastSelectedIndex: number | null;
  setLastSelectedIndex: (index: number | null) => void;
  onClearSelection: () => void;
  onDropFiles: (files: File[]) => void;
  onRefresh: () => void;
  setSelectedDocuments: (selection: Set<string>) => void; // Direct setter for bulk operations
}

function DocumentTable({
  documents,
  folderPath,
  projectId,
  activeDisciplines,
  activeTrades,
  selectedDocuments,
  savedDocuments,
  lastSelectedIndex,
  setLastSelectedIndex,
  onClearSelection,
  onDropFiles,
  onRefresh,
  setSelectedDocuments
}: DocumentTableProps) {
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);
  const [bulkActionProgress, setBulkActionProgress] = React.useState<{
    isActive: boolean;
    current: number;
    total: number;
    action: 'delete' | 'move' | '';
  }>({ isActive: false, current: 0, total: 0, action: '' }); // AC-12: Progress indicators
  const [showMoveDialog, setShowMoveDialog] = React.useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onDropFiles(files);
    }
  }, [onDropFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging if files are being dragged
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if leaving the container
    if (e.currentTarget === e.target) {
      setIsDraggingOver(false);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    // Always clear hover state when drag ends
    setIsDraggingOver(false);
  }, []);

  // AC-11: Bulk delete handler
  const handleBulkDelete = useCallback(async () => {
    if (selectedDocuments.size === 0) return;

    const confirmed = confirm(`Delete ${selectedDocuments.size} document(s)?`);
    if (!confirmed) return;

    setBulkActionProgress({ isActive: true, current: 0, total: selectedDocuments.size, action: 'delete' });

    const { bulkDeleteDocuments } = await import('@/app/actions/document');
    const result = await bulkDeleteDocuments(Array.from(selectedDocuments));

    setBulkActionProgress({ isActive: false, current: 0, total: 0, action: '' });

    if (result.success) {
      onRefresh();
      onClearSelection();
    } else {
      alert(`Delete failed: ${result.error?.message}`);
    }
  }, [selectedDocuments, onRefresh, onClearSelection]);

  // AC-11: Bulk move handler
  const handleBulkMove = useCallback(async (targetPath: string) => {
    if (selectedDocuments.size === 0) return;

    setBulkActionProgress({ isActive: true, current: 0, total: selectedDocuments.size, action: 'move' });

    const { bulkMoveDocuments } = await import('@/app/actions/document');
    const result = await bulkMoveDocuments(Array.from(selectedDocuments), targetPath);

    setBulkActionProgress({ isActive: false, current: 0, total: 0, action: '' });

    if (result.success) {
      onRefresh();
      onClearSelection();
      setShowMoveDialog(false);
    } else {
      alert(`Move failed: ${result.error?.message}`);
    }
  }, [selectedDocuments, onRefresh, onClearSelection]);

  // Filter and process documents based on selected folder from sidebar
  const filteredDocuments = React.useMemo(() => {
    // Process documents to extract Tier 1 and Tier 2 from path
    const processedDocs: GroupedDocument[] = documents.map((doc) => {
      const pathParts = doc.path.split('/');
      const tier1 = pathParts[0] || 'Uncategorized';
      const tier2 = pathParts[1] || '';

      return {
        ...doc,
        tier1,
        tier2,
      };
    });

    // Filter based on selected folder from sidebar (folderPath)
    let filtered = processedDocs;
    if (folderPath) {
      const filterParts = folderPath.split('/');
      if (filterParts.length === 1) {
        // Tier 1 filter (e.g., "Plan")
        filtered = processedDocs.filter(doc => doc.tier1 === filterParts[0]);
      } else if (filterParts.length === 2) {
        // Tier 2 filter (e.g., "Plan/Feasibility")
        filtered = processedDocs.filter(doc => doc.tier1 === filterParts[0] && doc.tier2 === filterParts[1]);
      }
    }

    // Sort by Folder (Tier 2, then Tier 1 if no Tier 2), then by Filename
    filtered.sort((a, b) => {
      const folderA = a.tier2 || a.tier1 || '';
      const folderB = b.tier2 || b.tier1 || '';
      const folderComparison = folderA.localeCompare(folderB);

      if (folderComparison !== 0) {
        return folderComparison;
      }

      // If folders are the same, sort by filename
      return (a.displayName || a.name).localeCompare(b.displayName || b.name);
    });

    return filtered;
  }, [documents, folderPath]);

  // Handler for document selection with proper range selection support
  const handleDocumentSelect = (docId: string, shiftKey: boolean, ctrlKey: boolean) => {
    const currentIndex = filteredDocuments.findIndex(d => d.id === docId);

    if (shiftKey && lastSelectedIndex !== null) {
      // Range selection - use filteredDocuments array
      const start = Math.min(lastSelectedIndex, currentIndex);
      const end = Math.max(lastSelectedIndex, currentIndex);
      const newSelection = new Set(selectedDocuments);
      for (let i = start; i <= end; i++) {
        newSelection.add(filteredDocuments[i].id);
      }
      setSelectedDocuments(newSelection);
    } else if (ctrlKey) {
      // Toggle individual
      const newSelection = new Set(selectedDocuments);
      if (newSelection.has(docId)) {
        newSelection.delete(docId);
      } else {
        newSelection.add(docId);
      }
      setSelectedDocuments(newSelection);
      setLastSelectedIndex(currentIndex);
    } else {
      // Single selection
      setSelectedDocuments(new Set([docId]));
      setLastSelectedIndex(currentIndex);
    }
  };

  const handleSelectAll = () => {
    const allFiltered = filteredDocuments.every((doc) => selectedDocuments.has(doc.id));

    const newSelection = new Set(selectedDocuments);

    if (allFiltered && filteredDocuments.length > 0) {
      // Deselect all filtered documents
      filteredDocuments.forEach((doc) => {
        newSelection.delete(doc.id);
      });
    } else {
      // Select all filtered documents
      filteredDocuments.forEach((doc) => {
        newSelection.add(doc.id);
      });
    }

    setSelectedDocuments(newSelection);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`;
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFileExtension = (filename: string): string => {
    const parts = filename.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
  };

  return (
    <div
      className={cn(
        "h-full flex flex-col transition-all",
        isDraggingOver && "bg-blue-50 ring-4 ring-blue-300 ring-inset"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragEnd={handleDragEnd}
    >
      {/* Table header with bulk actions */}
      <div className="border-b bg-gray-50 px-4 py-3">
        {selectedDocuments.size > 0 ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-blue-600">
                {selectedDocuments.size} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkActionProgress.isActive}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMoveDialog(true)}
                disabled={bulkActionProgress.isActive}
              >
                Move to...
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                disabled={bulkActionProgress.isActive}
              >
                Clear
              </Button>
            </div>
            {bulkActionProgress.isActive && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="animate-pulse">
                  {bulkActionProgress.action === 'delete' ? 'Deleting...' : 'Moving...'}
                </span>
                <span>{bulkActionProgress.current} / {bulkActionProgress.total}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            <span className="font-medium">{documents.length}</span> {documents.length === 1 ? 'document' : 'documents'}
            <span className="ml-3 text-gray-500">• Shift+click for range, Ctrl+click to toggle</span>
          </p>
        )}
      </div>

      {/* Drag overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-100 bg-opacity-90 z-10 pointer-events-none">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">Drop files here</p>
            <p className="text-sm text-blue-500 mt-2">Upload to {folderPath}</p>
          </div>
        </div>
      )}

      {/* Table with filtered documents and Folder column */}
      <div className="flex-1 overflow-auto relative">
        {documents.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-sm">No documents</p>
              <p className="text-xs mt-1">Drag and drop files to upload</p>
            </div>
          </div>
        ) : (
          <table className="w-full select-none table-fixed">
            <thead className="bg-gray-50 sticky top-0 z-10 border-b">
              <tr>
                <th className="w-10 p-2">
                  {/* Bulk select checkbox */}
                  <Checkbox
                    checked={
                      filteredDocuments.length > 0 &&
                      filteredDocuments.every((doc) => selectedDocuments.has(doc.id))
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all documents"
                  />
                </th>
                <th className="text-left p-2 font-medium text-gray-900 w-32">Folder</th>
                <th className="text-left p-2 font-medium text-gray-900">Filename</th>
                <th className="text-left p-2 font-medium text-gray-900 w-20">Revision</th>
                <th className="text-right p-2 font-medium text-gray-900 w-24">Size</th>
                <th className="text-left p-2 font-medium text-gray-900 w-32">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <p className="text-sm">No documents in this folder</p>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => {
                  const isSelected = selectedDocuments.has(doc.id);
                  const isSaved = savedDocuments.has(doc.id);
                  return (
                    <tr
                      key={doc.id}
                      className={cn(
                        'border-t cursor-pointer hover:bg-gray-50 transition-colors',
                        isSelected && !isSaved && 'bg-blue-50',
                        isSaved && 'bg-green-50 border-l-4 border-l-green-500'
                      )}
                      onClick={(e) => handleDocumentSelect(doc.id, e.shiftKey, e.ctrlKey || e.metaKey)}
                    >
                      <td className="p-2 align-middle">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => {}}
                          aria-label={`Select ${doc.displayName || doc.name}`}
                        />
                      </td>
                      <td className="p-2 text-sm text-gray-700 truncate overflow-hidden whitespace-nowrap" title={doc.tier2 || doc.tier1 || '-'}>
                        {doc.tier2 || doc.tier1 || '-'}
                      </td>
                      <td className="p-2 truncate overflow-hidden whitespace-nowrap" title={doc.displayName || doc.name}>
                        <span className="font-medium text-gray-900 text-sm">
                          {doc.displayName || doc.name}
                        </span>
                      </td>
                      <td className="p-2 text-sm text-gray-600 truncate overflow-hidden whitespace-nowrap">v{doc.version || 1}</td>
                      <td className="p-2 text-sm text-gray-600 text-right truncate overflow-hidden whitespace-nowrap">{formatFileSize(doc.size)}</td>
                      <td className="p-2 text-sm text-gray-600 truncate overflow-hidden whitespace-nowrap">{formatDate(doc.createdAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

interface BreadcrumbProps {
  path: string;
  onNavigate: (path: string) => void;
}

function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  const parts = path.split('/').filter(Boolean);

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={() => onNavigate('')}
        className="hover:text-blue-600 transition-colors"
      >
        Home
      </button>

      {parts.map((part, index) => {
        const currentPath = parts.slice(0, index + 1).join('/');
        return (
          <React.Fragment key={currentPath}>
            <span className="text-gray-400">/</span>
            <button
              onClick={() => onNavigate(currentPath)}
              className="hover:text-blue-600 transition-colors"
            >
              {part}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}