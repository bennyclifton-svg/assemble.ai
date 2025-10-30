'use client';

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
} from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspaceStore';

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
      { type: CardType.DOCUMENTS, label: 'Documents', icon: Folder },
      { type: CardType.COST_PLANNING, label: 'Cost Planning', icon: Calculator },
    ],
  },
];

export function NavigationSidebar() {
  const { activeCards, collapsedNav, openCard, closeCard, toggleNavigation, canAddCard } =
    useWorkspaceStore();

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
        flex flex-col h-screen bg-gray-900 text-white border-r border-gray-800
        transition-all duration-300 ease-in-out
        ${collapsedNav ? 'w-16' : 'w-60'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
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

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navigationGroups.map((group, groupIndex) => (
          <div key={group.id}>
            {/* Group Items */}
            <div className="px-2 space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeCards.includes(item.type);
                const isDisabled = !isActive && !canAddCard();

                return (
                  <button
                    key={item.type}
                    onClick={(e) => handleCardClick(item.type, e)}
                    onKeyDown={(e) => handleKeyDown(item.type, e)}
                    disabled={isDisabled}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-all duration-200
                      ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }
                      ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                      ${collapsedNav ? 'justify-center' : ''}
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
                      <span className="text-sm font-medium truncate">{item.label}</span>
                    )}
                    {!collapsedNav && isActive && (
                      <span className="ml-auto w-2 h-2 bg-white rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Group Separator */}
            {groupIndex < navigationGroups.length - 1 && (
              <div className="my-4 border-t border-gray-800" />
            )}
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      {!collapsedNav && (
        <div className="p-4 border-t border-gray-800">
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
