import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import {
  getRfisAction,
  createRfiAction,
  updateRfiTitleAction,
  toggleRfiReceivedAction,
  deleteRfiAction,
} from '../rfi';

// Mock dependencies
vi.mock('@clerk/nextjs/server');
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));
vi.mock('@/lib/db', () => ({
  prisma: {
    rfi: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('RFI Actions', () => {
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue({ userId: mockUserId });
  });

  describe('getRfisAction', () => {
    it('should return RFIs for a firm', async () => {
      const mockRfis = [
        {
          id: 'rfi-1',
          firmId: 'firm-1',
          title: 'RFI 01',
          dateReceived: null,
          isReceived: false,
          documentPath: null,
          displayOrder: 1,
          createdAt: new Date(),
          createdBy: 'test-user',
          updatedAt: new Date(),
          updatedBy: 'test-user',
          deletedAt: null,
        },
      ];

      (prisma.rfi.findMany as any).mockResolvedValue(mockRfis);

      const result = await getRfisAction('firm-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRfis);
      expect(prisma.rfi.findMany).toHaveBeenCalledWith({
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

      const result = await getRfisAction('firm-1');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });
  });

  describe('createRfiAction', () => {
    it('should create a new RFI with correct display order', async () => {
      const mockRfi = {
        id: 'rfi-1',
        firmId: 'firm-1',
        title: 'RFI 01',
        dateReceived: null,
        isReceived: false,
        documentPath: null,
        displayOrder: 1,
        createdAt: new Date(),
        createdBy: 'test-user-id',
        updatedAt: new Date(),
        updatedBy: 'test-user-id',
        deletedAt: null,
      };

      (prisma.rfi.findFirst as any).mockResolvedValue(null);
      (prisma.rfi.create as any).mockResolvedValue(mockRfi);

      const result = await createRfiAction('firm-1', 'RFI 01');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRfi);
      expect(prisma.rfi.create).toHaveBeenCalledWith({
        data: {
          firmId: 'firm-1',
          title: 'RFI 01',
          displayOrder: 1,
          isReceived: false,
          createdBy: 'test-user-id',
          updatedBy: 'test-user-id',
        },
      });
    });
  });

  describe('toggleRfiReceivedAction', () => {
    it('should toggle RFI to received with date', async () => {
      const mockRfi = {
        id: 'rfi-1',
        firmId: 'firm-1',
        title: 'RFI 01',
        dateReceived: new Date(),
        isReceived: true,
        documentPath: null,
        displayOrder: 1,
        createdAt: new Date(),
        createdBy: 'test-user-id',
        updatedAt: new Date(),
        updatedBy: 'test-user-id',
        deletedAt: null,
      };

      (prisma.rfi.update as any).mockResolvedValue(mockRfi);

      const result = await toggleRfiReceivedAction('rfi-1', true);

      expect(result.success).toBe(true);
      expect(result.data?.isReceived).toBe(true);
      expect(prisma.rfi.update).toHaveBeenCalledWith({
        where: { id: 'rfi-1' },
        data: expect.objectContaining({
          isReceived: true,
          updatedBy: 'test-user-id',
        }),
      });
    });

    it('should toggle RFI to not received and clear date', async () => {
      const mockRfi = {
        id: 'rfi-1',
        firmId: 'firm-1',
        title: 'RFI 01',
        dateReceived: null,
        isReceived: false,
        documentPath: null,
        displayOrder: 1,
        createdAt: new Date(),
        createdBy: 'test-user-id',
        updatedAt: new Date(),
        updatedBy: 'test-user-id',
        deletedAt: null,
      };

      (prisma.rfi.update as any).mockResolvedValue(mockRfi);

      const result = await toggleRfiReceivedAction('rfi-1', false);

      expect(result.success).toBe(true);
      expect(result.data?.isReceived).toBe(false);
      expect(result.data?.dateReceived).toBeNull();
    });
  });

  describe('updateRfiTitleAction', () => {
    it('should update RFI title', async () => {
      const mockRfi = {
        id: 'rfi-1',
        firmId: 'firm-1',
        title: 'Updated RFI',
        dateReceived: null,
        isReceived: false,
        documentPath: null,
        displayOrder: 1,
        createdAt: new Date(),
        createdBy: 'test-user-id',
        updatedAt: new Date(),
        updatedBy: 'test-user-id',
        deletedAt: null,
      };

      (prisma.rfi.update as any).mockResolvedValue(mockRfi);

      const result = await updateRfiTitleAction('rfi-1', 'Updated RFI');

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Updated RFI');
    });
  });

  describe('deleteRfiAction', () => {
    it('should soft delete an RFI', async () => {
      (prisma.rfi.update as any).mockResolvedValue({
        id: 'rfi-1',
        firmId: 'firm-1',
        title: 'RFI 01',
        dateReceived: null,
        isReceived: false,
        documentPath: null,
        displayOrder: 1,
        createdAt: new Date(),
        createdBy: 'test-user-id',
        updatedAt: new Date(),
        updatedBy: 'test-user-id',
        deletedAt: new Date(),
      });

      const result = await deleteRfiAction('rfi-1');

      expect(result.success).toBe(true);
      expect(prisma.rfi.update).toHaveBeenCalledWith({
        where: { id: 'rfi-1' },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
          updatedBy: 'test-user-id',
        }),
      });
    });
  });
});
