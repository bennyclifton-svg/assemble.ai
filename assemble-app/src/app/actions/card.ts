'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code?: string } };

/**
 * Update an item's data
 */
export async function updateItemAction(
  itemId: string,
  data: Prisma.InputJsonValue
): Promise<ActionResult<{ id: string; data: Prisma.JsonValue }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Check if item exists and is not locked
    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!existingItem) {
      return {
        success: false,
        error: { message: 'Item not found', code: 'NOT_FOUND' },
      };
    }

    if (existingItem.locked) {
      return {
        success: false,
        error: { message: 'Cannot update locked item', code: 'LOCKED' },
      };
    }

    // Update the item
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        data,
        updatedBy: userId,
      },
    });

    // Revalidate the project page
    // Note: In a real app, we'd get the projectId from the item's section's card
    revalidatePath('/projects/[id]', 'page');

    return {
      success: true,
      data: {
        id: updatedItem.id,
        data: updatedItem.data,
      },
    };
  } catch (error) {
    console.error('Error updating item:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to update item',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Create a new section with default items
 */
export async function createSectionWithItemsAction(
  cardId: string,
  sectionData: {
    name: string;
    order: number;
    items: Array<{
      order: number;
      type: string;
      data: Prisma.InputJsonValue;
    }>;
  }
): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Create section with items in a transaction
    const section = await prisma.$transaction(async (tx) => {
      const newSection = await tx.section.create({
        data: {
          cardId,
          name: sectionData.name,
          order: sectionData.order,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // Create all items
      await tx.item.createMany({
        data: sectionData.items.map((item) => ({
          sectionId: newSection.id,
          order: item.order,
          type: item.type,
          data: item.data,
          createdBy: userId,
          updatedBy: userId,
        })),
      });

      return newSection;
    });

    revalidatePath('/projects/[id]', 'page');

    return {
      success: true,
      data: { id: section.id },
    };
  } catch (error) {
    console.error('Error creating section:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to create section',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Add a new item to a section
 */
export async function addItemAction(
  sectionId: string,
  data: Prisma.InputJsonValue,
  type: string = 'text'
): Promise<ActionResult<{ id: string; order: number }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Get max order in section
    const maxOrderItem = await prisma.item.findFirst({
      where: { sectionId },
      orderBy: { order: 'desc' },
    });

    const newOrder = (maxOrderItem?.order ?? 0) + 1;

    const newItem = await prisma.item.create({
      data: {
        sectionId,
        order: newOrder,
        type,
        data,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    revalidatePath('/projects/[id]', 'page');

    return {
      success: true,
      data: { id: newItem.id, order: newItem.order },
    };
  } catch (error) {
    console.error('Error adding item:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to add item',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Delete an item (soft delete)
 */
export async function deleteItemAction(itemId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Check if item is locked
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return {
        success: false,
        error: { message: 'Item not found', code: 'NOT_FOUND' },
      };
    }

    if (item.locked) {
      return {
        success: false,
        error: { message: 'Cannot delete locked item', code: 'LOCKED' },
      };
    }

    // Soft delete
    await prisma.item.delete({
      where: { id: itemId },
    });

    revalidatePath('/projects/[id]', 'page');

    return {
      success: true,
      data: { id: itemId },
    };
  } catch (error) {
    console.error('Error deleting item:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to delete item',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Reorder items in a section
 */
export async function reorderItemsAction(
  itemIds: string[]
): Promise<ActionResult<{ count: number }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Update all items in a transaction
    await prisma.$transaction(
      itemIds.map((id, index) =>
        prisma.item.update({
          where: { id },
          data: { order: index, updatedBy: userId },
        })
      )
    );

    revalidatePath('/projects/[id]', 'page');

    return {
      success: true,
      data: { count: itemIds.length },
    };
  } catch (error) {
    console.error('Error reordering items:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to reorder items',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Update consultant status (active state and statuses)
 */
export async function updateConsultantStatusAction(
  projectId: string,
  disciplineId: string,
  data: {
    isActive: boolean;
    statuses: {
      brief: boolean;
      tender: boolean;
      rec: boolean;
      award: boolean;
    };
  }
): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // In a real app, we would have a ConsultantStatus table
    // For now, we'll store this in an Item with type 'consultant_status'
    // TODO: Create proper ConsultantStatus model in future stories

    // Check if consultant status item exists
    const existingStatus = await prisma.item.findFirst({
      where: {
        type: 'consultant_status',
        data: {
          path: ['disciplineId'],
          equals: disciplineId,
        },
        section: {
          card: {
            projectId,
            type: 'PLAN',
          },
          name: 'consultant-list',
        },
      },
    });

    if (existingStatus) {
      // Update existing status
      const updated = await prisma.item.update({
        where: { id: existingStatus.id },
        data: {
          data: {
            disciplineId,
            isActive: data.isActive,
            statuses: data.statuses,
          },
          updatedBy: userId,
        },
      });

      revalidatePath('/projects/[id]', 'page');

      return {
        success: true,
        data: { id: updated.id },
      };
    } else {
      // Create new status - find or create consultant-list section
      const card = await prisma.card.findFirst({
        where: {
          projectId,
          type: 'PLAN',
        },
        include: {
          sections: {
            where: {
              name: 'consultant-list',
            },
          },
        },
      });

      if (!card) {
        return {
          success: false,
          error: { message: 'Plan card not found', code: 'NOT_FOUND' },
        };
      }

      let sectionId = card.sections[0]?.id;

      // Create section if it doesn't exist
      if (!sectionId) {
        const section = await prisma.section.create({
          data: {
            cardId: card.id,
            name: 'consultant-list',
            order: 5, // After stakeholders
            createdBy: userId,
            updatedBy: userId,
          },
        });
        sectionId = section.id;
      }

      // Create new consultant status item
      const created = await prisma.item.create({
        data: {
          sectionId,
          type: 'consultant_status',
          order: 0,
          data: {
            disciplineId,
            isActive: data.isActive,
            statuses: data.statuses,
          },
          createdBy: userId,
          updatedBy: userId,
        },
      });

      revalidatePath('/projects/[id]', 'page');

      return {
        success: true,
        data: { id: created.id },
      };
    }
  } catch (error) {
    console.error('Error updating consultant status:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to update consultant status',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Get items for a specific section by name
 */
export async function getSectionItemsAction(
  projectId: string,
  sectionName: string
): Promise<ActionResult<Array<{ id: string; order: number; type: string; data: Prisma.JsonValue }>>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Find Plan card and section
    const card = await prisma.card.findFirst({
      where: {
        projectId,
        type: 'PLAN',
        deletedAt: null,
      },
      include: {
        sections: {
          where: {
            name: sectionName,
            deletedAt: null,
          },
          include: {
            items: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });

    if (!card || card.sections.length === 0) {
      return {
        success: true,
        data: [], // Return empty array if section doesn't exist yet
      };
    }

    const items = card.sections[0].items.map((item) => ({
      id: item.id,
      order: item.order,
      type: item.type,
      data: item.data,
    }));

    return {
      success: true,
      data: items,
    };
  } catch (error) {
    console.error('Error fetching section items:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch section items',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Initialize Details section with default fields
 */
export async function initializeDetailsSectionAction(
  projectId: string
): Promise<ActionResult<{ count: number }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Check if section already exists with items
    const existing = await getSectionItemsAction(projectId, 'details');
    if (existing.success && existing.data.length > 0) {
      return {
        success: true,
        data: { count: existing.data.length },
      };
    }

    // Find or create Plan card
    let card = await prisma.card.findFirst({
      where: {
        projectId,
        type: 'PLAN',
        deletedAt: null,
      },
      include: {
        sections: {
          where: {
            name: 'details',
            deletedAt: null,
          },
        },
      },
    });

    if (!card) {
      // Create Plan card if it doesn't exist
      card = await prisma.card.create({
        data: {
          projectId,
          type: 'PLAN',
          createdBy: userId,
          updatedBy: userId,
          sections: {
            create: {
              name: 'details',
              order: 1,
              createdBy: userId,
              updatedBy: userId,
            },
          },
        },
        include: {
          sections: {
            where: {
              name: 'details',
            },
          },
        },
      });
    }

    // Get or create section
    let sectionId = card.sections[0]?.id;
    if (!sectionId) {
      const section = await prisma.section.create({
        data: {
          cardId: card.id,
          name: 'details',
          order: 1,
          createdBy: userId,
          updatedBy: userId,
        },
      });
      sectionId = section.id;
    }

    // Create default fields
    const defaultFields = [
      { label: 'Project Name', value: '', type: 'text', required: true },
      { label: 'Address', value: '', type: 'text', required: true },
      { label: 'Legal Address', value: '', type: 'text', required: false },
      { label: 'Zoning', value: '', type: 'text', required: false },
      { label: 'Jurisdiction', value: '', type: 'text', required: false },
      { label: 'Lot Area', value: '', type: 'number', required: false, unit: 'm²' },
      { label: 'Number of Stories', value: '', type: 'number', required: false },
      { label: 'Building Class', value: '', type: 'text', required: false },
    ];

    await prisma.item.createMany({
      data: defaultFields.map((field, index) => ({
        sectionId,
        order: index + 1,
        type: 'field',
        data: field,
        createdBy: userId,
        updatedBy: userId,
      })),
    });

    revalidatePath('/projects/[id]', 'page');

    return {
      success: true,
      data: { count: defaultFields.length },
    };
  } catch (error) {
    console.error('Error initializing details section:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to initialize details section',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Initialize Objectives section with default fields
 */
export async function initializeObjectivesSectionAction(
  projectId: string
): Promise<ActionResult<{ count: number }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Check if section already exists with items
    const existing = await getSectionItemsAction(projectId, 'objectives');
    if (existing.success && existing.data.length > 0) {
      return {
        success: true,
        data: { count: existing.data.length },
      };
    }

    // Find or create Plan card
    let card = await prisma.card.findFirst({
      where: {
        projectId,
        type: 'PLAN',
        deletedAt: null,
      },
      include: {
        sections: {
          where: {
            name: 'objectives',
            deletedAt: null,
          },
        },
      },
    });

    if (!card) {
      // Get existing Plan card or create new one
      card = await prisma.card.findFirst({
        where: {
          projectId,
          type: 'PLAN',
          deletedAt: null,
        },
      });

      if (!card) {
        card = await prisma.card.create({
          data: {
            projectId,
            type: 'PLAN',
            createdBy: userId,
            updatedBy: userId,
          },
        });
      }
    }

    // Get or create section
    let sectionId = card.sections?.[0]?.id;
    if (!sectionId) {
      const section = await prisma.section.create({
        data: {
          cardId: card.id,
          name: 'objectives',
          order: 2,
          createdBy: userId,
          updatedBy: userId,
        },
      });
      sectionId = section.id;
    }

    // Create default fields
    const defaultFields = [
      {
        label: 'Functional',
        value: '',
        placeholder: 'Define functional objectives (e.g., space utilization, operational efficiency)...',
      },
      {
        label: 'Quality',
        value: '',
        placeholder: 'Define quality objectives (e.g., finishes, sustainability standards)...',
      },
      {
        label: 'Budget',
        value: '',
        placeholder: 'Define budget objectives (e.g., target cost, cost per sqm)...',
      },
      {
        label: 'Program',
        value: '',
        placeholder: 'Define program objectives (e.g., project timeline, key milestones)...',
      },
    ];

    await prisma.item.createMany({
      data: defaultFields.map((field, index) => ({
        sectionId,
        order: index + 1,
        type: 'field',
        data: field,
        createdBy: userId,
        updatedBy: userId,
      })),
    });

    revalidatePath('/projects/[id]', 'page');

    return {
      success: true,
      data: { count: defaultFields.length },
    };
  } catch (error) {
    console.error('Error initializing objectives section:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to initialize objectives section',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Update contractor status (active state and statuses)
 */
export async function updateContractorStatusAction(
  projectId: string,
  tradeId: string,
  data: {
    isActive: boolean;
    statuses: {
      brief: boolean;
      tender: boolean;
      rec: boolean;
      award: boolean;
    };
  }
): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Store contractor status in Item with type 'contractor_status'
    // Parallel to consultant status implementation

    // Check if contractor status item exists
    const existingStatus = await prisma.item.findFirst({
      where: {
        type: 'contractor_status',
        data: {
          path: ['tradeId'],
          equals: tradeId,
        },
        section: {
          card: {
            projectId,
            type: 'PLAN',
          },
          name: 'contractor-list',
        },
      },
    });

    if (existingStatus) {
      // Update existing status
      const updated = await prisma.item.update({
        where: { id: existingStatus.id },
        data: {
          data: {
            tradeId,
            isActive: data.isActive,
            statuses: data.statuses,
          },
          updatedBy: userId,
        },
      });

      revalidatePath('/projects/[id]', 'page');

      return {
        success: true,
        data: { id: updated.id },
      };
    } else {
      // Create new status - find or create contractor-list section
      const card = await prisma.card.findFirst({
        where: {
          projectId,
          type: 'PLAN',
        },
        include: {
          sections: {
            where: {
              name: 'contractor-list',
            },
          },
        },
      });

      if (!card) {
        return {
          success: false,
          error: { message: 'Plan card not found', code: 'NOT_FOUND' },
        };
      }

      let sectionId = card.sections[0]?.id;

      // Create section if it doesn't exist
      if (!sectionId) {
        const section = await prisma.section.create({
          data: {
            cardId: card.id,
            name: 'contractor-list',
            order: 6, // After consultant-list
            createdBy: userId,
            updatedBy: userId,
          },
        });
        sectionId = section.id;
      }

      // Create new contractor status item
      const created = await prisma.item.create({
        data: {
          sectionId,
          type: 'contractor_status',
          order: 0,
          data: {
            tradeId,
            isActive: data.isActive,
            statuses: data.statuses,
          },
          createdBy: userId,
          updatedBy: userId,
        },
      });

      revalidatePath('/projects/[id]', 'page');

      return {
        success: true,
        data: { id: created.id },
      };
    }
  } catch (error) {
    console.error('Error updating contractor status:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to update contractor status',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Extract project details from text content using AI
 */
export async function extractProjectDetailsFromText(
  content: string
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Dynamically import OpenAI and prompts to avoid issues with server-side code
    const { openai, FIRM_EXTRACTION_MODEL } = await import('@/lib/ai/openai');
    const {
      PROJECT_DETAILS_EXTRACTION_SYSTEM_PROMPT,
      PROJECT_DETAILS_EXTRACTION_USER_PROMPT,
    } = await import('@/lib/ai/projectDetailsExtractorPrompts');

    // Use AI to extract from text
    const completion = await openai.chat.completions.create({
      model: FIRM_EXTRACTION_MODEL,
      messages: [
        {
          role: 'system',
          content: PROJECT_DETAILS_EXTRACTION_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: PROJECT_DETAILS_EXTRACTION_USER_PROMPT(content),
        },
      ],
      temperature: 0, // Deterministic output
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      return {
        success: false,
        error: { message: 'No response from AI', code: 'AI_NO_RESPONSE' },
      };
    }

    // Parse JSON response
    try {
      const extracted = JSON.parse(responseText);

      return {
        success: true,
        data: extracted,
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      return {
        success: false,
        error: { message: 'Failed to parse AI response', code: 'AI_PARSE_ERROR' },
      };
    }
  } catch (error) {
    console.error('Error extracting project details:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to extract project details',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Extract project details from a file
 */
export async function extractProjectDetailsFromFile(
  fileContent: string,
  fileName: string
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // For now, just pass the content to text extraction
    // In the future, we can add specific file type handling (PDF, DOCX, etc.)
    return extractProjectDetailsFromText(fileContent);
  } catch (error) {
    console.error('Error extracting project details from file:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to extract project details from file',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Initialize staging section with default stages
 */
export async function initializeStagingSectionAction(
  projectId: string
): Promise<ActionResult<void>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Check if staging section already exists
    const existingResult = await getSectionItemsAction(projectId, 'staging');
    if (existingResult.success && existingResult.data.length > 0) {
      return { success: true, data: undefined };
    }

    // Get or create Plan card
    let card = await prisma.card.findFirst({
      where: {
        projectId,
        type: 'PLAN',
        deletedAt: null,
      },
    });

    if (!card) {
      card = await prisma.card.create({
        data: {
          projectId,
          type: 'PLAN',
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }

    // Get or create staging section
    let section = await prisma.section.findFirst({
      where: {
        cardId: card.id,
        name: 'staging',
        deletedAt: null,
      },
    });

    if (!section) {
      section = await prisma.section.create({
        data: {
          cardId: card.id,
          name: 'staging',
          order: 2, // After objectives
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }

    // Create default stages
    const defaultStages = [
      { name: 'Stage 1 Initiation', order: 0 },
      { name: 'Stage 2 Scheme Design', order: 1 },
      { name: 'Stage 3 Detail Design', order: 2 },
      { name: 'Stage 4 Procurement', order: 3 },
      { name: 'Stage 5 Delivery', order: 4 },
    ];

    for (const stage of defaultStages) {
      await prisma.item.create({
        data: {
          sectionId: section.id,
          type: 'text',
          order: stage.order,
          data: { name: stage.name },
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }

    revalidatePath('/projects/[id]', 'page');

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('Error initializing staging section:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to initialize staging section',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Initialize risk section with default risk categories
 */
export async function initializeRiskSectionAction(
  projectId: string
): Promise<ActionResult<void>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Check if risk section already exists
    const existingResult = await getSectionItemsAction(projectId, 'risk');
    if (existingResult.success && existingResult.data.length > 0) {
      return { success: true, data: undefined };
    }

    // Get or create Plan card
    let card = await prisma.card.findFirst({
      where: {
        projectId,
        type: 'PLAN',
        deletedAt: null,
      },
    });

    if (!card) {
      card = await prisma.card.create({
        data: {
          projectId,
          type: 'PLAN',
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }

    // Get or create risk section
    let section = await prisma.section.findFirst({
      where: {
        cardId: card.id,
        name: 'risk',
        deletedAt: null,
      },
    });

    if (!section) {
      section = await prisma.section.create({
        data: {
          cardId: card.id,
          name: 'risk',
          order: 3, // After staging
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }

    // Create default risk categories
    const defaultRisks = [
      { label: 'Design', value: '', placeholder: 'Identify design-related risks...', order: 0 },
      { label: 'Construction', value: '', placeholder: 'Identify construction-related risks...', order: 1 },
      { label: 'Financial', value: '', placeholder: 'Identify financial risks...', order: 2 },
      { label: 'Schedule', value: '', placeholder: 'Identify schedule risks...', order: 3 },
    ];

    for (const risk of defaultRisks) {
      await prisma.item.create({
        data: {
          sectionId: section.id,
          type: 'textarea',
          order: risk.order,
          data: { label: risk.label, value: risk.value, placeholder: risk.placeholder },
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }

    revalidatePath('/projects/[id]', 'page');

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('Error initializing risk section:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to initialize risk section',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Generate project risks using AI
 */
export async function generateRiskAction(
  projectId: string,
  context: any
): Promise<ActionResult<string>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Dynamically import OpenAI and prompts
    const { openai, FIRM_EXTRACTION_MODEL } = await import('@/lib/ai/openai');
    const {
      RISK_GENERATION_SYSTEM_PROMPT,
      buildRiskPrompt,
    } = await import('@/lib/ai/scopeGeneratorPrompts');

    const userPrompt = buildRiskPrompt(context);

    const completion = await openai.chat.completions.create({
      model: FIRM_EXTRACTION_MODEL,
      messages: [
        {
          role: 'system',
          content: RISK_GENERATION_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const generatedRisks = completion.choices[0]?.message?.content;

    if (!generatedRisks) {
      return {
        success: false,
        error: { message: 'No response from AI', code: 'AI_NO_RESPONSE' },
      };
    }

    return {
      success: true,
      data: generatedRisks.trim(),
    };
  } catch (error) {
    console.error('Error generating risks:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to generate risks',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Generate project objectives using AI
 */
export async function generateObjectivesAction(
  projectId: string,
  context: any
): Promise<ActionResult<string>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Dynamically import OpenAI and prompts
    const { openai, FIRM_EXTRACTION_MODEL } = await import('@/lib/ai/openai');
    const {
      OBJECTIVES_GENERATION_SYSTEM_PROMPT,
      buildObjectivesPrompt,
    } = await import('@/lib/ai/scopeGeneratorPrompts');

    const userPrompt = buildObjectivesPrompt(context);

    const completion = await openai.chat.completions.create({
      model: FIRM_EXTRACTION_MODEL,
      messages: [
        {
          role: 'system',
          content: OBJECTIVES_GENERATION_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const generatedObjectives = completion.choices[0]?.message?.content;

    if (!generatedObjectives) {
      return {
        success: false,
        error: { message: 'No response from AI', code: 'AI_NO_RESPONSE' },
      };
    }

    return {
      success: true,
      data: generatedObjectives.trim(),
    };
  } catch (error) {
    console.error('Error generating objectives:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to generate objectives',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Initialize Stakeholders Section
 * Creates empty stakeholders array for Plan Card
 */
export async function initializeStakeholdersSectionAction(
  projectId: string
): Promise<ActionResult<void>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Check if stakeholders section already exists
    const existingResult = await getSectionItemsAction(projectId, 'stakeholders');
    if (existingResult.success && existingResult.data.length > 0) {
      return { success: true, data: undefined };
    }

    // Get or create Plan card
    let card = await prisma.card.findFirst({
      where: {
        projectId,
        type: 'PLAN',
        deletedAt: null,
      },
    });

    if (!card) {
      card = await prisma.card.create({
        data: {
          projectId,
          type: 'PLAN',
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }

    // Get or create stakeholders section
    let section = await prisma.section.findFirst({
      where: {
        cardId: card.id,
        name: 'stakeholders',
        deletedAt: null,
      },
    });

    if (!section) {
      section = await prisma.section.create({
        data: {
          cardId: card.id,
          name: 'stakeholders',
          order: 4, // After risk
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }

    // Create single item to hold stakeholders array
    await prisma.item.create({
      data: {
        sectionId: section.id,
        type: 'list',
        order: 0,
        data: {
          stakeholders: [],
        },
        createdBy: userId,
        updatedBy: userId,
      },
    });

    revalidatePath('/projects/[id]', 'page');

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('Error initializing stakeholders section:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to initialize stakeholders section',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Get cards with sections for tender package selection
 * Returns Plan card and active Consultant/Contractor cards only
 * Story 2.5: AC6, AC7 - Show only active consultants/contractors
 */
export async function getCardsForTenderSelection(
  projectId: string
): Promise<ActionResult<Array<{
  id: string;
  type: string;
  discipline?: string | null;
  trade?: string | null;
  sections: Array<{
    id: string;
    name: string;
    order: number;
    items: Array<{
      id: string;
      type: string;
      data: Prisma.JsonValue;
    }>;
  }>;
}>>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Get Plan card (always included)
    const planCard = await prisma.card.findFirst({
      where: {
        projectId,
        type: 'PLAN',
        deletedAt: null,
      },
      include: {
        sections: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            order: 'asc',
          },
          include: {
            items: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                order: 'asc',
              },
              select: {
                id: true,
                type: true,
                data: true,
              },
            },
          },
        },
      },
    });

    // Get active consultants and contractors from Firm model
    const activeFirms = await prisma.firm.findMany({
      where: {
        projectId,
        deletedAt: null,
      },
      select: {
        consultantCardId: true,
        contractorCardId: true,
        entity: true,
      },
    });

    const activeConsultantCardIds = activeFirms
      .filter((f) => f.consultantCardId)
      .map((f) => f.consultantCardId as string);

    const activeContractorCardIds = activeFirms
      .filter((f) => f.contractorCardId)
      .map((f) => f.contractorCardId as string);

    // Get ONLY active consultant cards (AC6)
    const consultantCards = activeConsultantCardIds.length > 0
      ? await prisma.card.findMany({
          where: {
            id: {
              in: activeConsultantCardIds,
            },
            deletedAt: null,
          },
          include: {
            sections: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                order: 'asc',
              },
              include: {
                items: {
                  where: {
                    deletedAt: null,
                  },
                  orderBy: {
                    order: 'asc',
                  },
                  select: {
                    id: true,
                    type: true,
                    data: true,
                  },
                },
              },
            },
          },
        })
      : [];

    // Get ONLY active contractor cards (AC7)
    const contractorCards = activeContractorCardIds.length > 0
      ? await prisma.card.findMany({
          where: {
            id: {
              in: activeContractorCardIds,
            },
            deletedAt: null,
          },
          include: {
            sections: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                order: 'asc',
              },
              include: {
                items: {
                  where: {
                    deletedAt: null,
                  },
                  orderBy: {
                    order: 'asc',
                  },
                  select: {
                    id: true,
                    type: true,
                    data: true,
                  },
                },
              },
            },
          },
        })
      : [];

    // Combine all cards
    const allCards = [];

    if (planCard) {
      allCards.push({
        id: planCard.id,
        type: planCard.type,
        sections: planCard.sections,
      });
    }

    // Add consultant cards with discipline from Firm
    for (const card of consultantCards) {
      const firm = activeFirms.find((f) => f.consultantCardId === card.id);
      allCards.push({
        id: card.id,
        type: card.type,
        discipline: firm?.entity || null,
        sections: card.sections,
      });
    }

    // Add contractor cards with trade from Firm
    for (const card of contractorCards) {
      const firm = activeFirms.find((f) => f.contractorCardId === card.id);
      allCards.push({
        id: card.id,
        type: card.type,
        trade: firm?.entity || null,
        sections: card.sections,
      });
    }

    return {
      success: true,
      data: allCards,
    };
  } catch (error) {
    console.error('Error fetching cards for tender selection:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch cards',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Ensure a consultant card exists for a discipline
 * Creates the card if it doesn't exist, otherwise returns existing card
 *
 * This is called when a user activates a consultant discipline in the Plan Card
 */
export async function ensureConsultantCard(
  projectId: string,
  disciplineId: string
): Promise<ActionResult<{ cardId: string }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Check if card already exists
    const existingCard = await prisma.card.findUnique({
      where: { id: disciplineId },
      select: { id: true },
    });

    if (existingCard) {
      return {
        success: true,
        data: { cardId: existingCard.id },
      };
    }

    // Create the card
    const card = await prisma.card.create({
      data: {
        id: disciplineId,
        projectId,
        type: 'CONSULTANT',
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return {
      success: true,
      data: { cardId: card.id },
    };
  } catch (error) {
    console.error('Error ensuring consultant card:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to create consultant card',
        code: 'SERVER_ERROR',
      },
    };
  }
}
