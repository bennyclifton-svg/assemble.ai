'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, FileText, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDocuments, autoPopulateFields } from '@/app/actions/document';

interface DocumentSelectorProps {
  projectId: string;
  cardId: string;
  sectionName: string;
  onPopulated?: (fields: Record<string, any>) => void;
  buttonVariant?: 'default' | 'outline' | 'secondary';
  buttonSize?: 'default' | 'sm' | 'lg';
}

/**
 * AI Generate button with document selector dialog
 * AC7: "AI Generate" button provides alternative to drag-drop
 */
export function DocumentSelector({
  projectId,
  cardId,
  sectionName,
  onPopulated,
  buttonVariant = 'default',
  buttonSize = 'default',
}: DocumentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDocuments();
    }
  }, [isOpen]);

  const loadDocuments = async () => {
    setIsLoading(true);
    const result = await getDocuments(projectId);

    if (result.success && result.data) {
      // Filter to only show processed documents
      const processed = result.data.filter(
        (doc: any) => doc.processingStatus === 'completed' && doc.extractedData
      );
      setDocuments(processed);
    }

    setIsLoading(false);
  };

  const handleDocumentSelect = async (documentId: string) => {
    setSelectedDocId(documentId);
    setIsProcessing(true);

    try {
      const result = await autoPopulateFields(documentId, cardId, sectionName);

      if (result.success && result.data) {
        onPopulated?.(result.data.fields);
        setIsOpen(false);

        // Show success message
        const fieldCount = Object.keys(result.data.fields).length;
        console.log(`✓ ${fieldCount} field${fieldCount !== 1 ? 's' : ''} populated from document`);
      } else {
        alert(result.error?.message || 'Failed to populate fields from document');
      }
    } catch (error) {
      console.error('Document processing error:', error);
      alert('Failed to process document');
    } finally {
      setIsProcessing(false);
      setSelectedDocId(null);
    }
  };

  return (
    <>
      {/* AI Generate Button */}
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Sparkles className="w-4 h-4" />
        AI Generate
      </Button>

      {/* Document Selector Dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => !isProcessing && setIsOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Select Document for AI Extraction
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Choose a processed document to auto-populate {sectionName} fields
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                  <p className="text-gray-600">Loading documents...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-gray-900 font-medium">No processed documents found</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Upload documents and wait for AI processing to complete
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => {
                    const isSelected = selectedDocId === doc.id;
                    const isProcessingThis = isProcessing && isSelected;

                    return (
                      <button
                        key={doc.id}
                        onClick={() => !isProcessing && handleDocumentSelect(doc.id)}
                        disabled={isProcessing}
                        className={`
                          w-full p-4 rounded-lg border text-left transition-all
                          ${
                            isProcessingThis
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/50'
                          }
                          ${isProcessing && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <p className="font-medium text-gray-900 truncate">
                                {doc.displayName}
                              </p>
                            </div>
                            <p className="text-sm text-gray-600 truncate">{doc.path || '/'}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(doc.processedAt).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-600" />
                                Processed
                              </span>
                            </div>
                          </div>

                          {isProcessingThis && (
                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
