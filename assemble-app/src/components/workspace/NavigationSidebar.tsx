'use client';

import React, { useState, useEffect } from 'react';
import { CardType } from '@prisma/client';
import {
  FileText,
  Pencil,
  Ruler,
  Package,
  Truck,
  Users,
  HardHat,
  Folder,
  Calculator,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { DocumentFolderTree } from '@/components/workspace/DocumentFolderTree';

interface NavItem {
  type: CardType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  id: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  // Project Phases Group
  {
    id: 'phases',
    items: [
      { type: CardType.PLAN, label: 'Plan', icon: FileText },
      { type: CardType.SCHEME_DESIGN, label: 'Scheme', icon: Pencil },
      { type: CardType.DETAIL_DESIGN, label: 'Detail', icon: Ruler },
      { type: CardType.PROCURE, label: 'Procure', icon: Package },
      { type: CardType.DELIVER, label: 'Deliver', icon: Truck },
    ],
  },
  // Team Management Group
  {
    id: 'team',
    items: [
      { type: CardType.CONSULTANT, label: 'Consultant', icon: Users },
      { type: CardType.CONTRACTOR, label: 'Contractor', icon: HardHat },
    ],
  },
  // Administration Group
  {
    id: 'admin',
    items: [
      { type: CardType.COST_PLANNING, label: 'Cost Planning', icon: Calculator },
      { type: CardType.DOCUMENTS, label: 'Documents', icon: Folder },
    ],
  },
];

interface NavigationSidebarProps {
  projectId?: string;
  documents?: any[];
}

export function NavigationSidebar({ projectId, documents = [] }: NavigationSidebarProps) {
  const { activeCards, collapsedNav, openCard, closeCard, toggleNavigation, canAddCard, setSelectedFolder } =
    useWorkspaceStore();

  const [isDocumentsExpanded, setIsDocumentsExpanded] = useState(true);

  // Fix hydration mismatch: defer disabled state calculation until after client hydration
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleCardClick = (type: CardType, event: React.MouseEvent) => {
    const isActive = activeCards.includes(type);

    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd click: toggle card
      if (isActive) {
        closeCard(type);
      } else if (canAddCard()) {
        openCard(type);
      }
    } else {
      // Normal click: replace all cards with this one
      if (isActive && activeCards.length === 1) {
        // If clicking the only active card, close it
        closeCard(type);
      } else {
        openCard(type, true);
      }
    }
  };

  const handleKeyDown = (type: CardType, event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openCard(type, true);
    }
  };

  return (
    <aside
      className={`
        flex flex-col items-stretch h-screen bg-gray-900 text-white border-r border-gray-800
        transition-all duration-300 ease-in-out
        ${collapsedNav ? 'w-16' : 'w-60'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0">
        {!collapsedNav && (
          <h2 className="text-sm font-semibold text-gray-300">Cards</h2>
        )}
        <button
          onClick={toggleNavigation}
          className="p-1.5 rounded hover:bg-gray-800 transition-colors"
          aria-label={collapsedNav ? 'Expand navigation' : 'Collapse navigation'}
        >
          {collapsedNav ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Main Navigation Groups - Fixed, No Scrolling */}
      <nav className="flex-shrink-0 py-4 w-full flex flex-col items-stretch">
        {navigationGroups.map((group, groupIndex) => (
          <div key={group.id} className="w-full">
            {/* Group Items */}
            <div className="space-y-1 w-full flex flex-col items-stretch">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeCards.includes(item.type);
                // Only calculate disabled state after hydration to prevent SSR/CSR mismatch
                const isDisabled = isHydrated ? (!isActive && !canAddCard()) : false;
                const isDocuments = item.type === CardType.DOCUMENTS;

                return (
                  <button
                    key={item.type}
                    onClick={(e) => {
                      if (isDocuments) {
                        // Toggle expand/collapse for Documents
                        setIsDocumentsExpanded(!isDocumentsExpanded);
                        // Clear folder filter to show all documents
                        if (projectId) {
                          setSelectedFolder(projectId, '');
                        }
                        // Also handle card opening
                        handleCardClick(item.type, e);
                      } else {
                        handleCardClick(item.type, e);
                      }
                    }}
                    onKeyDown={(e) => handleKeyDown(item.type, e)}
                    disabled={isDisabled}
                    style={{ textAlign: 'left' }}
                    className={`
                      w-full flex items-center gap-3 pl-3 pr-3 py-2.5 rounded
                      transition-all duration-200
                      ${collapsedNav ? 'justify-center' : 'justify-start'}
                      ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }
                      ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                    `}
                    title={
                      collapsedNav
                        ? item.label
                        : isDisabled
                          ? 'Maximum 3 cards open. Close a card first.'
                          : 'Click to open. Ctrl/Cmd+Click to add.'
                    }
                    tabIndex={0}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsedNav && (
                      <span className="text-sm font-medium truncate flex-1 text-left">{item.label}</span>
                    )}
                    {!collapsedNav && isDocuments && projectId && (
                      <span
                        className="flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDocumentsExpanded(!isDocumentsExpanded);
                        }}
                      >
                        {isDocumentsExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </span>
                    )}
                    {!collapsedNav && isActive && !isDocuments && (
                      <span className="ml-auto w-2 h-2 bg-white rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Group Separator */}
            {groupIndex < navigationGroups.length - 1 && (
              <div className="my-4 border-t border-gray-800 mx-3" />
            )}
          </div>
        ))}
      </nav>

      {/* Nested Folder Tree - Scrollable Area */}
      {!collapsedNav && isDocumentsExpanded && projectId && (
        <div className="flex-1 overflow-hidden border-t border-gray-800/50">
          <DocumentFolderTree
            projectId={projectId}
            documents={documents}
          />
        </div>
      )}

      {/* Footer Info */}
      {!collapsedNav && (
        <div className="p-4 border-t border-gray-800 flex-shrink-0">
          <p className="text-xs text-gray-500">
            {activeCards.length} / 3 cards open
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Ctrl/Cmd+Click to add cards
          </p>
        </div>
      )}
    </aside>
  );
}
