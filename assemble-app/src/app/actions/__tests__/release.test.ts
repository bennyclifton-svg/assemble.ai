import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import {
  getReleasesAction,
  createReleaseAction,
  updateReleaseDateAction,
  uploadReleasePackageAction,
  deleteReleaseAction,
} from '../release';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    release: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Release Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getReleasesAction', () => {
    it('should return releases for authorized user', async () => {
      const mockReleases = [
        {
          id: 'release-1',
          firmId: 'firm-1',
          releaseDate: new Date('2025-11-02'),
          packagePath: 'Documents/Consultant/ABC Engineering/TenderPackage-2025-11-02.pdf',
          fileName: 'package.pdf',
        },
      ];

      (auth as any).mockResolvedValue({ userId: 'user-123' });
      (prisma.release.findMany as any).mockResolvedValue(mockReleases);

      const result = await getReleasesAction('firm-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockReleases);
      }
      expect(prisma.release.findMany).toHaveBeenCalledWith({
        where: { firmId: 'firm-1', deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return unauthorized error when user is not authenticated', async () => {
      (auth as any).mockResolvedValue({ userId: null });

      const result = await getReleasesAction('firm-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNAUTHORIZED');
      }
    });
  });

  describe('createReleaseAction', () => {
    it('should create release with auto-populated date', async () => {
      const mockRelease = {
        id: 'release-1',
        firmId: 'firm-1',
        releaseDate: new Date(),
        packagePath: null,
        fileName: null,
      };

      (auth as any).mockResolvedValue({ userId: 'user-123' });
      (prisma.release.create as any).mockResolvedValue(mockRelease);

      const result = await createReleaseAction('firm-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('release-1');
      }
    });

    it('should create release with provided date and package', async () => {
      const testDate = new Date('2025-11-02');
      const mockRelease = {
        id: 'release-1',
        firmId: 'firm-1',
        releaseDate: testDate,
        packagePath: 'Documents/Consultant/ABC/TenderPackage-2025-11-02.pdf',
        fileName: 'package.pdf',
      };

      (auth as any).mockResolvedValue({ userId: 'user-123' });
      (prisma.release.create as any).mockResolvedValue(mockRelease);

      const result = await createReleaseAction(
        'firm-1',
        testDate,
        'Documents/Consultant/ABC/TenderPackage-2025-11-02.pdf',
        'package.pdf'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('updateReleaseDateAction', () => {
    it('should update release date', async () => {
      const newDate = new Date('2025-11-05');
      const mockRelease = {
        id: 'release-1',
        firmId: 'firm-1',
        releaseDate: newDate,
        packagePath: null,
        fileName: null,
      };

      (auth as any).mockResolvedValue({ userId: 'user-123' });
      (prisma.release.update as any).mockResolvedValue(mockRelease);

      const result = await updateReleaseDateAction('release-1', newDate);

      expect(result.success).toBe(true);
      expect(prisma.release.update).toHaveBeenCalledWith({
        where: { id: 'release-1' },
        data: expect.objectContaining({ releaseDate: newDate }),
      });
    });
  });

  describe('uploadReleasePackageAction', () => {
    it('should upload package and auto-populate date', async () => {
      const mockRelease = {
        id: 'release-1',
        firmId: 'firm-1',
        releaseDate: new Date(),
        packagePath: 'Documents/Consultant/ABC/TenderPackage-2025-11-02.pdf',
        fileName: 'package.pdf',
      };

      (auth as any).mockResolvedValue({ userId: 'user-123' });
      (prisma.release.update as any).mockResolvedValue(mockRelease);

      const result = await uploadReleasePackageAction(
        'release-1',
        'Documents/Consultant/ABC/TenderPackage-2025-11-02.pdf',
        'package.pdf'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.packagePath).toBe('Documents/Consultant/ABC/TenderPackage-2025-11-02.pdf');
        expect(result.data.fileName).toBe('package.pdf');
      }
    });
  });

  describe('deleteReleaseAction', () => {
    it('should soft delete release', async () => {
      (auth as any).mockResolvedValue({ userId: 'user-123' });
      (prisma.release.update as any).mockResolvedValue({});

      const result = await deleteReleaseAction('release-1');

      expect(result.success).toBe(true);
      expect(prisma.release.update).toHaveBeenCalledWith({
        where: { id: 'release-1' },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      });
    });
  });
});
