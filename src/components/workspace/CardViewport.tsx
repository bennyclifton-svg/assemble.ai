'use client';

import { useWorkspaceStore } from '@/stores/workspaceStore';
import { CardType } from '@prisma/client';
import { X } from 'lucide-react';
import { PlanCard } from '@/components/cards/PlanCard';

// Placeholder component for cards (will be replaced with actual card components in future stories)
function CardPlaceholder({ type, projectId }: { type: CardType; projectId: string }) {
  const { closeCard } = useWorkspaceStore();

  // Return actual PlanCard if type is PLAN
  if (type === CardType.PLAN) {
    return <PlanCard projectId={projectId} onClose={() => closeCard(type)} />;
  }

  // Otherwise return placeholder for other cards
  const cardLabels: Record<CardType, string> = {
    [CardType.PLAN]: 'Plan Card',
    [CardType.SCHEME_DESIGN]: 'Scheme Design Card',
    [CardType.DETAIL_DESIGN]: 'Detail Design Card',
    [CardType.PROCURE]: 'Procure Card',
    [CardType.DELIVER]: 'Deliver Card',
    [CardType.CONSULTANT]: 'Consultant Card',
    [CardType.CONTRACTOR]: 'Contractor Card',
    [CardType.DOCUMENTS]: 'Documents Card',
    [CardType.COST_PLANNING]: 'Cost Planning Card',
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200 last:border-r-0">
      {/* Card Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">{cardLabels[type]}</h2>
        <button
          onClick={() => closeCard(type)}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700"
          aria-label={`Close ${cardLabels[type]}`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Card Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-2xl">
          <p className="text-gray-600 mb-4">
            This is a placeholder for the {cardLabels[type]}.
          </p>
          <p className="text-sm text-gray-500">
            The full card implementation will be added in subsequent stories.
          </p>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Card Type:</strong> {type}
            </p>
            <p className="text-sm text-blue-800 mt-2">
              This card will eventually contain sections and items for managing project data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CardViewportProps {
  projectId?: string;
}

export function CardViewport({ projectId = 'demo' }: CardViewportProps) {
  const { activeCards } = useWorkspaceStore();

  if (activeCards.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">No cards open</p>
          <p className="text-gray-400 text-sm">
            Select a card from the navigation to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {activeCards.map((cardType) => (
        <div
          key={cardType}
          className="flex-1 transition-all duration-300 ease-in-out"
          style={{
            width: `${100 / activeCards.length}%`,
            minWidth: 0, // Allow flex shrinking
          }}
        >
          <CardPlaceholder type={cardType} projectId={projectId} />
        </div>
      ))}
    </div>
  );
}
