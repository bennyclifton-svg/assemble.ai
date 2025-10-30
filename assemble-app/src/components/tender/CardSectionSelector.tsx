'use client';

import { useState, useEffect } from 'react';
import { useSelectionStore } from '@/stores/selectionStore';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CardType } from '@prisma/client';

interface Section {
  id: string;
  name: string;
  order: number;
  items?: Array<{
    id: string;
    type: string;
    data: any;
  }>;
}

interface Card {
  id: string;
  type: CardType;
  sections: Section[];
  discipline?: string; // for consultant cards
  trade?: string; // for contractor cards
}

interface CardSectionSelectorProps {
  projectId: string;
  cards: Card[];
  className?: string;
}

interface SectionCheckboxProps {
  section: Section;
  checked: boolean;
  onChange: () => void;
  showItems?: boolean;
}

function SectionCheckbox({ section, checked, onChange, showItems = false }: SectionCheckboxProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-2 py-1">
      <div className="flex items-center gap-2">
        {showItems && section.items && section.items.length > 0 && (
          <ChevronRight
            className={cn(
              'w-4 h-4 transition-transform cursor-pointer text-gray-500',
              expanded && 'rotate-90'
            )}
            onClick={() => setExpanded(!expanded)}
          />
        )}
        <Checkbox
          id={section.id}
          checked={checked}
          onCheckedChange={onChange}
        />
        <label htmlFor={section.id} className="flex-1 cursor-pointer text-sm">
          {section.name}
          {section.items && section.items.length > 0 && (
            <span className="text-sm text-gray-500 ml-2">({section.items.length} items)</span>
          )}
        </label>
      </div>

      {expanded && showItems && section.items && section.items.length > 0 && (
        <div className="ml-8 space-y-1">
          {section.items.map((item, idx) => {
            const itemData = item.data as any;
            const itemName = itemData?.fieldName || itemData?.name || itemData?.title || `Item ${idx + 1}`;
            return (
              <div key={item.id} className="text-sm text-gray-600">
                • {itemName}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * CardSectionSelector component for selecting card sections for tender packages
 * Supports:
 * - AC3: Plan Card section selection with checkboxes
 * - AC4: Consultant Card section selection (37 disciplines)
 * - AC5: Contractor Card section selection (20 trades)
 */
export function CardSectionSelector({ projectId, cards, className }: CardSectionSelectorProps) {
  const [activeDiscipline, setActiveDiscipline] = useState<string | null>(null);
  const [activeTrade, setActiveTrade] = useState<string | null>(null);

  const store = useSelectionStore();
  const selectedSections = store.getSelectedSections();
  const { toggleSection } = store;

  const planCard = cards.find((c) => c.type === 'PLAN');
  const consultantCards = cards.filter((c) => c.type === 'CONSULTANT');
  const contractorCards = cards.filter((c) => c.type === 'CONTRACTOR');

  // Set initial active tabs
  useEffect(() => {
    if (consultantCards.length > 0 && !activeDiscipline) {
      setActiveDiscipline(consultantCards[0].discipline || null);
    }
    if (contractorCards.length > 0 && !activeTrade) {
      setActiveTrade(contractorCards[0].trade || null);
    }
  }, [consultantCards, contractorCards]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Plan Card Sections (AC3) */}
      {planCard && planCard.sections.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Plan Card Sections</h3>
          <div className="border rounded-lg p-4 bg-white">
            {planCard.sections.map((section) => (
              <SectionCheckbox
                key={section.id}
                section={section}
                checked={selectedSections.plan.has(section.id)}
                onChange={() => toggleSection('plan', '', section.id)}
                showItems={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Consultant Card Sections (AC4) */}
      {consultantCards.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Consultant Card Sections</h3>

          {/* Discipline tabs */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {consultantCards.map((card) => {
              const discipline = card.discipline || card.id;
              const sectionCount = selectedSections.consultant.get(discipline)?.size || 0;

              return (
                <button
                  key={card.id}
                  onClick={() => setActiveDiscipline(discipline)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                    activeDiscipline === discipline
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {discipline}
                  {sectionCount > 0 && (
                    <Badge
                      variant={activeDiscipline === discipline ? 'secondary' : 'default'}
                      className="text-xs"
                    >
                      {sectionCount}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active discipline sections */}
          {consultantCards.map((card) => {
            const discipline = card.discipline || card.id;
            if (activeDiscipline !== discipline) return null;

            return (
              <div key={card.id} className="border rounded-lg p-4 bg-white">
                {card.sections.length === 0 ? (
                  <p className="text-sm text-gray-500">No sections available for this discipline</p>
                ) : (
                  card.sections.map((section) => (
                    <SectionCheckbox
                      key={section.id}
                      section={section}
                      checked={selectedSections.consultant.get(discipline)?.has(section.id) || false}
                      onChange={() => toggleSection('consultant', discipline, section.id)}
                      showItems={true}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Contractor Card Sections (AC5) */}
      {contractorCards.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Contractor Card Sections</h3>

          {/* Trade tabs */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {contractorCards.map((card) => {
              const trade = card.trade || card.id;
              const sectionCount = selectedSections.contractor.get(trade)?.size || 0;

              return (
                <button
                  key={card.id}
                  onClick={() => setActiveTrade(trade)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                    activeTrade === trade
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {trade}
                  {sectionCount > 0 && (
                    <Badge
                      variant={activeTrade === trade ? 'secondary' : 'default'}
                      className="text-xs"
                    >
                      {sectionCount}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active trade sections */}
          {contractorCards.map((card) => {
            const trade = card.trade || card.id;
            if (activeTrade !== trade) return null;

            return (
              <div key={card.id} className="border rounded-lg p-4 bg-white">
                {card.sections.length === 0 ? (
                  <p className="text-sm text-gray-500">No sections available for this trade</p>
                ) : (
                  card.sections.map((section) => (
                    <SectionCheckbox
                      key={section.id}
                      section={section}
                      checked={selectedSections.contractor.get(trade)?.has(section.id) || false}
                      onChange={() => toggleSection('contractor', trade, section.id)}
                      showItems={true}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!planCard && consultantCards.length === 0 && contractorCards.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600 font-medium">No cards available</p>
          <p className="text-gray-500 text-sm mt-1">
            Create Plan, Consultant, or Contractor cards to select sections
          </p>
        </div>
      )}
    </div>
  );
}
