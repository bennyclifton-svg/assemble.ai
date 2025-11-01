'use client';

import { useState, useEffect } from 'react';
import { useSelectionStore } from '@/stores/selectionStore';
import { SimplifiedSectionSelector } from '@/components/tender/SimplifiedSectionSelector';
import { getCardsForTenderSelection } from '@/app/actions/card';
import { getFirmsAction } from '@/app/actions/firm';
import { GenerateTenderButton } from '@/components/tender/GenerateTenderButton';
import { TenderPackageDisplay } from '@/components/tender/TenderPackageDisplay';
import { Package, Loader2 } from 'lucide-react';

interface TenderPackSectionProps {
  projectId: string;
  disciplineId: string;
}

/**
 * TenderPackSection - Simplified tender package assembly interface
 *
 * Workflow:
 * 1. Configure tender package selection once per discipline:
 *    - Two-column layout with simple checkboxes
 *    - Column 1: Plan Card sections (Details, Objectives, Staging, Risk)
 *    - Column 2: Consultant Card sections (Scope, Deliverables, Fee Structure, Tender Document, Tender Release) + Document Schedule
 * 2. Generate AI tender packages:
 *    - Individual "Generate AI Tender Package for [Firm Name]" button for each firm
 *    - Configuration applies to all firms in the discipline
 *    - Each package is personalized per firm details
 *
 * Uses SimplifiedSectionSelector for clean, focused section selection:
 * - Two-column grid layout
 * - Simple checkbox + label (no item counts, no nested previews, no tabs)
 * - Single discipline only (current context)
 */
interface Firm {
  id: string;
  entity: string;
  shortListed: boolean;
}

export function TenderPackSection({ projectId, disciplineId }: TenderPackSectionProps) {
  const [firms, setFirms] = useState<Firm[]>([]);
  const [generatedPackages, setGeneratedPackages] = useState<Map<string, any>>(new Map());
  const [cards, setCards] = useState<any[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [isLoadingFirms, setIsLoadingFirms] = useState(true);

  // Initialize selection context for this discipline
  const { setActiveContext } = useSelectionStore();

  useEffect(() => {
    // Set active context to current discipline for selection isolation
    setActiveContext(disciplineId);
  }, [disciplineId, setActiveContext]);

  // Load cards with sections
  useEffect(() => {
    loadCards();
    loadFirms();
  }, [projectId, disciplineId]);

  const loadCards = async () => {
    setIsLoadingCards(true);
    const result = await getCardsForTenderSelection(projectId);

    if (result.success && result.data) {
      console.log('🔍 ALL Cards from getCardsForTenderSelection:', result.data);
      console.log('🎯 Current disciplineId (discipline string, not card ID):', disciplineId);

      // disciplineId is actually a discipline string like 'architect', not a card ID
      // We need to find which consultant card is being used by firms for this discipline
      // The getCardsForTenderSelection returns consultant cards that have firms
      // Find the FIRST consultant card that has sections (to avoid empty legacy cards)

      const planCard = result.data.find(card => card.type === 'PLAN');
      const consultantCard = result.data.find(
        card => card.type === 'CONSULTANT' && card.sections && card.sections.length > 0
      );

      console.log('🔎 All consultant cards:', result.data.filter(c => c.type === 'CONSULTANT'));
      console.log('✅ Selected consultant card with sections:', consultantCard);

      const filteredCards = [planCard, consultantCard].filter(Boolean);

      console.log('📦 Final Filtered Cards:', filteredCards);
      console.log('👤 Active Consultant Card:', consultantCard);
      console.log('📋 Active Consultant Card Sections:', consultantCard?.sections);

      setCards(filteredCards as typeof result.data);
    } else {
      console.error('Failed to load cards for selection');
    }
    setIsLoadingCards(false);
  };

  const loadFirms = async () => {
    setIsLoadingFirms(true);
    const result = await getFirmsAction(projectId, disciplineId, 'consultant');

    if (result.success && result.data) {
      setFirms(result.data);
    } else {
      console.error('Failed to load firms');
    }
    setIsLoadingFirms(false);
  };

  const handlePackageGenerated = (firmId: string, packageData: any) => {
    setGeneratedPackages((prev) => new Map(prev).set(firmId, packageData));
  };

  const handleClosePackage = (firmId: string) => {
    setGeneratedPackages((prev) => {
      const newMap = new Map(prev);
      newMap.delete(firmId);
      return newMap;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Tender Package Configuration
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure once for all firms in this discipline. Select components to include in tender packages.
        </p>
      </div>

      {/* Section Configuration */}
      <div>
        {isLoadingCards ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-600">Loading sections...</span>
          </div>
        ) : (
          <SimplifiedSectionSelector projectId={projectId} cards={cards} />
        )}
      </div>

      {/* Generate Tender Packages */}
      <div className="border-t pt-6 space-y-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Generate Tender Packages</h4>
          <p className="text-sm text-gray-600 mb-4">
            Click the button for each firm to generate their personalized AI tender package using the configuration above.
          </p>
        </div>

        {isLoadingFirms ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-600">Loading firms...</span>
          </div>
        ) : firms.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-600 font-medium">No firms available</p>
            <p className="text-gray-500 text-sm mt-1">
              Add firms to this discipline to generate tender packages
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {firms.map((firm) => {
              const packageData = generatedPackages.get(firm.id);

              return (
                <div key={firm.id} className="space-y-3">
                  {!packageData && (
                    <GenerateTenderButton
                      projectId={projectId}
                      disciplineId={disciplineId}
                      firmId={firm.id}
                      firmName={firm.entity}
                      onGenerated={(data) => handlePackageGenerated(firm.id, data)}
                    />
                  )}
                  {packageData && (
                    <TenderPackageDisplay
                      packageData={packageData}
                      projectId={projectId}
                      disciplineId={disciplineId}
                      onClose={() => handleClosePackage(firm.id)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
