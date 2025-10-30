import { prisma } from '@/lib/prisma';

/**
 * Filing context interface for auto-filing documents
 * Supports AC1-AC10 for Story 2.6: Document Filing Automation
 */
export interface FilingContext {
  uploadLocation: 'plan_card' | 'consultant_card' | 'contractor_card' | 'document_card' | 'general';
  cardType?: 'CONSULTANT' | 'CONTRACTOR';
  disciplineOrTrade?: string;
  sectionName?: string;
  firmName?: string;
  documentType?: 'invoice' | 'submission' | 'TRR' | 'RFT' | 'addendum' | 'general';
  addToDocuments?: boolean; // Default true (AC7)
}

/**
 * Result of auto-filing path determination
 */
export interface FilingResult {
  path: string;
  displayName: string;
  firmId?: string; // If a firm was created/found for invoice filing
}

/**
 * AutoFiler Service
 *
 * Automatically determines filing paths and display names for documents
 * based on upload context and document type detection.
 *
 * Supports:
 * - AC1: Invoice auto-filing with firm creation
 * - AC2-AC3: Consultant/Contractor tender document filing
 * - AC4-AC6: Planning, Cost, and General document filing to Plan/Misc
 * - AC8-AC9: Card section-based filing
 */
export class AutoFiler {
  /**
   * Determine the filing path and display name for a document
   *
   * @param fileName - Original file name
   * @param context - Upload context with card type, discipline, section, etc.
   * @param projectId - Project ID for database queries (optional for preview mode)
   * @param previewMode - If true, skip database operations (for client-side preview)
   * @returns Filing result with path, display name, and optional firm ID
   */
  async determineFilingPath(
    fileName: string,
    context: FilingContext,
    projectId?: string,
    previewMode: boolean = false
  ): Promise<FilingResult> {
    const documentType = this.detectDocumentType(fileName, context);

    switch (documentType) {
      case 'invoice':
        return previewMode || !projectId
          ? this.previewInvoicePath(context, fileName)
          : this.fileInvoice(context, projectId, fileName);

      case 'submission':
        return previewMode || !projectId
          ? this.previewTenderDocumentPath(context, 'submission', fileName)
          : this.fileTenderDocument(context, projectId, 'submission', fileName);

      case 'TRR':
        return previewMode || !projectId
          ? this.previewTenderDocumentPath(context, 'TRR', fileName)
          : this.fileTenderDocument(context, projectId, 'TRR', fileName);

      case 'RFT':
        return previewMode || !projectId
          ? this.previewTenderDocumentPath(context, 'RFT', fileName)
          : this.fileTenderDocument(context, projectId, 'RFT', fileName);

      case 'addendum':
        return previewMode || !projectId
          ? this.previewTenderDocumentPath(context, 'addendum', fileName)
          : this.fileTenderDocument(context, projectId, 'addendum', fileName);

      default:
        return this.fileGeneral(fileName, context);
    }
  }

  /**
   * Extract file extension from filename, defaulting to PDF if no extension
   */
  private getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    if (parts.length > 1) {
      return parts.pop()!.toUpperCase();
    }
    return 'PDF';
  }

  /**
   * Detect document type based on filename and context
   *
   * Checks both filename patterns and upload context (section name, card type)
   * to accurately classify the document.
   */
  private detectDocumentType(
    fileName: string,
    context: FilingContext
  ): FilingContext['documentType'] {
    const lowerFileName = fileName.toLowerCase();

    // Check file name patterns
    if (lowerFileName.includes('invoice') || lowerFileName.includes('inv')) {
      return 'invoice';
    }
    if (lowerFileName.includes('submission') || lowerFileName.includes('tender response')) {
      return 'submission';
    }
    if (lowerFileName.includes('trr') || lowerFileName.includes('recommendation')) {
      return 'TRR';
    }
    if (lowerFileName.includes('rft') || lowerFileName.includes('request for tender')) {
      return 'RFT';
    }
    if (lowerFileName.includes('addendum') || lowerFileName.includes('amendment')) {
      return 'addendum';
    }

    // Check upload context (section name)
    const sectionName = context.sectionName?.toLowerCase() || '';
    if (sectionName.includes('addendum')) return 'addendum';
    if (sectionName.includes('submission')) return 'submission';
    if (sectionName.includes('recommendation') || sectionName.includes('trr')) return 'TRR';
    if (sectionName.includes('request') || sectionName.includes('rft')) return 'RFT';

    return 'general';
  }

  /**
   * Preview invoice path (client-safe, no database operations)
   */
  private previewInvoicePath(
    context: FilingContext,
    fileName: string
  ): FilingResult {
    const firmName = context.firmName || 'Unknown';
    const extension = this.getFileExtension(fileName);

    return {
      path: 'Invoices',
      displayName: `${firmName}_Invoice_001.${extension}`,
    };
  }

  /**
   * Preview tender document path (client-safe, no database operations)
   */
  private previewTenderDocumentPath(
    context: FilingContext,
    docType: 'submission' | 'TRR' | 'RFT' | 'addendum',
    fileName: string
  ): FilingResult {
    const firmName = context.firmName || 'Unknown';
    const disciplineOrTrade = context.disciplineOrTrade || 'General';
    const extension = this.getFileExtension(fileName);

    // Determine folder based on card type
    let basePath: string;
    if (context.cardType === 'CONSULTANT') {
      basePath = `Consultants/${disciplineOrTrade}`;
    } else if (context.cardType === 'CONTRACTOR') {
      basePath = `Contractors/${disciplineOrTrade}`;
    } else {
      basePath = `Consultants/General`;
    }

    // Generate filename based on document type
    let displayName: string;
    switch (docType) {
      case 'submission':
        displayName = `${firmName}_Submission_01.${extension}`;
        break;
      case 'TRR':
        displayName = `${firmName}_TRR.${extension}`;
        break;
      case 'RFT':
        displayName = `RFT_${disciplineOrTrade}.${extension}`;
        break;
      case 'addendum':
        displayName = `Addendum_01.${extension}`;
        break;
      default:
        displayName = fileName;
    }

    return {
      path: basePath,
      displayName,
    };
  }

  /**
   * File invoice documents (AC1)
   *
   * Auto-files to Finance/Invoices/ folder with firm name and sequential numbering.
   * Creates Firm record if it doesn't exist.
   *
   * Format: {FirmName}_Invoice_{001}.PDF
   */
  private async fileInvoice(
    context: FilingContext,
    projectId: string,
    fileName: string
  ): Promise<FilingResult> {
    let firmName = context.firmName || 'Unknown';
    let firmId: string | undefined;

    // AC1: Create firm if it doesn't exist
    if (context.firmName && context.firmName !== 'Unknown') {
      // Check if firm exists
      let firm = await prisma.firm.findFirst({
        where: {
          projectId,
          entity: context.firmName,
          deletedAt: null,
        },
      });

      // Create firm if it doesn't exist
      if (!firm) {
        // Get next display order
        const maxOrder = await prisma.firm.aggregate({
          where: { projectId, deletedAt: null },
          _max: { displayOrder: true },
        });

        const { userId } = await import('@clerk/nextjs/server').then((m) => m.auth());

        firm = await prisma.firm.create({
          data: {
            projectId,
            entity: context.firmName,
            displayOrder: (maxOrder._max.displayOrder || 0) + 1,
            createdBy: userId || 'system',
            updatedBy: userId || 'system',
          },
        });
      }

      firmId = firm.id;
      firmName = firm.entity;
    }

    // Get next invoice number for this firm
    const existingInvoices = await prisma.document.count({
      where: {
        projectId,
        path: 'Finance/Invoices',
        displayName: {
          contains: firmName,
        },
        deletedAt: null,
      },
    });

    const invoiceNumber = String(existingInvoices + 1).padStart(3, '0');
    const extension = this.getFileExtension(fileName);

    return {
      path: 'Finance/Invoices',
      displayName: `${firmName}_Invoice_${invoiceNumber}.${extension}`,
      firmId,
    };
  }

  /**
   * File tender documents (AC2, AC3)
   *
   * Auto-files consultant/contractor tender documents to appropriate folders.
   * Supports submissions, TRR, RFT, and addenda.
   *
   * Paths:
   * - Consultants/[Discipline]/
   * - Contractors/[Trade]/
   */
  private async fileTenderDocument(
    context: FilingContext,
    projectId: string,
    docType: 'submission' | 'TRR' | 'RFT' | 'addendum',
    fileName: string
  ): Promise<FilingResult> {
    const firmName = context.firmName || 'Unknown';
    const disciplineOrTrade = context.disciplineOrTrade || 'General';

    // Determine folder based on card type (AC2, AC3)
    let basePath: string;
    if (context.cardType === 'CONSULTANT') {
      basePath = `Consultants/${disciplineOrTrade}`;
    } else if (context.cardType === 'CONTRACTOR') {
      basePath = `Contractors/${disciplineOrTrade}`;
    } else {
      // Default to Consultants if not specified
      basePath = `Consultants/General`;
    }

    const extension = this.getFileExtension(fileName);

    // Generate filename based on document type
    let displayName: string;
    switch (docType) {
      case 'submission':
        // Get submission number
        const existingSubmissions = await prisma.document.count({
          where: {
            projectId,
            path: basePath,
            displayName: {
              contains: 'Submission',
            },
            deletedAt: null,
          },
        });
        const submissionNumber = String(existingSubmissions + 1).padStart(2, '0');
        displayName = `${firmName}_Submission_${submissionNumber}.${extension}`;
        break;

      case 'TRR':
        displayName = `${firmName}_TRR.${extension}`;
        break;

      case 'RFT':
        displayName = `RFT_${disciplineOrTrade}.${extension}`;
        break;

      case 'addendum':
        // Get addendum number
        const existingAddenda = await prisma.document.count({
          where: {
            projectId,
            path: basePath,
            displayName: {
              contains: 'Addendum',
            },
            deletedAt: null,
          },
        });
        const addendumNumber = String(existingAddenda + 1).padStart(2, '0');
        displayName = `Addendum_${addendumNumber}.${extension}`;
        break;

      default:
        displayName = fileName;
    }

    return {
      path: basePath,
      displayName,
    };
  }

  /**
   * File general documents (AC4, AC5, AC6, AC8, AC9)
   *
   * Routes documents based on filename keywords or upload context.
   * Defaults to Plan/Misc/ for all general documents.
   *
   * Rules:
   * - Planning documents → Plan/Misc (AC4)
   * - Cost documents → Plan/Misc (AC5)
   * - General documents → Plan/Misc (AC6)
   * - Plan Card uploads → Plan/Misc (AC8)
   * - Consultant Card uploads → Consultants/[Discipline]/ (AC9)
   * - Contractor Card uploads → Contractors/[Trade]/ (AC9)
   */
  private fileGeneral(
    fileName: string,
    context: FilingContext
  ): FilingResult {
    const lowerFileName = fileName.toLowerCase();

    // AC4: Planning documents → Plan/Misc
    if (lowerFileName.includes('planning') || lowerFileName.includes('plan')) {
      return { path: 'Plan/Misc', displayName: fileName };
    }

    // AC5: Cost documents → Plan/Misc
    if (lowerFileName.includes('cost')) {
      return { path: 'Plan/Misc', displayName: fileName };
    }

    // AC8: Files dropped in Plan Card sections → Plan/Misc
    if (context.uploadLocation === 'plan_card') {
      return { path: 'Plan/Misc', displayName: fileName };
    }

    // AC9: Files dropped in Consultant Card → Consultants/[Discipline]/
    if (context.uploadLocation === 'consultant_card' && context.disciplineOrTrade) {
      return {
        path: `Consultants/${context.disciplineOrTrade}`,
        displayName: fileName
      };
    }

    // AC9: Files dropped in Contractor Card → Contractors/[Trade]/
    if (context.uploadLocation === 'contractor_card' && context.disciplineOrTrade) {
      return {
        path: `Contractors/${context.disciplineOrTrade}`,
        displayName: fileName
      };
    }

    // AC6: General documents default to Plan/Misc
    return {
      path: 'Plan/Misc',
      displayName: fileName,
    };
  }
}

/**
 * Singleton instance for convenient usage
 */
export const autoFiler = new AutoFiler();
