'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import type { Project } from '@prisma/client';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code?: string } };

/**
 * Get all projects for the current user, ordered by last accessed
 */
export async function getUserProjects(): Promise<ActionResult<Project[]>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    const projects = await prisma.project.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        lastAccessedAt: 'desc',
      },
    });

    return { success: true, data: projects };
  } catch (error) {
    console.error('Error fetching user projects:', error);
    return {
      success: false,
      error: { message: 'Failed to fetch projects', code: 'FETCH_ERROR' },
    };
  }
}

/**
 * Get a single project by ID
 */
export async function getProject(
  projectId: string
): Promise<ActionResult<Project>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
        deletedAt: null,
      },
    });

    if (!project) {
      return {
        success: false,
        error: { message: 'Project not found', code: 'NOT_FOUND' },
      };
    }

    return { success: true, data: project };
  } catch (error) {
    console.error('Error fetching project:', error);
    return {
      success: false,
      error: { message: 'Failed to fetch project', code: 'FETCH_ERROR' },
    };
  }
}

/**
 * Create a new project with auto-generated name
 */
export async function createProject(): Promise<ActionResult<Project>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Count existing projects for this user to generate sequential name
    const projectCount = await prisma.project.count({
      where: {
        userId,
        deletedAt: null,
      },
    });

    const projectName = `New Project ${projectCount + 1}`;

    const project = await prisma.project.create({
      data: {
        name: projectName,
        userId,
      },
    });

    revalidatePath('/projects');

    return { success: true, data: project };
  } catch (error) {
    console.error('Error creating project:', error);
    return {
      success: false,
      error: { message: 'Failed to create project', code: 'CREATE_ERROR' },
    };
  }
}

/**
 * Update project name
 */
export async function renameProject(
  projectId: string,
  newName: string
): Promise<ActionResult<Project>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    if (!newName || newName.trim().length === 0) {
      return {
        success: false,
        error: { message: 'Project name cannot be empty', code: 'INVALID_NAME' },
      };
    }

    // Verify ownership
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
        deletedAt: null,
      },
    });

    if (!existingProject) {
      return {
        success: false,
        error: { message: 'Project not found', code: 'NOT_FOUND' },
      };
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: newName.trim(),
      },
    });

    revalidatePath('/projects');
    revalidatePath(`/projects/${projectId}`);

    return { success: true, data: project };
  } catch (error) {
    console.error('Error renaming project:', error);
    return {
      success: false,
      error: { message: 'Failed to rename project', code: 'RENAME_ERROR' },
    };
  }
}

/**
 * Update last accessed timestamp for a project
 */
export async function updateLastAccessed(
  projectId: string
): Promise<ActionResult<Project>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Verify ownership
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
        deletedAt: null,
      },
    });

    if (!existingProject) {
      return {
        success: false,
        error: { message: 'Project not found', code: 'NOT_FOUND' },
      };
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        lastAccessedAt: new Date(),
      },
    });

    return { success: true, data: project };
  } catch (error) {
    console.error('Error updating last accessed:', error);
    return {
      success: false,
      error: { message: 'Failed to update last accessed', code: 'UPDATE_ERROR' },
    };
  }
}

/**
 * Soft delete a project
 */
export async function deleteProject(
  projectId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      };
    }

    // Verify ownership
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
        deletedAt: null,
      },
    });

    if (!existingProject) {
      return {
        success: false,
        error: { message: 'Project not found', code: 'NOT_FOUND' },
      };
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        deletedAt: new Date(),
      },
    });

    revalidatePath('/projects');

    return { success: true, data: { id: projectId } };
  } catch (error) {
    console.error('Error deleting project:', error);
    return {
      success: false,
      error: { message: 'Failed to delete project', code: 'DELETE_ERROR' },
    };
  }
}
