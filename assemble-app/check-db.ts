import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const firms = await prisma.firm.findMany({
    where: { projectId: 'demo' },
    select: {
      id: true,
      entity: true,
      consultantCardId: true,
    },
  });

  console.log('=== FIRMS ===');
  console.log(JSON.stringify(firms, null, 2));

  const cards = await prisma.card.findMany({
    where: {
      projectId: 'demo',
      type: 'CONSULTANT',
    },
    include: {
      sections: {
        select: {
          id: true,
          name: true,
          order: true,
        },
      },
    },
  });

  console.log('\n=== CONSULTANT CARDS ===');
  cards.forEach(card => {
    console.log(`Card ID: ${card.id}`);
    console.log(`  Sections (${card.sections.length}):`);
    card.sections.forEach(s => {
      console.log(`    - ${s.name} (order: ${s.order})`);
    });
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
