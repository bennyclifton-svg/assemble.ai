'use client';

import { useState } from 'react';
import { FileUploadWithOverride } from '@/components/ui/FileUploadWithOverride';
import { FilingContext } from '@/services/autoFilerClient';
import { Badge } from '@/components/ui/badge';

export default function TestUploadPage({ params }: { params: { id: string } }) {
  const [selectedContext, setSelectedContext] = useState<'invoice' | 'consultant' | 'contractor' | 'plan' | 'general'>('invoice');
  const [firmName, setFirmName] = useState('Test Construction Co');

  // Different contexts for testing different ACs
  const getContext = (): FilingContext => {
    switch (selectedContext) {
      case 'invoice':
        return {
          uploadLocation: 'general',
          firmName,
          addToDocuments: true,
        };
      case 'consultant':
        return {
          uploadLocation: 'consultant_card',
          cardType: 'CONSULTANT',
          disciplineOrTrade: 'Architecture',
          firmName: 'Architects Inc',
          sectionName: 'Tender Release and Submission',
          addToDocuments: true,
        };
      case 'contractor':
        return {
          uploadLocation: 'contractor_card',
          cardType: 'CONTRACTOR',
          disciplineOrTrade: 'Electrical',
          firmName: 'Sparky Electric',
          sectionName: 'Tender Submission',
          addToDocuments: true,
        };
      case 'plan':
        return {
          uploadLocation: 'plan_card',
          sectionName: 'Project Documents',
          addToDocuments: true,
        };
      case 'general':
      default:
        return {
          uploadLocation: 'general',
          addToDocuments: true,
        };
    }
  };

  const acInfo: Record<string, { ac: string; expected: string }> = {
    invoice: {
      ac: 'AC1',
      expected: `Invoices/${firmName}_Invoice_001.PDF`,
    },
    consultant: {
      ac: 'AC2, AC9',
      expected: 'Consultants/Architecture/Architects Inc_Submission_01.PDF',
    },
    contractor: {
      ac: 'AC3, AC9',
      expected: 'Contractors/Electrical/Sparky Electric_Submission_01.PDF',
    },
    plan: {
      ac: 'AC8',
      expected: 'Plan/Misc/[filename]',
    },
    general: {
      ac: 'AC6',
      expected: 'Plan/Misc/[filename]',
    },
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📄 Document Filing Automation Test Page
        </h1>
        <p className="text-gray-600">
          Test Story 2.6 auto-filing functionality with different upload contexts
        </p>
        <Badge variant="outline" className="mt-2">
          Project ID: {params.id}
        </Badge>
      </div>

      {/* Context Selector */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          1. Select Upload Context
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Context Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Context Type:
            </label>
            <select
              value={selectedContext}
              onChange={(e) => setSelectedContext(e.target.value as any)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="invoice">🧾 Invoice Upload (AC1)</option>
              <option value="consultant">👨‍💼 Consultant Card (AC2, AC9)</option>
              <option value="contractor">👷 Contractor Card (AC3, AC9)</option>
              <option value="plan">📋 Plan Card (AC8)</option>
              <option value="general">📁 General Upload (AC6)</option>
            </select>
          </div>

          {/* Firm Name Input (for invoice context) */}
          {selectedContext === 'invoice' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Firm Name:
              </label>
              <input
                type="text"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter firm name"
              />
            </div>
          )}
        </div>

        {/* Current Context Display */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Testing: {acInfo[selectedContext].ac}</Badge>
            <span className="text-sm text-gray-600">
              Expected Path: <code className="bg-white px-2 py-0.5 rounded">{acInfo[selectedContext].expected}</code>
            </span>
          </div>

          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              Show Context JSON
            </summary>
            <pre className="mt-2 p-3 bg-white rounded text-xs overflow-auto border">
              {JSON.stringify(getContext(), null, 2)}
            </pre>
          </details>
        </div>
      </div>

      {/* Upload Component */}
      <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          2. Upload Test Files
        </h2>

        <FileUploadWithOverride
          projectId={params.id}
          context={getContext()}
          onUploadComplete={(docs) => {
            console.log('✅ Upload complete:', docs);
            alert(
              `✅ Successfully uploaded ${docs.length} document(s)!\n\n` +
              `Check:\n` +
              `- Console for details\n` +
              `- Prisma Studio for database records\n` +
              `- Path: ${docs[0]?.path}\n` +
              `- Display Name: ${docs[0]?.displayName}`
            );
          }}
        />
      </div>

      {/* Testing Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Files Location */}
        <div className="p-6 bg-green-50 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            📂 Test Files Location
          </h3>
          <p className="text-sm text-green-800 mb-2">
            Upload files from:
          </p>
          <code className="block p-2 bg-white rounded text-xs text-green-900 mb-3">
            D:\assemble.ai\test-files\
          </code>
          <p className="text-sm text-green-800">
            Files are organized by AC in folders:
          </p>
          <ul className="text-xs text-green-700 mt-2 space-y-1 list-disc list-inside">
            <li>AC1-Invoice/</li>
            <li>AC2-Consultant/</li>
            <li>AC3-Contractor/</li>
            <li>AC4-Planning/</li>
            <li>AC5-Cost/</li>
            <li>AC6-General/</li>
          </ul>
        </div>

        {/* Testing Steps */}
        <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
            ✅ Testing Steps
          </h3>
          <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
            <li>Select context above</li>
            <li>Upload files (drag or click)</li>
            <li>Check path preview is correct</li>
            <li>Try manual override (AC10)</li>
            <li>Verify "Add to Documents" toggle (AC7)</li>
            <li>Upload and check console</li>
            <li>Open Prisma Studio to verify DB</li>
          </ol>
        </div>
      </div>

      {/* Quick Test Scenarios */}
      <div className="mt-6 p-6 bg-purple-50 rounded-lg border border-purple-200">
        <h3 className="font-semibold text-purple-900 mb-3">
          🎯 Quick Test Scenarios (5 min)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-white rounded border border-purple-200">
            <div className="font-medium text-purple-900 mb-1">1. Invoice (AC1)</div>
            <div className="text-xs text-purple-700">
              • Context: Invoice<br />
              • File: invoice_march_2024.pdf<br />
              • Expected: Invoices/{firmName}_Invoice_001.PDF
            </div>
          </div>
          <div className="p-3 bg-white rounded border border-purple-200">
            <div className="font-medium text-purple-900 mb-1">2. Override (AC10)</div>
            <div className="text-xs text-purple-700">
              • Context: Any<br />
              • File: random_document.pdf<br />
              • Click Override, change path<br />
              • Verify custom path works
            </div>
          </div>
          <div className="p-3 bg-white rounded border border-purple-200">
            <div className="font-medium text-purple-900 mb-1">3. Toggle (AC7)</div>
            <div className="text-xs text-purple-700">
              • Context: Any<br />
              • Verify checkbox is ON by default<br />
              • Toggle on/off works
            </div>
          </div>
        </div>
      </div>

      {/* Verification Checklist */}
      <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">
          🔍 Verification Checklist
        </h3>
        <div className="text-sm text-gray-700 space-y-2">
          <div className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" />
            <label>Path preview shows before upload</label>
          </div>
          <div className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" />
            <label>Display name follows naming convention (e.g., FirmName_Invoice_001.PDF)</label>
          </div>
          <div className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" />
            <label>Override buttons appear and work</label>
          </div>
          <div className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" />
            <label>"Add to Documents" checkbox is checked by default</label>
          </div>
          <div className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" />
            <label>Upload completes without errors</label>
          </div>
          <div className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" />
            <label>Prisma Studio shows correct path and displayName</label>
          </div>
          <div className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" />
            <label>Metadata contains filing context</label>
          </div>
          <div className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" />
            <label>For invoices: Firm record created in database</label>
          </div>
        </div>
      </div>

      {/* Help */}
      <div className="mt-6 p-4 bg-blue-100 rounded-lg border border-blue-300">
        <p className="text-sm text-blue-900">
          <strong>💡 Tip:</strong> Open Prisma Studio in another tab to watch documents appear in real-time:
        </p>
        <code className="block mt-2 p-2 bg-white rounded text-xs text-blue-900">
          npx prisma studio
        </code>
        <p className="text-xs text-blue-800 mt-2">
          Then navigate to: Document table → Check path, displayName, metadata fields
        </p>
      </div>
    </div>
  );
}
