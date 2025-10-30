'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code?: string } };

/**
 * Get all Addendums for a specific firm
 */
export async function getAddendumsAction(firmId: string): Promise<ActionResult<any[]>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    const addendums = await prisma.addendum.findMany({
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
      data: addendums,
    };
  } catch (error) {
    console.error('Error fetching Addendums:', error);
    return {
      success: false,
      error: { message: 'Failed to fetch Addendums', code: 'FETCH_ERROR' },
    };
  }
}

/**
 * Create a new Addendum for a firm
 */
export async function createAddendumAction(
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
    const lastAddendum = await prisma.addendum.findFirst({
      where: { firmId, deletedAt: null },
      orderBy: { displayOrder: 'desc' },
    });

    const displayOrder = lastAddendum ? lastAddendum.displayOrder + 1 : 1;

    const addendum = await prisma.addendum.create({
      data: {
        firmId,
        title,
        displayOrder,
        isReleased: false,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    revalidatePath('/');

    return {
      success: true,
      data: addendum,
    };
  } catch (error) {
    console.error('Error creating Addendum:', error);
    return {
      success: false,
      error: { message: 'Failed to create Addendum', code: 'CREATE_ERROR' },
    };
  }
}

/**
 * Update Addendum title
 */
export async function updateAddendumTitleAction(
  addendumId: string,
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

    const addendum = await prisma.addendum.update({
      where: { id: addendumId },
      data: {
        title,
        updatedBy: userId,
      },
    });

    revalidatePath('/');

    return {
      success: true,
      data: addendum,
    };
  } catch (error) {
    console.error('Error updating Addendum title:', error);
    return {
      success: false,
      error: { message: 'Failed to update Addendum title', code: 'UPDATE_ERROR' },
    };
  }
}

/**
 * Toggle Addendum released status (selective issuance per firm)
 */
export async function toggleAddendumReleasedAction(
  addendumId: string,
  isReleased: boolean
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    const addendum = await prisma.addendum.update({
      where: { id: addendumId },
      data: {
        isReleased,
        dateReleased: isReleased ? new Date() : null,
        updatedBy: userId,
      },
    });

    revalidatePath('/');

    return {
      success: true,
      data: addendum,
    };
  } catch (error) {
    console.error('Error toggling Addendum released status:', error);
    return {
      success: false,
      error: { message: 'Failed to toggle Addendum status', code: 'TOGGLE_ERROR' },
    };
  }
}

/**
 * Update Addendum date
 */
export async function updateAddendumDateAction(
  addendumId: string,
  dateReleased: Date | null
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    const addendum = await prisma.addendum.update({
      where: { id: addendumId },
      data: {
        dateReleased,
        updatedBy: userId,
      },
    });

    revalidatePath('/');

    return {
      success: true,
      data: addendum,
    };
  } catch (error) {
    console.error('Error updating Addendum date:', error);
    return {
      success: false,
      error: { message: 'Failed to update Addendum date', code: 'UPDATE_ERROR' },
    };
  }
}

/**
 * Upload Addendum document
 */
export async function uploadAddendumDocumentAction(
  addendumId: string,
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

    const addendum = await prisma.addendum.update({
      where: { id: addendumId },
      data: {
        documentPath,
        dateReleased: new Date(), // Auto-populate date on document upload
        updatedBy: userId,
      },
    });

    revalidatePath('/');

    return {
      success: true,
      data: addendum,
    };
  } catch (error) {
    console.error('Error uploading Addendum document:', error);
    return {
      success: false,
      error: { message: 'Failed to upload Addendum document', code: 'UPLOAD_ERROR' },
    };
  }
}

/**
 * Delete Addendum (soft delete)
 */
export async function deleteAddendumAction(addendumId: string): Promise<ActionResult<void>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    await prisma.addendum.update({
      where: { id: addendumId },
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
    console.error('Error deleting Addendum:', error);
    return {
      success: false,
      error: { message: 'Failed to delete Addendum', code: 'DELETE_ERROR' },
    };
  }
}

/**
 * Reorder Addendums within a firm
 */
export async function reorderAddendumsAction(
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

    // Update all Addendums in a transaction
    await prisma.$transaction(
      updates.map((update) =>
        prisma.addendum.update({
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
    console.error('Error reordering Addendums:', error);
    return {
      success: false,
      error: { message: 'Failed to reorder Addendums', code: 'REORDER_ERROR' },
    };
  }
}
