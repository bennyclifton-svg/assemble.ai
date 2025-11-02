'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code?: string } };

/**
 * Get all TenderSubmissions for a specific firm
 */
export async function getTenderSubmissionsAction(firmId: string): Promise<ActionResult<any[]>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    const submissions = await prisma.tenderSubmission.findMany({
      where: {
        firmId,
        deletedAt: null,
      },
      orderBy: {
        submissionNumber: 'asc',
      },
    });

    return {
      success: true,
      data: submissions,
    };
  } catch (error) {
    console.error('Error fetching TenderSubmissions:', error);
    return {
      success: false,
      error: { message: 'Failed to fetch TenderSubmissions', code: 'FETCH_ERROR' },
    };
  }
}

/**
 * Create a new TenderSubmission for a firm
 * Auto-increments submissionNumber based on existing submissions
 */
export async function createTenderSubmissionAction(
  firmId: string,
  submissionDate?: Date,
  documentPath?: string,
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

    // Get the next submission number (including deleted submissions to avoid reusing numbers)
    const lastSubmission = await prisma.tenderSubmission.findFirst({
      where: { firmId },
      orderBy: { submissionNumber: 'desc' },
    });

    const submissionNumber = lastSubmission ? lastSubmission.submissionNumber + 1 : 1;

    const submission = await prisma.tenderSubmission.create({
      data: {
        firmId,
        submissionNumber,
        submissionDate: submissionDate || new Date(), // Auto-populate with current date if not provided
        documentPath,
        fileName,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    revalidatePath('/');

    return {
      success: true,
      data: submission,
    };
  } catch (error) {
    console.error('Error creating TenderSubmission:', error);
    return {
      success: false,
      error: { message: 'Failed to create TenderSubmission', code: 'CREATE_ERROR' },
    };
  }
}

/**
 * Update TenderSubmission date
 */
export async function updateSubmissionDateAction(
  submissionId: string,
  submissionDate: Date | null
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    const submission = await prisma.tenderSubmission.update({
      where: { id: submissionId },
      data: {
        submissionDate,
        updatedBy: userId,
      },
    });

    revalidatePath('/');

    return {
      success: true,
      data: submission,
    };
  } catch (error) {
    console.error('Error updating TenderSubmission date:', error);
    return {
      success: false,
      error: { message: 'Failed to update TenderSubmission date', code: 'UPDATE_ERROR' },
    };
  }
}

/**
 * Upload TenderSubmission document
 */
export async function uploadSubmissionDocumentAction(
  submissionId: string,
  documentPath: string,
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

    const submission = await prisma.tenderSubmission.update({
      where: { id: submissionId },
      data: {
        documentPath,
        fileName,
        submissionDate: new Date(), // Auto-populate date on document upload
        updatedBy: userId,
      },
    });

    revalidatePath('/');

    return {
      success: true,
      data: submission,
    };
  } catch (error) {
    console.error('Error uploading TenderSubmission document:', error);
    return {
      success: false,
      error: { message: 'Failed to upload TenderSubmission document', code: 'UPLOAD_ERROR' },
    };
  }
}

/**
 * Delete TenderSubmission (soft delete)
 */
export async function deleteTenderSubmissionAction(submissionId: string): Promise<ActionResult<void>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    await prisma.tenderSubmission.update({
      where: { id: submissionId },
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
    console.error('Error deleting TenderSubmission:', error);
    return {
      success: false,
      error: { message: 'Failed to delete TenderSubmission', code: 'DELETE_ERROR' },
    };
  }
}
