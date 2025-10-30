import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { saveTenderSelection, loadTenderSelection, getDocumentRegister } from '../tender';
import type { TenderSelection } from '../tender';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    tenderPackageDocument: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    tenderPackageSection: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

// Mock Next.js revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

describe('Tender Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveTenderSelection (AC8)', () => {
    it('should return error if user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const result = await saveTenderSelection({
        projectId: 'project-1',
        tenderPackageId: 'tender-1',
        selection: {
          documents: [],
          sections: { plan: [], consultant: {}, contractor: {} },
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should save document selections to database', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      const mockTransaction = vi.fn(async (callback) => {
        const mockTx = {
          tenderPackageDocument: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
          tenderPackageSection: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
        };
        return callback(mockTx);
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction as any);

      const selection: TenderSelection = {
        documents: ['doc-1', 'doc-2', 'doc-3'],
        sections: { plan: [], consultant: {}, contractor: {} },
      };

      const result = await saveTenderSelection({
        projectId: 'project-1',
        tenderPackageId: 'tender-1',
        selection,
      });

      expect(result.success).toBe(true);
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it('should save plan section selections to database (AC3)', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      let savedSections: any[] = [];

      const mockTransaction = vi.fn(async (callback) => {
        const mockTx = {
          tenderPackageDocument: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
          tenderPackageSection: {
            deleteMany: vi.fn(),
            createMany: vi.fn((args: any) => {
              savedSections = args.data;
            }),
          },
        };
        return callback(mockTx);
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction as any);

      const selection: TenderSelection = {
        documents: [],
        sections: {
          plan: ['section-1', 'section-2'],
          consultant: {},
          contractor: {},
        },
      };

      const result = await saveTenderSelection({
        projectId: 'project-1',
        tenderPackageId: 'tender-1',
        selection,
      });

      expect(result.success).toBe(true);
      expect(savedSections).toHaveLength(2);
      expect(savedSections[0]).toMatchObject({
        tenderPackageId: 'tender-1',
        sectionId: 'section-1',
        cardType: 'PLAN',
        discipline: null,
        createdBy: 'user-123',
      });
    });

    it('should save consultant section selections by discipline (AC4)', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      let savedSections: any[] = [];

      const mockTransaction = vi.fn(async (callback) => {
        const mockTx = {
          tenderPackageDocument: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
          tenderPackageSection: {
            deleteMany: vi.fn(),
            createMany: vi.fn((args: any) => {
              savedSections = args.data;
            }),
          },
        };
        return callback(mockTx);
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction as any);

      const selection: TenderSelection = {
        documents: [],
        sections: {
          plan: [],
          consultant: {
            architect: ['scope-1', 'deliverables-1'],
            structural: ['scope-2'],
          },
          contractor: {},
        },
      };

      const result = await saveTenderSelection({
        projectId: 'project-1',
        tenderPackageId: 'tender-1',
        selection,
      });

      expect(result.success).toBe(true);
      expect(savedSections).toHaveLength(3);

      const architectSections = savedSections.filter((s) => s.discipline === 'architect');
      expect(architectSections).toHaveLength(2);
      expect(architectSections[0].cardType).toBe('CONSULTANT');

      const structuralSections = savedSections.filter((s) => s.discipline === 'structural');
      expect(structuralSections).toHaveLength(1);
    });

    it('should save contractor section selections by trade (AC5)', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      let savedSections: any[] = [];

      const mockTransaction = vi.fn(async (callback) => {
        const mockTx = {
          tenderPackageDocument: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
          tenderPackageSection: {
            deleteMany: vi.fn(),
            createMany: vi.fn((args: any) => {
              savedSections = args.data;
            }),
          },
        };
        return callback(mockTx);
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction as any);

      const selection: TenderSelection = {
        documents: [],
        sections: {
          plan: [],
          consultant: {},
          contractor: {
            electrical: ['scope-1'],
            plumbing: ['scope-2', 'deliverables-2'],
          },
        },
      };

      const result = await saveTenderSelection({
        projectId: 'project-1',
        tenderPackageId: 'tender-1',
        selection,
      });

      expect(result.success).toBe(true);
      expect(savedSections).toHaveLength(3);

      const electricalSections = savedSections.filter((s) => s.discipline === 'electrical');
      expect(electricalSections).toHaveLength(1);
      expect(electricalSections[0].cardType).toBe('CONTRACTOR');
    });

    it('should clear existing selections before saving new ones', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      const deleteManyCalls: any[] = [];

      const mockTransaction = vi.fn(async (callback) => {
        const mockTx = {
          tenderPackageDocument: {
            deleteMany: vi.fn((args: any) => {
              deleteManyCalls.push({ type: 'document', args });
            }),
            createMany: vi.fn(),
          },
          tenderPackageSection: {
            deleteMany: vi.fn((args: any) => {
              deleteManyCalls.push({ type: 'section', args });
            }),
            createMany: vi.fn(),
          },
        };
        return callback(mockTx);
      });

      vi.mocked(prisma.$transaction).mockImplementation(mockTransaction as any);

      const selection: TenderSelection = {
        documents: ['doc-1'],
        sections: { plan: ['section-1'], consultant: {}, contractor: {} },
      };

      await saveTenderSelection({
        projectId: 'project-1',
        tenderPackageId: 'tender-1',
        selection,
      });

      expect(deleteManyCalls).toHaveLength(2);
      expect(deleteManyCalls[0].type).toBe('document');
      expect(deleteManyCalls[0].args.where.tenderPackageId).toBe('tender-1');
      expect(deleteManyCalls[1].type).toBe('section');
      expect(deleteManyCalls[1].args.where.tenderPackageId).toBe('tender-1');
    });
  });

  describe('loadTenderSelection (AC9)', () => {
    it('should return error if user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const result = await loadTenderSelection({
        projectId: 'project-1',
        tenderPackageId: 'tender-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should load document selections from database', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      vi.mocked(prisma.tenderPackageDocument.findMany).mockResolvedValue([
        { documentId: 'doc-1' },
        { documentId: 'doc-2' },
        { documentId: 'doc-3' },
      ] as any);

      vi.mocked(prisma.tenderPackageSection.findMany).mockResolvedValue([]);

      const result = await loadTenderSelection({
        projectId: 'project-1',
        tenderPackageId: 'tender-1',
      });

      expect(result.success).toBe(true);
      expect(result.data?.documents).toHaveLength(3);
      expect(result.data?.documents).toContain('doc-1');
      expect(result.data?.documents).toContain('doc-2');
      expect(result.data?.documents).toContain('doc-3');
    });

    it('should load plan section selections from database (AC3)', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      vi.mocked(prisma.tenderPackageDocument.findMany).mockResolvedValue([]);

      vi.mocked(prisma.tenderPackageSection.findMany).mockResolvedValue([
        { sectionId: 'section-1', cardType: 'PLAN', discipline: null },
        { sectionId: 'section-2', cardType: 'PLAN', discipline: null },
      ] as any);

      const result = await loadTenderSelection({
        projectId: 'project-1',
        tenderPackageId: 'tender-1',
      });

      expect(result.success).toBe(true);
      expect(result.data?.sections.plan).toHaveLength(2);
      expect(result.data?.sections.plan).toContain('section-1');
      expect(result.data?.sections.plan).toContain('section-2');
    });

    it('should load consultant section selections grouped by discipline (AC4)', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      vi.mocked(prisma.tenderPackageDocument.findMany).mockResolvedValue([]);

      vi.mocked(prisma.tenderPackageSection.findMany).mockResolvedValue([
        { sectionId: 'scope-1', cardType: 'CONSULTANT', discipline: 'architect' },
        { sectionId: 'deliverables-1', cardType: 'CONSULTANT', discipline: 'architect' },
        { sectionId: 'scope-2', cardType: 'CONSULTANT', discipline: 'structural' },
      ] as any);

      const result = await loadTenderSelection({
        projectId: 'project-1',
        tenderPackageId: 'tender-1',
      });

      expect(result.success).toBe(true);
      expect(result.data?.sections.consultant.architect).toHaveLength(2);
      expect(result.data?.sections.consultant.architect).toContain('scope-1');
      expect(result.data?.sections.consultant.architect).toContain('deliverables-1');
      expect(result.data?.sections.consultant.structural).toHaveLength(1);
      expect(result.data?.sections.consultant.structural).toContain('scope-2');
    });

    it('should load contractor section selections grouped by trade (AC5)', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      vi.mocked(prisma.tenderPackageDocument.findMany).mockResolvedValue([]);

      vi.mocked(prisma.tenderPackageSection.findMany).mockResolvedValue([
        { sectionId: 'scope-1', cardType: 'CONTRACTOR', discipline: 'electrical' },
        { sectionId: 'scope-2', cardType: 'CONTRACTOR', discipline: 'plumbing' },
        { sectionId: 'deliverables-2', cardType: 'CONTRACTOR', discipline: 'plumbing' },
      ] as any);

      const result = await loadTenderSelection({
        projectId: 'project-1',
        tenderPackageId: 'tender-1',
      });

      expect(result.success).toBe(true);
      expect(result.data?.sections.contractor.electrical).toHaveLength(1);
      expect(result.data?.sections.contractor.electrical).toContain('scope-1');
      expect(result.data?.sections.contractor.plumbing).toHaveLength(2);
      expect(result.data?.sections.contractor.plumbing).toContain('scope-2');
      expect(result.data?.sections.contractor.plumbing).toContain('deliverables-2');
    });
  });

  describe('getDocumentRegister (AC6, AC10)', () => {
    it('should return error if user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const result = await getDocumentRegister('tender-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should return formatted document schedule (AC6)', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      vi.mocked(prisma.tenderPackageDocument.findMany).mockResolvedValue([
        {
          document: {
            id: 'doc-1',
            name: 'plan.pdf',
            displayName: 'Project Plan',
            path: '/plans',
            size: 1024000,
            url: 'https://s3.example.com/plan.pdf',
            tags: ['plan', 'important'],
          },
          includeInSchedule: true,
        },
        {
          document: {
            id: 'doc-2',
            name: 'spec.pdf',
            displayName: 'Specifications',
            path: '/specs',
            size: 2048000,
            url: 'https://s3.example.com/spec.pdf',
            tags: ['spec'],
          },
          includeInSchedule: true,
        },
      ] as any);

      vi.mocked(prisma.tenderPackageSection.findMany).mockResolvedValue([]);

      const result = await getDocumentRegister('tender-1');

      expect(result.success).toBe(true);
      expect(result.data?.documents).toHaveLength(2);
      expect(result.data?.documents[0]).toMatchObject({
        number: 1,
        id: 'doc-1',
        name: 'Project Plan',
        filename: 'plan.pdf',
        path: '/plans',
        size: 1024000,
        url: 'https://s3.example.com/plan.pdf',
        tags: ['plan', 'important'],
        includeInSchedule: true,
      });
    });

    it('should return section content with items (AC10)', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any);

      vi.mocked(prisma.tenderPackageDocument.findMany).mockResolvedValue([]);

      vi.mocked(prisma.tenderPackageSection.findMany).mockResolvedValue([
        {
          sectionId: 'section-1',
          cardType: 'PLAN',
          discipline: null,
          section: {
            name: 'Project Details',
            items: [
              { id: 'item-1', type: 'text', data: { label: 'Title', value: 'Project X' }, order: 1 },
              { id: 'item-2', type: 'date', data: { label: 'Start Date', value: '2025-01-01' }, order: 2 },
            ],
            card: {
              id: 'card-1',
              type: 'PLAN',
            },
          },
        },
        {
          sectionId: 'section-2',
          cardType: 'CONSULTANT',
          discipline: 'architect',
          section: {
            name: 'Scope of Work',
            items: [
              { id: 'item-3', type: 'text', data: { label: 'Description', value: 'Design services' }, order: 1 },
            ],
            card: {
              id: 'card-2',
              type: 'CONSULTANT',
            },
          },
        },
      ] as any);

      const result = await getDocumentRegister('tender-1');

      expect(result.success).toBe(true);
      expect(result.data?.sections).toHaveLength(2);

      const planSection = result.data?.sections[0];
      expect(planSection).toMatchObject({
        sectionId: 'section-1',
        sectionName: 'Project Details',
        cardType: 'PLAN',
        discipline: null,
      });
      expect(planSection?.items).toHaveLength(2);
      expect(planSection?.items[0]).toMatchObject({
        id: 'item-1',
        type: 'text',
        order: 1,
      });

      const consultantSection = result.data?.sections[1];
      expect(consultantSection).toMatchObject({
        sectionId: 'section-2',
        sectionName: 'Scope of Work',
        cardType: 'CONSULTANT',
        discipline: 'architect',
      });
      expect(consultantSection?.items).toHaveLength(1);
    });
  });
});
