/**
 * Migration script to update document paths to new folder structure
 *
 * Old structure:
 * - Invoices (root level)
 * - Consultants/[discipline]
 * - Admin/...
 *
 * New structure:
 * - Finance/Invoices
 * - Consultants/[discipline] (unchanged)
 * - Admin/... (unchanged)
 * - Plan/...
 * - Scheme/[discipline]
 * - Detail/[discipline]
 * - Procure/...
 * - Delivery
 * - Contractors/[trade]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PATH_MAPPINGS: Record<string, string> = {
  'Invoices': 'Finance/Invoices',
  'Uncategorized': 'Admin/Misc',
};

async function migrateDocumentPaths() {
  console.log('Starting document path migration...\n');

  try {
    // Get all documents
    const documents = await prisma.document.findMany();
    console.log(`Found ${documents.length} documents to check\n`);

    let updatedCount = 0;
    const updates: Array<{ id: string; oldPath: string; newPath: string }> = [];

    for (const doc of documents) {
      let newPath = doc.path;
      let needsUpdate = false;

      // Check if path matches any direct mappings
      if (PATH_MAPPINGS[doc.path]) {
        newPath = PATH_MAPPINGS[doc.path];
        needsUpdate = true;
      }
      // Check if path starts with a mapped prefix
      else {
        for (const [oldPrefix, newPrefix] of Object.entries(PATH_MAPPINGS)) {
          if (doc.path.startsWith(oldPrefix + '/')) {
            newPath = doc.path.replace(oldPrefix, newPrefix);
            needsUpdate = true;
            break;
          }
        }
      }

      if (needsUpdate) {
        updates.push({
          id: doc.id,
          oldPath: doc.path,
          newPath: newPath,
        });
      }
    }

    console.log(`Found ${updates.length} documents that need path updates:\n`);

    // Show all planned updates
    updates.forEach((update, index) => {
      console.log(`${index + 1}. "${update.oldPath}" → "${update.newPath}"`);
    });

    if (updates.length === 0) {
      console.log('\nNo documents need migration. All paths are up to date!');
      return;
    }

    console.log('\n---\nExecuting updates...\n');

    // Execute updates
    for (const update of updates) {
      await prisma.document.update({
        where: { id: update.id },
        data: { path: update.newPath },
      });
      updatedCount++;
      console.log(`✓ Updated: ${update.oldPath} → ${update.newPath}`);
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
migrateDocumentPaths()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
