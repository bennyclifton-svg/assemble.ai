import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import {
  getAddendumsAction,
  createAddendumAction,
  updateAddendumTitleAction,
  toggleAddendumReleasedAction,
  deleteAddendumAction,
} from '../addendum';

// Mock dependencies
vi.mock('@clerk/nextjs/server');
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));
vi.mock('@/lib/db', () => ({
  prisma: {
    addendum: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Addendum Actions', () => {
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue({ userId: mockUserId });
  });

  describe('getAddendumsAction', () => {
    it('should return Addendums for a firm', async () => {
      const mockAddendums = [
        {
          id: 'addendum-1',
          firmId: 'firm-1',
          title: 'Addendum 01',
          dateReleased: null,
          isReleased: false,
          documentPath: null,
          displayOrder: 1,
          createdAt: new Date(),
          createdBy: 'test-user',
          updatedAt: new Date(),
          updatedBy: 'test-user',
          deletedAt: null,
        },
      ];

      prisma.addendum.findMany.mockResolvedValue(mockAddendums);

      const result = await getAddendumsAction('firm-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAddendums);
      expect(prisma.addendum.findMany).toHaveBeenCalledWith({
        where: {
          firmId: 'firm-1',
          deletedAt: null,
        },
        orderBy: {
          displayOrder: 'asc',
        },
      });
    });

    it('should return unauthorized error if not authenticated', async () => {
      (auth as any).mockResolvedValueOnce({ userId: null });

      const result = await getAddendumsAction('firm-1');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });
  });

  describe('createAddendumAction', () => {
    it('should create a new Addendum with correct display order', async () => {
      const mockAddendum = {
        id: 'addendum-1',
        firmId: 'firm-1',
        title: 'Addendum 01',
        dateReleased: null,
        isReleased: false,
        documentPath: null,
        displayOrder: 1,
        createdAt: new Date(),
        createdBy: 'test-user-id',
        updatedAt: new Date(),
        updatedBy: 'test-user-id',
        deletedAt: null,
      };

      prisma.addendum.findFirst.mockResolvedValue(null);
      prisma.addendum.create.mockResolvedValue(mockAddendum);

      const result = await createAddendumAction('firm-1', 'Addendum 01');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAddendum);
      expect(prisma.addendum.create).toHaveBeenCalledWith({
        data: {
          firmId: 'firm-1',
          title: 'Addendum 01',
          displayOrder: 1,
          isReleased: false,
          createdBy: 'test-user-id',
          updatedBy: 'test-user-id',
        },
      });
    });
  });

  describe('toggleAddendumReleasedAction', () => {
    it('should toggle Addendum to released with date (selective issuance)', async () => {
      const mockAddendum = {
        id: 'addendum-1',
        firmId: 'firm-1',
        title: 'Addendum 01',
        dateReleased: new Date(),
        isReleased: true,
        documentPath: null,
        displayOrder: 1,
        createdAt: new Date(),
        createdBy: 'test-user-id',
        updatedAt: new Date(),
        updatedBy: 'test-user-id',
        deletedAt: null,
      };

      prisma.addendum.update.mockResolvedValue(mockAddendum);

      const result = await toggleAddendumReleasedAction('addendum-1', true);

      expect(result.success).toBe(true);
      expect(result.data?.isReleased).toBe(true);
      expect(prisma.addendum.update).toHaveBeenCalledWith({
        where: { id: 'addendum-1' },
        data: expect.objectContaining({
          isReleased: true,
          updatedBy: 'test-user-id',
        }),
      });
    });

    it('should toggle Addendum to not released and clear date', async () => {
      const mockAddendum = {
        id: 'addendum-1',
        firmId: 'firm-1',
        title: 'Addendum 01',
        dateReleased: null,
        isReleased: false,
        documentPath: null,
        displayOrder: 1,
        createdAt: new Date(),
        createdBy: 'test-user-id',
        updatedAt: new Date(),
        updatedBy: 'test-user-id',
        deletedAt: null,
      };

      prisma.addendum.update.mockResolvedValue(mockAddendum);

      const result = await toggleAddendumReleasedAction('addendum-1', false);

      expect(result.success).toBe(true);
      expect(result.data?.isReleased).toBe(false);
      expect(result.data?.dateReleased).toBeNull();
    });
  });

  describe('updateAddendumTitleAction', () => {
    it('should update Addendum title', async () => {
      const mockAddendum = {
        id: 'addendum-1',
        firmId: 'firm-1',
        title: 'Updated Addendum',
        dateReleased: null,
        isReleased: false,
        documentPath: null,
        displayOrder: 1,
        createdAt: new Date(),
        createdBy: 'test-user-id',
        updatedAt: new Date(),
        updatedBy: 'test-user-id',
        deletedAt: null,
      };

      prisma.addendum.update.mockResolvedValue(mockAddendum);

      const result = await updateAddendumTitleAction('addendum-1', 'Updated Addendum');

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Updated Addendum');
    });
  });

  describe('deleteAddendumAction', () => {
    it('should soft delete an Addendum', async () => {
      prisma.addendum.update.mockResolvedValue({
        id: 'addendum-1',
        firmId: 'firm-1',
        title: 'Addendum 01',
        dateReleased: null,
        isReleased: false,
        documentPath: null,
        displayOrder: 1,
        createdAt: new Date(),
        createdBy: 'test-user-id',
        updatedAt: new Date(),
        updatedBy: 'test-user-id',
        deletedAt: new Date(),
      });

      const result = await deleteAddendumAction('addendum-1');

      expect(result.success).toBe(true);
      expect(prisma.addendum.update).toHaveBeenCalledWith({
        where: { id: 'addendum-1' },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
          updatedBy: 'test-user-id',
        }),
      });
    });
  });
});
