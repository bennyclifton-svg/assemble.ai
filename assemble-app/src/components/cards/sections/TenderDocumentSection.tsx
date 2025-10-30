'use client';

import { useState, useEffect } from 'react';
import { CardSectionSelector } from '@/components/tender/CardSectionSelector';
import { useSelectionStore } from '@/stores/selectionStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { getCardsForTenderSelection } from '@/app/actions/card';
import { saveTenderSelection } from '@/app/actions/tender';
import { consultantDisciplines } from '@/lib/constants/consultants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FolderOpen, Save, Loader2, ListChecks, ListX } from 'lucide-react';

interface TenderDocumentSectionProps {
  projectId: string;
  disciplineId: string;
}

/**
 * Tender Document Section - Document and Section Selection for Tender Packages
 * Story 2.5: Allows selection of documents and card sections for tender packages
 *
 * Features:
 * - Document selection from existing repository (NO upload)
 * - Tier 1 folder grouping with collapse/expand
 * - Multi-select (Shift+click, Ctrl+click)
 * - Section selection from Plan, Consultant, and Contractor cards
 * - Selection persistence
 */
export function TenderDocumentSection({ projectId, disciplineId }: TenderDocumentSectionProps) {
  const [cards, setCards] = useState<any[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { setActiveContext, getSelectionForTender, clearSelection } = useSelectionStore();
  const {
    saveTenderDocuments,
    getSavedTenderDocuments,
    clearSavedTenderDocuments,
    setActiveTenderDiscipline
  } = useWorkspaceStore();

  // Get discipline name from ID
  const discipline = consultantDisciplines.find((d) => d.id === disciplineId);
  const disciplineName = discipline?.name || 'General';

  // Set active context and active tender discipline when discipline changes
  useEffect(() => {
    setActiveContext(disciplineId);
    setActiveTenderDiscipline(projectId, disciplineId);
  }, [disciplineId, setActiveContext, projectId, setActiveTenderDiscipline]);

  // Load cards with sections
  useEffect(() => {
    loadCards();
  }, [projectId]);

  const loadCards = async () => {
    setIsLoadingCards(true);
    const result = await getCardsForTenderSelection(projectId);

    if (result.success && result.data) {
      setCards(result.data);
    } else {
      console.error('Failed to load cards for selection');
      setSaveMessage('Error: Failed to load cards for selection');
    }
    setIsLoadingCards(false);
  };

  const handleSaveSelection = async () => {
    setIsSaving(true);

    const selection = getSelectionForTender();

    // For now, we'll create a temporary tender package ID
    // In a real implementation, this would come from a tender package creation flow
    const tempTenderPackageId = `tender-${disciplineId}-${Date.now()}`;

    const result = await saveTenderSelection({
      projectId,
      tenderPackageId: tempTenderPackageId,
      selection,
    });

    if (result.success) {
      const totalSections =
        selection.sections.plan.length +
        Object.values(selection.sections.consultant).flat().length +
        Object.values(selection.sections.contractor).flat().length;
      setSaveMessage(`✓ Saved ${selection.documents.length} documents and ${totalSections} sections`);
      setTimeout(() => setSaveMessage(''), 5000);
    } else {
      setSaveMessage('Error: Failed to save selection');
      setTimeout(() => setSaveMessage(''), 5000);
    }

    setIsSaving(false);
  };

  const handleClearSelection = () => {
    clearSelection();
    setSaveMessage('✓ All selections cleared');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Button 1: Save List - Merge current selection with existing saved list
  const handleSaveList = () => {
    const currentSelected = useWorkspaceStore.getState().getSelectedDocuments(projectId);
    const existingSaved = getSavedTenderDocuments(projectId, disciplineId);

    // Merge: combine existing saved with new selections (remove duplicates)
    const mergedList = Array.from(new Set([...existingSaved, ...currentSelected]));

    // Save to store
    saveTenderDocuments(projectId, disciplineId, mergedList);

    // Clear selections in Documents Card
    useWorkspaceStore.getState().setSelectedDocuments(projectId, []);
  };

  // Button 2: Retrieve List - Load saved documents and select them in Documents Card
  const handleRetrieveList = () => {
    const savedDocs = getSavedTenderDocuments(projectId, disciplineId);

    // Set these as selected in Documents Card
    useWorkspaceStore.getState().setSelectedDocuments(projectId, savedDocs);
  };

  // Button 3: Clear Saved - Clear all saved documents for this discipline
  const handleClearSaved = () => {
    clearSavedTenderDocuments(projectId, disciplineId);

    // Clear selections in Documents Card
    useWorkspaceStore.getState().setSelectedDocuments(projectId, []);
  };

  // Get counts for display
  const savedCount = getSavedTenderDocuments(projectId, disciplineId).length;
  const selectedCount = useWorkspaceStore.getState().getSelectedDocuments(projectId).length;

  return (
    <div className="space-y-6">
      {/* Document Selection Management */}
      <div className="p-6 border border-gray-300 rounded-lg bg-gray-50">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Tender Document Selection</h3>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Button 1: Save List */}
          <Button
            onClick={handleSaveList}
            disabled={selectedCount === 0}
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            Save List
            {selectedCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedCount}
              </Badge>
            )}
          </Button>

          {/* Button 2: Retrieve List */}
          <Button
            onClick={handleRetrieveList}
            variant="outline"
            disabled={savedCount === 0}
            className="w-full text-gray-900 hover:text-gray-900"
          >
            <ListChecks className="w-4 h-4 mr-2" />
            Retrieve List
            {savedCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {savedCount}
              </Badge>
            )}
          </Button>

          {/* Button 3: Clear Saved */}
          <Button
            onClick={handleClearSaved}
            variant="destructive"
            disabled={savedCount === 0}
            className="w-full"
          >
            <ListX className="w-4 h-4 mr-2" />
            Clear Saved
          </Button>
        </div>

        {/* Instructions */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-900 font-medium mb-1">Document Selection Workflow:</p>
          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
            <li>Open Documents Card alongside this card to select documents</li>
            <li><strong>Save List:</strong> Merge selected documents with existing saved list</li>
            <li><strong>Retrieve List:</strong> Load saved documents to review/modify</li>
            <li><strong>Clear Saved:</strong> Remove all saved documents for this discipline</li>
            <li>Saved documents show with green highlighting in Documents Card</li>
          </ul>
        </div>

        {/* Status Display */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              Currently Selected: <strong className="text-blue-600">{selectedCount}</strong>
            </span>
            <span className="text-gray-600">
              Saved to Tender: <strong className="text-green-600">{savedCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Section Selection */}
      <div>
        {isLoadingCards ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <CardSectionSelector projectId={projectId} cards={cards} />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={handleClearSelection}
          size="sm"
        >
          Clear Selection
        </Button>
        <Button
          onClick={handleSaveSelection}
          disabled={isSaving}
          size="sm"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Selection
            </>
          )}
        </Button>
      </div>

      {/* Helper info */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-xs text-blue-900 font-medium mb-1">Section Selection Features:</p>
        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li>Select sections from Plan, Consultant, and Contractor cards</li>
          <li>Section selections are saved and can be used for tender generation</li>
        </ul>
      </div>
    </div>
  );
}
