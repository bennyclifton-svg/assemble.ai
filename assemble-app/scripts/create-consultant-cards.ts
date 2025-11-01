/**
 * Script to create missing consultant cards for activated disciplines
 * Run with: npx tsx scripts/create-consultant-cards.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking for missing consultant cards...\n');

  // Get all firms with consultantCardId
  const firms = await prisma.firm.findMany({
    where: {
      consultantCardId: { not: null },
    },
    select: {
      consultantCardId: true,
      projectId: true,
      entity: true,
    },
  });

  console.log(`Found ${firms.length} firms with consultant cards`);

  // Get unique consultant card IDs
  const uniqueCardIds = [...new Set(firms.map((f) => f.consultantCardId))].filter(Boolean) as string[];

  console.log(`\nUnique consultant card IDs: ${uniqueCardIds.join(', ')}\n`);

  // Check which cards exist
  const existingCards = await prisma.card.findMany({
    where: {
      id: { in: uniqueCardIds },
    },
    select: {
      id: true,
      type: true,
      projectId: true,
    },
  });

  const existingCardIds = existingCards.map((c) => c.id);
  const missingCardIds = uniqueCardIds.filter((id) => !existingCardIds.includes(id));

  console.log(`Existing cards: ${existingCardIds.join(', ') || 'none'}`);
  console.log(`Missing cards: ${missingCardIds.join(', ') || 'none'}\n`);

  if (missingCardIds.length === 0) {
    console.log('✅ All consultant cards exist!');
    return;
  }

  // Create missing cards
  console.log(`Creating ${missingCardIds.length} missing consultant cards...\n`);

  for (const cardId of missingCardIds) {
    // Find a firm with this cardId to get the projectId
    const firm = firms.find((f) => f.consultantCardId === cardId);
    if (!firm) {
      console.log(`⚠️  Skipping ${cardId} - no firm found`);
      continue;
    }

    try {
      const card = await prisma.card.create({
        data: {
          id: cardId,
          projectId: firm.projectId,
          type: 'CONSULTANT',
          createdBy: 'system',
          updatedBy: 'system',
        },
      });

      console.log(`✅ Created card: ${card.id} for project ${firm.projectId}`);
    } catch (error) {
      console.error(`❌ Failed to create card ${cardId}:`, error);
    }
  }

  console.log('\n✅ Done!');
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
