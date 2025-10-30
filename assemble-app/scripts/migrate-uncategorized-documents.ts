/**
 * Migration script to assign proper folder paths to uncategorized documents
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map document IDs to their correct paths based on filename and content
const documentPathMappings: Record<string, string> = {
  // Admin document - invoice
  'cmhacmnuk000ou19ou94ofxhr': 'Finance/Invoices', // ABC_Construction_Invoice.pdf

  // Tender submissions
  'cmhacs3ty0012u19okmjh4ie9': 'Procure/Tender Submission', // architect_submission.pdf
  'cmhacs50j001hu19o6ok4m7kf': 'Procure/Tender Submission', // tender_response_final.pdf
  'cmhad07dg001yu19omy8a6xd7': 'Procure/Tender Submission', // electrician_submission.pdf

  // Tender Recommendation Reports (TRR)
  'cmhacs42f0015u19o92hwtquq': 'Procure/Tender Recommendation Report', // architect_TRR.pdf
  'cmhacs4rp001eu19oglexaxw0': 'Procure/Tender Recommendation Report', // tender_recommendation.pdf
  'cmhad0l220021u19oh6r4dhc2': 'Procure/Tender Recommendation Report', // plumber_TRR.pdf

  // Request for Tender / Tender Pack
  'cmhacs4at0018u19o924odaar': 'Procure/Tender Pack', // request_for_tender_v2.pdf
  'cmhacs4j0001bu19owq62d2pp': 'Procure/Tender Pack', // RFT_architecture.pdf
  'cmhad0zhd0024u19ou049kdan': 'Procure/Tender Pack', // RFT_plumbing.pdf

  // Addendums and amendments
  'cmhacs58g001ku19ocrw8ktsa': 'Procure/Tender RFI and Addendum', // addendum_01.pdf
  'cmhacs5hi001nu19o9i83qbwd': 'Procure/Tender RFI and Addendum', // amendment_sheet.pdf
};

async function migrateUncategorizedDocuments() {
  console.log('Starting uncategorized documents migration...\n');

  try {
    const updates: Array<{ id: string; name: string; oldPath: string; newPath: string }> = [];

    // Get all documents that need migration
    for (const [docId, newPath] of Object.entries(documentPathMappings)) {
      const doc = await prisma.document.findUnique({
        where: { id: docId },
        select: { id: true, name: true, path: true },
      });

      if (doc) {
        updates.push({
          id: doc.id,
          name: doc.name,
          oldPath: doc.path || '(empty)',
          newPath: newPath,
        });
      }
    }

    console.log(`Found ${updates.length} documents to migrate:\n`);

    // Show all planned updates
    updates.forEach((update, index) => {
      console.log(`${index + 1}. ${update.name}`);
      console.log(`   "${update.oldPath}" → "${update.newPath}"\n`);
    });

    if (updates.length === 0) {
      console.log('No documents need migration.');
      return;
    }

    console.log('---\nExecuting updates...\n');

    // Execute updates
    let updatedCount = 0;
    for (const update of updates) {
      await prisma.document.update({
        where: { id: update.id },
        data: { path: update.newPath },
      });
      updatedCount++;
      console.log(`✓ Updated: ${update.name}`);
    }

    console.log(`\n✅ Migration complete! Updated ${updatedCount} document paths.`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateUncategorizedDocuments()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
