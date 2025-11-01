'use client';

import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { consultantDisciplines } from '@/lib/constants/consultants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Save, ListChecks, ListX } from 'lucide-react';

interface TenderDocumentSectionProps {
  projectId: string;
  disciplineId: string;
}

/**
 * Tender Document Section - Document Management for Tender Packages
 * Story 2.5: Simplified document selection interface
 *
 * Features:
 * - Document selection from existing repository (NO upload)
 * - Save/Retrieve/Clear document lists
 * - Multi-select support (managed in Documents Card)
 * - Document list persistence per discipline
 */
export function TenderDocumentSection({ projectId, disciplineId }: TenderDocumentSectionProps) {
  const {
    saveTenderDocuments,
    getSavedTenderDocuments,
    clearSavedTenderDocuments,
    setActiveTenderDiscipline
  } = useWorkspaceStore();

  // Get discipline name from ID
  const discipline = consultantDisciplines.find((d) => d.id === disciplineId);
  const disciplineName = discipline?.name || 'General';

  // Set active tender discipline when discipline changes
  useEffect(() => {
    setActiveTenderDiscipline(projectId, disciplineId);
  }, [disciplineId, projectId, setActiveTenderDiscipline]);

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
      {/* Tender Document Selection Header */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-4">Tender Document Selection</h3>
        <p className="text-sm text-gray-600 mb-4">
          Open the Documents Card alongside this card to select documents.
          Use the buttons below to manage your document list for <strong>{disciplineName}</strong>.
        </p>
      </div>

      {/* Document Action Buttons */}
      <div className="grid grid-cols-3 gap-4">
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

      {/* Status Display */}
      <div className="flex items-center gap-6 text-sm py-3 px-4 bg-gray-50 rounded-md border border-gray-200">
        <span className="text-gray-600">
          Currently Selected: <strong className="text-blue-600">{selectedCount}</strong>
        </span>
        <span className="text-gray-600">
          Saved to Tender: <strong className="text-green-600">{savedCount}</strong>
        </span>
      </div>
    </div>
  );
}
