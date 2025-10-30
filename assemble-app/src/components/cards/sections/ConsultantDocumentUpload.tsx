'use client';

import { useState, useCallback } from 'react';
import { FileUploadWithOverride } from '@/components/ui/FileUploadWithOverride';
import { FilingContext } from '@/services/autoFilerClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FolderOpen, FileCheck, Upload } from 'lucide-react';

interface ConsultantDocumentUploadProps {
  projectId: string;
  discipline: string; // e.g., 'Architecture', 'Engineering'
  sectionName: string; // e.g., 'Tender Release and Submission', 'RFI and Addendum'
  firmName?: string; // Optional firm name for specific firm uploads
  description?: string;
}

/**
 * Consultant Document Upload Component - Integrates FileUploadWithOverride
 * for consultant card document uploads (AC2, AC9)
 *
 * Features:
 * - Auto-files to Consultants/[Discipline]/
 * - Detects tender documents (submission, TRR, RFT, addendum)
 * - Manual override capability
 * - "Add to Documents" toggle
 * - Section-aware filing based on upload context
 */
export function ConsultantDocumentUpload({
  projectId,
  discipline,
  sectionName,
  firmName,
  description,
}: ConsultantDocumentUploadProps) {
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [showUploader, setShowUploader] = useState(false);

  // Build filing context for consultant card documents (AC2, AC9)
  const filingContext: FilingContext = {
    uploadLocation: 'consultant_card',
    cardType: 'CONSULTANT',
    disciplineOrTrade: discipline,
    sectionName,
    firmName,
    addToDocuments: true,
  };

  const handleUploadComplete = useCallback((documents: any[]) => {
    setUploadedDocuments((prev) => [...prev, ...documents]);
    setShowUploader(false);
    console.log('Uploaded consultant documents:', documents);
  }, []);

  if (!showUploader) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              {description || 'Upload documents for this consultant discipline'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Documents will be auto-filed to Consultants/{discipline}/
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            <FolderOpen className="w-3 h-3 mr-1" />
            Consultants/{discipline}
          </Badge>
        </div>

        <Button
          onClick={() => setShowUploader(true)}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Documents
        </Button>

        {/* Uploaded documents list */}
        {uploadedDocuments.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-green-600" />
              Uploaded Documents ({uploadedDocuments.length})
            </h4>
            <div className="space-y-2">
              {uploadedDocuments.map((doc, index) => (
                <div
                  key={doc.id || index}
                  className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-md"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.displayName || doc.name}
                    </p>
                    <p className="text-xs text-gray-500">{doc.path}</p>
                    {firmName && (
                      <p className="text-xs text-blue-600">Firm: {firmName}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs ml-2">
                    {doc.metadata?.manuallyOverridden ? 'Custom' : 'Auto-filed'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Upload Documents</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Files will be auto-filed to Consultants/{discipline}/ (AC2)
          </p>
          {firmName && (
            <p className="text-xs text-blue-600 mt-0.5">For firm: {firmName}</p>
          )}
        </div>
        <Button
          onClick={() => setShowUploader(false)}
          variant="ghost"
          size="sm"
        >
          Cancel
        </Button>
      </div>

      {/* File upload with override */}
      <FileUploadWithOverride
        projectId={projectId}
        context={filingContext}
        onUploadComplete={handleUploadComplete}
        maxFiles={10}
      />

      {/* Helper info */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-xs text-blue-900 font-medium mb-1">Auto-Filing Rules (AC2, AC9):</p>
        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li>Tender submissions → Consultants/{discipline}/ (with firm name and number)</li>
          <li>TRR documents → Consultants/{discipline}/ (with firm name)</li>
          <li>RFT documents → Consultants/{discipline}/ (with discipline name)</li>
          <li>Addendum documents → Consultants/{discipline}/ (with sequential number)</li>
          <li>General documents → Consultants/{discipline}/ (original filename)</li>
        </ul>
        <p className="text-xs text-blue-600 mt-2">
          💡 You can override the filing location if needed
        </p>
      </div>
    </div>
  );
}
