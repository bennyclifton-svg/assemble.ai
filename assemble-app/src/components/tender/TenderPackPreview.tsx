'use client';

import { useSelectionStore } from '@/stores/selectionStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Eye, FileText, Layers, X, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TenderPackPreviewProps {
  projectId: string;
  disciplineId: string;
}

// Section name mappings for display
const PLAN_SECTION_NAMES: Record<string, string> = {
  'details': 'Details',
  'objectives': 'Objectives',
  'staging': 'Staging',
  'risk': 'Risk',
  'stakeholders': 'Stakeholders',
};

const CARD_SECTION_NAMES: Record<string, string> = {
  'scope': 'Scope',
  'deliverables': 'Deliverables',
  'fee-structure': 'Fee Structure',
  'tender-release': 'Tender Release and Submission',
};

/**
 * TenderPackPreview - Preview panel component showing selected sections summary
 *
 * Features:
 * - AC6: Preview of selected components before generation
 * - Shows Plan sections, Card sections, and document schedule (conditionally)
 * - Allows deselecting items from preview
 * - Provides summary count of selected items
 * - Document schedule only displayed when checkbox is checked
 */
export function TenderPackPreview({ projectId, disciplineId }: TenderPackPreviewProps) {
  const { getSelectedSections, toggleSection, getDocumentScheduleSelected, toggleDocumentSchedule } = useSelectionStore();
  const { getSavedTenderDocuments } = useWorkspaceStore();

  const selectedSections = getSelectedSections();
  const documentScheduleSelected = getDocumentScheduleSelected();
  const savedDocumentIds = getSavedTenderDocuments(projectId, disciplineId);

  // Get selected Plan sections
  const selectedPlanSections = Array.from(selectedSections.plan);

  // Get selected Card sections for current discipline
  const selectedCardSections = Array.from(selectedSections.consultant.get(disciplineId) || []);

  // Count includes document schedule only if checked
  const totalSelected = selectedPlanSections.length + selectedCardSections.length + (documentScheduleSelected ? 1 : 0);

  if (totalSelected === 0) {
    return (
      <div className="border rounded-lg bg-gray-50 p-8 text-center">
        <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">No Components Selected</p>
        <p className="text-sm text-gray-500 mt-1">
          Select sections and documents above to preview your tender package configuration
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-gray-700" />
        <h4 className="text-md font-semibold text-gray-900">
          Tender Package Preview
        </h4>
        <span className="ml-auto text-sm text-gray-600">
          {totalSelected} item{totalSelected !== 1 ? 's' : ''} selected
        </span>
      </div>

      <div className="space-y-4">
        {/* Plan Sections */}
        {selectedPlanSections.length > 0 && (
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">
                Plan Card Sections ({selectedPlanSections.length})
              </span>
            </div>
            <div className="divide-y">
              {selectedPlanSections.map((sectionId) => (
                <div
                  key={sectionId}
                  className="flex items-center justify-between px-4 py-2 hover:bg-gray-50"
                >
                  <span className="text-sm text-gray-700">
                    {PLAN_SECTION_NAMES[sectionId] || sectionId}
                  </span>
                  <button
                    onClick={() => toggleSection('plan', '', sectionId)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remove from selection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Card Sections */}
        {selectedCardSections.length > 0 && (
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2">
              <Layers className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">
                Card Sections ({selectedCardSections.length})
              </span>
            </div>
            <div className="divide-y">
              {selectedCardSections.map((sectionId) => (
                <div
                  key={sectionId}
                  className="flex items-center justify-between px-4 py-2 hover:bg-gray-50"
                >
                  <span className="text-sm text-gray-700">
                    {CARD_SECTION_NAMES[sectionId] || sectionId}
                  </span>
                  <button
                    onClick={() => toggleSection('consultant', disciplineId, sectionId)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remove from selection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document Schedule - only shown when checkbox is checked */}
        {documentScheduleSelected && savedDocumentIds.length > 0 && (
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">
                Document Schedule ({savedDocumentIds.length})
              </span>
              <button
                onClick={() => toggleDocumentSchedule()}
                className="ml-auto p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove Document Schedule"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y max-h-64 overflow-y-auto">
              {savedDocumentIds.map((documentId, index) => (
                <div
                  key={documentId}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50"
                >
                  <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Document {index + 1} (ID: {documentId.slice(0, 8)}...)
                  </span>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 bg-gray-50 border-t">
              <p className="text-xs text-gray-500">
                To modify the document list, use the Tender Document section above.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
