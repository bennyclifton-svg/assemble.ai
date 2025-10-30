'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { firmSchema, firmUpdateSchema, firmReorderSchema } from '@/lib/validators/firmValidators';
import type { FirmInput, FirmUpdateInput, FirmReorderInput } from '@/lib/validators/firmValidators';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code?: string } };

/**
 * Get all firms for a consultant or contractor card
 */
export async function getFirmsAction(
  projectId: string,
  disciplineId: string,
  cardType: 'consultant' | 'contractor'
): Promise<ActionResult<any[]>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    const firms = await prisma.firm.findMany({
      where: {
        projectId,
        ...(cardType === 'consultant'
          ? { consultantCardId: disciplineId }
          : { contractorCardId: disciplineId }),
        deletedAt: null,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    return {
      success: true,
      data: firms,
    };
  } catch (error) {
    console.error('Error fetching firms:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch firms',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Add a new firm
 */
export async function addFirmAction(
  projectId: string,
  disciplineId: string,
  cardType: 'consultant' | 'contractor',
  data: FirmInput
): Promise<ActionResult<{ id: string; displayOrder: number }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Validate input
    const validationResult = firmSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: {
          message: validationResult.error.errors[0]?.message || 'Validation failed',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // Get max display order
    const maxOrderFirm = await prisma.firm.findFirst({
      where: {
        projectId,
        ...(cardType === 'consultant'
          ? { consultantCardId: disciplineId }
          : { contractorCardId: disciplineId }),
        deletedAt: null,
      },
      orderBy: {
        displayOrder: 'desc',
      },
    });

    const newOrder = (maxOrderFirm?.displayOrder ?? -1) + 1;

    // Create firm
    const firm = await prisma.firm.create({
      data: {
        projectId,
        ...(cardType === 'consultant'
          ? { consultantCardId: disciplineId }
          : { contractorCardId: disciplineId }),
        entity: validationResult.data.entity,
        abn: validationResult.data.abn || null,
        address: validationResult.data.address || null,
        contact: validationResult.data.contact || null,
        email: validationResult.data.email || null,
        mobile: validationResult.data.mobile || null,
        shortListed: validationResult.data.shortListed,
        displayOrder: newOrder,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    revalidatePath('/projects/[id]', 'page');

    return {
      success: true,
      data: { id: firm.id, displayOrder: firm.displayOrder },
    };
  } catch (error) {
    console.error('Error adding firm:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to add firm',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Update a firm
 */
export async function updateFirmAction(
  firmId: string,
  data: FirmUpdateInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Validate input
    const validationResult = firmUpdateSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: {
          message: validationResult.error.errors[0]?.message || 'Validation failed',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // Check if firm exists
    const existingFirm = await prisma.firm.findUnique({
      where: { id: firmId },
    });

    if (!existingFirm || existingFirm.deletedAt) {
      return {
        success: false,
        error: { message: 'Firm not found', code: 'NOT_FOUND' },
      };
    }

    // Update firm
    const updatedFirm = await prisma.firm.update({
      where: { id: firmId },
      data: {
        ...validationResult.data,
        abn: validationResult.data.abn || null,
        address: validationResult.data.address || null,
        contact: validationResult.data.contact || null,
        email: validationResult.data.email || null,
        mobile: validationResult.data.mobile || null,
        updatedBy: userId,
      },
    });

    revalidatePath('/projects/[id]', 'page');

    return {
      success: true,
      data: { id: updatedFirm.id },
    };
  } catch (error) {
    console.error('Error updating firm:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to update firm',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Delete a firm (soft delete)
 */
export async function deleteFirmAction(firmId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Check if firm exists
    const firm = await prisma.firm.findUnique({
      where: { id: firmId },
    });

    if (!firm || firm.deletedAt) {
      return {
        success: false,
        error: { message: 'Firm not found', code: 'NOT_FOUND' },
      };
    }

    // Soft delete
    await prisma.firm.update({
      where: { id: firmId },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    // Reorder remaining firms
    const remainingFirms = await prisma.firm.findMany({
      where: {
        projectId: firm.projectId,
        ...(firm.consultantCardId
          ? { consultantCardId: firm.consultantCardId }
          : { contractorCardId: firm.contractorCardId }),
        deletedAt: null,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    // Update display orders
    await prisma.$transaction(
      remainingFirms.map((f, index) =>
        prisma.firm.update({
          where: { id: f.id },
          data: { displayOrder: index, updatedBy: userId },
        })
      )
    );

    revalidatePath('/projects/[id]', 'page');

    return {
      success: true,
      data: { id: firmId },
    };
  } catch (error) {
    console.error('Error deleting firm:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to delete firm',
        code: 'SERVER_ERROR',
      },
    };
  }
}

/**
 * Reorder firms
 */
export async function reorderFirmsAction(
  data: FirmReorderInput
): Promise<ActionResult<{ count: number }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Validate input
    const validationResult = firmReorderSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: {
          message: validationResult.error.errors[0]?.message || 'Validation failed',
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // Update all firms in a transaction
    await prisma.$transaction(
      validationResult.data.firmIds.map((id, index) =>
        prisma.firm.update({
          where: { id },
          data: { displayOrder: index, updatedBy: userId },
        })
      )
    );

    revalidatePath('/projects/[id]', 'page');

    return {
      success: true,
      data: { count: validationResult.data.firmIds.length },
    };
  } catch (error) {
    console.error('Error reordering firms:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to reorder firms',
        code: 'SERVER_ERROR',
      },
    };
  }
}
