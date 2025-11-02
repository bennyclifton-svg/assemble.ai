'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { uploadToS3, generateS3Key, getSignedDownloadUrl } from '@/services/supabaseStorage';
import crypto from 'crypto';
import { z } from 'zod';
import { AutoFiler, type FilingContext } from '@/services/autoFiler';

// Validation schemas
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Upload documents to a specific folder
 */
export async function uploadDocuments(
  formData: FormData
): Promise<ActionResult<any[]>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      };
    }

    const projectId = formData.get('projectId') as string;
    const folderPath = formData.get('folderPath') as string || '';
    const files = formData.getAll('files') as File[];

    if (!projectId) {
      return {
        success: false,
        error: { code: 'MISSING_PROJECT', message: 'Project ID is required' }
      };
    }

    // Validate files
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return {
          success: false,
          error: { code: 'FILE_TOO_LARGE', message: `${file.name} exceeds 15MB limit` }
        };
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return {
          success: false,
          error: { code: 'INVALID_FILE_TYPE', message: `${file.name} has unsupported type` }
        };
      }
    }

    const uploadedDocuments = [];

    for (const file of files) {
      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Generate checksum
      const checksum = crypto.createHash('md5').update(buffer).digest('hex');

      // Check if document already exists
      const existingDoc = await prisma.document.findFirst({
        where: {
          projectId,
          checksum,
          deletedAt: null
        }
      });

      if (existingDoc) {
        uploadedDocuments.push(existingDoc);
        continue;
      }

      // Generate S3 key
      const s3Key = generateS3Key(projectId, folderPath, file.name);

      // Upload to S3
      const { bucket, url } = await uploadToS3(buffer, s3Key, file.type);

      // Create document record
      const document = await prisma.document.create({
        data: {
          projectId,
          path: folderPath,
          name: file.name,
          displayName: file.name,
          s3Key,
          s3Bucket: bucket,
          url,
          size: file.size,
          mimeType: file.type,
          checksum,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // Add to processing queue for AI extraction
      await prisma.documentQueue.create({
        data: {
          documentId: document.id,
          status: 'pending',
        },
      });

      uploadedDocuments.push(document);
    }

    return { success: true, data: uploadedDocuments };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: { code: 'UPLOAD_FAILED', message: 'Failed to upload documents' }
    };
  }
}

/**
 * Upload documents to a specific folder with drag and drop
 */
export async function uploadDocumentsToFolder(
  projectId: string,
  folderPath: string,
  files: File[]
): Promise<ActionResult<any[]>> {
  const formData = new FormData();
  formData.append('projectId', projectId);
  formData.append('folderPath', folderPath);

  files.forEach(file => {
    formData.append('files', file);
  });

  return uploadDocuments(formData);
}

/**
 * Upload documents with context-aware auto-filing
 * Supports Story 2.6: Document Filing Automation (AC1-AC10)
 *
 * Uses AutoFiler service to determine filing path and display name based on:
 * - Document type (invoice, submission, TRR, RFT, addendum, general)
 * - Upload context (card type, discipline/trade, section name, firm name)
 * - Filename patterns
 *
 * @param formData - Form data containing files and filing context
 * @returns Result with uploaded documents including auto-filed paths
 */
export async function uploadDocumentsWithContext(
  formData: FormData
): Promise<ActionResult<any[]>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      };
    }

    const projectId = formData.get('projectId') as string;
    const files = formData.getAll('files') as File[];

    // Extract filing context from form data (AC7-AC9)
    const context: FilingContext = {
      uploadLocation: (formData.get('uploadLocation') as any) || 'general',
      cardType: formData.get('cardType') as any,
      disciplineOrTrade: formData.get('disciplineOrTrade') as string | undefined,
      sectionName: formData.get('sectionName') as string | undefined,
      firmName: formData.get('firmName') as string | undefined,
      addToDocuments: formData.get('addToDocuments') !== 'false', // Default true (AC7)
    };

    if (!projectId) {
      return {
        success: false,
        error: { code: 'MISSING_PROJECT', message: 'Project ID is required' }
      };
    }

    // Validate files
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return {
          success: false,
          error: { code: 'FILE_TOO_LARGE', message: `${file.name} exceeds 15MB limit` }
        };
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return {
          success: false,
          error: { code: 'INVALID_FILE_TYPE', message: `${file.name} has unsupported type` }
        };
      }
    }

    const autoFiler = new AutoFiler();
    const uploadedDocuments = [];

    for (let index = 0; index < files.length; index++) {
      const file = files[index];

      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Generate checksum
      const checksum = crypto.createHash('md5').update(buffer).digest('hex');

      // Check if document already exists
      const existingDoc = await prisma.document.findFirst({
        where: {
          projectId,
          checksum,
          deletedAt: null
        }
      });

      if (existingDoc) {
        uploadedDocuments.push(existingDoc);
        continue;
      }

      // Check for manual override (AC10)
      const overrideData = formData.get(`override_${index}`);
      let path: string;
      let displayName: string;
      let firmId: string | undefined;
      let wasOverridden = false;

      if (overrideData && typeof overrideData === 'string') {
        // Manual override provided (AC10)
        try {
          const override = JSON.parse(overrideData);
          path = override.path;
          displayName = override.displayName;
          wasOverridden = true;
        } catch (error) {
          // If override parsing fails, fall back to auto-filing
          const result = await autoFiler.determineFilingPath(
            file.name,
            context,
            projectId
          );
          path = result.path;
          displayName = result.displayName;
          firmId = result.firmId;
        }
      } else {
        // Auto-filing (AC1-AC6, AC8-AC9)
        const result = await autoFiler.determineFilingPath(
          file.name,
          context,
          projectId
        );
        path = result.path;
        displayName = result.displayName;
        firmId = result.firmId;
      }

      // Generate S3 key with auto-filed path
      const s3Key = generateS3Key(projectId, path, displayName);

      // Upload to S3
      const { bucket, url } = await uploadToS3(buffer, s3Key, file.type);

      // Create document record with auto-filing metadata
      const document = await prisma.document.create({
        data: {
          projectId,
          path,
          name: file.name,
          displayName,
          s3Key,
          s3Bucket: bucket,
          url,
          size: file.size,
          mimeType: file.type,
          checksum,
          createdBy: userId,
          updatedBy: userId,
          // Store auto-filing context for audit trail (AC requirement)
          metadata: {
            autoFiled: !wasOverridden,
            manuallyOverridden: wasOverridden, // AC10: Track manual overrides
            originalFileName: file.name,
            filingContext: context as any, // Cast to allow FilingContext in JSON
            firmId,
          } as any,
        },
      });

      // Add to processing queue for AI extraction
      await prisma.documentQueue.create({
        data: {
          documentId: document.id,
          status: 'pending',
        },
      });

      uploadedDocuments.push(document);

      console.log(wasOverridden ? 'Document manually filed' : 'Document auto-filed', {
        originalName: file.name,
        filedAs: displayName,
        path,
        wasOverridden,
        context,
        firmId,
      });
    }

    return { success: true, data: uploadedDocuments };
  } catch (error) {
    console.error('Upload with context error:', error);
    return {
      success: false,
      error: { code: 'UPLOAD_FAILED', message: 'Failed to upload documents with auto-filing' }
    };
  }
}

/**
 * Get active consultant disciplines and contractor trades for a project
 * Used to determine which folders to create (AC-2: only active consultants/contractors)
 */
export async function getActiveConsultantsAndContractors(
  projectId: string
): Promise<ActionResult<{ disciplines: string[], trades: string[] }>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      };
    }

    // Get all firms for this project
    const firms = await prisma.firm.findMany({
      where: {
        projectId,
        OR: [
          { consultantCardId: { not: null } },
          { contractorCardId: { not: null } }
        ]
      },
      select: {
        consultantCardId: true,
        contractorCardId: true,
      }
    });

    // Get consultant cards to extract disciplines from section names
    const consultantCards = await prisma.card.findMany({
      where: {
        projectId,
        type: 'CONSULTANT',
        deletedAt: null
      },
      include: {
        sections: {
          where: { deletedAt: null },
          select: { name: true }
        }
      }
    });

    // Get contractor cards to extract trades from section names
    const contractorCards = await prisma.card.findMany({
      where: {
        projectId,
        type: 'CONTRACTOR',
        deletedAt: null
      },
      include: {
        sections: {
          where: { deletedAt: null },
          select: { name: true }
        }
      }
    });

    // Extract unique disciplines and trades
    const disciplines = new Set<string>();
    const trades = new Set<string>();

    consultantCards.forEach(card => {
      // Card title often contains the discipline
      card.sections.forEach(section => {
        // Section name might be the discipline
        if (section.name && section.name !== 'Scope' && section.name !== 'Deliverables' && section.name !== 'Fee Structure') {
          disciplines.add(section.name);
        }
      });
    });

    contractorCards.forEach(card => {
      card.sections.forEach(section => {
        if (section.name && section.name !== 'Scope' && section.name !== 'Deliverables' && section.name !== 'Fee Structure') {
          trades.add(section.name);
        }
      });
    });

    return {
      success: true,
      data: {
        disciplines: Array.from(disciplines),
        trades: Array.from(trades)
      }
    };
  } catch (error) {
    console.error('Get active consultants/contractors error:', error);
    return {
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch active consultants and contractors' }
    };
  }
}

/**
 * Get documents for a project
 */
export async function getDocuments(
  projectId: string,
  folderPath?: string
): Promise<ActionResult<any[]>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      };
    }

    const where: any = {
      projectId,
      deletedAt: null,
    };

    if (folderPath !== undefined) {
      where.path = folderPath;
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Generate signed URLs for secure access
    // Handle missing files gracefully by returning null for signedUrl
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const signedUrl = await getSignedDownloadUrl(doc.s3Key);

        // Log if file is missing in storage
        if (!signedUrl) {
          console.warn(`Document ${doc.id} (${doc.name}) has missing file in storage: ${doc.s3Key}`);
        }

        return {
          ...doc,
          signedUrl,
        };
      })
    );

    return { success: true, data: documentsWithUrls };
  } catch (error) {
    console.error('Get documents error:', error);
    return {
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch documents' }
    };
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(
  documentId: string
): Promise<ActionResult<void>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      };
    }

    // Soft delete
    await prisma.document.update({
      where: { id: documentId },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    // Note: We don't delete from S3 immediately to allow recovery
    // A separate cleanup job can permanently delete old soft-deleted documents

    return { success: true };
  } catch (error) {
    console.error('Delete document error:', error);
    return {
      success: false,
      error: { code: 'DELETE_FAILED', message: 'Failed to delete document' }
    };
  }
}

/**
 * Move document to different folder
 */
export async function moveDocument(
  documentId: string,
  newPath: string
): Promise<ActionResult<void>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      };
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        path: newPath,
        updatedBy: userId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Move document error:', error);
    return {
      success: false,
      error: { code: 'MOVE_FAILED', message: 'Failed to move document' }
    };
  }
}

/**
 * Add tags to document
 */
export async function updateDocumentTags(
  documentId: string,
  tags: string[]
): Promise<ActionResult<void>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      };
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        tags,
        updatedBy: userId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Update tags error:', error);
    return {
      success: false,
      error: { code: 'UPDATE_FAILED', message: 'Failed to update tags' }
    };
  }
}

/**
 * Bulk delete documents (AC-11)
 * Soft deletes multiple documents at once
 */
export async function bulkDeleteDocuments(
  documentIds: string[]
): Promise<ActionResult<void>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      };
    }

    if (documentIds.length === 0) {
      return {
        success: false,
        error: { code: 'NO_DOCUMENTS', message: 'No documents provided' }
      };
    }

    // Soft delete all documents
    await prisma.document.updateMany({
      where: {
        id: { in: documentIds },
        deletedAt: null
      },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Bulk delete error:', error);
    return {
      success: false,
      error: { code: 'BULK_DELETE_FAILED', message: 'Failed to delete documents' }
    };
  }
}

/**
 * Bulk move documents to a different folder (AC-11)
 * Moves multiple documents to a new path at once
 */
export async function bulkMoveDocuments(
  documentIds: string[],
  targetPath: string
): Promise<ActionResult<any[]>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      };
    }

    if (documentIds.length === 0) {
      return {
        success: false,
        error: { code: 'NO_DOCUMENTS', message: 'No documents provided' }
      };
    }

    // Update all documents to new path
    await prisma.document.updateMany({
      where: {
        id: { in: documentIds },
        deletedAt: null
      },
      data: {
        path: targetPath,
        updatedBy: userId,
      },
    });

    // Fetch updated documents to return
    const updatedDocuments = await prisma.document.findMany({
      where: {
        id: { in: documentIds }
      }
    });

    return { success: true, data: updatedDocuments };
  } catch (error) {
    console.error('Bulk move error:', error);
    return {
      success: false,
      error: { code: 'BULK_MOVE_FAILED', message: 'Failed to move documents' }
    };
  }
}

/**
 * Retry AI extraction for a failed document
 * Clears errors and re-queues the document for processing
 */
export async function retryExtraction(
  documentId: string
): Promise<ActionResult<void>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      };
    }

    // Check if document exists
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found' }
      };
    }

    // Reset document processing status
    await prisma.document.update({
      where: { id: documentId },
      data: {
        processingStatus: 'pending',
        updatedBy: userId,
      },
    });

    // Check if queue item exists
    const existingQueueItem = await prisma.documentQueue.findUnique({
      where: { documentId },
    });

    if (existingQueueItem) {
      // Reset existing queue item
      await prisma.documentQueue.update({
        where: { documentId },
        data: {
          status: 'pending',
          error: null,
          retryCount: 0, // Reset retry count for manual retry
        },
      });
    } else {
      // Create new queue item
      await prisma.documentQueue.create({
        data: {
          documentId,
          status: 'pending',
          retryCount: 0,
        },
      });
    }

    console.log('Document re-queued for extraction', { documentId, userId });

    return { success: true };
  } catch (error) {
    console.error('Retry extraction error:', error);
    return {
      success: false,
      error: { code: 'RETRY_FAILED', message: 'Failed to retry extraction' }
    };
  }
}

/**
 * Types for AI Auto-Population
 */
export interface PopulatedFields {
  fields: Record<string, any>;
  source: string;
}

/**
 * Auto-populate card section fields from extracted document data
 * AC3, AC4: AI analyzes document and populates appropriate fields
 */
export async function autoPopulateFields(
  documentId: string,
  targetCardId: string,
  targetSection: string
): Promise<ActionResult<PopulatedFields>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      };
    }

    // Get document with extracted data
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        extractedData: true,
        extractedText: true,
        processingStatus: true,
      },
    });

    if (!document) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found' }
      };
    }

    if (!document.extractedData || document.processingStatus !== 'completed') {
      return {
        success: false,
        error: { code: 'NO_EXTRACTED_DATA', message: 'Document has not been processed yet' },
      };
    }

    // Get target card with sections
    const card = await prisma.card.findUnique({
      where: { id: targetCardId },
      include: {
        sections: {
          where: { deletedAt: null },
          include: {
            items: {
              where: { deletedAt: null },
              orderBy: { order: 'asc' }
            }
          }
        }
      },
    });

    if (!card) {
      return {
        success: false,
        error: { code: 'CARD_NOT_FOUND', message: 'Target card not found' },
      };
    }

    // Map extracted data to card fields based on card type and section
    const mappedFields = mapExtractedDataToFields(
      document.extractedData as any,
      card.type,
      targetSection
    );

    if (Object.keys(mappedFields).length === 0) {
      return {
        success: false,
        error: {
          code: 'NO_MAPPABLE_DATA',
          message: 'No relevant data found in document for this section'
        },
      };
    }

    // Update card section with mapped data
    const updatedFields = await updateCardSection(
      card,
      targetSection,
      mappedFields,
      userId
    );

    // Track which fields were AI-populated (AC8: Track AI population history)
    await prisma.aIPopulationHistory.create({
      data: {
        documentId,
        cardId: targetCardId,
        section: targetSection,
        populatedFields: updatedFields,
        createdBy: userId,
      },
    });

    console.log('Fields auto-populated', { documentId, cardId: targetCardId, section: targetSection });

    return {
      success: true,
      data: {
        fields: updatedFields,
        source: documentId,
      },
    };
  } catch (error) {
    console.error('Auto-population failed', { error, documentId, targetCardId });
    return {
      success: false,
      error: { code: 'POPULATION_FAILED', message: 'Failed to populate fields' },
    };
  }
}

/**
 * Map extracted document data to card-specific field structure
 * Handles different card types (PLAN, CONSULTANT, CONTRACTOR) and sections
 * AC4: AI populates appropriate fields based on extracted content
 */
function mapExtractedDataToFields(
  extractedData: any,
  cardType: string,
  section: string
): Record<string, any> {
  // Define mappings for each card type and section
  const mappings: Record<string, Record<string, any>> = {
    PLAN: {
      Details: {
        projectName: extractedData.projectName,
        address: extractedData.address,
        legalAddress: extractedData.legalAddress,
        zoning: extractedData.zoning,
        jurisdiction: extractedData.jurisdiction,
        lotArea: extractedData.lotArea,
        numberOfStories: extractedData.numberOfStories,
        buildingClass: extractedData.buildingClass,
      },
      Objectives: {
        functional: extractedData.objectives?.filter((o: any) => o.type === 'functional') || [],
        quality: extractedData.objectives?.filter((o: any) => o.type === 'quality') || [],
        budget: extractedData.objectives?.filter((o: any) => o.type === 'budget') || [],
        program: extractedData.objectives?.filter((o: any) => o.type === 'program') || [],
      },
      Staging: {
        stages: extractedData.stages?.map((s: any) => ({
          name: s.name,
          startDate: s.startDate || s.date,
          endDate: s.endDate,
          description: s.description,
        })) || [],
      },
      Risk: {
        risks: extractedData.risks?.map((r: any) => {
          if (typeof r === 'string') {
            return { title: r, description: '', mitigation: '' };
          }
          return {
            title: r.title || '',
            description: r.description || '',
            mitigation: r.mitigation || '',
            probability: r.probability,
            impact: r.impact,
          };
        }) || [],
      },
      Stakeholders: {
        stakeholders: extractedData.stakeholders?.map((s: any) => ({
          role: s.role || '',
          organization: s.organization || '',
          name: s.name || '',
          email: s.email || '',
          mobile: s.mobile || '',
        })) || [],
      },
    },
    CONSULTANT: {
      Scope: {
        items: extractedData.scopeItems || [],
      },
      Deliverables: {
        items: extractedData.deliverables || [],
      },
      'Fee Structure': {
        stages: extractedData.feeStructure?.map((f: any) => ({
          stage: f.stage,
          amount: f.amount,
        })) || [],
      },
    },
    CONTRACTOR: {
      Scope: {
        items: extractedData.scopeItems || [],
      },
      Deliverables: {
        items: extractedData.deliverables || [],
      },
      'Fee Structure': {
        stages: extractedData.feeStructure?.map((f: any) => ({
          stage: f.stage,
          amount: f.amount,
        })) || [],
      },
    },
  };

  const cardMapping = mappings[cardType];
  if (!cardMapping) {
    return {};
  }

  const sectionMapping = cardMapping[section];
  if (!sectionMapping) {
    return {};
  }

  // Filter out null/undefined values
  const filtered: Record<string, any> = {};
  for (const [key, value] of Object.entries(sectionMapping)) {
    if (value !== null && value !== undefined) {
      // For arrays, only include if non-empty
      if (Array.isArray(value) && value.length > 0) {
        filtered[key] = value;
      } else if (!Array.isArray(value) && value !== '') {
        filtered[key] = value;
      }
    }
  }

  return filtered;
}

/**
 * Update or create card section with AI-populated fields
 * AC6: Merge with existing data, don't replace
 */
async function updateCardSection(
  card: any,
  sectionName: string,
  fields: Record<string, any>,
  userId: string
): Promise<Record<string, any>> {
  // Find existing section
  const existingSection = card.sections.find(
    (s: any) => s.name === sectionName && !s.deletedAt
  );

  let section = existingSection;

  if (!section) {
    // Create new section if it doesn't exist
    const maxOrder = card.sections.length > 0
      ? Math.max(...card.sections.map((s: any) => s.order))
      : -1;

    section = await prisma.section.create({
      data: {
        cardId: card.id,
        name: sectionName,
        order: maxOrder + 1,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  // Create or update items for each field
  const createdFields: Record<string, any> = {};

  for (const [fieldName, fieldValue] of Object.entries(fields)) {
    // Determine item type based on value
    let itemType = 'text';
    if (typeof fieldValue === 'number') {
      itemType = 'number';
    } else if (typeof fieldValue === 'boolean') {
      itemType = 'toggle';
    } else if (Array.isArray(fieldValue)) {
      itemType = 'list';
    } else if (fieldValue && typeof fieldValue === 'object') {
      itemType = 'object';
    }

    // Check if item already exists for this field
    const existingItem = section.items?.find(
      (item: any) => item.data?.fieldName === fieldName && !item.deletedAt
    );

    if (existingItem) {
      // Merge with existing item data
      await prisma.item.update({
        where: { id: existingItem.id },
        data: {
          data: {
            ...existingItem.data,
            fieldName,
            value: fieldValue,
            aiPopulated: true,
          },
          updatedBy: userId,
        },
      });
    } else {
      // Create new item
      const maxOrder = section.items?.length > 0
        ? Math.max(...section.items.map((i: any) => i.order))
        : -1;

      await prisma.item.create({
        data: {
          sectionId: section.id,
          order: maxOrder + 1,
          type: itemType,
          data: {
            fieldName,
            value: fieldValue,
            aiPopulated: true,
          },
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }

    createdFields[fieldName] = fieldValue;
  }

  return createdFields;
}