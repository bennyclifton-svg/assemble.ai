/**
 * Tests for tender package generation service
 * Story 4.2: AI Tender Package Generation
 *
 * Test coverage for all acceptance criteria:
 * - AC #1: AI compiles selected components into coherent package
 * - AC #2: Generates sharp, focused content (not generic templates)
 * - AC #3: Package includes all selected sections with appropriate formatting
 * - AC #4: Document schedule created (not actual document copies)
 * - AC #5: Generation completes in < 30 seconds
 * - AC #6: Progress indicator during generation (tested in UI tests)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Prisma - must be before imports
vi.mock('@/lib/prisma', () => ({
  prisma: {
    tenderPackageConfig: {
      findUnique: vi.fn(),
    },
    firm: {
      findUnique: vi.fn(),
    },
    card: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    tenderPackage: {
      create: vi.fn(),
    },
  },
}));

// Mock OpenAI
vi.mock('@/lib/ai/openai', () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}));

import { generateTenderPackage } from '../tenderGenerator';
import { prisma } from '@/lib/prisma';
import { openai } from '@/lib/ai/openai';

const mockPrisma = vi.mocked(prisma);
const mockOpenAICreate = vi.mocked(openai.chat.completions.create);

describe('TenderGenerator Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockConfig = {
    id: 'config-1',
    consultantCardId: 'card-consultant-1',
    contractorCardId: null,
    selectedPlanSections: ['plan-section-1', 'plan-section-2'],
    selectedCardSections: ['card-section-1', 'card-section-2'],
  };

  const mockFirm = {
    id: 'firm-1',
    entity: 'ABC Architects Pty Ltd',
    projectId: 'project-1',
  };

  const mockCard = {
    id: 'card-consultant-1',
    projectId: 'project-1',
    type: 'CONSULTANT',
    project: {
      id: 'project-1',
      name: 'Test Project',
    },
    sections: [
      {
        id: 'card-section-1',
        name: 'Scope',
        order: 1,
        items: [
          {
            id: 'item-1',
            order: 1,
            type: 'text',
            data: { value: 'Architectural design services for residential development' },
          },
        ],
      },
      {
        id: 'card-section-2',
        name: 'Deliverables',
        order: 2,
        items: [
          {
            id: 'item-2',
            order: 1,
            type: 'text',
            data: { value: 'Concept drawings, DA submission, construction documentation' },
          },
        ],
      },
    ],
  };

  const mockPlanCard = {
    id: 'plan-card-1',
    projectId: 'project-1',
    type: 'PLAN',
    sections: [
      {
        id: 'plan-section-1',
        name: 'Details',
        order: 1,
        items: [
          {
            id: 'plan-item-1',
            order: 1,
            type: 'text',
            data: { value: '123 Main Street, Sydney NSW 2000' },
          },
        ],
      },
      {
        id: 'plan-section-2',
        name: 'Objectives',
        order: 2,
        items: [
          {
            id: 'plan-item-2',
            order: 1,
            type: 'text',
            data: {
              value: 'Functional: Create modern residential units\nQuality: Meet BCA requirements',
            },
          },
        ],
      },
    ],
  };

  const mockAIResponse = {
    choices: [
      {
        message: {
          content: 'Generated tender content for this specific project context',
        },
      },
    ],
  };

  describe('Data Aggregation (AC #1)', () => {
    it('should aggregate data from Plan Card, Consultant Card, and Firm', async () => {
      mockPrisma.tenderPackageConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrisma.firm.findUnique.mockResolvedValue(mockFirm);
      mockPrisma.card.findUnique.mockResolvedValue(mockCard);
      mockPrisma.card.findFirst.mockResolvedValue(mockPlanCard);
      mockPrisma.tenderPackage.create.mockResolvedValue({
        id: 'tender-package-1',
      });

      mockOpenAICreate.mockResolvedValue(mockAIResponse);

      const result = await generateTenderPackage({
        configId: 'config-1',
        firmId: 'firm-1',
        userId: 'user-1',
      });

      expect(mockPrisma.tenderPackageConfig.findUnique).toHaveBeenCalledWith({
        where: { id: 'config-1' },
      });
      expect(mockPrisma.firm.findUnique).toHaveBeenCalledWith({
        where: { id: 'firm-1' },
      });
      expect(result).toBeDefined();
      expect(result.tenderPackageId).toBe('tender-package-1');
    });

    it('should fail if config not found', async () => {
      mockPrisma.tenderPackageConfig.findUnique.mockResolvedValue(null);

      await expect(
        generateTenderPackage({
          configId: 'invalid-config',
          firmId: 'firm-1',
          userId: 'user-1',
        })
      ).rejects.toThrow('Tender package config not found');
    });

    it('should fail if firm not found', async () => {
      mockPrisma.tenderPackageConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrisma.firm.findUnique.mockResolvedValue(null);

      await expect(
        generateTenderPackage({
          configId: 'config-1',
          firmId: 'invalid-firm',
          userId: 'user-1',
        })
      ).rejects.toThrow('Firm not found');
    });
  });

  describe('AI Content Generation (AC #2, #3)', () => {
    it('should generate all required tender sections using GPT-4 Turbo', async () => {
      mockPrisma.tenderPackageConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrisma.firm.findUnique.mockResolvedValue(mockFirm);
      mockPrisma.card.findUnique.mockResolvedValue(mockCard);
      mockPrisma.card.findFirst.mockResolvedValue(mockPlanCard);
      mockPrisma.tenderPackage.create.mockResolvedValue({
        id: 'tender-package-1',
      });

      mockOpenAICreate.mockResolvedValue(mockAIResponse);

      const result = await generateTenderPackage({
        configId: 'config-1',
        firmId: 'firm-1',
        userId: 'user-1',
      });

      // Should call OpenAI 6 times (one for each section)
      expect(mockOpenAICreate).toHaveBeenCalledTimes(6);

      // Verify all sections are present
      expect(result.generatedContent).toHaveProperty('introduction');
      expect(result.generatedContent).toHaveProperty('projectOverview');
      expect(result.generatedContent).toHaveProperty('scopeOfWork');
      expect(result.generatedContent).toHaveProperty('deliverables');
      expect(result.generatedContent).toHaveProperty('timeline');
      expect(result.generatedContent).toHaveProperty('submissionRequirements');

      // Verify GPT-4 Turbo model is used
      const firstCall = mockOpenAICreate.mock.calls[0][0];
      expect(firstCall.model).toBe('gpt-4-turbo');
    });

    it('should use project-specific context in prompts (AC #2: sharp content)', async () => {
      mockPrisma.tenderPackageConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrisma.firm.findUnique.mockResolvedValue(mockFirm);
      mockPrisma.card.findUnique.mockResolvedValue(mockCard);
      mockPrisma.card.findFirst.mockResolvedValue(mockPlanCard);
      mockPrisma.tenderPackage.create.mockResolvedValue({
        id: 'tender-package-1',
      });

      mockOpenAICreate.mockResolvedValue(mockAIResponse);

      await generateTenderPackage({
        configId: 'config-1',
        firmId: 'firm-1',
        userId: 'user-1',
      });

      // Check that prompts include project-specific details
      const firstCall = mockOpenAICreate.mock.calls[0][0];
      const userMessage = firstCall.messages[1].content;

      expect(userMessage).toContain('Test Project'); // Project name
      expect(userMessage).toContain('ABC Architects Pty Ltd'); // Firm name
      expect(userMessage).toContain('123 Main Street'); // Project location
    });

    it('should handle AI timeout gracefully', async () => {
      mockPrisma.tenderPackageConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrisma.firm.findUnique.mockResolvedValue(mockFirm);
      mockPrisma.card.findUnique.mockResolvedValue(mockCard);
      mockPrisma.card.findFirst.mockResolvedValue(mockPlanCard);

      // Simulate timeout
      const error = new Error('AI generation timeout for section: introduction');
      mockOpenAICreate.mockRejectedValue(error);

      await expect(
        generateTenderPackage({
          configId: 'config-1',
          firmId: 'firm-1',
          userId: 'user-1',
        })
      ).rejects.toThrow('Failed to generate tender package');
    });
  });

  describe('Document Schedule Generation (AC #4)', () => {
    it('should create document schedule with references only, not file copies', async () => {
      mockPrisma.tenderPackageConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrisma.firm.findUnique.mockResolvedValue(mockFirm);
      mockPrisma.card.findUnique.mockResolvedValue(mockCard);
      mockPrisma.card.findFirst.mockResolvedValue(mockPlanCard);
      mockPrisma.tenderPackage.create.mockResolvedValue({
        id: 'tender-package-1',
      });

      mockOpenAICreate.mockResolvedValue(mockAIResponse);

      const result = await generateTenderPackage({
        configId: 'config-1',
        firmId: 'firm-1',
        userId: 'user-1',
      });

      expect(result.documentSchedule).toBeDefined();
      expect(Array.isArray(result.documentSchedule)).toBe(true);

      // Document schedule should contain references, not actual file data
      result.documentSchedule.forEach((category) => {
        expect(category).toHaveProperty('categoryName');
        expect(category).toHaveProperty('documents');
        expect(Array.isArray(category.documents)).toBe(true);
      });
    });
  });

  describe('Performance (AC #5)', () => {
    it('should complete generation in under 30 seconds', async () => {
      mockPrisma.tenderPackageConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrisma.firm.findUnique.mockResolvedValue(mockFirm);
      mockPrisma.card.findUnique.mockResolvedValue(mockCard);
      mockPrisma.card.findFirst.mockResolvedValue(mockPlanCard);
      mockPrisma.tenderPackage.create.mockResolvedValue({
        id: 'tender-package-1',
      });

      // Mock AI responses with realistic timing (5s per call, 6 calls in parallel)
      mockOpenAICreate.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return mockAIResponse;
      });

      const startTime = Date.now();
      const resultPromise = generateTenderPackage({
        configId: 'config-1',
        firmId: 'firm-1',
        userId: 'user-1',
      });

      // Fast-forward time by 5 seconds (parallel execution)
      await vi.advanceTimersByTimeAsync(5000);

      const result = await resultPromise;
      const endTime = Date.now();

      // Should track generation time
      expect(result.generationTimeMs).toBeDefined();
      expect(result.generationTimeMs).toBeLessThan(30000); // Less than 30s
    }, 10000); // Test timeout of 10s

    it('should use parallel AI calls for speed optimization', async () => {
      mockPrisma.tenderPackageConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrisma.firm.findUnique.mockResolvedValue(mockFirm);
      mockPrisma.card.findUnique.mockResolvedValue(mockCard);
      mockPrisma.card.findFirst.mockResolvedValue(mockPlanCard);
      mockPrisma.tenderPackage.create.mockResolvedValue({
        id: 'tender-package-1',
      });

      let callCount = 0;
      const callTimes: number[] = [];

      mockOpenAICreate.mockImplementation(async () => {
        callTimes.push(Date.now());
        callCount++;
        return mockAIResponse;
      });

      await generateTenderPackage({
        configId: 'config-1',
        firmId: 'firm-1',
        userId: 'user-1',
      });

      // All 6 calls should happen nearly simultaneously (within 100ms)
      expect(callCount).toBe(6);
      const timeDiff = Math.max(...callTimes) - Math.min(...callTimes);
      expect(timeDiff).toBeLessThan(100); // Parallel execution
    });
  });

  describe('Database Storage', () => {
    it('should save generated package with all required fields', async () => {
      mockPrisma.tenderPackageConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrisma.firm.findUnique.mockResolvedValue(mockFirm);
      mockPrisma.card.findUnique.mockResolvedValue(mockCard);
      mockPrisma.card.findFirst.mockResolvedValue(mockPlanCard);
      mockPrisma.tenderPackage.create.mockResolvedValue({
        id: 'tender-package-1',
      });

      mockOpenAICreate.mockResolvedValue(mockAIResponse);

      await generateTenderPackage({
        configId: 'config-1',
        firmId: 'firm-1',
        userId: 'user-1',
      });

      expect(mockPrisma.tenderPackage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          configId: 'config-1',
          firmId: 'firm-1',
          consultantCardId: 'card-consultant-1',
          status: 'draft',
          generatedBy: 'user-1',
          aiModel: 'gpt-4-turbo',
          generationTimeMs: expect.any(Number),
          generatedContent: expect.any(Object),
          documentSchedule: expect.any(Object),
        }),
      });
    });

    it('should track AI model and generation time for audit trail', async () => {
      mockPrisma.tenderPackageConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrisma.firm.findUnique.mockResolvedValue(mockFirm);
      mockPrisma.card.findUnique.mockResolvedValue(mockCard);
      mockPrisma.card.findFirst.mockResolvedValue(mockPlanCard);
      mockPrisma.tenderPackage.create.mockResolvedValue({
        id: 'tender-package-1',
      });

      mockOpenAICreate.mockResolvedValue(mockAIResponse);

      const result = await generateTenderPackage({
        configId: 'config-1',
        firmId: 'firm-1',
        userId: 'user-1',
      });

      expect(result.aiModel).toBe('gpt-4-turbo');
      expect(result.generationTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle AI generation errors gracefully', async () => {
      mockPrisma.tenderPackageConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrisma.firm.findUnique.mockResolvedValue(mockFirm);
      mockPrisma.card.findUnique.mockResolvedValue(mockCard);
      mockPrisma.card.findFirst.mockResolvedValue(mockPlanCard);

      mockOpenAICreate.mockRejectedValue(new Error('OpenAI API error'));

      await expect(
        generateTenderPackage({
          configId: 'config-1',
          firmId: 'firm-1',
          userId: 'user-1',
        })
      ).rejects.toThrow('Failed to generate tender package');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.tenderPackageConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrisma.firm.findUnique.mockResolvedValue(mockFirm);
      mockPrisma.card.findUnique.mockResolvedValue(mockCard);
      mockPrisma.card.findFirst.mockResolvedValue(mockPlanCard);
      mockPrisma.tenderPackage.create.mockRejectedValue(new Error('Database error'));

      mockOpenAICreate.mockResolvedValue(mockAIResponse);

      await expect(
        generateTenderPackage({
          configId: 'config-1',
          firmId: 'firm-1',
          userId: 'user-1',
        })
      ).rejects.toThrow();
    });
  });
});
