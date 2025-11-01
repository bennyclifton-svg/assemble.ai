'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  getDefaultFolderStructure,
  buildFolderTree,
  FolderNode
} from '@/services/folderStructure';
import { useWorkspaceStore } from '@/stores/workspaceStore';

interface DocumentFolderTreeProps {
  projectId: string;
  documents?: any[];
}

export function DocumentFolderTree({
  projectId,
  documents = []
}: DocumentFolderTreeProps) {
  // Get state and actions from workspace store
  const {
    activeConsultants,
    activeContractors,
    expandedFolders,
    selectedFolderPath,
    setSelectedFolder,
    toggleFolder,
    expandAllFolders,
    isFolderExpanded
  } = useWorkspaceStore();

  // Fix hydration mismatch: defer folder expansion state until after client hydration
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const activeDisciplines = activeConsultants[projectId] || [];
  const activeTrades = activeContractors[projectId] || [];
  const selectedPath = selectedFolderPath[projectId] || '';
  const projectExpandedFolders = expandedFolders[projectId] || [];

  // Initialize with Tier 1 folders expanded if not already set
  useEffect(() => {
    if (projectExpandedFolders.length === 0) {
      const folders = getDefaultFolderStructure(activeDisciplines, activeTrades);
      const tier1Folders = folders.filter(f => !f.includes('/'));
      expandAllFolders(projectId, tier1Folders);
    }
  }, [projectId, projectExpandedFolders.length, activeDisciplines.length, activeTrades.length, expandAllFolders]);

  const folderStructure = useMemo(() => {
    const folders = getDefaultFolderStructure(activeDisciplines, activeTrades);
    const tree = buildFolderTree(folders, documents);
    return tree;
  }, [documents, activeDisciplines, activeTrades]);

  if (!folderStructure) return null;

  return (
    <div className="h-full overflow-y-auto py-2 scrollbar-improved">
      <style jsx>{`
        .scrollbar-improved::-webkit-scrollbar {
          width: 10px;
        }
        .scrollbar-improved::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 5px;
        }
        .scrollbar-improved::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.4);
          border-radius: 5px;
        }
        .scrollbar-improved::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.6);
        }
      `}</style>
      {folderStructure.children.map((node) => (
        <FolderTreeNode
          key={node.path}
          node={node}
          projectId={projectId}
          selectedPath={selectedPath}
          level={0}
          baseIndent={24}
          isHydrated={isHydrated}
        />
      ))}
    </div>
  );
}

interface FolderTreeNodeProps {
  node: FolderNode;
  projectId: string;
  level: number;
  selectedPath: string;
  baseIndent: number;
  isHydrated: boolean;
}

function FolderTreeNode({
  node,
  projectId,
  level,
  selectedPath,
  baseIndent,
  isHydrated
}: FolderTreeNodeProps) {
  const router = useRouter();
  const { toggleFolder: toggleFolderInStore, setSelectedFolder, isFolderExpanded } = useWorkspaceStore();
  const [isDragOver, setIsDragOver] = useState(false);

  // Only calculate expanded state after hydration to prevent SSR/CSR mismatch
  const isExpanded = isHydrated ? isFolderExpanded(projectId, node.path) : false;
  const hasChildren = node.children.length > 0;
  const isSelected = selectedPath === node.path;

  // Clear highlight when drag ends globally
  useEffect(() => {
    const handleDragEnd = () => setIsDragOver(false);
    document.addEventListener('dragend', handleDragEnd);
    document.addEventListener('drop', handleDragEnd);
    return () => {
      document.removeEventListener('dragend', handleDragEnd);
      document.removeEventListener('drop', handleDragEnd);
    };
  }, []);

  const handleRowClick = () => {
    // Select the folder
    setSelectedFolder(projectId, node.path);
    // If it has children, also toggle expand/collapse
    if (hasChildren) {
      toggleFolderInStore(projectId, node.path);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        console.log('Dropping files into folder:', node.path, files);

        // Import the upload function dynamically
        const { uploadDocumentsToFolder } = await import('@/app/actions/document');

        const result = await uploadDocumentsToFolder(projectId, node.path, files);

        if (result.success) {
          console.log('Upload successful:', result.data);
          // Trigger Next.js router refresh to revalidate server data
          router.refresh();
        } else {
          console.error('Upload failed:', result.error);
          alert(`Upload failed: ${result.error?.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error);
      alert('An error occurred during upload');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    // Only set isDragOver to false if mouse actually left the container bounds
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragOver(false);
    }
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors mx-2',
          'hover:bg-gray-800/50',
          isSelected && 'bg-gray-800 text-gray-100',
          !isSelected && 'text-gray-300',
          isDragOver && 'bg-blue-600/30 border-2 border-blue-400 border-dashed'
        )}
        style={{ paddingLeft: `${baseIndent + level * 16}px` }}
        onClick={handleRowClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Expand/collapse chevron */}
        {hasChildren ? (
          <span className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        ) : (
          <span className="w-4" />
        )}

        {/* Folder name - matching main nav font size */}
        <span className="flex-1 text-sm font-medium truncate">{node.name}</span>

        {/* File count (minimal) */}
        {node.fileCount !== undefined && node.fileCount > 0 && (
          <span className="text-xs text-gray-500 ml-1">
            {node.fileCount}
          </span>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <FolderTreeNode
              key={child.path}
              node={child}
              projectId={projectId}
              level={level + 1}
              selectedPath={selectedPath}
              baseIndent={baseIndent}
              isHydrated={isHydrated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
