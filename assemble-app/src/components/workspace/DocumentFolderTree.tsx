'use client';

import React, { useMemo, useEffect } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
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
}

function FolderTreeNode({
  node,
  projectId,
  level,
  selectedPath,
  baseIndent
}: FolderTreeNodeProps) {
  const { toggleFolder: toggleFolderInStore, setSelectedFolder, isFolderExpanded } = useWorkspaceStore();

  const isExpanded = isFolderExpanded(projectId, node.path);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedPath === node.path;

  const handleRowClick = () => {
    // Select the folder
    setSelectedFolder(projectId, node.path);
    // If it has children, also toggle expand/collapse
    if (hasChildren) {
      toggleFolderInStore(projectId, node.path);
    }
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors mx-2',
          'hover:bg-gray-800/50',
          isSelected && 'bg-gray-800 text-gray-100',
          !isSelected && 'text-gray-300'
        )}
        style={{ paddingLeft: `${baseIndent + level * 16}px` }}
        onClick={handleRowClick}
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
