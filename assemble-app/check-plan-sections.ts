import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const planCard = await prisma.card.findFirst({
    where: {
      projectId: 'demo',
      type: 'PLAN',
    },
    include: {
      sections: {
        select: {
          id: true,
          name: true,
          order: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  console.log('=== PLAN CARD ===');
  console.log(`Card ID: ${planCard?.id}`);
  console.log(`\nSections (${planCard?.sections.length || 0}):`);
  planCard?.sections.forEach(s => {
    console.log(`  ${s.order}. "${s.name}" (id: ${s.id})`);
  });

  console.log('\n=== ALLOWED_PLAN_SECTIONS ===');
  const allowed = ['Details', 'Objectives', 'Staging', 'Risk'];
  allowed.forEach(name => {
    const found = planCard?.sections.find(s => s.name === name);
    console.log(`  "${name}" - ${found ? '✅ FOUND' : '❌ NOT FOUND'}`);
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
