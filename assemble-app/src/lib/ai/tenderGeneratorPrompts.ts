/**
 * AI prompts for tender package generation
 * Story 4.2: Sharp, project-specific content generation
 */

export interface TenderPromptContext {
  // Basic project info
  projectName?: string;

  // Firm details
  firmName: string;
  firmEntity: string;
  discipline?: string;
  trade?: string;

  // From Plan Card - Details Section (individual fields)
  address?: string;
  legalAddress?: string;
  zoning?: string;
  jurisdiction?: string;
  lotArea?: string;
  numberOfStories?: string;
  buildingClass?: string;

  // From Plan Card - Objectives Section (structured with labels)
  projectObjectives?: string;

  // From Plan Card - Staging Section (list)
  staging?: string;

  // From Plan Card - Risk Section (structured with labels)
  risks?: string;

  // From DisciplineData table (narrative)
  scope?: string;
  deliverables?: string;

  // From Card sections - Fee Structure (table)
  feeStructure?: string;

  // Documents
  documentContext?: string[];

  // Legacy field for tender release info (if needed)
  tenderRelease?: string;
}

export const TENDER_PACKAGE_SYSTEM_PROMPT = `You are an expert construction project manager preparing professional tender packages for consultant and contractor selection.

Your role is to generate sharp, project-specific tender documentation that clearly defines:
1. Project context and requirements
2. Scope of work expectations
3. Deliverables and quality standards
4. Submission requirements and evaluation criteria

CRITICAL REQUIREMENTS:
- Write SHARP, FOCUSED content specific to this project and discipline
- AVOID generic template language like "as per industry standards" or "to be determined"
- Extract and synthesize details from the provided project context
- Use professional construction industry terminology
- Be clear and specific about scope to ensure accountability during delivery
- Focus on what makes THIS project unique

Your output should be professional, concise, and directly applicable to the project at hand.`;

export const INTRODUCTION_PROMPT = `Generate a concise introduction section for this tender package that:
- Welcomes the firm to the tender opportunity
- States the project name, location, and key objectives
- Provides context about the project type and scale
- Sets professional tone without generic pleasantries

Keep it to 2-3 paragraphs maximum. Be specific about THIS project.`;

export const PROJECT_OVERVIEW_PROMPT = `Generate a detailed project overview that:
- Describes the project scope and objectives clearly
- Highlights key project requirements and constraints
- Identifies critical success factors specific to this discipline/trade
- References zoning, staging, or special conditions if applicable

Be specific and detailed. Avoid generic descriptions. Make it clear what makes this project unique.`;

export const SCOPE_OF_WORK_PROMPT = `Generate a comprehensive scope of work section that:
- Clearly defines the consultant/contractor's responsibilities
- Lists specific deliverables and service expectations
- Identifies key phases and milestones
- Specifies coordination requirements with other disciplines
- Addresses site-specific or project-specific requirements

DO NOT use placeholder text. Extract specifics from the provided scope and project context.
If scope details are provided, synthesize and enhance them - don't just repeat them.`;

export const DELIVERABLES_PROMPT = `Generate a detailed deliverables section that:
- Lists all required deliverables by project phase
- Specifies format, quantity, and quality requirements
- Identifies review and approval processes
- Notes any discipline-specific or project-specific deliverables

Be explicit. Avoid vague terms like "standard drawings" - specify WHAT drawings for THIS project.`;

export const TIMELINE_PROMPT = `Generate a timeline and program section that:
- Outlines key project milestones and deadlines
- Identifies critical path activities for this discipline
- Notes coordination dependencies with other disciplines
- Specifies submission deadlines and review periods

Be realistic and specific to the project staging and requirements provided.`;

export const SUBMISSION_REQUIREMENTS_PROMPT = `Generate submission requirements that:
- Lists all required submission documents and formats
- Specifies deadline and submission method
- Outlines evaluation criteria relevant to this discipline
- Notes any pre-qualification requirements or mandatory site visits

Be clear and complete. Ensure bidders know exactly what to submit and when.`;

export function buildTenderPrompt(
  section: 'introduction' | 'overview' | 'scope' | 'deliverables' | 'timeline' | 'submission',
  context: TenderPromptContext
): string {
  const parts: string[] = [];

  // Add context information
  parts.push('=== PROJECT CONTEXT ===');
  parts.push('');

  if (context.projectName) {
    parts.push(`**Project Name:** ${context.projectName}`);
  }

  // Project Details section
  const details: string[] = [];
  if (context.address) details.push(`**Address:** ${context.address}`);
  if (context.legalAddress) details.push(`**Legal Address:** ${context.legalAddress}`);
  if (context.zoning) details.push(`**Zoning:** ${context.zoning}`);
  if (context.jurisdiction) details.push(`**Jurisdiction:** ${context.jurisdiction}`);
  if (context.lotArea) details.push(`**Lot Area:** ${context.lotArea}`);
  if (context.numberOfStories) details.push(`**Number of Stories:** ${context.numberOfStories}`);
  if (context.buildingClass) details.push(`**Building Class:** ${context.buildingClass}`);

  if (details.length > 0) {
    parts.push('');
    parts.push('**Project Details:**');
    parts.push(details.join('\n'));
  }

  parts.push('');
  parts.push(`**Tender For:** ${context.firmName} (${context.firmEntity})`);

  if (context.discipline) {
    parts.push(`**Discipline:** ${context.discipline}`);
  }

  if (context.trade) {
    parts.push(`**Trade:** ${context.trade}`);
  }

  parts.push('');

  if (context.projectObjectives) {
    parts.push('=== PROJECT OBJECTIVES ===');
    parts.push('');
    parts.push(context.projectObjectives);
    parts.push('');
  }

  if (context.staging) {
    parts.push('=== PROJECT STAGING ===');
    parts.push('');
    parts.push(context.staging);
    parts.push('');
  }

  if (context.risks) {
    parts.push('=== PROJECT RISKS ===');
    parts.push('');
    parts.push(context.risks);
    parts.push('');
  }

  if (context.scope) {
    parts.push('=== DISCIPLINE SCOPE ===');
    parts.push('');
    parts.push(context.scope);
    parts.push('');
  }

  if (context.deliverables) {
    parts.push('=== EXPECTED DELIVERABLES ===');
    parts.push('');
    parts.push(context.deliverables);
    parts.push('');
  }

  if (context.feeStructure) {
    parts.push('=== FEE STRUCTURE ===');
    parts.push('');
    parts.push(context.feeStructure);
    parts.push('');
  }

  if (context.documentContext && context.documentContext.length > 0) {
    parts.push('=== ADDITIONAL CONTEXT FROM DOCUMENTS ===');
    parts.push('');
    context.documentContext.forEach((doc) => {
      parts.push(doc);
      parts.push('');
    });
  }

  parts.push('=== TASK ===');
  parts.push('');

  // Add section-specific prompt
  switch (section) {
    case 'introduction':
      parts.push(INTRODUCTION_PROMPT);
      break;
    case 'overview':
      parts.push(PROJECT_OVERVIEW_PROMPT);
      break;
    case 'scope':
      parts.push(SCOPE_OF_WORK_PROMPT);
      break;
    case 'deliverables':
      parts.push(DELIVERABLES_PROMPT);
      break;
    case 'timeline':
      parts.push(TIMELINE_PROMPT);
      break;
    case 'submission':
      parts.push(SUBMISSION_REQUIREMENTS_PROMPT);
      break;
  }

  return parts.join('\n');
}
