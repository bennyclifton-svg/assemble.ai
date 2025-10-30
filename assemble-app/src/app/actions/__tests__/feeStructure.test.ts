import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getFeeStructure,
  saveFeeStructure,
  retrieveFromCostPlanning,
  exportFeeStructureForTender,
} from '../feeStructure';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import type { FeeStructureData } from '@/types/feeStructure';

// Mock dependencies
vi.mock('@clerk/nextjs/server');
vi.mock('@/lib/prisma', () => ({
  prisma: {
    card: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    section: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    item: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

describe('Fee Structure Server Actions - Story 3.5', () => {
  const mockUserId = 'user_123';
  const mockProjectId = 'project_456';
  const mockDisciplineId = 'architect';

  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue({ userId: mockUserId });
  });

  describe('AC 28, 31: Get and save fee structure', () => {
    it('should return empty items when no fee structure exists', async () => {
      (prisma.card.findFirst as any).mockResolvedValue(null);

      const result = await getFeeStructure(mockProjectId, mockDisciplineId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toEqual([]);
      }
    });

    it('should fetch existing fee structure from database', async () => {
      const mockCard = {
        id: 'card_123',
        sections: [
          {
            id: 'section_123',
            name: `fee-structure-${mockDisciplineId}`,
            items: [
              {
                id: 'item_1',
                order: 0,
                data: {
                  id: 'cat-1',
                  type: 'category',
                  description: 'Design Services',
                },
              },
              {
                id: 'item_2',
                order: 1,
                data: {
                  id: 'item-1',
                  type: 'item',
                  description: 'Concept Design',
                  quantity: '1',
                  unit: 'lot',
                  parentId: 'cat-1',
                },
              },
            ],
          },
        ],
      };

      (prisma.card.findFirst as any).mockResolvedValue(mockCard);

      const result = await getFeeStructure(mockProjectId, mockDisciplineId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(2);
        expect(result.data.items[0].type).toBe('category');
        expect(result.data.items[0].description).toBe('Design Services');
        expect(result.data.items[1].type).toBe('item');
        expect(result.data.items[1].description).toBe('Concept Design');
      }
    });

    it('should save fee structure to database', async () => {
      const mockFeeStructure: FeeStructureData = {
        items: [
          {
            id: 'cat-1',
            type: 'category',
            description: 'Professional Fees',
            order: 0,
          },
          {
            id: 'item-1',
            type: 'item',
            description: 'Design Fee',
            quantity: '1',
            unit: 'lot',
            order: 1,
            parentId: 'cat-1',
          },
        ],
      };

      const mockCard = {
        id: 'card_123',
        type: 'CONSULTANT',
      };

      const mockSection = {
        id: 'section_123',
        name: `fee-structure-${mockDisciplineId}`,
      };

      (prisma.card.findFirst as any).mockResolvedValue(mockCard);
      (prisma.section.findFirst as any).mockResolvedValue(mockSection);
      (prisma.item.deleteMany as any).mockResolvedValue({ count: 0 });
      (prisma.item.createMany as any).mockResolvedValue({ count: 2 });

      const result = await saveFeeStructure(mockProjectId, mockDisciplineId, mockFeeStructure);

      expect(result.success).toBe(true);
      expect(prisma.item.deleteMany).toHaveBeenCalledWith({
        where: { sectionId: mockSection.id },
      });
      expect(prisma.item.createMany).toHaveBeenCalled();
    });

    it('should create card and section if they do not exist', async () => {
      const mockFeeStructure: FeeStructureData = {
        items: [
          {
            id: 'item-1',
            type: 'item',
            description: 'New Item',
            quantity: '5',
            unit: 'ea',
            order: 0,
          },
        ],
      };

      (prisma.card.findFirst as any).mockResolvedValue(null);
      (prisma.card.create as any).mockResolvedValue({ id: 'new_card_123' });
      (prisma.section.findFirst as any).mockResolvedValue(null);
      (prisma.section.create as any).mockResolvedValue({ id: 'new_section_123' });
      (prisma.item.deleteMany as any).mockResolvedValue({ count: 0 });
      (prisma.item.createMany as any).mockResolvedValue({ count: 1 });

      const result = await saveFeeStructure(mockProjectId, mockDisciplineId, mockFeeStructure);

      expect(result.success).toBe(true);
      expect(prisma.card.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: mockProjectId,
            type: 'CONSULTANT',
          }),
        })
      );
      expect(prisma.section.create).toHaveBeenCalled();
    });
  });

  describe('AC 27: Retrieve from Cost Planning', () => {
    it('should retrieve fee structure from Cost Planning Card - Consultants section', async () => {
      const mockCostPlanningCard = {
        id: 'cost_card_123',
        type: 'COST_PLANNING',
        sections: [
          {
            id: 'tier2_section_123',
            name: 'Consultants',
            items: [
              {
                id: 'tier3_item_1',
                order: 0,
                data: {
                  type: 'category',
                  description: 'Design Consultants',
                },
              },
              {
                id: 'tier3_item_2',
                order: 1,
                data: {
                  description: 'Architectural Services',
                  quantity: '1',
                  unit: 'lot',
                },
              },
            ],
          },
        ],
      };

      (prisma.card.findFirst as any).mockResolvedValue(mockCostPlanningCard);

      const result = await retrieveFromCostPlanning(mockProjectId, mockDisciplineId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(2);
        expect(result.data.items[0].description).toBe('Design Consultants');
        expect(result.data.items[1].description).toBe('Architectural Services');
      }
    });

    it('should gracefully handle missing Cost Planning Card (AC 27)', async () => {
      (prisma.card.findFirst as any).mockResolvedValue(null);

      const result = await retrieveFromCostPlanning(mockProjectId, mockDisciplineId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
        expect(result.error.message).toContain('Cost Planning Card not found');
      }
    });

    it('should gracefully handle missing Tier 2 section (AC 27)', async () => {
      const mockCostPlanningCard = {
        id: 'cost_card_123',
        type: 'COST_PLANNING',
        sections: [], // No matching Tier 2 section
      };

      (prisma.card.findFirst as any).mockResolvedValue(mockCostPlanningCard);

      const result = await retrieveFromCostPlanning(mockProjectId, mockDisciplineId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('SECTION_NOT_FOUND');
        expect(result.error.message).toContain('Tier 2 section');
      }
    });

    it('should transform Tier 3 items to fee structure format', async () => {
      const mockCostPlanningCard = {
        id: 'cost_card_123',
        sections: [
          {
            id: 'tier2_section_123',
            name: 'Consultants',
            items: [
              {
                id: 'tier3_cat',
                order: 0,
                data: {
                  isCategory: true,
                  description: 'Professional Services',
                },
              },
              {
                id: 'tier3_item_1',
                order: 1,
                data: {
                  name: 'Engineering Consultancy',
                  quantity: '120',
                  unit: 'hours',
                  parentId: 'tier3_cat',
                },
              },
            ],
          },
        ],
      };

      (prisma.card.findFirst as any).mockResolvedValue(mockCostPlanningCard);

      const result = await retrieveFromCostPlanning(mockProjectId, mockDisciplineId);

      expect(result.success).toBe(true);
      if (result.success) {
        const items = result.data.items;
        expect(items[0].type).toBe('category');
        expect(items[0].description).toBe('Professional Services');
        expect(items[1].type).toBe('item');
        expect(items[1].description).toBe('Engineering Consultancy');
        expect(items[1].quantity).toBe('120');
        expect(items[1].unit).toBe('hours');
      }
    });
  });

  describe('AC 31: Export for tender package generation', () => {
    it('should export fee structure in tender-ready format', async () => {
      const mockCard = {
        id: 'card_123',
        sections: [
          {
            id: 'section_123',
            name: `fee-structure-${mockDisciplineId}`,
            items: [
              {
                id: 'item_1',
                order: 0,
                data: {
                  id: 'cat-1',
                  type: 'category',
                  description: 'Fee Schedule',
                },
              },
              {
                id: 'item_2',
                order: 1,
                data: {
                  id: 'item-1',
                  type: 'item',
                  description: 'Base Design Fee',
                  quantity: '1',
                  unit: 'lot',
                },
              },
            ],
          },
        ],
      };

      (prisma.card.findFirst as any).mockResolvedValue(mockCard);

      const result = await exportFeeStructureForTender(mockProjectId, mockDisciplineId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(2);
        expect(result.data.items[0].description).toBe('Fee Schedule');
        expect(result.data.items[1].description).toBe('Base Design Fee');
      }
    });
  });

  describe('Authorization', () => {
    it('should reject unauthorized requests', async () => {
      (auth as any).mockResolvedValue({ userId: null });

      const result = await getFeeStructure(mockProjectId, mockDisciplineId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNAUTHORIZED');
      }
    });
  });
});
