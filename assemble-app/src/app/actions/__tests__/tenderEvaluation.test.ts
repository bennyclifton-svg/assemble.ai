import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { getTenderEvaluation, saveTenderEvaluation, retrieveFromTenderSchedules } from '../tenderEvaluation';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-user-id' }),
}));

// Mock Prisma client
vi.mock('@/lib/db', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

// Import mocked prisma after setting up mock
import { prisma } from '@/lib/db';

describe('Tender Evaluation Actions', () => {
  beforeEach(() => {
    mockReset(prisma);
  });

  describe('getTenderEvaluation', () => {
    it('should fetch tender evaluation with consultant card ID', async () => {
      const mockEvaluation = {
        id: 'eval1',
        projectId: 'proj1',
        disciplineId: 'arch',
        consultantCardId: 'cons1',
        contractorCardId: null,
        grandTotal: 1500.0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user1',
        updatedBy: 'user1',
        tables: [
          {
            id: 'table1',
            evaluationId: 'eval1',
            tableNumber: 1,
            tableName: 'Original',
            subTotal: 1000.0,
            sortOrder: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            items: [
              {
                id: 'item1',
                tableId: 'table1',
                description: 'Concept Design',
                isCategory: false,
                parentCategoryId: null,
                categorySubTotal: null,
                sortOrder: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                firmPrices: [
                  {
                    id: 'price1',
                    lineItemId: 'item1',
                    firmId: 'firm1',
                    amount: 1000.0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    firm: {
                      id: 'firm1',
                      entity: 'Firm A',
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      vi.mocked(prisma.tenderEvaluation.findFirst).mockResolvedValue(mockEvaluation as any);

      const result = await getTenderEvaluation('proj1', 'arch', 'cons1');

      expect(result).toBeDefined();
      expect(result?.projectId).toBe('proj1');
      expect(result?.disciplineId).toBe('arch');
      expect(result?.consultantCardId).toBe('cons1');
      expect(result?.tables).toHaveLength(1);
    });

    it('should fetch tender evaluation with contractor card ID', async () => {
      const mockEvaluation = {
        id: 'eval1',
        projectId: 'proj1',
        disciplineId: 'struct',
        consultantCardId: null,
        contractorCardId: 'cont1',
        grandTotal: 1500.0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user1',
        updatedBy: 'user1',
        tables: [],
      };

      vi.mocked(prisma.tenderEvaluation.findFirst).mockResolvedValue(mockEvaluation as any);

      const result = await getTenderEvaluation('proj1', 'struct', undefined, 'cont1');

      expect(result).toBeDefined();
      expect(result?.contractorCardId).toBe('cont1');
    });

    it('should return null when no evaluation exists', async () => {
      vi.mocked(prisma.tenderEvaluation.findFirst).mockResolvedValue(null);

      const result = await getTenderEvaluation('proj1', 'arch', 'cons1');

      expect(result).toBeNull();
    });

    it('should throw error when database query fails', async () => {
      vi.mocked(prisma.tenderEvaluation.findFirst).mockRejectedValue(new Error('Database error'));

      await expect(getTenderEvaluation('proj1', 'arch', 'cons1')).rejects.toThrow(
        'Failed to fetch tender evaluation'
      );
    });
  });

  describe('retrieveFromTenderSchedules', () => {
    it('should return success false when no tender submission documents found', async () => {
      vi.mocked(prisma.document.findMany).mockResolvedValue([]);

      const result = await retrieveFromTenderSchedules('proj1', 'arch', 'eval1');

      expect(result.success).toBe(false);
      expect(result.message).toContain('No tender submission documents found');
    });

    it('should check for tender documents with correct path filter', async () => {
      vi.mocked(prisma.document.findMany).mockResolvedValue([
        {
          id: 'doc1',
          path: 'Tender Submissions/doc1.pdf',
          processingStatus: 'completed',
        } as any,
      ]);

      await retrieveFromTenderSchedules('proj1', 'arch', 'eval1');

      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: 'proj1',
            path: { contains: 'Tender Submissions' },
            processingStatus: 'completed',
          }),
        })
      );
    });

    it('should return mock price data when documents exist', async () => {
      vi.mocked(prisma.document.findMany).mockResolvedValue([
        {
          id: 'doc1',
          path: 'Tender Submissions/doc1.pdf',
          processingStatus: 'completed',
        } as any,
      ]);

      const result = await retrieveFromTenderSchedules('proj1', 'arch', 'eval1');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.items).toBeDefined();
      expect(Array.isArray(result.data.items)).toBe(true);
    });
  });
});
