/**
 * Type definitions for tender package generation
 * Story 4.2: AI Tender Package Generation
 */

export interface DocumentScheduleItem {
  id: string;
  name: string;
  path: string;
  version?: string;
  relevantSections?: string[];
}

export interface DocumentSchedule {
  categoryName: string;
  documents: DocumentScheduleItem[];
}

export interface TenderSectionContent {
  sectionName: string;
  content: string;
  sourceCardType: 'PLAN' | 'CONSULTANT' | 'CONTRACTOR';
  sourceSectionId?: string;
}

export interface GeneratedTenderContent {
  introduction: string;
  projectOverview: string;
  scopeOfWork: string;
  deliverables: string;
  timeline: string;
  submissionRequirements: string;
  sections: TenderSectionContent[];
}

export interface TenderGenerationParams {
  configId: string;
  firmId: string;
  userId: string;
}

export interface TenderGenerationResult {
  tenderPackageId: string;
  generatedContent: GeneratedTenderContent;
  documentSchedule: DocumentSchedule[];
  generationTimeMs: number;
  aiModel: string;
}

export interface TenderGenerationProgress {
  stage: 'aggregating' | 'generating' | 'formatting' | 'saving' | 'complete';
  message: string;
  progress: number; // 0-100
}
