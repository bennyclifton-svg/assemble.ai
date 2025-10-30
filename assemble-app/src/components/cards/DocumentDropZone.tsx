'use client';

import { useState, ReactNode } from 'react';
import { Upload, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { autoPopulateFields } from '@/app/actions/document';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface DocumentDropZoneProps {
  cardId: string;
  sectionName: string;
  onPopulated?: (fields: Record<string, any>) => void;
  children: ReactNode;
  addToDocuments?: boolean;
}

/**
 * Drag-drop zone for AI auto-population from Document Repository
 * AC1, AC2: Documents draggable into card sections
 * AC5: Visual feedback during drag operations
 * AC8: "Add to Documents" toggle
 */
export function DocumentDropZone({
  cardId,
  sectionName,
  onPopulated,
  children,
  addToDocuments = true,
}: DocumentDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [populatedFields, setPopulatedFields] = useState<string[] | null>(null);
  const [addToRepo, setAddToRepo] = useState(addToDocuments);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if dragging contains files or document data
    const hasFiles = e.dataTransfer.types.includes('Files');
    const hasDocumentId = e.dataTransfer.types.includes('application/x-document-id');

    if (hasFiles || hasDocumentId) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    // Only hide overlay if mouse truly left the container
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setIsProcessing(true);

    try {
      // Check if document ID was dragged from repository
      const documentId = e.dataTransfer.getData('application/x-document-id');

      if (documentId) {
        // Use existing processed document from repository
        await processDocumentFromRepository(documentId);
      } else {
        // Handle file drop (upload new document)
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
          await processNewFile(files[0]);
        }
      }
    } catch (error) {
      console.error('Drop handling error:', error);
      alert('Failed to process document');
    } finally {
      setIsProcessing(false);
    }
  };

  const processDocumentFromRepository = async (documentId: string) => {
    const result = await autoPopulateFields(documentId, cardId, sectionName);

    if (result.success && result.data) {
      setPopulatedFields(Object.keys(result.data.fields));
      onPopulated?.(result.data.fields);

      // Show success message
      showSuccessMessage(Object.keys(result.data.fields).length);

      // Clear indicators after 5 seconds
      setTimeout(() => setPopulatedFields(null), 5000);
    } else {
      alert(result.error?.message || 'Failed to populate fields from document');
    }
  };

  const processNewFile = async (file: File) => {
    // TODO: Upload file to S3, add to document queue for processing
    // For now, show message that this feature is coming
    alert(`File upload and auto-filing feature coming soon.\n\nFor now, please:\n1. Upload documents via the Documents page\n2. Wait for processing to complete\n3. Drag processed documents to this section`);
  };

  const showSuccessMessage = (fieldCount: number) => {
    const message = `✓ ${fieldCount} field${fieldCount !== 1 ? 's' : ''} populated from document`;
    // Could use a toast notification here instead of console
    console.log(message);
  };

  return (
    <div
      className="relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay - AC5: Visual feedback */}
      {(isDragOver || isProcessing) && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-95 flex items-center justify-center z-50 border-2 border-dashed border-blue-400 rounded-lg">
          <div className="text-center">
            {isProcessing ? (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-blue-700 font-medium text-lg">Processing document...</p>
                <p className="text-blue-600 text-sm mt-1">Extracting and populating fields</p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <p className="text-blue-700 font-medium text-lg">Drop document to auto-populate</p>
                <p className="text-blue-600 text-sm mt-1">From Document Repository or new file</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Success indicator - AC5: Visual highlight */}
      {populatedFields && populatedFields.length > 0 && (
        <div className="absolute top-2 right-2 z-10 bg-green-100 text-green-700 px-3 py-1.5 rounded-md shadow-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">
            {populatedFields.length} field{populatedFields.length !== 1 ? 's' : ''} populated
          </span>
          <CheckCircle2 className="w-4 h-4" />
        </div>
      )}

      {/* Control bar - AC8: Add to Documents toggle */}
      <div className="mb-3 flex items-center gap-3 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          <span>Drag document here or use AI Generate</span>
        </div>
        <label className="flex items-center gap-2 ml-auto">
          <Checkbox
            checked={addToRepo}
            onCheckedChange={(checked) => setAddToRepo(!!checked)}
          />
          <span className="text-xs">Add to Documents</span>
        </label>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
