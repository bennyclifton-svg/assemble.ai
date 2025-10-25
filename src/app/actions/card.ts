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
