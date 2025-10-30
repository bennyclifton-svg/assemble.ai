'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  File,
  FolderOpen,
  CheckCircle2,
  Edit3,
  Building2,
  Clock,
  ChevronDown,
  ChevronRight,
  Info,
} from 'lucide-react';

interface FilingHistoryPanelProps {
  document: {
    id: string;
    name: string;
    displayName: string;
    path: string;
    metadata?: any;
    createdAt: Date | string;
    createdBy: string;
  };
}

/**
 * Filing History Panel - Displays auto-filing audit trail
 *
 * Shows:
 * - Auto-filing vs manual override status
 * - Filing context used
 * - Firm creation events
 * - Filing decision details
 * - Original filename vs display name
 */
export function FilingHistoryPanel({ document }: FilingHistoryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const metadata = document.metadata || {};
  const isAutoFiled = metadata.autoFiled === true;
  const wasOverridden = metadata.manuallyOverridden === true;
  const filingContext = metadata.filingContext || {};
  const firmId = metadata.firmId;

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUploadLocationLabel = (location: string): string => {
    const labels: Record<string, string> = {
      plan_card: 'Plan Card',
      consultant_card: 'Consultant Card',
      contractor_card: 'Contractor Card',
      document_card: 'Document Card',
      general: 'General Upload',
    };
    return labels[location] || location;
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1">
          <File className="w-5 h-5 text-gray-400" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {document.displayName}
            </h3>
            <p className="text-xs text-gray-500 truncate">{document.path}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={isAutoFiled ? 'default' : wasOverridden ? 'secondary' : 'outline'}
            className="text-xs"
          >
            {isAutoFiled ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Auto-filed
              </>
            ) : wasOverridden ? (
              <>
                <Edit3 className="w-3 h-3 mr-1" />
                Manual Override
              </>
            ) : (
              'Unknown'
            )}
          </Badge>

          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
          {/* Filing Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Filing Status</p>
              <div className="flex items-center gap-2">
                {isAutoFiled ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <Edit3 className="w-4 h-4 text-blue-600" />
                )}
                <p className="text-sm text-gray-900">
                  {isAutoFiled ? 'Automatically Filed' : wasOverridden ? 'Manually Overridden' : 'Uploaded'}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Upload Time</p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-900">{formatDate(document.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* File Names */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">File Naming</p>
            <div className="bg-white border border-gray-200 rounded p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600">Original Filename:</p>
                  <p className="text-sm font-mono text-gray-900">{metadata.originalFileName || document.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600">Display Name:</p>
                  <p className="text-sm font-mono text-gray-900">{document.displayName}</p>
                </div>
              </div>
              {document.displayName !== (metadata.originalFileName || document.name) && (
                <div className="mt-1 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  ✓ Filename was auto-generated based on filing rules
                </div>
              )}
            </div>
          </div>

          {/* Filing Context */}
          {Object.keys(filingContext).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Filing Context</p>
              <div className="bg-white border border-gray-200 rounded p-3 space-y-2">
                {filingContext.uploadLocation && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Upload Location:</span>
                    <Badge variant="outline" className="text-xs">
                      {getUploadLocationLabel(filingContext.uploadLocation)}
                    </Badge>
                  </div>
                )}

                {filingContext.cardType && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Card Type:</span>
                    <Badge variant="secondary" className="text-xs">
                      {filingContext.cardType}
                    </Badge>
                  </div>
                )}

                {filingContext.disciplineOrTrade && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                      {filingContext.cardType === 'CONSULTANT' ? 'Discipline:' : 'Trade:'}
                    </span>
                    <span className="text-sm text-gray-900">{filingContext.disciplineOrTrade}</span>
                  </div>
                )}

                {filingContext.sectionName && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Section:</span>
                    <span className="text-sm text-gray-900">{filingContext.sectionName}</span>
                  </div>
                )}

                {filingContext.firmName && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Firm Name:</span>
                    <span className="text-sm text-gray-900">{filingContext.firmName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Firm Creation Event */}
          {firmId && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Related Actions</p>
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Firm Auto-Created (AC1)</p>
                    <p className="text-xs text-green-700 mt-1">
                      Firm "{filingContext.firmName}" was automatically created in the database during invoice filing.
                    </p>
                    <p className="text-xs text-green-600 mt-1">Firm ID: {firmId}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filing Path */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">Filing Location</p>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">{document.path}</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {isAutoFiled
                      ? 'Auto-filed based on document type and context'
                      : wasOverridden
                      ? 'User manually specified this location'
                      : 'Filed to this location'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Auto-Filing Rules Applied */}
          {isAutoFiled && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Auto-Filing Rules Applied</p>
              <div className="bg-white border border-gray-200 rounded p-3">
                <ul className="text-xs text-gray-700 space-y-1.5 list-disc list-inside">
                  {document.path === 'Invoices' && (
                    <li>Invoice detected → Filed to Invoices/ (AC1)</li>
                  )}
                  {document.path.startsWith('Consultants/') && (
                    <li>Consultant tender document → Filed to {document.path} (AC2)</li>
                  )}
                  {document.path.startsWith('Contractors/') && (
                    <li>Contractor tender document → Filed to {document.path} (AC3)</li>
                  )}
                  {document.path === 'Plan/Misc' && filingContext.uploadLocation === 'plan_card' && (
                    <li>Plan Card upload → Filed to Plan/Misc/ (AC8)</li>
                  )}
                  {document.path === 'Plan/Misc' && !filingContext.uploadLocation && (
                    <li>General/Planning/Cost document → Filed to Plan/Misc/ (AC4-AC6)</li>
                  )}
                  {filingContext.disciplineOrTrade && (
                    <li>Context-aware filing using discipline/trade: {filingContext.disciplineOrTrade} (AC9)</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
