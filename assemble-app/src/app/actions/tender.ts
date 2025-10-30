'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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
