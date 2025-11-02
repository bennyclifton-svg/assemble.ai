import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDocumentSchedule() {
  try {
    // 1. Check if there are any documents
    const documents = await prisma.document.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        displayName: true,
        path: true,
        version: true,
        projectId: true,
      },
    });

    console.log('\n=== DOCUMENTS IN DATABASE ===');
    console.log(`Total documents: ${documents.length}`);
    documents.slice(0, 5).forEach(doc => {
      console.log(`- ${doc.displayName} (${doc.path}) v${doc.version} - Project: ${doc.projectId}`);
    });

    // 2. Check latest tender packages for document schedule
    const tenderPackages = await prisma.tenderPackage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        createdAt: true,
        documentSchedule: true,
      },
    });

    console.log('\n=== LATEST TENDER PACKAGES ===');
    for (const pkg of tenderPackages) {
      console.log(`\nPackage ID: ${pkg.id}`);
      console.log(`Created: ${pkg.createdAt}`);

      if (pkg.documentSchedule) {
        const schedule = pkg.documentSchedule as any;
        console.log('Document Schedule:', JSON.stringify(schedule, null, 2));
      } else {
        console.log('Document Schedule: NULL or empty');
      }
    }

    // 3. Check if tender configs have project associations
    const configs = await prisma.tenderPackageConfig.findMany({
      include: {
        consultantCard: {
          select: {
            id: true,
            projectId: true,
          },
        },
        contractorCard: {
          select: {
            id: true,
            projectId: true,
          },
        },
      },
    });

    console.log('\n=== TENDER CONFIGS ===');
    configs.forEach(config => {
      const projectId = config.consultantCard?.projectId || config.contractorCard?.projectId;
      console.log(`Config ${config.id}: Project ID = ${projectId || 'NONE'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDocumentSchedule();