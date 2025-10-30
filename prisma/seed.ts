import { PrismaClient, CardType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create a test project
  const project = await prisma.project.create({
    data: {
      name: 'Sample Construction Project',
      userId: 'test-user-123',
    },
  });

  console.log(`Created project: ${project.name} (${project.id})`);

  // Create a Plan Card
  const planCard = await prisma.card.create({
    data: {
      projectId: project.id,
      type: CardType.PLAN,
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  console.log(`Created Plan Card (${planCard.id})`);

  // Create sections for Plan Card
  const detailsSection = await prisma.section.create({
    data: {
      cardId: planCard.id,
      name: 'Details',
      order: 0,
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  const objectivesSection = await prisma.section.create({
    data: {
      cardId: planCard.id,
      name: 'Objectives',
      order: 1,
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  const stagingSection = await prisma.section.create({
    data: {
      cardId: planCard.id,
      name: 'Staging',
      order: 2,
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  console.log(`Created ${3} sections for Plan Card`);

  // Create sample items in Details section
  await prisma.item.create({
    data: {
      sectionId: detailsSection.id,
      order: 0,
      type: 'text',
      data: {
        label: 'Project Name',
        value: 'Sample Construction Project',
      },
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  await prisma.item.create({
    data: {
      sectionId: detailsSection.id,
      order: 1,
      type: 'text',
      data: {
        label: 'Address',
        value: '123 Main Street, Sydney NSW 2000',
      },
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  await prisma.item.create({
    data: {
      sectionId: detailsSection.id,
      order: 2,
      type: 'number',
      data: {
        label: 'Number of Stories',
        value: 5,
      },
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  console.log(`Created ${3} items in Details section`);

  // Create sample items in Objectives section
  await prisma.item.create({
    data: {
      sectionId: objectivesSection.id,
      order: 0,
      type: 'text',
      data: {
        label: 'Functional',
        value: 'Provide modern office space with collaborative areas',
      },
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  await prisma.item.create({
    data: {
      sectionId: objectivesSection.id,
      order: 1,
      type: 'text',
      data: {
        label: 'Budget',
        value: '$15M AUD',
      },
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  console.log(`Created ${2} items in Objectives section`);

  // Create a Consultant Card
  const consultantCard = await prisma.card.create({
    data: {
      projectId: project.id,
      type: CardType.CONSULTANT,
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  console.log(`Created Consultant Card (${consultantCard.id})`);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
