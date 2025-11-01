/**
 * Tender Package Generator Service
 * Story 4.2: AI Tender Package Generation
 *
 * Generates comprehensive, project-specific tender packages using GPT-4 Turbo.
 * Target: < 30 seconds generation time (AC #5)
 */

import { prisma } from '@/lib/prisma';
import { openai } from '@/lib/ai/openai';
import {
  TENDER_PACKAGE_SYSTEM_PROMPT,
  buildTenderPrompt,
  type TenderPromptContext,
} from '@/lib/ai/tenderGeneratorPrompts';
import type {
  TenderGenerationParams,
  TenderGenerationResult,
  GeneratedTenderContent,
  DocumentSchedule,
  TenderSectionContent,
} from '@/types/tender';

// Use GPT-4 Turbo for speed (AC #5: < 30s)
const TENDER_GENERATION_MODEL = 'gpt-4-turbo';
const AI_TIMEOUT_MS = 25000; // 25s to leave buffer for DB operations

/**
 * Generate a complete tender package with AI
 * Orchestrates data aggregation, AI generation, and storage
 */
export async function generateTenderPackage(
  params: TenderGenerationParams
): Promise<TenderGenerationResult> {
  const startTime = Date.now();

  try {
    // Step 1: Aggregate data from Plan Card, Consultant/Contractor Card, Firm, Documents
    const context = await aggregateTenderContext(params.configId, params.firmId);

    // Step 2: Generate tender content using AI (parallel calls for speed)
    const generatedContent = await generateTenderContent(context);

    // Step 3: Build document schedule (references only, not file copies)
    const documentSchedule = await buildDocumentSchedule(params.configId);

    // Step 4: Save to database
    const tenderPackage = await saveTenderPackage({
      ...params,
      generatedContent,
      documentSchedule,
      generationTimeMs: Date.now() - startTime,
      aiModel: TENDER_GENERATION_MODEL,
    });

    return {
      tenderPackageId: tenderPackage.id,
      generatedContent,
      documentSchedule,
      generationTimeMs: Date.now() - startTime,
      aiModel: TENDER_GENERATION_MODEL,
    };
  } catch (error) {
    console.error('Tender generation failed:', error);
    throw new Error(
      `Failed to generate tender package: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate a tender package without AI (manual assembly)
 * Retrieves selected sections and returns raw content without AI processing
 */
export async function generateTenderPackageManual(
  params: TenderGenerationParams
): Promise<TenderGenerationResult> {
  const startTime = Date.now();

  try {
    // Step 1: Aggregate data from Plan Card, Consultant/Contractor Card, Firm, Documents
    const context = await aggregateTenderContext(params.configId, params.firmId);

    // Step 2: Build content manually (no AI) - just retrieve and format selected sections
    const generatedContent = buildManualTenderContent(context);

    // Step 3: Build document schedule (references only, not file copies)
    const documentSchedule = await buildDocumentSchedule(params.configId);

    // Step 4: Save to database
    const tenderPackage = await saveTenderPackage({
      ...params,
      generatedContent,
      documentSchedule,
      generationTimeMs: Date.now() - startTime,
      aiModel: 'manual', // No AI used
    });

    return {
      tenderPackageId: tenderPackage.id,
      generatedContent,
      documentSchedule,
      generationTimeMs: Date.now() - startTime,
      aiModel: 'manual',
    };
  } catch (error) {
    console.error('Manual tender generation failed:', error);
    throw new Error(
      `Failed to generate tender package manually: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Aggregate all data needed for tender generation
 * Gathers from Plan Card, Consultant/Contractor Card, Firm details, and Documents
 */
async function aggregateTenderContext(
  configId: string,
  firmId: string
): Promise<TenderPromptContext> {
  // Fetch tender package config
  const config = await prisma.tenderPackageConfig.findUnique({
    where: { id: configId },
  });

  if (!config) {
    throw new Error(`Tender package config not found: ${configId}`);
  }

  // Fetch firm details
  const firm = await prisma.firm.findUnique({
    where: { id: firmId },
  });

  if (!firm) {
    throw new Error(`Firm not found: ${firmId}`);
  }

  // Determine card ID (consultant or contractor)
  const cardId = config.consultantCardId || config.contractorCardId;
  if (!cardId) {
    throw new Error('Config must have either consultantCardId or contractorCardId');
  }

  const selectedCardSections = (config.selectedCardSections as string[]) || [];
  const selectedPlanSections = (config.selectedPlanSections as string[]) || [];

  console.log('🔧 [aggregateTenderContext] Config loaded:', {
    configId,
    cardId,
    cardType: config.consultantCardId ? 'CONSULTANT' : 'CONTRACTOR',
    selectedCardSectionIds: selectedCardSections,
    selectedPlanSectionIds: selectedPlanSections,
  });

  // Fetch the discipline/trade card with sections
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      sections: {
        where: {
          id: {
            in: selectedCardSections,
          },
        },
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
      project: true,
    },
  });

  if (!card) {
    throw new Error(`Card not found: ${cardId}`);
  }

  console.log('📦 [aggregateTenderContext] Card sections fetched:', {
    cardId: card.id,
    cardType: card.type,
    totalSectionsFetched: card.sections.length,
    sectionNames: card.sections.map((s) => ({ id: s.id, name: s.name })),
  });

  // Fetch Plan card with selected sections
  const planCard = await prisma.card.findFirst({
    where: {
      projectId: card.projectId,
      type: 'PLAN',
    },
    include: {
      sections: {
        where: {
          id: {
            in: selectedPlanSections,
          },
        },
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  console.log('📋 [aggregateTenderContext] Plan card sections fetched:', {
    planCardId: planCard?.id,
    totalSectionsFetched: planCard?.sections.length || 0,
    sectionNames: planCard?.sections.map((s) => ({ id: s.id, name: s.name })) || [],
  });

  // Helper: Get item data (handles both direct properties and nested 'data' field)
  // Items from the database have label/value/name directly on the item object
  const parseItemData = (item: any) => {
    // If item already has label/value/name properties, return it directly
    if (item.label !== undefined || item.value !== undefined || item.name !== undefined) {
      return item;
    }

    // Otherwise, try to parse nested 'data' field (legacy format)
    if (!item.data) return null;
    if (typeof item.data === 'string') {
      try {
        return JSON.parse(item.data);
      } catch {
        return item.data;
      }
    }
    return item.data;
  };

  // Helper: Extract a specific field value by label from a structured section
  const extractFieldValue = (sectionName: string, sections: any[], labelToFind: string): string | undefined => {
    const section = sections.find((s) => s.name.toLowerCase() === sectionName.toLowerCase());
    if (!section) return undefined;

    for (const item of section.items) {
      const data = parseItemData(item);
      if (!data) continue;

      // Handle label/value pair structure
      if (data.label === labelToFind) {
        const value = data.value;
        if (value === null || value === undefined || value === '') return undefined;
        return value.toString();
      }
    }

    return undefined;
  };

  // Helper: Extract all label/value pairs from a structured section with formatting
  const extractStructuredSection = (sectionName: string, sections: any[]): string | undefined => {
    const section = sections.find((s) => s.name.toLowerCase() === sectionName.toLowerCase());
    if (!section) return undefined;

    const pairs: string[] = [];

    for (const item of section.items) {
      const data = parseItemData(item);
      if (!data) continue;

      // Handle label/value pair structure
      if (data.label && (data.value !== null && data.value !== undefined && data.value !== '')) {
        pairs.push(`**${data.label}:** ${data.value}`);
      }
    }

    return pairs.length > 0 ? pairs.join('\n') : undefined;
  };

  // Helper: Extract list items (for Staging section which uses 'name' property)
  const extractListSection = (sectionName: string, sections: any[]): string | undefined => {
    const section = sections.find((s) => s.name.toLowerCase() === sectionName.toLowerCase());
    if (!section) return undefined;

    const items: string[] = [];

    for (let i = 0; i < section.items.length; i++) {
      const item = section.items[i];
      const data = parseItemData(item);
      if (!data) continue;

      // Try 'name' property first (used by Staging), then 'value'
      const content = data.name || data.value;
      if (content) {
        items.push(`${i + 1}. ${content}`);
      }
    }

    return items.length > 0 ? items.join('\n') : undefined;
  };

  // Helper: Extract table/fee structure section with formatting
  const extractTableSection = (sectionName: string, sections: any[]): string | undefined => {
    const section = sections.find((s) => s.name.toLowerCase() === sectionName.toLowerCase());
    if (!section) return undefined;

    const lines: string[] = [];

    for (const item of section.items) {
      const data = parseItemData(item);
      if (!data) continue;

      // Handle category vs item types
      if (data.type === 'category') {
        lines.push(`\n**${data.description || data.name}**`);
      } else if (data.description || data.name) {
        lines.push(`  - ${data.description || data.name}`);
      }
    }

    return lines.length > 0 ? lines.join('\n').trim() : undefined;
  };

  const cardSections = card.sections || [];
  const planSections = planCard?.sections || [];

  // Debug: Log what we received from database
  console.log('🔍 DEBUG: Plan Card Sections from DB:', JSON.stringify(planSections, null, 2));
  console.log('🔍 DEBUG: Config selectedPlanSections:', config.selectedPlanSections);

  // Query DisciplineData for Scope and Deliverables (these are NOT in Section/Item structure)
  let disciplineScope: string | undefined;
  let disciplineDeliverables: string | undefined;

  if (card.type === 'CONSULTANT') {
    const disciplineData = await prisma.disciplineData.findUnique({
      where: {
        projectId_disciplineId: {
          projectId: card.projectId,
          disciplineId: cardId,
        },
      },
      select: {
        scope: true,
        deliverables: true,
      },
    });

    disciplineScope = disciplineData?.scope || undefined;
    disciplineDeliverables = disciplineData?.deliverables || undefined;
  }

  // Build context object with comprehensive extraction
  const context: TenderPromptContext = {
    // Basic project info
    projectName: card.project.name,
    firmName: firm.entity,
    firmEntity: firm.entity,
    discipline: card.type === 'CONSULTANT' ? cardId : undefined,
    trade: card.type === 'CONTRACTOR' ? cardId : undefined,

    // From Plan Card - Details Section (structured, extract individual fields)
    address: extractFieldValue('Details', planSections, 'Address'),
    legalAddress: extractFieldValue('Details', planSections, 'Legal Address'),
    zoning: extractFieldValue('Details', planSections, 'Zoning'),
    jurisdiction: extractFieldValue('Details', planSections, 'Jurisdiction'),
    lotArea: extractFieldValue('Details', planSections, 'Lot Area'),
    numberOfStories: extractFieldValue('Details', planSections, 'Number of Stories'),
    buildingClass: extractFieldValue('Details', planSections, 'Building Class'),

    // From Plan Card - Objectives Section (structured, extract with labels)
    projectObjectives: extractStructuredSection('Objectives', planSections),

    // From Plan Card - Staging Section (list format)
    staging: extractListSection('Staging', planSections),

    // From Plan Card - Risk Section (structured, extract with labels)
    risks: extractStructuredSection('Risk', planSections),

    // From DisciplineData table (for Consultant cards)
    scope: disciplineScope,
    deliverables: disciplineDeliverables,

    // From Consultant/Contractor Card - Fee Structure (table format)
    feeStructure: extractTableSection('Fee Structure', cardSections),
  };

  // Debug: Log extracted context - ALL fields
  console.log('📦 DEBUG: Extracted Context (ALL FIELDS):', {
    projectName: context.projectName,
    address: context.address,
    legalAddress: context.legalAddress,
    zoning: context.zoning,
    jurisdiction: context.jurisdiction,
    lotArea: context.lotArea,
    numberOfStories: context.numberOfStories,
    buildingClass: context.buildingClass,
    projectObjectives: context.projectObjectives,
    staging: context.staging,
    risks: context.risks,
    scope: context.scope,
    deliverables: context.deliverables,
    feeStructure: context.feeStructure,
  });

  return context;
}

/**
 * Generate tender content using AI
 * Uses GPT-4 Turbo with parallel calls for speed
 */
async function generateTenderContent(
  context: TenderPromptContext
): Promise<GeneratedTenderContent> {
  // Generate all sections in parallel for speed (AC #5: < 30s)
  const [introduction, projectOverview, scopeOfWork, deliverables, timeline, submissionRequirements] =
    await Promise.all([
      generateSection('introduction', context),
      generateSection('overview', context),
      generateSection('scope', context),
      generateSection('deliverables', context),
      generateSection('timeline', context),
      generateSection('submission', context),
    ]);

  return {
    introduction,
    projectOverview,
    scopeOfWork,
    deliverables,
    timeline,
    submissionRequirements,
    sections: [],
  };
}

/**
 * Generate a single tender section using AI
 */
async function generateSection(
  section: 'introduction' | 'overview' | 'scope' | 'deliverables' | 'timeline' | 'submission',
  context: TenderPromptContext
): Promise<string> {
  const userPrompt = buildTenderPrompt(section, context);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const completion = await openai.chat.completions.create(
      {
        model: TENDER_GENERATION_MODEL,
        messages: [
          { role: 'system', content: TENDER_PACKAGE_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7, // Balance creativity with consistency
        max_tokens: 1500, // Reasonable length per section
      },
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error(`No content generated for section: ${section}`);
    }

    return content.trim();
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`AI generation timeout for section: ${section}`);
    }

    throw error;
  }
}

/**
 * Build tender content manually without AI
 * Simply retrieves and formats selected sections from cards
 */
function buildManualTenderContent(context: TenderPromptContext): GeneratedTenderContent {
  console.log('📝 [buildManualTenderContent] Building manual content with context:', {
    hasAddress: !!context.address,
    hasObjectives: !!context.projectObjectives,
    hasStaging: !!context.staging,
    hasRisks: !!context.risks,
    hasScope: !!context.scope,
    hasDeliverables: !!context.deliverables,
    hasFeeStructure: !!context.feeStructure,
  });

  // SECTION 1: DETAILS (Clean, no JSON formatting)
  const detailsContent = [
    context.projectName && `Project Name: ${context.projectName}`,
    context.address && `Address: ${context.address}`,
    context.legalAddress && `Legal Address: ${context.legalAddress}`,
    context.zoning && `Zoning: ${context.zoning}`,
    context.jurisdiction && `Jurisdiction: ${context.jurisdiction}`,
    context.lotArea && `Lot Area: ${context.lotArea}`,
    context.numberOfStories && `Number of Stories: ${context.numberOfStories}`,
    context.buildingClass && `Building Class: ${context.buildingClass}`,
  ]
    .filter(Boolean)
    .join('\n');

  // SECTION 2: OBJECTIVES (Clean, no JSON formatting)
  // Remove markdown bold (**) formatting from the content
  const objectivesContent = context.projectObjectives
    ? context.projectObjectives.replace(/\*\*/g, '') // Remove ** markdown
    : '';

  // SECTION 3: STAGING (Preserve even if empty)
  const stagingContent = context.staging || '';

  // SECTION 4: RISK (Clean, no JSON formatting)
  // Remove markdown bold (**) formatting from the content
  const riskContent = context.risks
    ? context.risks.replace(/\*\*/g, '') // Remove ** markdown
    : '';

  // SECTION 5: SCOPE OF WORK (from DisciplineData)
  const scopeOfWork = context.scope || '';

  // SECTION 6: DELIVERABLES (from DisciplineData)
  const deliverables = context.deliverables || '';

  // SECTION 7: FEE STRUCTURE (Clean, no markdown headers)
  const feeStructureContent = context.feeStructure || '';

  // Build the properly ordered sections
  // Per requirements: Details, Objectives, Staging, Risk, Scope, Deliverables, Fee Structure
  // Document Schedule is handled separately, not part of generatedContent

  // Introduction: Use actual project information instead of generic text
  const introduction = objectivesContent
    ? `${context.projectName}\nFor: ${context.firmName}\n\n${objectivesContent.split('\n')[0]}` // First line of objectives as intro
    : `${context.projectName}\nFor: ${context.firmName}`;

  // Project Overview: Combines Details, Objectives, Staging, and Risk in proper order
  const projectOverviewSections = [];

  if (detailsContent) {
    projectOverviewSections.push(detailsContent);
  }

  if (objectivesContent) {
    projectOverviewSections.push(`Objectives:\n${objectivesContent}`);
  }

  if (stagingContent) {
    projectOverviewSections.push(`Staging:\n${stagingContent}`);
  }

  if (riskContent) {
    projectOverviewSections.push(`Risk:\n${riskContent}`);
  }

  const projectOverview = projectOverviewSections.length > 0
    ? projectOverviewSections.join('\n\n')
    : '';

  // Timeline is actually the Staging content
  const timeline = stagingContent;

  // Submission requirements (from Tender Release section if available)
  const submissionRequirements = context.tenderRelease || '';

  // Add Fee Structure to sections array as a proper TenderSectionContent
  const sections: TenderSectionContent[] = [];

  if (feeStructureContent) {
    sections.push({
      sectionName: 'Fee Structure',
      content: feeStructureContent,
      sourceCardType: 'CONSULTANT',
    });
  }

  console.log('✅ [buildManualTenderContent] Manual content built (cleaned):', {
    hasIntroduction: !!introduction,
    hasProjectOverview: !!projectOverview,
    hasScope: !!scopeOfWork,
    hasDeliverables: !!deliverables,
    hasTimeline: !!timeline,
    hasSubmissionReq: !!submissionRequirements,
    hasFeeStructure: !!feeStructureContent,
  });

  return {
    introduction,
    projectOverview,
    scopeOfWork,
    deliverables,
    timeline,
    submissionRequirements,
    sections,
  };
}

/**
 * Build document schedule (references only, not file copies)
 * AC #4: Document schedule created (not actual document copies)
 */
async function buildDocumentSchedule(configId: string): Promise<DocumentSchedule[]> {
  // Fetch all documents associated with this tender package config
  const config = await prisma.tenderPackageConfig.findUnique({
    where: { id: configId },
  });

  if (!config) {
    return [];
  }

  // Determine card ID to get projectId
  const cardId = config.consultantCardId || config.contractorCardId;
  if (!cardId) {
    return [];
  }

  // Fetch the card to get projectId
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: { projectId: true },
  });

  if (!card) {
    return [];
  }

  // Query all documents for this project
  const documents = await prisma.document.findMany({
    where: {
      projectId: card.projectId,
      deletedAt: null,
    },
    orderBy: [
      { path: 'asc' },
      { displayName: 'asc' },
    ],
  });

  // Group documents by category based on path
  // Project Documents: paths starting with specific folders (e.g., "Consultants/", "Contractors/")
  // Reference Documents: other paths
  const projectDocs: typeof documents = [];
  const referenceDocs: typeof documents = [];

  documents.forEach((doc) => {
    // Consider documents in Consultants/, Contractors/, or Project/ as Project Documents
    if (
      doc.path.startsWith('Consultants/') ||
      doc.path.startsWith('Contractors/') ||
      doc.path.startsWith('Project/')
    ) {
      projectDocs.push(doc);
    } else {
      referenceDocs.push(doc);
    }
  });

  // Build schedule structure
  const schedule: DocumentSchedule[] = [];

  if (projectDocs.length > 0) {
    schedule.push({
      categoryName: 'Project Documents',
      documents: projectDocs.map((doc) => ({
        id: doc.id,
        name: doc.displayName,
        path: doc.path,
        version: `v${doc.version}`,
      })),
    });
  }

  if (referenceDocs.length > 0) {
    schedule.push({
      categoryName: 'Reference Documents',
      documents: referenceDocs.map((doc) => ({
        id: doc.id,
        name: doc.displayName,
        path: doc.path,
        version: `v${doc.version}`,
      })),
    });
  }

  return schedule;
}

/**
 * Save generated tender package to database
 */
async function saveTenderPackage(data: {
  configId: string;
  firmId: string;
  userId: string;
  generatedContent: GeneratedTenderContent;
  documentSchedule: DocumentSchedule[];
  generationTimeMs: number;
  aiModel: string;
}): Promise<{ id: string }> {
  const config = await prisma.tenderPackageConfig.findUnique({
    where: { id: data.configId },
  });

  if (!config) {
    throw new Error(`Config not found: ${data.configId}`);
  }

  const tenderPackage = await prisma.tenderPackage.create({
    data: {
      configId: data.configId,
      firmId: data.firmId,
      consultantCardId: config.consultantCardId,
      contractorCardId: config.contractorCardId,
      generatedContent: data.generatedContent as any,
      documentSchedule: data.documentSchedule as any,
      status: 'draft',
      generatedBy: data.userId,
      aiModel: data.aiModel,
      generationTimeMs: data.generationTimeMs,
    },
  });

  return { id: tenderPackage.id };
}
