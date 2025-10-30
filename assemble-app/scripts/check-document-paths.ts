/**
 * Check current document paths in database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDocumentPaths() {
  try {
    const documents = await prisma.document.findMany({
      select: {
        id: true,
        name: true,
        path: true,
      },
    });

    console.log(`Total documents: ${documents.length}\n`);

    // Group by Tier 1 folder
    const pathCounts = new Map<string, number>();
    documents.forEach(doc => {
      const tier1 = doc.path.split('/')[0] || 'Root';
      pathCounts.set(tier1, (pathCounts.get(tier1) || 0) + 1);
    });

    console.log('Documents by Tier 1 folder:\n');
    Array.from(pathCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([path, count]) => {
        console.log(`  ${path}: ${count} documents`);
      });

    // Show any unexpected paths
    const validTier1 = ['Plan', 'Scheme', 'Detail', 'Procure', 'Delivery', 'Consultants', 'Contractors', 'Admin', 'Finance'];
    const invalidPaths = Array.from(pathCounts.keys()).filter(p => !validTier1.includes(p));

    if (invalidPaths.length > 0) {
      console.log('\n⚠️  Unexpected Tier 1 folders found:');
      invalidPaths.forEach(path => {
        console.log(`  - ${path}: ${pathCounts.get(path)} documents`);
        // Show specific documents
        const docsInPath = documents.filter(d => d.path.startsWith(path));
        docsInPath.forEach(doc => {
          console.log(`    → ${doc.name} (${doc.path})`);
        });
      });
    } else {
      console.log('\n✅ All documents are in valid Tier 1 folders!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDocumentPaths();
