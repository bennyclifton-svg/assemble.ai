'use client';

import React, { useState, useEffect } from 'react';
import { useSelectionStore } from '@/stores/selectionStore';
import { getDocuments } from '@/app/actions/document';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Document {
  id: string;
  name: string;
  displayName: string | null;
  path: string;
  size: number;
  tags: string[];
  processingStatus: string;
  version?: number;
  createdAt?: string;
}

interface DocumentSelectorProps {
  projectId: string;
  className?: string;
}

interface GroupedDocument extends Document {
  tier1: string;
  tier2: string;
}

/**
 * DocumentSelector component for selecting documents for tender packages
 * Displays existing documents from repository with Tier 1 grouping
 * Supports:
 * - AC1: Display existing documents from repository (NO upload)
 * - AC2: Shift+click range selection
 * - AC3: Ctrl+click individual selection
 * - AC4: Tag filtering
 * - AC8: Group by Tier 1 folders with collapse/expand (chevron in header)
 * - AC9: Sort by Folder2 within each group
 * - AC10: Bulk collapse/expand via header chevron control
 * - AC11: Columns: Chevron, Checkbox, Folder, Filename, Revision, Size, Date
 * - Default: All folders start collapsed
 */
export function DocumentSelector({ projectId, className }: DocumentSelectorProps) {
  const [documents, setDocuments] = useState<GroupedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  // Default: All groups collapsed
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set(['Admin', 'Invoices', 'Plan', 'Consultants', 'Scheme', 'Detail', 'Procure', 'Contractors', 'Delivery']));

  const store = useSelectionStore();
  const selectedDocuments = store.getSelectedDocuments();
  const {
    setAllDocuments,
    toggleDocument,
    selectAllDocuments,
    clearDocuments,
  } = store;

  useEffect(() => {
    loadDocuments();
  }, [projectId]);

  const loadDocuments = async () => {
    setIsLoading(true);

    const result = await getDocuments(projectId);

    if (result.success && result.data) {
      const docs = result.data as unknown as Document[];

      // Process documents to extract Tier 1 and Tier 2 from path
      const groupedDocs: GroupedDocument[] = docs.map((doc) => {
        const pathParts = doc.path.split('/');
        const tier1 = pathParts[0] || 'Uncategorized';
        const tier2 = pathParts[1] || 'Misc';

        return {
          ...doc,
          tier1,
          tier2,
        };
      });

      setDocuments(groupedDocs);
      setAllDocuments(groupedDocs.map((d) => ({ id: d.id })));

      // Extract all unique tags
      const tags = new Set<string>();
      docs.forEach((doc) => {
        doc.tags?.forEach((tag) => tags.add(tag));
      });
      setAllTags(Array.from(tags).sort());
    }

    setIsLoading(false);
  };

  const filteredDocuments = documents.filter((doc) => {
    if (filterTags.length === 0) return true;
    return filterTags.some((tag) => doc.tags?.includes(tag));
  });

  // Group documents by Tier 1 folder (AC8, AC9)
  const groupedByTier1 = filteredDocuments.reduce((acc, doc) => {
    if (!acc[doc.tier1]) {
      acc[doc.tier1] = [];
    }
    acc[doc.tier1].push(doc);
    return acc;
  }, {} as Record<string, GroupedDocument[]>);

  // Sort each Tier 1 group by Tier 2 folder name alphanumerically (AC9)
  Object.keys(groupedByTier1).forEach((tier1) => {
    groupedByTier1[tier1].sort((a, b) => {
      // Primary sort: Tier 2 folder
      const tier2Compare = a.tier2.localeCompare(b.tier2);
      if (tier2Compare !== 0) return tier2Compare;
      // Secondary sort: Filename
      return (a.displayName || a.name).localeCompare(b.displayName || b.name);
    });
  });

  // Sort Tier 1 folders in a logical order
  const tier1Order = ['Admin', 'Invoices', 'Plan', 'Consultants', 'Scheme', 'Detail', 'Procure', 'Contractors', 'Delivery'];
  const sortedTier1Keys = Object.keys(groupedByTier1).sort((a, b) => {
    const aIndex = tier1Order.indexOf(a);
    const bIndex = tier1Order.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });

  const handleDocumentClick = (e: React.MouseEvent, documentId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const isShiftClick = e.shiftKey;
    const isCtrlClick = e.ctrlKey || e.metaKey;

    if (isShiftClick) {
      // Shift+Click: Range selection - REPLACE entire selection with range
      const lastSelected = store.getLastSelectedDocument();
      if (lastSelected && filteredDocuments.length > 0) {
        const startIdx = filteredDocuments.findIndex((d) => d.id === lastSelected);
        const endIdx = filteredDocuments.findIndex((d) => d.id === documentId);

        if (startIdx !== -1 && endIdx !== -1) {
          const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];

          // Clear existing selection
          store.clearDocuments();

          // Select range
          for (let i = from; i <= to; i++) {
            toggleDocument(filteredDocuments[i].id, false, true);
          }
          return;
        }
      }
    }

    // Default click (no modifiers) OR Ctrl/Cmd+Click: Toggle individual item, preserve others
    // This is the standard multi-select behavior
    toggleDocument(documentId, false, true);
  };

  // Handle group checkbox - works on ALL documents in group regardless of collapse state
  const handleSelectAllInGroup = (tier1: string) => {
    const groupDocs = groupedByTier1[tier1];
    const allSelected = groupDocs.every((doc) => selectedDocuments.has(doc.id));

    if (allSelected) {
      // Deselect all documents in group (including hidden ones)
      groupDocs.forEach((doc) => {
        if (selectedDocuments.has(doc.id)) {
          toggleDocument(doc.id, false, true);
        }
      });
    } else {
      // Select all documents in group (including hidden ones)
      setAllDocuments(filteredDocuments.map((d) => ({ id: d.id })));
      groupDocs.forEach((doc) => {
        if (!selectedDocuments.has(doc.id)) {
          toggleDocument(doc.id, false, true);
        }
      });
    }
  };

  const toggleGroup = (tier1: string) => {
    setCollapsedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tier1)) {
        newSet.delete(tier1);
      } else {
        newSet.add(tier1);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setCollapsedGroups(new Set());
  };

  const collapseAll = () => {
    setCollapsedGroups(new Set(sortedTier1Keys));
  };

  const handleTagToggle = (tag: string) => {
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  // Check if all groups are collapsed
  const allCollapsed = sortedTier1Keys.every((tier1) => collapsedGroups.has(tier1));

  // Handle bulk select all documents (regardless of collapsed state)
  const handleSelectAll = () => {
    // Work on ALL filtered documents, not just visible ones
    const allDocs = filteredDocuments;
    const allDocsSelected = allDocs.every((doc) => selectedDocuments.has(doc.id));

    if (allDocsSelected && allDocs.length > 0) {
      // Deselect all documents
      allDocs.forEach((doc) => {
        if (selectedDocuments.has(doc.id)) {
          toggleDocument(doc.id, false, true);
        }
      });
    } else {
      // Select all documents
      setAllDocuments(allDocs.map((d) => ({ id: d.id })));
      allDocs.forEach((doc) => {
        if (!selectedDocuments.has(doc.id)) {
          toggleDocument(doc.id, false, true);
        }
      });
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with selection count and tag filter */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h3 className="font-medium text-gray-900">Tender Documents</h3>
          <span className="text-sm text-gray-500">
            {selectedDocuments.size} of {filteredDocuments.length} selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          {allTags.length > 0 && (
            <>
              <span className="text-sm text-gray-600">Filter by tags:</span>
              <div className="flex gap-1 flex-wrap max-w-md">
                {allTags.slice(0, 5).map((tag) => (
                  <Badge
                    key={tag}
                    variant={filterTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-blue-100"
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Document register/transmittal table with Tier 1 grouping */}
      <div className="border rounded-lg max-h-[600px] overflow-y-auto select-none">
        <table className="w-full select-none">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="w-8 p-2">
                {/* Bulk collapse/expand chevron */}
                <button
                  onClick={allCollapsed ? expandAll : collapseAll}
                  className="flex items-center justify-center hover:bg-gray-200 rounded p-1"
                  aria-label={allCollapsed ? 'Expand all folders' : 'Collapse all folders'}
                >
                  {allCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </th>
              <th className="w-10 p-2">
                {/* Bulk select checkbox - works on ALL documents regardless of collapse state */}
                <Checkbox
                  checked={
                    filteredDocuments.length > 0 &&
                    filteredDocuments.every((doc) => selectedDocuments.has(doc.id))
                  }
                  indeterminate={
                    selectedDocuments.size > 0 &&
                    selectedDocuments.size < filteredDocuments.length &&
                    filteredDocuments.some((doc) => selectedDocuments.has(doc.id))
                  }
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all documents"
                />
              </th>
              <th className="text-left p-2 font-medium text-gray-900">Folder</th>
              <th className="text-left p-2 font-medium text-gray-900">Filename</th>
              <th className="text-left p-2 font-medium text-gray-900">Revision</th>
              <th className="text-right p-2 font-medium text-gray-900">Size</th>
              <th className="text-left p-2 font-medium text-gray-900">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  {filterTags.length > 0
                    ? 'No documents match the selected tags'
                    : 'No documents available'}
                </td>
              </tr>
            ) : (
              sortedTier1Keys.map((tier1) => {
                const groupDocs = groupedByTier1[tier1];
                const isCollapsed = collapsedGroups.has(tier1);
                // Calculate checkbox state based on ALL documents in group (regardless of collapse state)
                const allSelectedInGroup = groupDocs.every((doc) => selectedDocuments.has(doc.id));
                const someSelectedInGroup = groupDocs.some((doc) => selectedDocuments.has(doc.id));

                return (
                  <React.Fragment key={tier1}>
                    {/* Tier 1 Group Header */}
                    <tr className="bg-gray-100 border-t-2 border-gray-300">
                      {/* Chevron column */}
                      <td className="p-2">
                        <button
                          onClick={() => toggleGroup(tier1)}
                          className="flex items-center justify-center hover:bg-gray-200 rounded p-1"
                          aria-label={isCollapsed ? `Expand ${tier1}` : `Collapse ${tier1}`}
                        >
                          {isCollapsed ? (
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                      </td>
                      {/* Checkbox column - selects ALL documents in group regardless of collapse state */}
                      <td className="p-2">
                        <Checkbox
                          checked={allSelectedInGroup}
                          indeterminate={someSelectedInGroup && !allSelectedInGroup}
                          onCheckedChange={() => handleSelectAllInGroup(tier1)}
                          aria-label={`Select all documents in ${tier1}`}
                        />
                      </td>
                      {/* Group name and info spanning remaining columns */}
                      <td colSpan={5} className="p-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{tier1}</span>
                          <span className="text-sm text-gray-500">
                            ({groupDocs.length} documents)
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Documents in this Tier 1 group */}
                    {!isCollapsed &&
                      groupDocs.map((doc) => (
                        <tr
                          key={doc.id}
                          className={cn(
                            'border-t cursor-pointer hover:bg-gray-50 transition-colors',
                            selectedDocuments.has(doc.id) && 'bg-blue-50'
                          )}
                          onClick={(e) => handleDocumentClick(e, doc.id)}
                        >
                          <td className="p-2">
                            {/* Empty cell for alignment with chevron column */}
                          </td>
                          <td className="p-2">
                            <Checkbox
                              checked={selectedDocuments.has(doc.id)}
                              onCheckedChange={() => {}}
                              aria-label={`Select ${doc.displayName || doc.name}`}
                            />
                          </td>
                          <td className="p-2 text-sm text-gray-700">{doc.tier2}</td>
                          <td className="p-2">
                            <p className="font-medium text-gray-900 text-sm">
                              {doc.displayName || doc.name}
                            </p>
                          </td>
                          <td className="p-2 text-sm text-gray-600">
                            v{doc.version || 1}
                          </td>
                          <td className="p-2 text-sm text-gray-600 text-right">
                            {formatFileSize(doc.size)}
                          </td>
                          <td className="p-2 text-sm text-gray-600">
                            {formatDate(doc.createdAt)}
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Help text */}
      <div className="text-sm text-gray-500">
        <p>
          <strong>Tip:</strong> Use Shift+click for range selection, Ctrl+click (Cmd+click
          on Mac) for multiple selection
        </p>
      </div>
    </div>
  );
}
