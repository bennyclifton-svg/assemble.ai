'use client';

import { FileText, Calendar, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getDocuments } from '@/app/actions/document';
import { useWorkspaceStore } from '@/stores/workspaceStore';

interface GeneratedTenderContent {
  introduction?: string;
  projectOverview?: string;
  scopeOfWork?: string;
  deliverables?: string;
  timeline?: string;
  submissionRequirements?: string;
  sections?: any[];
}

interface DocumentSchedule {
  categoryName: string;
  documents: Array<{
    id: string;
    name: string;
    path: string;
    version?: string;
  }>;
}

interface TenderPackageData {
  firmId: string;
  firmName: string;
  generatedAt: string;
  generatedContent?: GeneratedTenderContent;
  documentSchedule?: DocumentSchedule[];
  planSections: Array<{
    id: string;
    name: string;
    items: Array<{
      id: string;
      type: string;
      data: any;
      order: number;
    }>;
  }>;
  cardSections: Array<{
    id: string;
    name: string;
    items: Array<{
      id: string;
      type: string;
      data: any;
      order: number;
    }>;
  }>;
  discipline: string | null;
}

interface TenderPackageDisplayProps {
  packageData: TenderPackageData;
  projectId: string;
  disciplineId: string;
  onClose?: () => void;
}

/**
 * TenderPackageDisplay - Shows the generated tender package in a formatted view
 *
 * Features:
 * - Displays firm-specific tender package
 * - Shows all selected Plan and Card sections
 * - Formats content in a professional layout
 * - Expandable sections for easy navigation
 * - Export capabilities (future enhancement)
 */
export function TenderPackageDisplay({ packageData, projectId, disciplineId, onClose }: TenderPackageDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [tenderDocuments, setTenderDocuments] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  // Get saved tender document IDs from workspace store
  const getSavedTenderDocuments = useWorkspaceStore(state => state.getSavedTenderDocuments);

  // Defensive: Ensure required arrays exist
  const planSections = packageData?.planSections || [];
  const cardSections = packageData?.cardSections || [];
  const generatedContent = packageData?.generatedContent;
  const documentSchedule = packageData?.documentSchedule || [];

  // Fetch and filter real document data
  useEffect(() => {
    const fetchTenderDocuments = async () => {
      setIsLoadingDocs(true);
      try {
        // Get saved tender document IDs for this discipline
        const savedDocIds = getSavedTenderDocuments(projectId, disciplineId);

        if (savedDocIds.length === 0) {
          setTenderDocuments([]);
          setIsLoadingDocs(false);
          return;
        }

        // Fetch all documents from database
        const result = await getDocuments(projectId);

        if (result.success && result.data) {
          // Filter to only include saved tender documents
          const filtered = result.data.filter(doc => savedDocIds.includes(doc.id));

          // Process documents to extract folder (tier1/tier2) from path
          const processed = filtered.map(doc => {
            const pathParts = doc.path.split('/');
            const tier1 = pathParts[0] || 'Uncategorized';
            const tier2 = pathParts[1] || '';

            return {
              ...doc,
              tier1,
              tier2,
              folder: tier2 || tier1, // Use tier2 if available, otherwise tier1
            };
          });

          // Sort by folder, then by name
          processed.sort((a, b) => {
            const folderComparison = a.folder.localeCompare(b.folder);
            if (folderComparison !== 0) return folderComparison;
            return (a.displayName || a.name).localeCompare(b.displayName || b.name);
          });

          setTenderDocuments(processed);
        }
      } catch (error) {
        console.error('Error fetching tender documents:', error);
      } finally {
        setIsLoadingDocs(false);
      }
    };

    fetchTenderDocuments();
  }, [projectId, disciplineId, getSavedTenderDocuments]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const renderItemContent = (item: any) => {
    const data = item.data;

    // Handle different item types
    switch (item.type) {
      case 'text':
        return <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.content || data.text || ''}</p>;

      case 'heading':
        return <h4 className="text-md font-semibold text-gray-900">{data.content || data.text || ''}</h4>;

      case 'list':
        return (
          <ul className="list-disc list-inside space-y-1">
            {(data.items || []).map((listItem: string, idx: number) => (
              <li key={idx} className="text-sm text-gray-700">{listItem}</li>
            ))}
          </ul>
        );

      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-gray-50">
                <tr>
                  {(data.headers || []).map((header: string, idx: number) => (
                    <th key={idx} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(data.rows || []).map((row: any[], rowIdx: number) => (
                  <tr key={rowIdx}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-2 text-sm text-gray-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return <p className="text-sm text-gray-500 italic">Content: {JSON.stringify(data)}</p>;
    }
  };

  return (
    <div className="border rounded-lg bg-white shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Tender Package</h2>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span className="font-medium">{packageData.firmName}</span>
              </div>
              {packageData.discipline && (
                <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                  {packageData.discipline}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(packageData.generatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
        {/* AI-Generated Tender Content */}
        {generatedContent && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded"></div>
              <h3 className="text-lg font-semibold text-gray-900">
                {packageData?.aiModel === 'manual' ? 'Tender Package' : 'AI-Generated Tender Package'}
              </h3>
            </div>

            {/* Only show Introduction if it has meaningful content */}
            {generatedContent.introduction && generatedContent.introduction.trim() && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">Introduction</h4>
                <div className="text-sm text-gray-700 whitespace-pre-line">{generatedContent.introduction}</div>
              </div>
            )}

            {/* Project Overview - Contains Details, Objectives, Staging, Risk */}
            {generatedContent.projectOverview && generatedContent.projectOverview.trim() && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Project Overview</h4>
                <div className="text-sm text-gray-700 whitespace-pre-line">{generatedContent.projectOverview}</div>
              </div>
            )}

            {/* Scope of Work */}
            {generatedContent.scopeOfWork && generatedContent.scopeOfWork.trim() && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Scope of Work</h4>
                <div className="text-sm text-gray-700 whitespace-pre-line">{generatedContent.scopeOfWork}</div>
              </div>
            )}

            {/* Deliverables */}
            {generatedContent.deliverables && generatedContent.deliverables.trim() && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Deliverables</h4>
                <div className="text-sm text-gray-700 whitespace-pre-line">{generatedContent.deliverables}</div>
              </div>
            )}

            {/* Timeline (this is usually the Staging content) */}
            {generatedContent.timeline && generatedContent.timeline.trim() && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Timeline</h4>
                <div className="text-sm text-gray-700 whitespace-pre-line">{generatedContent.timeline}</div>
              </div>
            )}

            {/* Submission Requirements */}
            {generatedContent.submissionRequirements && generatedContent.submissionRequirements.trim() && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Submission Requirements</h4>
                <div className="text-sm text-gray-700 whitespace-pre-line">{generatedContent.submissionRequirements}</div>
              </div>
            )}

            {/* Additional Sections (like Fee Structure) from sections array */}
            {generatedContent.sections && generatedContent.sections.length > 0 && (
              <>
                {generatedContent.sections.map((section, index) => {
                  // Only render if section has content
                  if (!section.content || !section.content.trim()) return null;

                  return (
                    <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">{section.sectionName}</h4>
                      <div className="text-sm text-gray-700 whitespace-pre-line">{section.content}</div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* Document Schedule */}
        {documentSchedule && documentSchedule.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-600 rounded"></div>
              <h3 className="text-lg font-semibold text-gray-900">Document Schedule</h3>
            </div>
            {documentSchedule.map((category, categoryIndex) => (
              <div key={categoryIndex} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {category.categoryName && (
                  <div className="bg-gray-50 px-4 py-2 border-b">
                    <h4 className="font-medium text-gray-900">{category.categoryName}</h4>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-2 font-medium text-gray-900">Document Name</th>
                        <th className="text-left p-2 font-medium text-gray-900">Path</th>
                        <th className="text-left p-2 font-medium text-gray-900 w-20">Version</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {category.documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="p-2 text-sm text-gray-900 font-medium">
                            {doc.name}
                          </td>
                          <td className="p-2 text-sm text-gray-600">
                            {doc.path}
                          </td>
                          <td className="p-2 whitespace-nowrap text-sm text-gray-600">
                            v{doc.version || '1.0'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fallback: Display tender documents from workspace if no document schedule */}
        {!documentSchedule?.length && !isLoadingDocs && tenderDocuments.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-600 rounded"></div>
              <h3 className="text-lg font-semibold text-gray-900">Document Schedule</h3>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead className="bg-gray-50 sticky top-0 z-10 border-b">
                    <tr>
                      <th className="text-left p-2 font-medium text-gray-900 w-32">Folder</th>
                      <th className="text-left p-2 font-medium text-gray-900">Name</th>
                      <th className="text-left p-2 font-medium text-gray-900">Description</th>
                      <th className="text-left p-2 font-medium text-gray-900 w-20">Revision</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tenderDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="p-2 text-sm text-gray-600">
                          {doc.folder}
                        </td>
                        <td className="p-2 text-sm text-gray-900 font-medium">
                          {doc.displayName || doc.name}
                        </td>
                        <td className="p-2 text-sm text-gray-600">
                          {doc.path}
                        </td>
                        <td className="p-2 whitespace-nowrap text-sm text-gray-600">
                          v{doc.version || 1}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {!documentSchedule?.length && isLoadingDocs && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-600 rounded"></div>
              <h3 className="text-lg font-semibold text-gray-900">Document Schedule</h3>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-500">Loading tender documents...</p>
            </div>
          </div>
        )}

        {/* Card Sections (Consultant/Contractor specific) */}
        {cardSections.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {packageData.discipline || 'Discipline'} Requirements
            </h3>
            <div className="space-y-2">
              {cardSections.map((section) => {
                const isExpanded = expandedSections.has(section.id);
                return (
                  <div key={section.id} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{section.name}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-4 py-3 space-y-3 bg-white">
                        {section.items.map((item) => (
                          <div key={item.id} className="border-l-2 border-indigo-200 pl-3">
                            {renderItemContent(item)}
                          </div>
                        ))}
                        {section.items.length === 0 && (
                          <p className="text-sm text-gray-500 italic">No content available</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!generatedContent && cardSections.length === 0 && documentSchedule.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No content available for this tender package</p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {planSections.length + cardSections.length} section(s) included
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Export PDF
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            Send to Firm
          </button>
        </div>
      </div>
    </div>
  );
}
