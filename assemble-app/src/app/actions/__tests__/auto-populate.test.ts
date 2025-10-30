import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies BEFORE imports
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    document: {
      findUnique: vi.fn(),
    },
    card: {
      findUnique: vi.fn(),
    },
    section: {
      create: vi.fn(),
    },
    item: {
      create: vi.fn(),
      update: vi.fn(),
    },
    aIPopulationHistory: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/services/supabaseStorage', () => ({
  uploadToS3: vi.fn(),
  generateS3Key: vi.fn(),
  getSignedDownloadUrl: vi.fn(),
}));

// Now safe to import
import { autoPopulateFields } from '../document';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

describe('autoPopulateFields', () => {
  const mockUserId = 'user_test123';
  const mockDocumentId = 'doc_123';
  const mockCardId = 'card_123';

  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockReturnValue({ userId: mockUserId });
  });

  describe('Authentication (AC3)', () => {
    it('should return error if user not authenticated', async () => {
      (auth as any).mockReturnValue({ userId: null });

      const result = await autoPopulateFields(mockDocumentId, mockCardId, 'Details');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Document validation (AC3)', () => {
    it('should return error if document not found', async () => {
      (prisma.document.findUnique as any).mockResolvedValue(null);

      const result = await autoPopulateFields(mockDocumentId, mockCardId, 'Details');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should return error if document has no extracted data', async () => {
      (prisma.document.findUnique as any).mockResolvedValue({
        id: mockDocumentId,
        extractedData: null,
        processingStatus: 'pending',
      });

      const result = await autoPopulateFields(mockDocumentId, mockCardId, 'Details');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NO_EXTRACTED_DATA');
    });

    it('should return error if document not yet processed', async () => {
      (prisma.document.findUnique as any).mockResolvedValue({
        id: mockDocumentId,
        extractedData: { projectName: 'Test' },
        processingStatus: 'pending',
      });

      const result = await autoPopulateFields(mockDocumentId, mockCardId, 'Details');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NO_EXTRACTED_DATA');
    });
  });

  describe('Card validation (AC4)', () => {
    it('should return error if card not found', async () => {
      (prisma.document.findUnique as any).mockResolvedValue({
        id: mockDocumentId,
        extractedData: { projectName: 'Test' },
        processingStatus: 'completed',
      });
      (prisma.card.findUnique as any).mockResolvedValue(null);

      const result = await autoPopulateFields(mockDocumentId, mockCardId, 'Details');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CARD_NOT_FOUND');
    });
  });

  describe('Plan Card - Details section (AC4)', () => {
    it('should populate project details fields correctly', async () => {
      const mockExtractedData = {
        projectName: 'Test Building',
        address: '123 Main St',
        zoning: 'Commercial',
        jurisdiction: 'City Center',
      };

      (prisma.document.findUnique as any).mockResolvedValue({
        id: mockDocumentId,
        extractedData: mockExtractedData,
        processingStatus: 'completed',
      });

      (prisma.card.findUnique as any).mockResolvedValue({
        id: mockCardId,
        type: 'PLAN',
        sections: [],
      });

      (prisma.section.create as any).mockResolvedValue({
        id: 'section_123',
        name: 'Details',
        items: [],
      });

      (prisma.item.create as any).mockResolvedValue({});
      (prisma.aIPopulationHistory.create as any).mockResolvedValue({});

      const result = await autoPopulateFields(mockDocumentId, mockCardId, 'Details');

      expect(result.success).toBe(true);
      expect(result.data?.fields).toHaveProperty('projectName', 'Test Building');
      expect(result.data?.fields).toHaveProperty('address', '123 Main St');
      expect(result.data?.fields).toHaveProperty('zoning', 'Commercial');
      expect(result.data?.source).toBe(mockDocumentId);
    });
  });

  describe('Plan Card - Stakeholders section (AC4)', () => {
    it('should populate stakeholder fields with all contact details', async () => {
      const mockExtractedData = {
        stakeholders: [
          {
            role: 'Architect',
            organization: 'ABC Architects',
            name: 'John Doe',
            email: 'john@abc.com',
            mobile: '+1234567890',
          },
          {
            role: 'Client',
            organization: 'XYZ Corp',
            name: 'Jane Smith',
            email: 'jane@xyz.com',
            mobile: '+0987654321',
          },
        ],
      };

      (prisma.document.findUnique as any).mockResolvedValue({
        id: mockDocumentId,
        extractedData: mockExtractedData,
        processingStatus: 'completed',
      });

      (prisma.card.findUnique as any).mockResolvedValue({
        id: mockCardId,
        type: 'PLAN',
        sections: [],
      });

      (prisma.section.create as any).mockResolvedValue({
        id: 'section_123',
        name: 'Stakeholders',
        items: [],
      });

      (prisma.item.create as any).mockResolvedValue({});
      (prisma.aIPopulationHistory.create as any).mockResolvedValue({});

      const result = await autoPopulateFields(mockDocumentId, mockCardId, 'Stakeholders');

      expect(result.success).toBe(true);
      expect(result.data?.fields).toHaveProperty('stakeholders');
      const stakeholders = result.data?.fields.stakeholders;
      expect(stakeholders).toHaveLength(2);
      expect(stakeholders[0]).toEqual({
        role: 'Architect',
        organization: 'ABC Architects',
        name: 'John Doe',
        email: 'john@abc.com',
        mobile: '+1234567890',
      });
    });
  });

  describe('Plan Card - Objectives section (AC4)', () => {
    it('should filter and group objectives by type', async () => {
      const mockExtractedData = {
        objectives: [
          { type: 'functional', description: 'Functional goal 1' },
          { type: 'quality', description: 'Quality goal 1' },
          { type: 'functional', description: 'Functional goal 2' },
          { type: 'budget', description: 'Budget goal 1' },
        ],
      };

      (prisma.document.findUnique as any).mockResolvedValue({
        id: mockDocumentId,
        extractedData: mockExtractedData,
        processingStatus: 'completed',
      });

      (prisma.card.findUnique as any).mockResolvedValue({
        id: mockCardId,
        type: 'PLAN',
        sections: [],
      });

      (prisma.section.create as any).mockResolvedValue({
        id: 'section_123',
        name: 'Objectives',
        items: [],
      });

      (prisma.item.create as any).mockResolvedValue({});
      (prisma.aIPopulationHistory.create as any).mockResolvedValue({});

      const result = await autoPopulateFields(mockDocumentId, mockCardId, 'Objectives');

      expect(result.success).toBe(true);
      const fields = result.data?.fields;
      expect(fields?.functional).toHaveLength(2);
      expect(fields?.quality).toHaveLength(1);
      expect(fields?.budget).toHaveLength(1);
    });
  });

  describe('Plan Card - Staging section (AC4)', () => {
    it('should populate stages with name, dates, and description', async () => {
      const mockExtractedData = {
        stages: [
          {
            name: 'Design',
            startDate: '2025-01-01',
            endDate: '2025-03-31',
            description: 'Design phase',
          },
          {
            name: 'Construction',
            date: '2025-04-01',
            description: 'Construction phase',
          },
        ],
      };

      (prisma.document.findUnique as any).mockResolvedValue({
        id: mockDocumentId,
        extractedData: mockExtractedData,
        processingStatus: 'completed',
      });

      (prisma.card.findUnique as any).mockResolvedValue({
        id: mockCardId,
        type: 'PLAN',
        sections: [],
      });

      (prisma.section.create as any).mockResolvedValue({
        id: 'section_123',
        name: 'Staging',
        items: [],
      });

      (prisma.item.create as any).mockResolvedValue({});
      (prisma.aIPopulationHistory.create as any).mockResolvedValue({});

      const result = await autoPopulateFields(mockDocumentId, mockCardId, 'Staging');

      expect(result.success).toBe(true);
      const stages = result.data?.fields.stages;
      expect(stages).toHaveLength(2);
      expect(stages[0].startDate).toBe('2025-01-01');
      expect(stages[1].startDate).toBe('2025-04-01'); // Uses date if startDate not present
    });
  });

  describe('Plan Card - Risk section (AC4)', () => {
    it('should populate risk fields with title, description, and mitigation', async () => {
      const mockExtractedData = {
        risks: [
          {
            title: 'Schedule Risk',
            description: 'Potential delays',
            mitigation: 'Add buffer time',
            probability: 'medium',
            impact: 'high',
          },
          'Simple risk text', // Test string format
        ],
      };

      (prisma.document.findUnique as any).mockResolvedValue({
        id: mockDocumentId,
        extractedData: mockExtractedData,
        processingStatus: 'completed',
      });

      (prisma.card.findUnique as any).mockResolvedValue({
        id: mockCardId,
        type: 'PLAN',
        sections: [],
      });

      (prisma.section.create as any).mockResolvedValue({
        id: 'section_123',
        name: 'Risk',
        items: [],
      });

      (prisma.item.create as any).mockResolvedValue({});
      (prisma.aIPopulationHistory.create as any).mockResolvedValue({});

      const result = await autoPopulateFields(mockDocumentId, mockCardId, 'Risk');

      expect(result.success).toBe(true);
      const risks = result.data?.fields.risks;
      expect(risks).toHaveLength(2);
      expect(risks[0]).toHaveProperty('title', 'Schedule Risk');
      expect(risks[0]).toHaveProperty('probability', 'medium');
      expect(risks[1]).toEqual({ title: 'Simple risk text', description: '', mitigation: '' });
    });
  });

  describe('Consultant Card sections (AC4)', () => {
    it('should populate Scope section with items', async () => {
      const mockExtractedData = {
        scopeItems: ['Item 1', 'Item 2', 'Item 3'],
      };

      (prisma.document.findUnique as any).mockResolvedValue({
        id: mockDocumentId,
        extractedData: mockExtractedData,
        processingStatus: 'completed',
      });

      (prisma.card.findUnique as any).mockResolvedValue({
        id: mockCardId,
        type: 'CONSULTANT',
        sections: [],
      });

      (prisma.section.create as any).mockResolvedValue({
        id: 'section_123',
        name: 'Scope',
        items: [],
      });

      (prisma.item.create as any).mockResolvedValue({});
      (prisma.aIPopulationHistory.create as any).mockResolvedValue({});

      const result = await autoPopulateFields(mockDocumentId, mockCardId, 'Scope');

      expect(result.success).toBe(true);
      expect(result.data?.fields.items).toEqual(['Item 1', 'Item 2', 'Item 3']);
    });

    it('should populate Fee Structure section', async () => {
      const mockExtractedData = {
        feeStructure: [
          { stage: 'Design', amount: 50000 },
          { stage: 'Construction Admin', amount: 75000 },
        ],
      };

      (prisma.document.findUnique as any).mockResolvedValue({
        id: mockDocumentId,
        extractedData: mockExtractedData,
        processingStatus: 'completed',
      });

      (prisma.card.findUnique as any).mockResolvedValue({
        id: mockCardId,
        type: 'CONSULTANT',
        sections: [],
      });

      (prisma.section.create as any).mockResolvedValue({
        id: 'section_123',
        name: 'Fee Structure',
        items: [],
      });

      (prisma.item.create as any).mockResolvedValue({});
      (prisma.aIPopulationHistory.create as any).mockResolvedValue({});

      const result = await autoPopulateFields(mockDocumentId, mockCardId, 'Fee Structure');

      expect(result.success).toBe(true);
      expect(result.data?.fields.stages).toHaveLength(2);
      expect(result.data?.fields.stages[0]).toEqual({ stage: 'Design', amount: 50000 });
    });
  });

  describe('Data filtering', () => {
    it('should filter out null and undefined values', async () => {
      const mockExtractedData = {
        projectName: 'Test',
        address: null,
        zoning: undefined,
        jurisdiction: '',
      };

      (prisma.document.findUnique as any).mockResolvedValue({
        id: mockDocumentId,
        extractedData: mockExtractedData,
        processingStatus: 'completed',
      });

      (prisma.card.findUnique as any).mockResolvedValue({
        id: mockCardId,
        type: 'PLAN',
        sections: [],
      });

      (prisma.section.create as any).mockResolvedValue({
        id: 'section_123',
        name: 'Details',
        items: [],
      });

      (prisma.item.create as any).mockResolvedValue({});
      (prisma.aIPopulationHistory.create as any).mockResolvedValue({});

      const result = await autoPopulateFields(mockDocumentId, mockCardId, 'Details');

      expect(result.success).toBe(true);
      expect(result.data?.fields).toHaveProperty('projectName');
      expect(result.data?.fields).not.toHaveProperty('address');
      expect(result.data?.fields).not.toHaveProperty('zoning');
      expect(result.data?.fields).not.toHaveProperty('jurisdiction');
    });

    it('should filter out empty arrays', async () => {
      const mockExtractedData = {
        stakeholders: [],
        objectives: [],
      };

      (prisma.document.findUnique as any).mockResolvedValue({
        id: mockDocumentId,
        extractedData: mockExtractedData,
        processingStatus: 'completed',
      });

      (prisma.card.findUnique as any).mockResolvedValue({
        id: mockCardId,
        type: 'PLAN',
        sections: [],
      });

      const result = await autoPopulateFields(mockDocumentId, mockCardId, 'Stakeholders');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NO_MAPPABLE_DATA');
    });
  });

  describe('AIPopulationHistory tracking (AC8)', () => {
    it('should create AIPopulationHistory record after successful population', async () => {
      const mockExtractedData = {
        projectName: 'Test Building',
      };

      (prisma.document.findUnique as any).mockResolvedValue({
        id: mockDocumentId,
        extractedData: mockExtractedData,
        processingStatus: 'completed',
      });

      (prisma.card.findUnique as any).mockResolvedValue({
        id: mockCardId,
        type: 'PLAN',
        sections: [],
      });

      (prisma.section.create as any).mockResolvedValue({
        id: 'section_123',
        name: 'Details',
        items: [],
      });

      (prisma.item.create as any).mockResolvedValue({});
      (prisma.aIPopulationHistory.create as any).mockResolvedValue({});

      await autoPopulateFields(mockDocumentId, mockCardId, 'Details');

      expect(prisma.aIPopulationHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          documentId: mockDocumentId,
          cardId: mockCardId,
          section: 'Details',
          createdBy: mockUserId,
        }),
      });
    });
  });

  describe('Merge with existing data (AC6)', () => {
    it('should update existing items rather than create duplicates', async () => {
      const mockExtractedData = {
        projectName: 'Updated Name',
      };

      const existingSection = {
        id: 'section_existing',
        name: 'Details',
        items: [
          {
            id: 'item_existing',
            data: { fieldName: 'projectName', value: 'Old Name', aiPopulated: false },
            deletedAt: null,
          },
        ],
      };

      (prisma.document.findUnique as any).mockResolvedValue({
        id: mockDocumentId,
        extractedData: mockExtractedData,
        processingStatus: 'completed',
      });

      (prisma.card.findUnique as any).mockResolvedValue({
        id: mockCardId,
        type: 'PLAN',
        sections: [existingSection],
      });

      (prisma.item.update as any).mockResolvedValue({});
      (prisma.aIPopulationHistory.create as any).mockResolvedValue({});

      const result = await autoPopulateFields(mockDocumentId, mockCardId, 'Details');

      expect(result.success).toBe(true);
      expect(prisma.item.update).toHaveBeenCalledWith({
        where: { id: 'item_existing' },
        data: expect.objectContaining({
          data: expect.objectContaining({
            fieldName: 'projectName',
            value: 'Updated Name',
            aiPopulated: true,
          }),
        }),
      });
      expect(prisma.item.create).not.toHaveBeenCalled();
    });
  });
});
