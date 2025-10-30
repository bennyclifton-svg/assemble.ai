'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code?: string } };

/**
 * Get all RFIs for a specific firm
 */
export async function getRfisAction(firmId: string): Promise<ActionResult<any[]>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    const rfis = await prisma.rfi.findMany({
      where: {
        firmId,
        deletedAt: null,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    return {
      success: true,
      data: rfis,
    };
  } catch (error) {
    console.error('Error fetching RFIs:', error);
    return {
      success: false,
      error: { message: 'Failed to fetch RFIs', code: 'FETCH_ERROR' },
    };
  }
}

/**
 * Create a new RFI for a firm
 */
export async function createRfiAction(
  firmId: string,
  title: string
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Get the next display order
    const lastRfi = await prisma.rfi.findFirst({
      where: { firmId, deletedAt: null },
      orderBy: { displayOrder: 'desc' },
    });

    const displayOrder = lastRfi ? lastRfi.displayOrder + 1 : 1;

    const rfi = await prisma.rfi.create({
      data: {
        firmId,
        title,
        displayOrder,
        isReceived: false,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    revalidatePath('/');

    return {
      success: true,
      data: rfi,
    };
  } catch (error) {
    console.error('Error creating RFI:', error);
    return {
      success: false,
      error: { message: 'Failed to create RFI', code: 'CREATE_ERROR' },
    };
  }
}

/**
 * Update RFI title
 */
export async function updateRfiTitleAction(
  rfiId: string,
  title: string
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    const rfi = await prisma.rfi.update({
      where: { id: rfiId },
      data: {
        title,
        updatedBy: userId,
      },
    });

    revalidatePath('/');

    return {
      success: true,
      data: rfi,
    };
  } catch (error) {
    console.error('Error updating RFI title:', error);
    return {
      success: false,
      error: { message: 'Failed to update RFI title', code: 'UPDATE_ERROR' },
    };
  }
}

/**
 * Toggle RFI received status
 */
export async function toggleRfiReceivedAction(
  rfiId: string,
  isReceived: boolean
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    const rfi = await prisma.rfi.update({
      where: { id: rfiId },
      data: {
        isReceived,
        dateReceived: isReceived ? new Date() : null,
        updatedBy: userId,
      },
    });

    revalidatePath('/');

    return {
      success: true,
      data: rfi,
    };
  } catch (error) {
    console.error('Error toggling RFI received status:', error);
    return {
      success: false,
      error: { message: 'Failed to toggle RFI status', code: 'TOGGLE_ERROR' },
    };
  }
}

/**
 * Update RFI date
 */
export async function updateRfiDateAction(
  rfiId: string,
  dateReceived: Date | null
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    const rfi = await prisma.rfi.update({
      where: { id: rfiId },
      data: {
        dateReceived,
        updatedBy: userId,
      },
    });

    revalidatePath('/');

    return {
      success: true,
      data: rfi,
    };
  } catch (error) {
    console.error('Error updating RFI date:', error);
    return {
      success: false,
      error: { message: 'Failed to update RFI date', code: 'UPDATE_ERROR' },
    };
  }
}

/**
 * Upload RFI document
 */
export async function uploadRfiDocumentAction(
  rfiId: string,
  documentPath: string
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    const rfi = await prisma.rfi.update({
      where: { id: rfiId },
      data: {
        documentPath,
        dateReceived: new Date(), // Auto-populate date on document upload
        updatedBy: userId,
      },
    });

    revalidatePath('/');

    return {
      success: true,
      data: rfi,
    };
  } catch (error) {
    console.error('Error uploading RFI document:', error);
    return {
      success: false,
      error: { message: 'Failed to upload RFI document', code: 'UPLOAD_ERROR' },
    };
  }
}

/**
 * Delete RFI (soft delete)
 */
export async function deleteRfiAction(rfiId: string): Promise<ActionResult<void>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    await prisma.rfi.update({
      where: { id: rfiId },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    revalidatePath('/');

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('Error deleting RFI:', error);
    return {
      success: false,
      error: { message: 'Failed to delete RFI', code: 'DELETE_ERROR' },
    };
  }
}

/**
 * Reorder RFIs within a firm
 */
export async function reorderRfisAction(
  updates: Array<{ id: string; displayOrder: number }>
): Promise<ActionResult<void>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Update all RFIs in a transaction
    await prisma.$transaction(
      updates.map((update) =>
        prisma.rfi.update({
          where: { id: update.id },
          data: {
            displayOrder: update.displayOrder,
            updatedBy: userId,
          },
        })
      )
    );

    revalidatePath('/');

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('Error reordering RFIs:', error);
    return {
      success: false,
      error: { message: 'Failed to reorder RFIs', code: 'REORDER_ERROR' },
    };
  }
}
