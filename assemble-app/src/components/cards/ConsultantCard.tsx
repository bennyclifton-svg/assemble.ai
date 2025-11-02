'use client';

import { useState } from 'react';
import { CardPanel } from './CardPanel';
import { Section } from './Section';
import { FirmsSection } from './sections/FirmsSection';
import { ScopeSection } from './sections/ScopeSection';
import { DeliverablesSection } from './sections/DeliverablesSection';
import { FeeStructureSection } from './sections/FeeStructureSection';
import { TenderDocumentSection } from './sections/TenderDocumentSection';
import { TenderPackSection } from './sections/TenderPackSection';
import { RFISection } from './sections/RfiSection';
import { TenderEvaluationSection } from './sections/TenderEvaluationSection';
import { RecommendationReportSection } from './sections/RecommendationReportSection';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { consultantDisciplines } from '@/lib/constants/consultants';
import {
  Briefcase,
  FileText,
  Target,
  DollarSign,
  File,
  Package,
  MessageCircleQuestion,
  BarChart3,
  ClipboardCheck,
} from 'lucide-react';

interface ConsultantCardProps {
  projectId: string;
  onClose: () => void;
}

const consultantCardSections = [
  { id: 'firms', name: 'Firms', icon: Briefcase, order: 1 },
  { id: 'scope', name: 'Scope', icon: FileText, order: 2 },
  { id: 'deliverables', name: 'Deliverables', icon: Target, order: 3 },
  { id: 'fee-structure', name: 'Fee Structure', icon: DollarSign, order: 4 },
  { id: 'tender-document', name: 'Tender Document', icon: File, order: 5 },
  { id: 'tender-pack', name: 'Tender Pack', icon: Package, order: 6 },
  { id: 'rfi-addendum', name: 'Release, RFI, Addendum, Submission', icon: MessageCircleQuestion, order: 7 },
  { id: 'tender-evaluation', name: 'Tender Evaluation', icon: BarChart3, order: 8 },
  { id: 'recommendation-report', name: 'Tender Recommendation Report', icon: ClipboardCheck, order: 9 },
];

export function ConsultantCard({ projectId, onClose }: ConsultantCardProps) {
  const { activeConsultants, toggleSection, isSectionCollapsed } = useWorkspaceStore();

  // Get active consultant disciplines for this project
  const activeDisciplineIds = activeConsultants[projectId] || [];
  const activeDisciplines = consultantDisciplines.filter((d) => activeDisciplineIds.includes(d.id));

  // Tab state - default to first active discipline
  const [activeTab, setActiveTab] = useState<string>(activeDisciplines[0]?.id || '');

  // If no active consultants, show empty state
  if (activeDisciplines.length === 0) {
    return (
      <CardPanel title="Consultant Card" onClose={onClose}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-2">No Consultants Selected</p>
            <p className="text-gray-500 text-sm">
              Toggle consultants in the Plan Card to start managing consultant procurement.
            </p>
          </div>
        </div>
      </CardPanel>
    );
  }

  // Update active tab if current tab becomes inactive
  if (activeTab && !activeDisciplineIds.includes(activeTab) && activeDisciplines.length > 0) {
    setActiveTab(activeDisciplines[0].id);
  }

  const currentDiscipline = consultantDisciplines.find((d) => d.id === activeTab);

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case 'firms':
        return <FirmsSection projectId={projectId} disciplineId={activeTab} />;
      case 'scope':
        return <ScopeSection projectId={projectId} disciplineId={activeTab} />;
      case 'deliverables':
        return <DeliverablesSection projectId={projectId} disciplineId={activeTab} />;
      case 'fee-structure':
        return <FeeStructureSection projectId={projectId} disciplineId={activeTab} />;
      case 'tender-document':
        return <TenderDocumentSection projectId={projectId} disciplineId={activeTab} />;
      case 'tender-pack':
        return <TenderPackSection projectId={projectId} disciplineId={activeTab} />;
      case 'rfi-addendum':
        return <RFISection projectId={projectId} disciplineId={activeTab} />;
      case 'tender-evaluation':
        return <TenderEvaluationSection projectId={projectId} disciplineId={activeTab} />;
      case 'recommendation-report':
        return <RecommendationReportSection projectId={projectId} disciplineId={activeTab} />;
      default:
        return (
          <div className="text-sm text-gray-500">
            <p className="mb-2">This section is coming soon.</p>
            <p className="text-xs text-gray-400">
              Future stories will add functionality to this section.
            </p>
          </div>
        );
    }
  };

  return (
    <CardPanel title="Consultant Card" onClose={onClose}>
      {/* Tab Navigation */}
      {activeDisciplines.length > 1 && (
        <div className="border-b border-gray-200 bg-white">
          <div className="flex overflow-x-auto">
            {activeDisciplines.map((discipline) => (
              <button
                key={discipline.id}
                onClick={() => setActiveTab(discipline.id)}
                className={`
                  px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                  ${
                    activeTab === discipline.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }
                `}
              >
                {discipline.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="divide-y divide-gray-200">
        {consultantCardSections.map((section) => {
          const sectionKey = `consultant-${activeTab}-${section.id}`;
          return (
            <Section
              key={section.id}
              id={sectionKey}
              title={section.name}
              icon={section.icon}
              isCollapsed={isSectionCollapsed(projectId, sectionKey)}
              onToggle={() => toggleSection(projectId, sectionKey)}
            >
              {renderSectionContent(section.id)}
            </Section>
          );
        })}
      </div>
    </CardPanel>
  );
}
