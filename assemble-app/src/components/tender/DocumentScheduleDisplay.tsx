'use client';

import { useWorkspaceStore } from '@/stores/workspaceStore';
import { File, FileText } from 'lucide-react';

interface DocumentScheduleDisplayProps {
  projectId: string;
  disciplineId: string;
}

/**
 * DocumentScheduleDisplay - Display component showing saved document list from Tender Documents section
 *
 * Features:
 * - AC3: Display document schedule retrieved from Tender Documents section
 * - Retrieves saved document list from workspaceStore.savedTenderDocuments
 * - Does NOT allow re-selection (documents selected in Story 2.5/2.6)
 * - Shows read-only list of documents that will be included
 */
export function DocumentScheduleDisplay({ projectId, disciplineId }: DocumentScheduleDisplayProps) {
  const { getSavedTenderDocuments } = useWorkspaceStore();

  // Retrieve saved tender documents for this discipline
  const savedDocumentIds = getSavedTenderDocuments(projectId, disciplineId);

  if (savedDocumentIds.length === 0) {
    return (
      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-3">
          Document Schedule
        </h4>
        <div className="border rounded-lg bg-gray-50 p-6 text-center">
          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">No documents selected</p>
          <p className="text-xs text-gray-500 mt-1">
            Use the Tender Document section to select documents for this discipline
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-md font-semibold text-gray-900 mb-3">
        Document Schedule
      </h4>
      <p className="text-sm text-gray-600 mb-3">
        Documents from Tender Documents section that will be included in tender packages.
      </p>
      <div className="border rounded-lg bg-white">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <span className="text-sm font-medium text-gray-700">
            {savedDocumentIds.length} document{savedDocumentIds.length !== 1 ? 's' : ''} selected
          </span>
        </div>
        <div className="divide-y max-h-64 overflow-y-auto">
          {savedDocumentIds.map((documentId, index) => (
            <div
              key={documentId}
              className="flex items-center gap-3 px-4 py-3"
            >
              <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                Document {index + 1} (ID: {documentId.slice(0, 8)}...)
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        To modify the document list, use the Tender Document section above.
      </p>
    </div>
  );
}
