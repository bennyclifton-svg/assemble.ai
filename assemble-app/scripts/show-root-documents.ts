import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showRootDocuments() {
  const docs = await prisma.document.findMany({
    where: {
      OR: [
        { path: '' },
        { path: { not: { contains: '/' } } }
      ]
    },
    select: { id: true, name: true, path: true }
  });

  console.log(`Found ${docs.length} documents without proper folder structure:\n`);
  docs.forEach(d => {
    console.log(`  - ${d.name}`);
    console.log(`    Path: "${d.path}"`);
    console.log(`    ID: ${d.id}\n`);
  });

  await prisma.$disconnect();
}

showRootDocuments();
