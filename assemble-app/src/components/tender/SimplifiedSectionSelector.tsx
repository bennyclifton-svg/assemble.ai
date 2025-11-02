'use client';

import { useEffect } from 'react';
import { useSelectionStore } from '@/stores/selectionStore';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { CardType } from '@prisma/client';

interface Section {
  id: string;
  name: string;
  order: number;
}

interface Card {
  id: string;
  type: CardType;
  sections: Section[];
  discipline?: string;
  trade?: string;
}

interface SimplifiedSectionSelectorProps {
  projectId: string;
  cards: Card[];
  className?: string;
}

// Helper function to get display name for sections
const getDisplayName = (name: string): string => {
  // Capitalize first letter if it's lowercase
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1);
};

/**
 * SimplifiedSectionSelector - Clean two-column section selection for Tender Pack
 *
 * Features:
 * - Column 1: Plan Card sections (Details, Objectives, Staging, Risk)
 * - Column 2: Consultant Card sections (Scope, Deliverables, Fee Structure, Tender Document, Tender Release) + Document Schedule
 * - No item counts, no nested content, no tabs
 * - Single discipline only (current context)
 * - Simple checkbox + label layout
 */
export function SimplifiedSectionSelector({
  projectId,
  cards,
  className,
}: SimplifiedSectionSelectorProps) {
  const store = useSelectionStore();
  const selectedSections = store.getSelectedSections();
  const selectedPlanSections = store.selectedPlanSections; // Get global Plan sections
  const { toggleSection, getDocumentScheduleSelected, toggleDocumentSchedule } = store;
  const documentScheduleSelected = getDocumentScheduleSelected();

  const planCard = cards.find((c) => c.type === 'PLAN');
  const consultantCards = cards.filter((c) => c.type === 'CONSULTANT');

  console.log('🎨 SimplifiedSectionSelector - Received cards:', cards);
  console.log('📦 Plan Card:', planCard);
  console.log('👥 Consultant Cards:', consultantCards);

  // Get the first consultant card (current context only)
  const consultantCard = consultantCards.length > 0 ? consultantCards[0] : null;
  const currentDiscipline = consultantCard?.discipline || consultantCard?.id || '';

  console.log('✨ Selected Consultant Card:', consultantCard);
  console.log('🆔 Current Discipline:', currentDiscipline);

  // Get ALL Plan sections (sorted by order) - with deduplication by name
  const planSectionsRaw = planCard?.sections.sort((a, b) => a.order - b.order) || [];

  // IMPORTANT: Case-insensitive deduplication required to prevent duplicates
  // The database may contain sections with different casing (e.g., 'Details' vs 'details')
  // due to seed data using title case while init functions use lowercase.
  // This deduplication keeps the first occurrence of each unique section name.
  // DO NOT REMOVE: This prevents the duplication bug from reoccurring.
  const seenNames = new Set<string>();
  const planSections = planSectionsRaw.filter((section) => {
    const normalizedName = section.name.toLowerCase();
    if (seenNames.has(normalizedName)) {
      return false;
    }
    seenNames.add(normalizedName);
    return true;
  });

  console.log('📊 Plan Card Sections (all sections shown):', planSections);

  // Get ALL Consultant sections (sorted by order) - NO FILTERING
  const consultantSections = consultantCard?.sections?.sort((a, b) => a.order - b.order) || [];

  console.log('📋 Consultant Card Sections (all sections shown):', consultantSections);

  return (
    <div className={cn('space-y-6', className)}>
      <p className="text-sm text-gray-600">
        Select which sections to include in tender packages. This configuration applies to all firms in this discipline.
      </p>

      {/* Two-Column Grid */}
      <div className="grid grid-cols-2 gap-8">
        {/* Column 1: Plan Card Sections */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4">Plan Card Sections</h4>
          <div className="border rounded-lg p-4 bg-white space-y-3">
            {planSections.length === 0 ? (
              <p className="text-sm text-gray-500">No Plan sections available</p>
            ) : (
              planSections.map((section) => {
                const isSelected = selectedPlanSections.has(section.id);
                return (
                  <div key={section.id} className="flex items-center gap-3">
                    <Checkbox
                      id={`plan-${section.id}`}
                      checked={isSelected}
                      onCheckedChange={() => toggleSection('plan', '', section.id)}
                    />
                    <label
                      htmlFor={`plan-${section.id}`}
                      className="text-sm font-medium text-gray-900 cursor-pointer flex-1"
                    >
                      {getDisplayName(section.name)}
                    </label>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Consultant Card Sections + Document Schedule */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4">Consultant Card Sections</h4>
          <div className="border rounded-lg p-4 bg-white space-y-3">
            {consultantSections.length === 0 ? (
              <p className="text-sm text-gray-500">No Consultant sections available</p>
            ) : (
              <>
                {consultantSections
                  .filter((section) => section.name !== 'Tender Document') // Hide Tender Document (it's for upload, not content)
                  .map((section) => {
                    const isSelected =
                      selectedSections.consultant.get(currentDiscipline)?.has(section.id) || false;
                    return (
                      <div key={section.id} className="flex items-center gap-3">
                        <Checkbox
                          id={`consultant-${section.id}`}
                          checked={isSelected}
                          onCheckedChange={() =>
                            toggleSection('consultant', currentDiscipline, section.id)
                          }
                        />
                        <label
                          htmlFor={`consultant-${section.id}`}
                          className="text-sm font-medium text-gray-900 cursor-pointer flex-1"
                        >
                          {getDisplayName(section.name)}
                        </label>
                      </div>
                    );
                  })}

                {/* Document Schedule at bottom of Column 2 */}
                <div className="pt-3 mt-3 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="document-schedule"
                      checked={documentScheduleSelected}
                      onCheckedChange={() => toggleDocumentSchedule()}
                    />
                    <label
                      htmlFor="document-schedule"
                      className="text-sm font-medium text-gray-900 cursor-pointer flex-1"
                    >
                      Document Schedule
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {!planCard && consultantCards.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600 font-medium">No cards available</p>
          <p className="text-gray-500 text-sm mt-1">
            Create Plan and Consultant cards to configure tender packages
          </p>
        </div>
      )}
    </div>
  );
}
