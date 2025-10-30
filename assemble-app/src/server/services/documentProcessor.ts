import { PrismaClient } from '@prisma/client';
import { extractFromDocument } from '@/lib/ai/extractors';

const prisma = new PrismaClient();

/**
 * Document Queue Processor Service
 * Processes pending document extractions from the queue
 */

/**
 * Process pending documents from the queue
 * Fetches up to 5 pending items and processes them
 */
export async function processDocumentQueue() {
  try {
    // Get pending documents from queue
    const queueItems = await prisma.documentQueue.findMany({
      where: {
        status: 'pending',
        retryCount: { lt: 3 }, // Max 3 retry attempts
      },
      take: 5, // Process 5 at a time
      orderBy: { createdAt: 'asc' },
    });

    console.log(`Processing ${queueItems.length} documents from queue`);

    // Process each queue item
    for (const item of queueItems) {
      await processDocument(item.documentId, item.id);
    }
  } catch (error) {
    console.error('Queue processing error:', error);
  }
}

/**
 * Process a single document from the queue
 */
async function processDocument(documentId: string, queueId: string) {
  try {
    // Update queue status to processing
    await prisma.documentQueue.update({
      where: { id: queueId },
      data: {
        status: 'processing',
        retryCount: { increment: 1 },
      },
    });

    // Update document processing status
    await prisma.document.update({
      where: { id: documentId },
      data: { processingStatus: 'processing' },
    });

    // Get document details
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    console.log(`Processing document: ${document.name} (${documentId})`);

    // Determine document type from MIME type
    const documentType = getDocumentType(document.mimeType);

    // Extract text and structured data
    const startTime = Date.now();
    const result = await extractFromDocument({
      documentUrl: document.url,
      documentType,
      // Note: Context determination would require card association
      // This can be added when Document model includes card relation
    });

    const processingTime = Date.now() - startTime;

    if (result.success) {
      // Update document with extracted data
      await prisma.document.update({
        where: { id: documentId },
        data: {
          extractedText: result.extractedText,
          extractedData: result.structuredData as any,
          processingStatus: 'completed',
        },
      });

      // Update queue status to completed
      await prisma.documentQueue.update({
        where: { id: queueId },
        data: {
          status: 'completed',
          error: null, // Clear any previous errors
        },
      });

      console.log('Document processed successfully', {
        documentId,
        documentName: document.name,
        processingTime,
        confidence: result.confidence,
        textLength: result.extractedText.length,
      });
    } else {
      throw new Error('Extraction failed');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Document processing error', { documentId, error: errorMessage });

    // Update queue with error
    await prisma.documentQueue.update({
      where: { id: queueId },
      data: {
        status: 'failed',
        error: errorMessage,
      },
    });

    // Update document status to failed
    await prisma.document.update({
      where: { id: documentId },
      data: {
        processingStatus: 'failed',
      },
    });
  }
}

/**
 * Determine document type from MIME type
 */
function getDocumentType(mimeType: string): 'pdf' | 'image' | 'scanned' {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  return 'scanned'; // Default for unknown types
}

/**
 * Manually retry a failed document extraction
 * Clears the error and re-queues the document
 */
export async function retryDocumentExtraction(documentId: string): Promise<void> {
  try {
    // Check if document exists
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Reset document processing status
    await prisma.document.update({
      where: { id: documentId },
      data: {
        processingStatus: 'pending',
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

    console.log('Document re-queued for extraction', { documentId });
  } catch (error) {
    console.error('Failed to retry document extraction', { documentId, error });
    throw error;
  }
}

// Background job - run every 30 seconds
// Note: This is commented out as it should be initialized from a proper worker
// or Next.js API route to avoid multiple instances in development mode
/*
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    processDocumentQueue().catch(console.error);
  }, 30000);
}
*/
