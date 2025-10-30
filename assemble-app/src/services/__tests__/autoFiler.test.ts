import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { AutoFiler, FilingContext } from '../autoFiler';
import { prisma } from '@/lib/prisma';

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    firm: {
      findFirst: vi.fn(),
      create: vi.fn(),
      aggregate: vi.fn(),
    },
    document: {
      count: vi.fn(),
    },
  },
}));

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ userId: 'test-user-id' })),
}));

describe('AutoFiler Service', () => {
  let autoFiler: AutoFiler;
  const mockProjectId = 'project-123';

  beforeEach(() => {
    autoFiler = new AutoFiler();
    vi.clearAllMocks();
  });

  describe('AC1: Invoice auto-filing with firm creation', () => {
    it('should detect invoice by filename pattern "invoice"', async () => {
      const context: FilingContext = {
        uploadLocation: 'general',
        firmName: 'ABC Construction',
      };

      // Mock firm exists
      (prisma.firm.findFirst as Mock).mockResolvedValue({
        id: 'firm-1',
        entity: 'ABC Construction',
      });

      // Mock existing invoice count
      (prisma.document.count as Mock).mockResolvedValue(0);

      const result = await autoFiler.determineFilingPath(
        'invoice-march-2024.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Invoices');
      expect(result.displayName).toBe('ABC Construction_Invoice_001.PDF');
      expect(result.firmId).toBe('firm-1');
    });

    it('should detect invoice by filename pattern "inv"', async () => {
      const context: FilingContext = {
        uploadLocation: 'general',
        firmName: 'XYZ Corp',
      };

      (prisma.firm.findFirst as Mock).mockResolvedValue({
        id: 'firm-2',
        entity: 'XYZ Corp',
      });
      (prisma.document.count as Mock).mockResolvedValue(2);

      const result = await autoFiler.determineFilingPath(
        'inv-12345.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Invoices');
      expect(result.displayName).toBe('XYZ Corp_Invoice_003.PDF');
      expect(result.firmId).toBe('firm-2');
    });

    it('should create firm if it does not exist (AC1)', async () => {
      const context: FilingContext = {
        uploadLocation: 'general',
        firmName: 'New Firm Ltd',
      };

      // Mock firm doesn't exist
      (prisma.firm.findFirst as Mock).mockResolvedValue(null);

      // Mock max display order
      (prisma.firm.aggregate as Mock).mockResolvedValue({
        _max: { displayOrder: 5 },
      });

      // Mock firm creation
      (prisma.firm.create as Mock).mockResolvedValue({
        id: 'new-firm-id',
        entity: 'New Firm Ltd',
        displayOrder: 6,
      });

      (prisma.document.count as Mock).mockResolvedValue(0);

      const result = await autoFiler.determineFilingPath(
        'invoice.pdf',
        context,
        mockProjectId
      );

      expect(prisma.firm.create).toHaveBeenCalledWith({
        data: {
          projectId: mockProjectId,
          entity: 'New Firm Ltd',
          displayOrder: 6,
          createdBy: 'test-user-id',
          updatedBy: 'test-user-id',
        },
      });

      expect(result.path).toBe('Invoices');
      expect(result.displayName).toBe('New Firm Ltd_Invoice_001.PDF');
      expect(result.firmId).toBe('new-firm-id');
    });

    it('should handle missing firm name with "Unknown" default', async () => {
      const context: FilingContext = {
        uploadLocation: 'general',
      };

      (prisma.document.count as Mock).mockResolvedValue(0);

      const result = await autoFiler.determineFilingPath(
        'invoice.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Invoices');
      expect(result.displayName).toBe('Unknown_Invoice_001.PDF');
      expect(result.firmId).toBeUndefined();
    });

    it('should generate sequential invoice numbers', async () => {
      const context: FilingContext = {
        uploadLocation: 'general',
        firmName: 'Test Firm',
      };

      (prisma.firm.findFirst as Mock).mockResolvedValue({
        id: 'firm-1',
        entity: 'Test Firm',
      });

      // Mock 15 existing invoices
      (prisma.document.count as Mock).mockResolvedValue(15);

      const result = await autoFiler.determineFilingPath(
        'invoice.pdf',
        context,
        mockProjectId
      );

      expect(result.displayName).toBe('Test Firm_Invoice_016.PDF');
    });

    it('should preserve file extension in uppercase', async () => {
      const context: FilingContext = {
        uploadLocation: 'general',
        firmName: 'Test Firm',
      };

      (prisma.firm.findFirst as Mock).mockResolvedValue({
        id: 'firm-1',
        entity: 'Test Firm',
      });
      (prisma.document.count as Mock).mockResolvedValue(0);

      const resultPdf = await autoFiler.determineFilingPath(
        'invoice.pdf',
        context,
        mockProjectId
      );
      expect(resultPdf.displayName).toBe('Test Firm_Invoice_001.PDF');

      const resultDocx = await autoFiler.determineFilingPath(
        'invoice.docx',
        context,
        mockProjectId
      );
      expect(resultDocx.displayName).toBe('Test Firm_Invoice_001.DOCX');
    });
  });

  describe('AC2: Consultant tender document filing', () => {
    it('should file consultant submission to Consultants/[Discipline]/', async () => {
      const context: FilingContext = {
        uploadLocation: 'consultant_card',
        cardType: 'CONSULTANT',
        disciplineOrTrade: 'Structural Engineering',
        firmName: 'Engineering Co',
      };

      (prisma.document.count as Mock).mockResolvedValue(0);

      const result = await autoFiler.determineFilingPath(
        'tender_submission.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Consultants/Structural Engineering');
      expect(result.displayName).toBe('Engineering Co_Submission_01.PDF');
    });

    it('should detect submission by filename pattern "submission"', async () => {
      const context: FilingContext = {
        uploadLocation: 'consultant_card',
        cardType: 'CONSULTANT',
        disciplineOrTrade: 'Architecture',
        firmName: 'Architects Inc',
      };

      (prisma.document.count as Mock).mockResolvedValue(1);

      const result = await autoFiler.determineFilingPath(
        'submission-response.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Consultants/Architecture');
      expect(result.displayName).toBe('Architects Inc_Submission_02.PDF');
    });

    it('should detect submission by filename pattern "tender response"', async () => {
      const context: FilingContext = {
        uploadLocation: 'consultant_card',
        cardType: 'CONSULTANT',
        disciplineOrTrade: 'MEP',
        firmName: 'MEP Firm',
      };

      (prisma.document.count as Mock).mockResolvedValue(0);

      const result = await autoFiler.determineFilingPath(
        'tender response final.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Consultants/MEP');
      expect(result.displayName).toBe('MEP Firm_Submission_01.PDF');
    });

    it('should file consultant TRR document', async () => {
      const context: FilingContext = {
        uploadLocation: 'consultant_card',
        cardType: 'CONSULTANT',
        disciplineOrTrade: 'Civil Engineering',
        firmName: 'Civil Co',
      };

      const result = await autoFiler.determineFilingPath(
        'TRR_report.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Consultants/Civil Engineering');
      expect(result.displayName).toBe('Civil Co_TRR.PDF');
    });

    it('should detect TRR by filename pattern "recommendation"', async () => {
      const context: FilingContext = {
        uploadLocation: 'consultant_card',
        cardType: 'CONSULTANT',
        disciplineOrTrade: 'Landscape',
        firmName: 'Landscape Firm',
      };

      const result = await autoFiler.determineFilingPath(
        'tender_recommendation.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Consultants/Landscape');
      expect(result.displayName).toBe('Landscape Firm_TRR.PDF');
    });

    it('should file consultant RFT document', async () => {
      const context: FilingContext = {
        uploadLocation: 'consultant_card',
        cardType: 'CONSULTANT',
        disciplineOrTrade: 'Fire Services',
      };

      const result = await autoFiler.determineFilingPath(
        'RFT_package.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Consultants/Fire Services');
      expect(result.displayName).toBe('RFT_Fire Services.PDF');
    });

    it('should detect RFT by filename pattern "request for tender"', async () => {
      const context: FilingContext = {
        uploadLocation: 'consultant_card',
        cardType: 'CONSULTANT',
        disciplineOrTrade: 'Geotechnical',
      };

      const result = await autoFiler.determineFilingPath(
        'request for tender v2.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Consultants/Geotechnical');
      expect(result.displayName).toBe('RFT_Geotechnical.PDF');
    });

    it('should file consultant addendum with sequential numbering', async () => {
      const context: FilingContext = {
        uploadLocation: 'consultant_card',
        cardType: 'CONSULTANT',
        disciplineOrTrade: 'Acoustic',
      };

      (prisma.document.count as Mock).mockResolvedValue(2);

      const result = await autoFiler.determineFilingPath(
        'addendum.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Consultants/Acoustic');
      expect(result.displayName).toBe('Addendum_03.PDF');
    });

    it('should detect addendum by filename pattern "amendment"', async () => {
      const context: FilingContext = {
        uploadLocation: 'consultant_card',
        cardType: 'CONSULTANT',
        disciplineOrTrade: 'Traffic',
      };

      (prisma.document.count as Mock).mockResolvedValue(0);

      const result = await autoFiler.determineFilingPath(
        'amendment-01.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Consultants/Traffic');
      expect(result.displayName).toBe('Addendum_01.PDF');
    });

    it('should detect document type from section name context', async () => {
      const context: FilingContext = {
        uploadLocation: 'consultant_card',
        cardType: 'CONSULTANT',
        disciplineOrTrade: 'Hydraulic',
        sectionName: 'Addendum Documents',
      };

      (prisma.document.count as Mock).mockResolvedValue(0);

      const result = await autoFiler.determineFilingPath(
        'document.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Consultants/Hydraulic');
      expect(result.displayName).toBe('Addendum_01.PDF');
    });
  });

  describe('AC3: Contractor tender document filing', () => {
    it('should file contractor submission to Contractors/[Trade]/', async () => {
      const context: FilingContext = {
        uploadLocation: 'contractor_card',
        cardType: 'CONTRACTOR',
        disciplineOrTrade: 'Excavation',
        firmName: 'Excavation Pty Ltd',
      };

      (prisma.document.count as Mock).mockResolvedValue(0);

      const result = await autoFiler.determineFilingPath(
        'submission.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Contractors/Excavation');
      expect(result.displayName).toBe('Excavation Pty Ltd_Submission_01.PDF');
    });

    it('should file contractor TRR document', async () => {
      const context: FilingContext = {
        uploadLocation: 'contractor_card',
        cardType: 'CONTRACTOR',
        disciplineOrTrade: 'Carpentry',
        firmName: 'Carpenters United',
      };

      const result = await autoFiler.determineFilingPath(
        'TRR.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Contractors/Carpentry');
      expect(result.displayName).toBe('Carpenters United_TRR.PDF');
    });

    it('should file contractor RFT document', async () => {
      const context: FilingContext = {
        uploadLocation: 'contractor_card',
        cardType: 'CONTRACTOR',
        disciplineOrTrade: 'Electrical',
      };

      const result = await autoFiler.determineFilingPath(
        'RFT.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Contractors/Electrical');
      expect(result.displayName).toBe('RFT_Electrical.PDF');
    });

    it('should file contractor addendum with sequential numbering', async () => {
      const context: FilingContext = {
        uploadLocation: 'contractor_card',
        cardType: 'CONTRACTOR',
        disciplineOrTrade: 'Plumbing',
      };

      (prisma.document.count as Mock).mockResolvedValue(1);

      const result = await autoFiler.determineFilingPath(
        'addendum.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Contractors/Plumbing');
      expect(result.displayName).toBe('Addendum_02.PDF');
    });

    it('should handle multiple contractor submissions with correct numbering', async () => {
      const context: FilingContext = {
        uploadLocation: 'contractor_card',
        cardType: 'CONTRACTOR',
        disciplineOrTrade: 'Concrete',
        firmName: 'Concrete Works',
      };

      (prisma.document.count as Mock).mockResolvedValue(5);

      const result = await autoFiler.determineFilingPath(
        'submission_final.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Contractors/Concrete');
      expect(result.displayName).toBe('Concrete Works_Submission_06.PDF');
    });
  });

  describe('AC4: Planning documents auto-file to Plan/Misc', () => {
    it('should file documents with "planning" in filename to Plan/Misc', async () => {
      const context: FilingContext = {
        uploadLocation: 'general',
      };

      const result = await autoFiler.determineFilingPath(
        'planning_report_2024.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Plan/Misc');
      expect(result.displayName).toBe('planning_report_2024.pdf');
    });

    it('should file documents with "plan" in filename to Plan/Misc', async () => {
      const context: FilingContext = {
        uploadLocation: 'general',
      };

      const result = await autoFiler.determineFilingPath(
        'master_plan.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Plan/Misc');
      expect(result.displayName).toBe('master_plan.pdf');
    });

    it('should be case-insensitive for planning detection', async () => {
      const context: FilingContext = {
        uploadLocation: 'general',
      };

      const result = await autoFiler.determineFilingPath(
        'PLANNING_DOCUMENT.PDF',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Plan/Misc');
      expect(result.displayName).toBe('PLANNING_DOCUMENT.PDF');
    });
  });

  describe('AC5: Cost documents auto-file to Plan/Misc', () => {
    it('should file documents with "cost" in filename to Plan/Misc', async () => {
      const context: FilingContext = {
        uploadLocation: 'general',
      };

      const result = await autoFiler.determineFilingPath(
        'cost_estimate.xlsx',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Plan/Misc');
      expect(result.displayName).toBe('cost_estimate.xlsx');
    });

    it('should be case-insensitive for cost detection', async () => {
      const context: FilingContext = {
        uploadLocation: 'general',
      };

      const result = await autoFiler.determineFilingPath(
        'COST_PLAN_2024.PDF',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Plan/Misc');
      expect(result.displayName).toBe('COST_PLAN_2024.PDF');
    });
  });

  describe('AC6: General documents default to Plan/Misc', () => {
    it('should file unrecognized documents to Plan/Misc', async () => {
      const context: FilingContext = {
        uploadLocation: 'general',
      };

      const result = await autoFiler.determineFilingPath(
        'random_document.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Plan/Misc');
      expect(result.displayName).toBe('random_document.pdf');
    });

    it('should file documents from document_card location to Plan/Misc by default', async () => {
      const context: FilingContext = {
        uploadLocation: 'document_card',
      };

      const result = await autoFiler.determineFilingPath(
        'generic_file.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Plan/Misc');
      expect(result.displayName).toBe('generic_file.pdf');
    });

    it('should preserve original filename for general documents', async () => {
      const context: FilingContext = {
        uploadLocation: 'general',
      };

      const result = await autoFiler.determineFilingPath(
        'my_special_document_v2.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Plan/Misc');
      expect(result.displayName).toBe('my_special_document_v2.pdf');
    });
  });

  describe('AC8: Files dropped in Plan Card sections auto-file to Plan/Misc', () => {
    it('should file plan_card uploads to Plan/Misc', async () => {
      const context: FilingContext = {
        uploadLocation: 'plan_card',
      };

      const result = await autoFiler.determineFilingPath(
        'schedule.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Plan/Misc');
      expect(result.displayName).toBe('schedule.pdf');
    });

    it('should prioritize plan_card location over filename patterns', async () => {
      const context: FilingContext = {
        uploadLocation: 'plan_card',
      };

      // Even though filename contains "invoice", plan_card location takes priority
      const result = await autoFiler.determineFilingPath(
        'some_document.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Plan/Misc');
      expect(result.displayName).toBe('some_document.pdf');
    });
  });

  describe('AC9: Files dropped in Consultant/Contractor Cards auto-file to respective Discipline or Trade', () => {
    it('should file consultant_card uploads to Consultants/[Discipline]/', async () => {
      const context: FilingContext = {
        uploadLocation: 'consultant_card',
        disciplineOrTrade: 'Quantity Surveying',
      };

      const result = await autoFiler.determineFilingPath(
        'report.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Consultants/Quantity Surveying');
      expect(result.displayName).toBe('report.pdf');
    });

    it('should file contractor_card uploads to Contractors/[Trade]/', async () => {
      const context: FilingContext = {
        uploadLocation: 'contractor_card',
        disciplineOrTrade: 'Painting',
      };

      const result = await autoFiler.determineFilingPath(
        'specification.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Contractors/Painting');
      expect(result.displayName).toBe('specification.pdf');
    });

    it('should handle consultant_card without disciplineOrTrade gracefully', async () => {
      const context: FilingContext = {
        uploadLocation: 'consultant_card',
      };

      const result = await autoFiler.determineFilingPath(
        'document.pdf',
        context,
        mockProjectId
      );

      // Falls back to general filing (Plan/Misc)
      expect(result.path).toBe('Plan/Misc');
      expect(result.displayName).toBe('document.pdf');
    });

    it('should handle contractor_card without disciplineOrTrade gracefully', async () => {
      const context: FilingContext = {
        uploadLocation: 'contractor_card',
      };

      const result = await autoFiler.determineFilingPath(
        'document.pdf',
        context,
        mockProjectId
      );

      // Falls back to general filing (Plan/Misc)
      expect(result.path).toBe('Plan/Misc');
      expect(result.displayName).toBe('document.pdf');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle filenames without extensions', async () => {
      const context: FilingContext = {
        uploadLocation: 'general',
        firmName: 'Test Firm',
      };

      (prisma.firm.findFirst as Mock).mockResolvedValue({
        id: 'firm-1',
        entity: 'Test Firm',
      });
      (prisma.document.count as Mock).mockResolvedValue(0);

      const result = await autoFiler.determineFilingPath(
        'invoice',
        context,
        mockProjectId
      );

      expect(result.displayName).toBe('Test Firm_Invoice_001.PDF');
    });

    it('should handle special characters in firm names', async () => {
      const context: FilingContext = {
        uploadLocation: 'general',
        firmName: "O'Brien & Associates (Pty) Ltd",
      };

      (prisma.firm.findFirst as Mock).mockResolvedValue({
        id: 'firm-special',
        entity: "O'Brien & Associates (Pty) Ltd",
      });
      (prisma.document.count as Mock).mockResolvedValue(0);

      const result = await autoFiler.determineFilingPath(
        'invoice.pdf',
        context,
        mockProjectId
      );

      expect(result.displayName).toBe("O'Brien & Associates (Pty) Ltd_Invoice_001.PDF");
    });

    it('should handle special characters in discipline/trade names', async () => {
      const context: FilingContext = {
        uploadLocation: 'consultant_card',
        cardType: 'CONSULTANT',
        disciplineOrTrade: 'Audio/Visual',
        firmName: 'AV Firm',
      };

      (prisma.document.count as Mock).mockResolvedValue(0);

      const result = await autoFiler.determineFilingPath(
        'submission.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Consultants/Audio/Visual');
      expect(result.displayName).toBe('AV Firm_Submission_01.PDF');
    });

    it('should handle firm with no existing invoices (first invoice)', async () => {
      const context: FilingContext = {
        uploadLocation: 'general',
        firmName: 'First Time Firm',
      };

      (prisma.firm.findFirst as Mock).mockResolvedValue({
        id: 'new-firm',
        entity: 'First Time Firm',
      });
      (prisma.document.count as Mock).mockResolvedValue(0);

      const result = await autoFiler.determineFilingPath(
        'invoice.pdf',
        context,
        mockProjectId
      );

      expect(result.displayName).toBe('First Time Firm_Invoice_001.PDF');
    });

    it('should handle cardType without uploadLocation match', async () => {
      const context: FilingContext = {
        uploadLocation: 'general',
        cardType: 'CONSULTANT',
        disciplineOrTrade: 'Architecture',
      };

      const result = await autoFiler.determineFilingPath(
        'general_doc.pdf',
        context,
        mockProjectId
      );

      // Without specific card upload location, falls back to general filing
      expect(result.path).toBe('Plan/Misc');
      expect(result.displayName).toBe('general_doc.pdf');
    });

    it('should handle mixed case document type detection', async () => {
      const context: FilingContext = {
        uploadLocation: 'consultant_card',
        cardType: 'CONSULTANT',
        disciplineOrTrade: 'Sustainability',
        firmName: 'Green Consultants',
      };

      (prisma.document.count as Mock).mockResolvedValue(0);

      const result = await autoFiler.determineFilingPath(
        'TENDER_SUBMISSION_FINAL.PDF',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Consultants/Sustainability');
      expect(result.displayName).toBe('Green Consultants_Submission_01.PDF');
    });

    it('should handle section name taking priority over filename for document type', async () => {
      const context: FilingContext = {
        uploadLocation: 'consultant_card',
        cardType: 'CONSULTANT',
        disciplineOrTrade: 'Waste Management',
        sectionName: 'TRR Documentation',
      };

      const result = await autoFiler.determineFilingPath(
        'final_document.pdf',
        context,
        mockProjectId
      );

      expect(result.displayName).toContain('_TRR.PDF');
    });

    it('should handle zero max display order when creating first firm', async () => {
      const context: FilingContext = {
        uploadLocation: 'general',
        firmName: 'Very First Firm',
      };

      (prisma.firm.findFirst as Mock).mockResolvedValue(null);
      (prisma.firm.aggregate as Mock).mockResolvedValue({
        _max: { displayOrder: null },
      });
      (prisma.firm.create as Mock).mockResolvedValue({
        id: 'first-firm',
        entity: 'Very First Firm',
        displayOrder: 1,
      });
      (prisma.document.count as Mock).mockResolvedValue(0);

      const result = await autoFiler.determineFilingPath(
        'invoice.pdf',
        context,
        mockProjectId
      );

      expect(prisma.firm.create).toHaveBeenCalledWith({
        data: {
          projectId: mockProjectId,
          entity: 'Very First Firm',
          displayOrder: 1,
          createdBy: 'test-user-id',
          updatedBy: 'test-user-id',
        },
      });

      expect(result.displayName).toBe('Very First Firm_Invoice_001.PDF');
    });

    it('should default to General discipline for consultant tender docs without discipline', async () => {
      const context: FilingContext = {
        uploadLocation: 'consultant_card',
        cardType: 'CONSULTANT',
        firmName: 'Generic Consultant',
      };

      (prisma.document.count as Mock).mockResolvedValue(0);

      const result = await autoFiler.determineFilingPath(
        'submission.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Consultants/General');
      expect(result.displayName).toBe('Generic Consultant_Submission_01.PDF');
    });

    it('should handle no cardType specified for tender documents', async () => {
      const context: FilingContext = {
        uploadLocation: 'general',
        disciplineOrTrade: 'Architecture',
        firmName: 'Architects',
      };

      (prisma.document.count as Mock).mockResolvedValue(0);

      const result = await autoFiler.determineFilingPath(
        'submission.pdf',
        context,
        mockProjectId
      );

      // Without cardType, defaults to Consultants/General
      expect(result.path).toBe('Consultants/General');
      expect(result.displayName).toBe('Architects_Submission_01.PDF');
    });
  });

  describe('FilingContext.addToDocuments flag (AC7)', () => {
    it('should accept addToDocuments flag in context', async () => {
      const context: FilingContext = {
        uploadLocation: 'general',
        addToDocuments: true,
      };

      const result = await autoFiler.determineFilingPath(
        'document.pdf',
        context,
        mockProjectId
      );

      // Filing should proceed normally
      expect(result.path).toBe('Plan/Misc');
      expect(result.displayName).toBe('document.pdf');
    });

    it('should accept addToDocuments: false in context', async () => {
      const context: FilingContext = {
        uploadLocation: 'general',
        addToDocuments: false,
      };

      const result = await autoFiler.determineFilingPath(
        'document.pdf',
        context,
        mockProjectId
      );

      // Filing path is still determined (UI layer handles the flag)
      expect(result.path).toBe('Plan/Misc');
      expect(result.displayName).toBe('document.pdf');
    });
  });

  describe('Document type detection priority', () => {
    it('should prioritize filename pattern over section name', async () => {
      const context: FilingContext = {
        uploadLocation: 'consultant_card',
        cardType: 'CONSULTANT',
        disciplineOrTrade: 'Architecture',
        sectionName: 'General Documents',
      };

      const result = await autoFiler.determineFilingPath(
        'invoice_2024.pdf',
        context,
        mockProjectId
      );

      // Invoice pattern in filename should win
      expect(result.path).toBe('Invoices');
    });

    it('should use section name when filename has no matching pattern', async () => {
      const context: FilingContext = {
        uploadLocation: 'consultant_card',
        cardType: 'CONSULTANT',
        disciplineOrTrade: 'Structural Engineering',
        sectionName: 'Submission Documents',
        firmName: 'Structural Firm',
      };

      (prisma.document.count as Mock).mockResolvedValue(0);

      const result = await autoFiler.determineFilingPath(
        'document_final.pdf',
        context,
        mockProjectId
      );

      expect(result.path).toBe('Consultants/Structural Engineering');
      expect(result.displayName).toBe('Structural Firm_Submission_01.PDF');
    });
  });
});
