'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code?: string } };

/**
 * Get all Releases for a specific firm
 */
export async function getReleasesAction(firmId: string): Promise<ActionResult<any[]>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    const releases = await prisma.release.findMany({
      where: {
        firmId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: releases,
    };
  } catch (error) {
    console.error('Error fetching Releases:', error);
    return {
      success: false,
      error: { message: 'Failed to fetch Releases', code: 'FETCH_ERROR' },
    };
  }
}

/**
 * Create a new Release for a firm
 */
export async function createReleaseAction(
  firmId: string,
  releaseDate?: Date,
  packagePath?: string,
  fileName?: string
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    const release = await prisma.release.create({
      data: {
        firmId,
        releaseDate: releaseDate || new Date(), // Auto-populate with current date if not provided
        packagePath,
        fileName,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    revalidatePath('/');

    return {
      success: true,
      data: release,
    };
  } catch (error) {
    console.error('Error creating Release:', error);
    return {
      success: false,
      error: { message: 'Failed to create Release', code: 'CREATE_ERROR' },
    };
  }
}

/**
 * Update Release date
 */
export async function updateReleaseDateAction(
  releaseId: string,
  releaseDate: Date | null
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    const release = await prisma.release.update({
      where: { id: releaseId },
      data: {
        releaseDate,
        updatedBy: userId,
      },
    });

    revalidatePath('/');

    return {
      success: true,
      data: release,
    };
  } catch (error) {
    console.error('Error updating Release date:', error);
    return {
      success: false,
      error: { message: 'Failed to update Release date', code: 'UPDATE_ERROR' },
    };
  }
}

/**
 * Upload Release package
 */
export async function uploadReleasePackageAction(
  releaseId: string,
  packagePath: string,
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

    const release = await prisma.release.update({
      where: { id: releaseId },
      data: {
        packagePath,
        fileName,
        releaseDate: new Date(), // Auto-populate date on document upload
        updatedBy: userId,
      },
    });

    revalidatePath('/');

    return {
      success: true,
      data: release,
    };
  } catch (error) {
    console.error('Error uploading Release package:', error);
    return {
      success: false,
      error: { message: 'Failed to upload Release package', code: 'UPLOAD_ERROR' },
    };
  }
}

/**
 * Delete Release (soft delete)
 */
export async function deleteReleaseAction(releaseId: string): Promise<ActionResult<void>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    await prisma.release.update({
      where: { id: releaseId },
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
    console.error('Error deleting Release:', error);
    return {
      success: false,
      error: { message: 'Failed to delete Release', code: 'DELETE_ERROR' },
    };
  }
}
