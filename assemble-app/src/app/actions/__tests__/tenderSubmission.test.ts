import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import {
  getTenderSubmissionsAction,
  createTenderSubmissionAction,
  updateSubmissionDateAction,
  uploadSubmissionDocumentAction,
  deleteTenderSubmissionAction,
} from '../tenderSubmission';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    tenderSubmission: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('TenderSubmission Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTenderSubmissionsAction', () => {
    it('should return submissions for authorized user', async () => {
      const mockSubmissions = [
        {
          id: 'submission-1',
          firmId: 'firm-1',
          submissionNumber: 1,
          submissionDate: new Date('2025-11-02'),
          documentPath: 'Documents/Consultant/Structural/submission1.pdf',
          fileName: 'submission1.pdf',
        },
        {
          id: 'submission-2',
          firmId: 'firm-1',
          submissionNumber: 2,
          submissionDate: new Date('2025-11-03'),
          documentPath: 'Documents/Consultant/Structural/submission2.pdf',
          fileName: 'submission2.pdf',
        },
      ];

      (auth as any).mockResolvedValue({ userId: 'user-123' });
      (prisma.tenderSubmission.findMany as any).mockResolvedValue(mockSubmissions);

      const result = await getTenderSubmissionsAction('firm-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockSubmissions);
      }
      expect(prisma.tenderSubmission.findMany).toHaveBeenCalledWith({
        where: { firmId: 'firm-1', deletedAt: null },
        orderBy: { submissionNumber: 'asc' },
      });
    });

    it('should return unauthorized error when user is not authenticated', async () => {
      (auth as any).mockResolvedValue({ userId: null });

      const result = await getTenderSubmissionsAction('firm-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNAUTHORIZED');
      }
    });
  });

  describe('createTenderSubmissionAction', () => {
    it('should create submission with auto-incremented number', async () => {
      const mockLastSubmission = {
        id: 'submission-1',
        firmId: 'firm-1',
        submissionNumber: 2,
      };
      const mockNewSubmission = {
        id: 'submission-2',
        firmId: 'firm-1',
        submissionNumber: 3,
        submissionDate: new Date(),
        documentPath: 'Documents/Consultant/Structural/submission.pdf',
        fileName: 'submission.pdf',
      };

      (auth as any).mockResolvedValue({ userId: 'user-123' });
      (prisma.tenderSubmission.findFirst as any).mockResolvedValue(mockLastSubmission);
      (prisma.tenderSubmission.create as any).mockResolvedValue(mockNewSubmission);

      const result = await createTenderSubmissionAction(
        'firm-1',
        new Date(),
        'Documents/Consultant/Structural/submission.pdf',
        'submission.pdf'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.submissionNumber).toBe(3);
      }
    });

    it('should create submission with number 1 when no previous submissions exist', async () => {
      const mockNewSubmission = {
        id: 'submission-1',
        firmId: 'firm-1',
        submissionNumber: 1,
        submissionDate: new Date(),
        documentPath: 'Documents/Consultant/Structural/submission.pdf',
        fileName: 'submission.pdf',
      };

      (auth as any).mockResolvedValue({ userId: 'user-123' });
      (prisma.tenderSubmission.findFirst as any).mockResolvedValue(null);
      (prisma.tenderSubmission.create as any).mockResolvedValue(mockNewSubmission);

      const result = await createTenderSubmissionAction(
        'firm-1',
        new Date(),
        'Documents/Consultant/Structural/submission.pdf',
        'submission.pdf'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.submissionNumber).toBe(1);
      }
    });

    it('should auto-populate date when not provided', async () => {
      const mockSubmission = {
        id: 'submission-1',
        firmId: 'firm-1',
        submissionNumber: 1,
        submissionDate: new Date(),
        documentPath: null,
        fileName: null,
      };

      (auth as any).mockResolvedValue({ userId: 'user-123' });
      (prisma.tenderSubmission.findFirst as any).mockResolvedValue(null);
      (prisma.tenderSubmission.create as any).mockResolvedValue(mockSubmission);

      const result = await createTenderSubmissionAction('firm-1');

      expect(result.success).toBe(true);
    });
  });

  describe('updateSubmissionDateAction', () => {
    it('should update submission date', async () => {
      const newDate = new Date('2025-11-05');
      const mockSubmission = {
        id: 'submission-1',
        firmId: 'firm-1',
        submissionNumber: 1,
        submissionDate: newDate,
        documentPath: null,
        fileName: null,
      };

      (auth as any).mockResolvedValue({ userId: 'user-123' });
      (prisma.tenderSubmission.update as any).mockResolvedValue(mockSubmission);

      const result = await updateSubmissionDateAction('submission-1', newDate);

      expect(result.success).toBe(true);
      expect(prisma.tenderSubmission.update).toHaveBeenCalledWith({
        where: { id: 'submission-1' },
        data: expect.objectContaining({ submissionDate: newDate }),
      });
    });
  });

  describe('uploadSubmissionDocumentAction', () => {
    it('should upload document and auto-populate date', async () => {
      const mockSubmission = {
        id: 'submission-1',
        firmId: 'firm-1',
        submissionNumber: 1,
        submissionDate: new Date(),
        documentPath: 'Documents/Consultant/Structural/submission.pdf',
        fileName: 'submission.pdf',
      };

      (auth as any).mockResolvedValue({ userId: 'user-123' });
      (prisma.tenderSubmission.update as any).mockResolvedValue(mockSubmission);

      const result = await uploadSubmissionDocumentAction(
        'submission-1',
        'Documents/Consultant/Structural/submission.pdf',
        'submission.pdf'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.documentPath).toBe('Documents/Consultant/Structural/submission.pdf');
        expect(result.data.fileName).toBe('submission.pdf');
      }
    });
  });

  describe('deleteTenderSubmissionAction', () => {
    it('should soft delete submission', async () => {
      (auth as any).mockResolvedValue({ userId: 'user-123' });
      (prisma.tenderSubmission.update as any).mockResolvedValue({});

      const result = await deleteTenderSubmissionAction('submission-1');

      expect(result.success).toBe(true);
      expect(prisma.tenderSubmission.update).toHaveBeenCalledWith({
        where: { id: 'submission-1' },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('submission numbering with gaps', () => {
    it('should maintain incrementing numbers even when submissions are deleted', async () => {
      // Simulate submission 1 deleted, submission 2 exists
      const mockLastSubmission = {
        id: 'submission-2',
        firmId: 'firm-1',
        submissionNumber: 2,
        deletedAt: null,
      };
      const mockNewSubmission = {
        id: 'submission-3',
        firmId: 'firm-1',
        submissionNumber: 3,
        submissionDate: new Date(),
        documentPath: null,
        fileName: null,
      };

      (auth as any).mockResolvedValue({ userId: 'user-123' });
      // findFirst includes deleted submissions (no deletedAt filter in query)
      (prisma.tenderSubmission.findFirst as any).mockResolvedValue(mockLastSubmission);
      (prisma.tenderSubmission.create as any).mockResolvedValue(mockNewSubmission);

      const result = await createTenderSubmissionAction('firm-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.submissionNumber).toBe(3);
      }
    });
  });
});
