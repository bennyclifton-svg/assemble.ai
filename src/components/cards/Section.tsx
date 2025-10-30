'use client';

import { ChevronDown, ChevronRight, LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface SectionProps {
  id: string;
  title: string;
  icon?: LucideIcon;
  isCollapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
  isEmpty?: boolean;
}

export function Section({
  id,
  title,
  icon: Icon,
  isCollapsed,
  onToggle,
  children,
  isEmpty = false,
}: SectionProps) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left"
        aria-expanded={!isCollapsed}
        aria-controls={`section-content-${id}`}
      >
        <div className="flex items-center gap-3">
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
          )}
          {Icon && <Icon className="w-5 h-5 text-gray-600 flex-shrink-0" />}
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        </div>
        {isEmpty && !isCollapsed && (
          <span className="text-sm text-gray-400">Empty</span>
        )}
      </button>

      {/* Section Content */}
      <div
        id={`section-content-${id}`}
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${isCollapsed ? 'max-h-0' : 'max-h-[2000px]'}
        `}
      >
        <div className="px-6 py-4 bg-gray-50/50">
          {children}
        </div>
      </div>
    </div>
  );
}
