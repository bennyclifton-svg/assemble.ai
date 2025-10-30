/**
 * Client-Safe AutoFiler - Path Preview Only
 *
 * This version contains NO database operations or server-only imports.
 * Used by client components for previewing filing paths before upload.
 */

export interface FilingContext {
  uploadLocation: 'plan_card' | 'consultant_card' | 'contractor_card' | 'document_card' | 'general';
  cardType?: 'CONSULTANT' | 'CONTRACTOR';
  disciplineOrTrade?: string;
  sectionName?: string;
  firmName?: string;
  documentType?: 'invoice' | 'submission' | 'TRR' | 'RFT' | 'addendum' | 'general';
  addToDocuments?: boolean;
}

export interface FilingResult {
  path: string;
  displayName: string;
}

/**
 * Client-Safe AutoFiler for path previews
 *
 * Uses only client-safe logic - no database, no server imports
 */
export class AutoFilerClient {
  /**
   * Preview filing path (client-safe, no database operations)
   */
  async previewFilingPath(
    fileName: string,
    context: FilingContext
  ): Promise<FilingResult> {
    const documentType = this.detectDocumentType(fileName, context);

    switch (documentType) {
      case 'invoice':
        return this.previewInvoicePath(context, fileName);

      case 'submission':
        return this.previewTenderDocumentPath(context, 'submission', fileName);

      case 'TRR':
        return this.previewTenderDocumentPath(context, 'TRR', fileName);

      case 'RFT':
        return this.previewTenderDocumentPath(context, 'RFT', fileName);

      case 'addendum':
        return this.previewTenderDocumentPath(context, 'addendum', fileName);

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
   * Preview invoice path (client-safe)
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
   * Preview tender document path (client-safe)
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
   * File general documents (client-safe)
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
export const autoFilerClient = new AutoFilerClient();
