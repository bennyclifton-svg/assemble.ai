'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { generateTenderPackage, generateTenderPackageManual } from '@/server/services/tenderGenerator';

export interface TenderSelection {
  documents: string[];
  sections: {
    plan: string[];
    consultant: Record<string, string[]>;
    contractor: Record<string, string[]>;
  };
}

export interface SaveTenderSelectionInput {
  projectId: string;
  tenderPackageId: string;
  selection: TenderSelection;
}

export interface LoadTenderSelectionInput {
  projectId: string;
  tenderPackageId: string;
}

/**
 * Save tender package selections (documents and sections) to the database
 * Supports AC8: Persist selections to database
 *
 * @param input - Contains projectId, tenderPackageId, and selection data
 * @returns Success or error result
 */
export async function saveTenderSelection(input: SaveTenderSelectionInput) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { projectId, tenderPackageId, selection } = input;

    // Start a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // 1. Clear existing document selections for this tender package
      await tx.tenderPackageDocument.deleteMany({
        where: { tenderPackageId },
      });

      // 2. Clear existing section selections for this tender package
      await tx.tenderPackageSection.deleteMany({
        where: { tenderPackageId },
      });

      // 3. Insert new document selections
      if (selection.documents.length > 0) {
        await tx.tenderPackageDocument.createMany({
          data: selection.documents.map((documentId, index) => ({
            tenderPackageId,
            documentId,
            order: index,
            createdBy: userId,
          })),
        });
      }

      // 4. Insert new section selections
      const sectionInserts: Array<{
        tenderPackageId: string;
        sectionId: string;
        cardType: string;
        discipline: string | null;
        createdBy: string;
      }> = [];

      // Plan card sections
      selection.sections.plan.forEach((sectionId) => {
        sectionInserts.push({
          tenderPackageId,
          sectionId,
          cardType: 'PLAN',
          discipline: null,
          createdBy: userId,
        });
      });

      // Consultant card sections (by discipline)
      Object.entries(selection.sections.consultant).forEach(([discipline, sectionIds]) => {
        sectionIds.forEach((sectionId) => {
          sectionInserts.push({
            tenderPackageId,
            sectionId,
            cardType: 'CONSULTANT',
            discipline,
            createdBy: userId,
          });
        });
      });

      // Contractor card sections (by trade)
      Object.entries(selection.sections.contractor).forEach(([trade, sectionIds]) => {
        sectionIds.forEach((sectionId) => {
          sectionInserts.push({
            tenderPackageId,
            sectionId,
            cardType: 'CONTRACTOR',
            discipline: trade,
            createdBy: userId,
          });
        });
      });

      // Insert all section selections
      if (sectionInserts.length > 0) {
        await tx.tenderPackageSection.createMany({
          data: sectionInserts,
        });
      }
    });

    // Revalidate paths that might display this data
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/tender/${tenderPackageId}`);

    return { success: true };
  } catch (error) {
    console.error('Error saving tender selection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save tender selection',
    };
  }
}

/**
 * Load tender package selections from the database
 * Supports AC9: Restore selections from database
 *
 * @param input - Contains projectId and tenderPackageId
 * @returns Selection data or error
 */
export async function loadTenderSelection(input: LoadTenderSelectionInput) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { tenderPackageId } = input;

    // Fetch document selections
    const documentSelections = await prisma.tenderPackageDocument.findMany({
      where: { tenderPackageId },
      orderBy: { order: 'asc' },
      select: { documentId: true },
    });

    // Fetch section selections
    const sectionSelections = await prisma.tenderPackageSection.findMany({
      where: { tenderPackageId },
      select: {
        sectionId: true,
        cardType: true,
        discipline: true,
      },
    });

    // Transform section selections into the expected format
    const selection: TenderSelection = {
      documents: documentSelections.map((d) => d.documentId),
      sections: {
        plan: [],
        consultant: {},
        contractor: {},
      },
    };

    sectionSelections.forEach((s) => {
      if (s.cardType === 'PLAN') {
        selection.sections.plan.push(s.sectionId);
      } else if (s.cardType === 'CONSULTANT' && s.discipline) {
        if (!selection.sections.consultant[s.discipline]) {
          selection.sections.consultant[s.discipline] = [];
        }
        selection.sections.consultant[s.discipline].push(s.sectionId);
      } else if (s.cardType === 'CONTRACTOR' && s.discipline) {
        if (!selection.sections.contractor[s.discipline]) {
          selection.sections.contractor[s.discipline] = [];
        }
        selection.sections.contractor[s.discipline].push(s.sectionId);
      }
    });

    return { success: true, data: selection };
  } catch (error) {
    console.error('Error loading tender selection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load tender selection',
    };
  }
}

/**
 * Save tender package configuration for a discipline/trade
 * Story 4.1: Persist tender package configuration to database
 *
 * @param consultantCardId - Consultant card ID (or null)
 * @param contractorCardId - Contractor card ID (or null)
 * @param selectedPlanSections - Array of Plan card section IDs
 * @param selectedCardSections - Array of Card section IDs
 * @returns Success or error result
 */
export async function saveTenderPackageConfig(input: {
  consultantCardId?: string;
  contractorCardId?: string;
  selectedPlanSections: string[];
  selectedCardSections: string[];
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { consultantCardId, contractorCardId, selectedPlanSections, selectedCardSections } = input;

    // Use upsert to create or update configuration
    const config = await prisma.tenderPackageConfig.upsert({
      where: consultantCardId
        ? { consultantCardId }
        : contractorCardId
        ? { contractorCardId }
        : { id: 'dummy-id-that-wont-exist' }, // Force create if neither ID provided
      update: {
        selectedPlanSections,
        selectedCardSections,
        updatedBy: userId,
      },
      create: {
        consultantCardId: consultantCardId || null,
        contractorCardId: contractorCardId || null,
        selectedPlanSections,
        selectedCardSections,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return { success: true, data: config };
  } catch (error) {
    console.error('Error saving tender package config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save tender package config',
    };
  }
}

/**
 * Load tender package configuration for a discipline/trade
 * Story 4.1: Retrieve saved tender package configuration from database
 *
 * @param consultantCardId - Consultant card ID (or null)
 * @param contractorCardId - Contractor card ID (or null)
 * @returns Configuration data or null if not found
 */
export async function loadTenderPackageConfig(input: {
  consultantCardId?: string;
  contractorCardId?: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { consultantCardId, contractorCardId } = input;

    const config = await prisma.tenderPackageConfig.findFirst({
      where: consultantCardId
        ? { consultantCardId }
        : contractorCardId
        ? { contractorCardId }
        : undefined,
    });

    return { success: true, data: config };
  } catch (error) {
    console.error('Error loading tender package config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load tender package config',
    };
  }
}

/**
 * Generate tender package for a specific firm (Legacy - Story 4.1)
 * Story 4.1: Assembles tender package content based on selected sections
 *
 * @deprecated Use generateTenderPackageWithAI for AI-powered generation (Story 4.2)
 * @param projectId - Project ID
 * @param disciplineId - Discipline/Card ID
 * @param firmId - Firm ID to generate for
 * @returns Generated tender package data with all sections and documents
 */
export async function generateTenderPackageAction(input: {
  projectId: string;
  disciplineId: string;
  firmId: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { projectId, disciplineId, firmId } = input;

    // Get the firm details
    const firm = await prisma.firm.findFirst({
      where: {
        id: firmId,
        projectId,
      },
    });

    if (!firm) {
      return { success: false, error: 'Firm not found' };
    }

    // Get the card (consultant card)
    const card = await prisma.card.findFirst({
      where: {
        id: disciplineId,
        projectId,
      },
      select: {
        id: true,
        type: true,
      },
    });

    if (!card) {
      return { success: false, error: 'Card not found' };
    }

    // Get the Plan card for this project
    const planCard = await prisma.card.findFirst({
      where: {
        projectId,
        type: 'PLAN',
      },
      include: {
        sections: {
          include: {
            items: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    // Get sections for the consultant/contractor card
    const disciplineCard = await prisma.card.findUnique({
      where: { id: disciplineId },
      include: {
        sections: {
          include: {
            items: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    // Simulate AI-powered assembly (for now, just return the structure)
    // In a real implementation, this would:
    // 1. Apply AI to personalize content for the firm
    // 2. Generate custom introductions/summaries
    // 3. Format content into professional tender document structure

    return {
      success: true,
      data: {
        firmId: firm.id,
        firmName: firm.entity,
        generatedAt: new Date().toISOString(),
        planSections: planCard?.sections || [],
        cardSections: disciplineCard?.sections || [],
      },
    };
  } catch (error) {
    console.error('Error generating tender package:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate tender package',
    };
  }
}

/**
 * Get document register/transmittal for a tender package (AC8, AC11, AC14)
 * Returns a formatted list of selected documents and section content
 * WITHOUT copying files to a new directory (document IDs only)
 *
 * @param tenderPackageId - The tender package ID
 * @returns Document register data
 */
export async function getDocumentRegister(tenderPackageId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Fetch selected documents with full details
    const documents = await prisma.tenderPackageDocument.findMany({
      where: { tenderPackageId },
      orderBy: { order: 'asc' },
      include: {
        document: {
          select: {
            id: true,
            name: true,
            displayName: true,
            path: true,
            size: true,
            url: true,
            tags: true,
          },
        },
      },
    });

    // Fetch selected sections with items
    const sections = await prisma.tenderPackageSection.findMany({
      where: { tenderPackageId },
      include: {
        section: {
          include: {
            items: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                type: true,
                data: true,
                order: true,
              },
            },
            card: {
              select: {
                id: true,
                type: true,
              },
            },
          },
        },
      },
    });

    // Format the document register/transmittal (matches DocumentCard table format per AC8)
    const documentRegister = documents.map((tpDoc, index) => ({
      number: index + 1,
      id: tpDoc.document.id,
      name: tpDoc.document.displayName || tpDoc.document.name,
      filename: tpDoc.document.name,
      path: tpDoc.document.path,
      size: tpDoc.document.size,
      url: tpDoc.document.url,
      tags: tpDoc.document.tags,
      includeInSchedule: tpDoc.includeInSchedule,
    }));

    // Format the section content (AC10)
    const sectionContent = sections.map((tpSection) => ({
      sectionId: tpSection.sectionId,
      sectionName: tpSection.section.name,
      cardType: tpSection.cardType,
      discipline: tpSection.discipline,
      items: tpSection.section.items.map((item) => ({
        id: item.id,
        type: item.type,
        data: item.data,
        order: item.order,
      })),
    }));

    return {
      success: true,
      data: {
        documents: documentRegister,
        sections: sectionContent,
      },
    };
  } catch (error) {
    console.error('Error getting document register:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get document register',
    };
  }
}

/**
 * Generate AI-powered tender package (Story 4.2)
 * Uses GPT-4 Turbo to generate sharp, project-specific tender content
 *
 * AC #1: AI compiles selected components into coherent package
 * AC #2: Generates sharp, focused content (not generic templates)
 * AC #3: Package includes all selected sections with appropriate formatting
 * AC #4: Document schedule created (not actual document copies)
 * AC #5: Generation completes in < 30 seconds
 *
 * @param configId - Tender package configuration ID
 * @param firmId - Firm ID to generate tender for
 * @returns Generated tender package ID or error
 */
export async function generateTenderPackageWithAI(input: {
  configId: string;
  firmId: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { configId, firmId } = input;

    // Validate inputs
    if (!configId || !firmId) {
      return { success: false, error: 'Missing required parameters: configId and firmId' };
    }

    // Generate tender package using AI service
    const result = await generateTenderPackage({
      configId,
      firmId,
      userId,
    });

    // Revalidate relevant paths
    revalidatePath(`/tender/${result.tenderPackageId}`);

    return {
      success: true,
      data: {
        tenderPackageId: result.tenderPackageId,
        generationTimeMs: result.generationTimeMs,
        aiModel: result.aiModel,
      },
    };
  } catch (error) {
    console.error('Error generating AI tender package:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate tender package',
    };
  }
}

/**
 * Generate tender package without AI (manual assembly)
 * Retrieves selected sections and returns raw content without AI processing
 *
 * @param configId - Tender package configuration ID
 * @param firmId - Firm ID to generate tender for
 * @returns Generated tender package ID or error
 */
export async function generateTenderPackageWithoutAI(input: {
  configId: string;
  firmId: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { configId, firmId } = input;

    // Validate inputs
    if (!configId || !firmId) {
      return { success: false, error: 'Missing required parameters: configId and firmId' };
    }

    // Validate that config has selections before generation
    const config = await prisma.tenderPackageConfig.findUnique({
      where: { id: configId },
      select: {
        id: true,
        selectedPlanSections: true,
        selectedCardSections: true,
      },
    });

    if (!config) {
      return { success: false, error: 'Tender package configuration not found' };
    }

    const planSections = (config.selectedPlanSections as string[]) || [];
    const cardSections = (config.selectedCardSections as string[]) || [];

    console.log('🔍 Generating tender package WITHOUT AI:', {
      configId,
      firmId,
      planSectionsCount: planSections.length,
      cardSectionsCount: cardSections.length,
      planSectionIds: planSections,
      cardSectionIds: cardSections,
    });

    // Warning if no sections selected (but allow it - maybe they only want document schedule)
    if (planSections.length === 0 && cardSections.length === 0) {
      console.warn('⚠️ No sections selected in config - tender package may be empty');
    }

    // Generate tender package manually (no AI)
    const result = await generateTenderPackageManual({
      configId,
      firmId,
      userId,
    });

    // Revalidate relevant paths
    revalidatePath(`/tender/${result.tenderPackageId}`);

    return {
      success: true,
      data: {
        tenderPackageId: result.tenderPackageId,
        generationTimeMs: result.generationTimeMs,
        aiModel: result.aiModel,
      },
    };
  } catch (error) {
    console.error('Error generating manual tender package:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate tender package manually',
    };
  }
}

/**
 * Fetch complete tender package data for display
 * Retrieves the tender package with all sections and their items
 *
 * @param tenderPackageId - The ID of the tender package to fetch
 * @returns Complete tender package data ready for display
 */
export async function getTenderPackageForDisplay(tenderPackageId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Fetch tender package with config
    const tenderPackage = await prisma.tenderPackage.findUnique({
      where: { id: tenderPackageId },
      include: {
        config: {
          select: {
            consultantCardId: true,
            contractorCardId: true,
            selectedPlanSections: true,
            selectedCardSections: true,
          },
        },
      },
    });

    if (!tenderPackage) {
      return { success: false, error: 'Tender package not found' };
    }

    // Fetch firm separately (TenderPackage.firmId is not a relation)
    const firm = await prisma.firm.findUnique({
      where: { id: tenderPackage.firmId },
      select: {
        entity: true,
      },
    });

    if (!firm) {
      return { success: false, error: 'Firm not found' };
    }

    const config = tenderPackage.config;
    const cardId = config.consultantCardId || config.contractorCardId;

    if (!cardId) {
      return { success: false, error: 'Invalid tender package configuration' };
    }

    // Fetch the discipline/trade card
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: {
        projectId: true,
        type: true,
      },
    });

    if (!card) {
      return { success: false, error: 'Card not found' };
    }

    // Fetch Plan card sections
    const planSections = await prisma.section.findMany({
      where: {
        cardId: {
          in: await prisma.card
            .findMany({
              where: {
                projectId: card.projectId,
                type: 'PLAN',
              },
              select: { id: true },
            })
            .then((cards) => cards.map((c) => c.id)),
        },
        id: {
          in: (config.selectedPlanSections as string[]) || [],
        },
      },
      include: {
        items: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            type: true,
            data: true,
            order: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    // Fetch Card sections (consultant or contractor)
    const cardSections = await prisma.section.findMany({
      where: {
        cardId: cardId,
        id: {
          in: (config.selectedCardSections as string[]) || [],
        },
      },
      include: {
        items: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            type: true,
            data: true,
            order: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    // Build response in the format expected by TenderPackageDisplay
    return {
      success: true,
      data: {
        firmId: tenderPackage.firmId,
        firmName: firm.entity,
        generatedAt: tenderPackage.createdAt.toISOString(),
        discipline: config.consultantCardId || null,
        generatedContent: tenderPackage.generatedContent as any, // AI-generated content
        documentSchedule: tenderPackage.documentSchedule as any, // Document references
        planSections: planSections.map((section) => ({
          id: section.id,
          name: section.name,
          items: section.items,
        })),
        cardSections: cardSections.map((section) => ({
          id: section.id,
          name: section.name,
          items: section.items,
        })),
      },
    };
  } catch (error) {
    console.error('Error fetching tender package for display:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tender package',
    };
  }
}

/**
 * Get available sections for tender package configuration
 * Fetches real section IDs and names from database for Plan and Consultant/Contractor cards
 *
 * @param projectId - Project ID to fetch sections for
 * @param cardId - Consultant or Contractor card ID to fetch card-specific sections
 * @returns Available Plan sections and Card sections with real database IDs
 */
export async function getAvailableSectionsForTender(input: {
  projectId: string;
  cardId: string; // consultant or contractor card ID
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { projectId, cardId } = input;

    // Fetch Plan card sections
    const planCard = await prisma.card.findFirst({
      where: {
        projectId,
        type: 'PLAN',
      },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Fetch Consultant/Contractor card sections
    const cardSections = await prisma.section.findMany({
      where: {
        cardId: cardId,
      },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
      },
    });

    return {
      success: true,
      data: {
        planSections: planCard?.sections || [],
        cardSections: cardSections || [],
      },
    };
  } catch (error) {
    console.error('Error fetching available sections:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch available sections',
    };
  }
}
