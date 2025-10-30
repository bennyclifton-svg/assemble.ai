'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import type { FeeStructureData, FeeStructureItem } from '@/types/feeStructure';

/**
 * Standard action result type
 */
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code: string } };

/**
 * Get fee structure for a specific discipline (AC 28, 31)
 * Retrieves from database Section/Item storage
 */
export async function getFeeStructure(
  projectId: string,
  disciplineId: string
): Promise<ActionResult<FeeStructureData>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Find the consultant card for this project
    const consultantCard = await prisma.card.findFirst({
      where: {
        projectId,
        type: 'CONSULTANT',
      },
      include: {
        sections: {
          where: {
            name: `fee-structure-${disciplineId}`,
          },
          include: {
            items: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });

    if (!consultantCard || consultantCard.sections.length === 0) {
      // No existing fee structure, return empty
      return {
        success: true,
        data: { items: [] },
      };
    }

    const section = consultantCard.sections[0];

    // Transform items from database to FeeStructureItem format
    const items: FeeStructureItem[] = section.items.map(item => ({
      id: item.id,
      type: (item.data as any).type || 'item',
      description: (item.data as any).description || '',
      quantity: (item.data as any).quantity,
      unit: (item.data as any).unit,
      order: item.order,
      parentId: (item.data as any).parentId,
    }));

    return {
      success: true,
      data: { items },
    };
  } catch (error) {
    console.error('Error fetching fee structure:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch fee structure',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Save fee structure for a specific discipline (AC 28, 31)
 * Stores in database as Section/Item records with JSON data
 */
export async function saveFeeStructure(
  projectId: string,
  disciplineId: string,
  data: FeeStructureData
): Promise<ActionResult<void>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Find or create consultant card
    let consultantCard = await prisma.card.findFirst({
      where: {
        projectId,
        type: 'CONSULTANT',
      },
    });

    if (!consultantCard) {
      consultantCard = await prisma.card.create({
        data: {
          projectId,
          type: 'CONSULTANT',
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }

    // Find or create section for this discipline's fee structure
    const sectionName = `fee-structure-${disciplineId}`;
    let section = await prisma.section.findFirst({
      where: {
        cardId: consultantCard.id,
        name: sectionName,
      },
    });

    if (!section) {
      section = await prisma.section.create({
        data: {
          cardId: consultantCard.id,
          name: sectionName,
          order: 4, // Fee structure is typically 4th section
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }

    // Delete existing items for this section
    await prisma.item.deleteMany({
      where: {
        sectionId: section.id,
      },
    });

    // Create new items
    if (data.items.length > 0) {
      await prisma.item.createMany({
        data: data.items.map(item => ({
          sectionId: section.id,
          order: item.order,
          type: 'fee_structure_item',
          data: {
            id: item.id,
            type: item.type,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            parentId: item.parentId,
          },
          createdBy: userId,
          updatedBy: userId,
        })),
      });
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('Error saving fee structure:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to save fee structure',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Retrieve fee structure from Cost Planning Card (AC 27)
 *
 * Logic:
 * - Determine card type (Consultant or Contractor) from disciplineId
 * - Query Cost Planning Card for appropriate Tier 2 section:
 *   - For Consultant: Query "Consultants" section
 *   - For Contractor: Query "Construction" section
 * - If Cost Planning Card doesn't exist: return null (graceful)
 * - If Tier 2 section doesn't exist: return null (graceful)
 * - Transform Tier 3 items to fee structure format
 */
export async function retrieveFromCostPlanning(
  projectId: string,
  disciplineId: string
): Promise<ActionResult<FeeStructureData>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Determine card type based on disciplineId
    // TODO: Add logic to distinguish consultant vs contractor disciplines
    // For now, assume consultant disciplines
    const isConsultant = true; // This would be determined by checking disciplineId against known lists
    const tier2SectionName = isConsultant ? 'Consultants' : 'Construction';

    // Find Cost Planning Card
    const costPlanningCard = await prisma.card.findFirst({
      where: {
        projectId,
        type: 'COST_PLANNING',
      },
      include: {
        sections: {
          where: {
            name: tier2SectionName,
          },
          include: {
            items: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });

    // Graceful handling: Cost Planning Card doesn't exist
    if (!costPlanningCard) {
      return {
        success: false,
        error: {
          message: 'Cost Planning Card not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Graceful handling: Tier 2 section doesn't exist
    if (costPlanningCard.sections.length === 0) {
      return {
        success: false,
        error: {
          message: `Tier 2 section "${tier2SectionName}" not found in Cost Planning`,
          code: 'SECTION_NOT_FOUND',
        },
      };
    }

    const tier2Section = costPlanningCard.sections[0];

    // Transform Tier 3 items to fee structure format
    const feeStructureItems: FeeStructureItem[] = tier2Section.items.map((item, index) => {
      const itemData = item.data as any;

      // Determine if this is a category or item based on data structure
      const isCategory = itemData.isCategory || itemData.type === 'category';

      return {
        id: `imported-${item.id}`,
        type: isCategory ? 'category' : 'item',
        description: itemData.description || itemData.name || '',
        quantity: itemData.quantity || '',
        unit: itemData.unit || '',
        order: index,
        parentId: itemData.parentId,
      };
    });

    return {
      success: true,
      data: { items: feeStructureItems },
    };
  } catch (error) {
    console.error('Error retrieving from Cost Planning:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to retrieve from Cost Planning',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Export fee structure for tender package generation (AC 31)
 * Returns fee structure in format ready for tender package assembly
 */
export async function exportFeeStructureForTender(
  projectId: string,
  disciplineId: string
): Promise<ActionResult<FeeStructureData>> {
  // This uses the same getFeeStructure function since the data is already
  // in the correct format for tender package generation
  return getFeeStructure(projectId, disciplineId);
}

/**
 * Retrieve stages from Plan Card
 * Fetches stage names from the Plan Card for the given project
 */
export async function retrieveStages(
  planCardId: string
): Promise<ActionResult<string[]>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Find the Plan Card
    const planCard = await prisma.card.findFirst({
      where: {
        id: planCardId,
        type: 'PLAN',
      },
      include: {
        sections: {
          where: {
            name: 'staging', // Staging section stores the stages
          },
          include: {
            items: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });

    if (!planCard) {
      return {
        success: false,
        error: {
          message: 'Plan Card not found',
          code: 'NOT_FOUND',
        },
      };
    }

    if (planCard.sections.length === 0) {
      return {
        success: false,
        error: {
          message: 'No staging section found in Plan Card',
          code: 'SECTION_NOT_FOUND',
        },
      };
    }

    const stagingSection = planCard.sections[0];

    // Extract stage names from items
    // The data structure uses 'name' field in the JSONB data column
    const stageNames: string[] = stagingSection.items.map(item => {
      const itemData = item.data as any;
      return itemData.name || '';
    }).filter(name => name.trim() !== '');

    return {
      success: true,
      data: stageNames,
    };
  } catch (error) {
    console.error('Error retrieving stages:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to retrieve stages',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Get Plan Card ID for a project
 * Returns the ID of the Plan Card if it exists
 */
export async function getPlanCardId(
  projectId: string
): Promise<ActionResult<string>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Find the Plan Card for this project
    const planCard = await prisma.card.findFirst({
      where: {
        projectId,
        type: 'PLAN',
      },
      select: {
        id: true,
      },
    });

    if (!planCard) {
      return {
        success: false,
        error: {
          message: 'Plan Card not found for this project',
          code: 'NOT_FOUND',
        },
      };
    }

    return {
      success: true,
      data: planCard.id,
    };
  } catch (error) {
    console.error('Error getting Plan Card ID:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to get Plan Card ID',
        code: 'SERVER_ERROR',
      },
    };
  }
}
