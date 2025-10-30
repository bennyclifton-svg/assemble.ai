'use client';

import { useState, useCallback } from 'react';
import { FileUploadWithOverride } from '@/components/ui/FileUploadWithOverride';
import { FilingContext } from '@/services/autoFilerClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FolderOpen, FileCheck, Upload } from 'lucide-react';

interface ContractorDocumentUploadProps {
  projectId: string;
  trade: string; // e.g., 'Electrical', 'Plumbing'
  sectionName: string; // e.g., 'Tender Release and Submission', 'RFI and Addendum'
  firmName?: string; // Optional firm name for specific firm uploads
  description?: string;
}

/**
 * Contractor Document Upload Component - Integrates FileUploadWithOverride
 * for contractor card document uploads (AC3, AC9)
 *
 * Features:
 * - Auto-files to Contractors/[Trade]/
 * - Detects tender documents (submission, TRR, RFT, addendum)
 * - Manual override capability
 * - "Add to Documents" toggle
 * - Section-aware filing based on upload context
 */
export function ContractorDocumentUpload({
  projectId,
  trade,
  sectionName,
  firmName,
  description,
}: ContractorDocumentUploadProps) {
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [showUploader, setShowUploader] = useState(false);

  // Build filing context for contractor card documents (AC3, AC9)
  const filingContext: FilingContext = {
    uploadLocation: 'contractor_card',
    cardType: 'CONTRACTOR',
    disciplineOrTrade: trade,
    sectionName,
    firmName,
    addToDocuments: true,
  };

  const handleUploadComplete = useCallback((documents: any[]) => {
    setUploadedDocuments((prev) => [...prev, ...documents]);
    setShowUploader(false);
    console.log('Uploaded contractor documents:', documents);
  }, []);

  if (!showUploader) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              {description || 'Upload documents for this contractor trade'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Documents will be auto-filed to Contractors/{trade}/
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            <FolderOpen className="w-3 h-3 mr-1" />
            Contractors/{trade}
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
            Files will be auto-filed to Contractors/{trade}/ (AC3)
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
        <p className="text-xs text-blue-900 font-medium mb-1">Auto-Filing Rules (AC3, AC9):</p>
        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li>Tender submissions → Contractors/{trade}/ (with firm name and number)</li>
          <li>TRR documents → Contractors/{trade}/ (with firm name)</li>
          <li>RFT documents → Contractors/{trade}/ (with trade name)</li>
          <li>Addendum documents → Contractors/{trade}/ (with sequential number)</li>
          <li>General documents → Contractors/{trade}/ (original filename)</li>
        </ul>
        <p className="text-xs text-blue-600 mt-2">
          💡 You can override the filing location if needed
        </p>
      </div>
    </div>
  );
}
