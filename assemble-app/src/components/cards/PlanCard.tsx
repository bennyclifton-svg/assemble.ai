'use client';

import { CardPanel } from './CardPanel';
import { Section } from './Section';
import { DetailsSection } from './sections/DetailsSection';
import { ObjectivesSection } from './sections/ObjectivesSection';
import { StagingSection } from './sections/StagingSection';
import { RiskSection } from './sections/RiskSection';
import { StakeholdersSection } from './sections/StakeholdersSection';
import { ConsultantListSection } from './sections/ConsultantListSection';
import { ContractorListSection } from './sections/ContractorListSection';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { CardType } from '@prisma/client';
import {
  FileText,
  Target,
  Layers,
  AlertTriangle,
  Users,
  Briefcase,
  HardHat,
} from 'lucide-react';

interface PlanCardProps {
  projectId: string;
  cardId?: string;
  onClose: () => void;
}

const planCardSections = [
  { id: 'details', name: 'Details', icon: FileText, order: 1 },
  { id: 'objectives', name: 'Objectives', icon: Target, order: 2 },
  { id: 'staging', name: 'Staging', icon: Layers, order: 3 },
  { id: 'risk', name: 'Risk', icon: AlertTriangle, order: 4 },
  { id: 'stakeholders', name: 'Stakeholders', icon: Users, order: 5 },
  { id: 'consultant-list', name: 'Consultant List', icon: Briefcase, order: 6 },
  { id: 'contractor-list', name: 'Contractor List', icon: HardHat, order: 7 },
];

export function PlanCard({ projectId, cardId, onClose }: PlanCardProps) {
  const { toggleSection, isSectionCollapsed } = useWorkspaceStore();

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case 'details':
        return <DetailsSection projectId={projectId} />;
      case 'objectives':
        return <ObjectivesSection projectId={projectId} />;
      case 'staging':
        return <StagingSection projectId={projectId} />;
      case 'risk':
        return <RiskSection projectId={projectId} />;
      case 'stakeholders':
        return <StakeholdersSection projectId={projectId} cardId={cardId} />;
      case 'consultant-list':
        return <ConsultantListSection projectId={projectId} />;
      case 'contractor-list':
        return <ContractorListSection projectId={projectId} />;
      default:
        return (
          <div className="text-sm text-gray-500">
            <p className="mb-2">This section is coming soon.</p>
          </div>
        );
    }
  };

  return (
    <CardPanel title="Plan Card" onClose={onClose}>
      <div className="divide-y divide-gray-200">
        {planCardSections.map((section) => (
          <Section
            key={section.id}
            id={section.id}
            title={section.name}
            icon={section.icon}
            isCollapsed={isSectionCollapsed(projectId, section.id)}
            onToggle={() => toggleSection(projectId, section.id)}
            isEmpty={
              section.id !== 'details' &&
              section.id !== 'objectives' &&
              section.id !== 'staging' &&
              section.id !== 'risk' &&
              section.id !== 'stakeholders' &&
              section.id !== 'consultant-list' &&
              section.id !== 'contractor-list'
            }
          >
            {renderSectionContent(section.id)}
          </Section>
        ))}
      </div>
    </CardPanel>
  );
}
