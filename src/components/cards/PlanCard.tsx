'use client';

import { CardPanel } from './CardPanel';
import { Section } from './Section';
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

export function PlanCard({ projectId, onClose }: PlanCardProps) {
  const { toggleSection, isSectionCollapsed } = useWorkspaceStore();

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
            isEmpty={true} // Will be dynamic when we add items
          >
            <div className="text-sm text-gray-500">
              <p>This section will contain:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {section.id === 'details' && (
                  <>
                    <li>Project Name</li>
                    <li>Address</li>
                    <li>Legal Address</li>
                    <li>Zoning</li>
                    <li>Jurisdiction</li>
                    <li>Lot Area</li>
                    <li>Number of Stories</li>
                    <li>Building Class</li>
                  </>
                )}
                {section.id === 'objectives' && (
                  <>
                    <li>Functional objectives</li>
                    <li>Quality objectives</li>
                    <li>Budget objectives</li>
                    <li>Program objectives</li>
                  </>
                )}
                {section.id === 'staging' && (
                  <>
                    <li>Stage 1: Initiation</li>
                    <li>Stage 2: Scheme Design</li>
                    <li>Stage 3: Detail Design</li>
                    <li>Stage 4: Procurement</li>
                    <li>Stage 5: Delivery</li>
                  </>
                )}
                {section.id === 'risk' && (
                  <>
                    <li>Risk items with severity ratings</li>
                    <li>Mitigation strategies</li>
                    <li>Risk tracking over time</li>
                  </>
                )}
                {section.id === 'stakeholders' && (
                  <>
                    <li>Project stakeholder list</li>
                    <li>Contact information</li>
                    <li>Roles and responsibilities</li>
                  </>
                )}
                {section.id === 'consultant-list' && (
                  <>
                    <li>36 consultant disciplines with toggles</li>
                    <li>Status tracking: Brief, Tender, Rec, Award</li>
                    <li>Automatic tab creation in Consultant Card</li>
                  </>
                )}
                {section.id === 'contractor-list' && (
                  <>
                    <li>20 contractor trades with toggles</li>
                    <li>Status tracking: Brief, Tender, Rec, Award</li>
                    <li>Automatic tab creation in Contractor Card</li>
                  </>
                )}
              </ul>
              <p className="mt-3 text-xs text-gray-400">
                Full implementation coming in Stories 1.5-1.8
              </p>
            </div>
          </Section>
        ))}
      </div>
    </CardPanel>
  );
}
