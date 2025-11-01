import { PrismaClient, CardType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create a test project with a fixed ID for demo purposes
  const project = await prisma.project.upsert({
    where: { id: 'demo' },
    update: {},
    create: {
      id: 'demo',
      name: 'Demo Construction Project',
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

  const riskSection = await prisma.section.create({
    data: {
      cardId: planCard.id,
      name: 'Risk',
      order: 3,
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  console.log(`Created ${4} sections for Plan Card`);

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

  // Create sample items in Staging section
  await prisma.item.create({
    data: {
      sectionId: stagingSection.id,
      order: 0,
      type: 'text',
      data: {
        name: 'Design Development Phase - 6 months',
      },
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  await prisma.item.create({
    data: {
      sectionId: stagingSection.id,
      order: 1,
      type: 'text',
      data: {
        name: 'Construction Documentation - 4 months',
      },
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  await prisma.item.create({
    data: {
      sectionId: stagingSection.id,
      order: 2,
      type: 'text',
      data: {
        name: 'Tender and Contract - 2 months',
      },
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  console.log(`Created ${3} items in Staging section`);

  // Create sample items in Risk section
  await prisma.item.create({
    data: {
      sectionId: riskSection.id,
      order: 0,
      type: 'text',
      data: {
        label: 'Heritage Constraints',
        value: 'Building is heritage-listed, requiring council approval for facade modifications',
      },
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  await prisma.item.create({
    data: {
      sectionId: riskSection.id,
      order: 1,
      type: 'text',
      data: {
        label: 'Site Access',
        value: 'Limited site access during business hours due to adjacent commercial properties',
      },
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  await prisma.item.create({
    data: {
      sectionId: riskSection.id,
      order: 2,
      type: 'text',
      data: {
        label: 'Budget Constraints',
        value: 'Fixed budget with no contingency - requires careful scope management',
      },
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  console.log(`Created ${3} items in Risk section`);

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

  // Create sections for Consultant Card
  const scopeSection = await prisma.section.create({
    data: {
      cardId: consultantCard.id,
      name: 'Scope',
      order: 0,
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  const deliverablesSection = await prisma.section.create({
    data: {
      cardId: consultantCard.id,
      name: 'Deliverables',
      order: 1,
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  const feeStructureSection = await prisma.section.create({
    data: {
      cardId: consultantCard.id,
      name: 'Fee Structure',
      order: 2,
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  const tenderDocumentSection = await prisma.section.create({
    data: {
      cardId: consultantCard.id,
      name: 'Tender Document',
      order: 3,
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  const tenderReleaseSection = await prisma.section.create({
    data: {
      cardId: consultantCard.id,
      name: 'Tender Release and Submission',
      order: 4,
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  console.log(`Created ${5} sections for Consultant Card`);

  // Create DisciplineData for the consultant card
  const disciplineData = await prisma.disciplineData.upsert({
    where: {
      projectId_disciplineId: {
        projectId: project.id,
        disciplineId: 'architect',
      },
    },
    update: {},
    create: {
      projectId: project.id,
      disciplineId: 'architect',
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  console.log(`Created DisciplineData for architect (${disciplineData.id})`);

  // Create sample firms linked to the consultant card
  const firm1 = await prisma.firm.create({
    data: {
      projectId: project.id,
      consultantCardId: consultantCard.id,
      entity: 'ABC Architects',
      abn: '12 345 678 901',
      address: '456 Design Street, Sydney NSW 2000',
      contact: 'John Smith',
      email: 'john.smith@abcarchitects.com.au',
      mobile: '0412 345 678',
      shortListed: true,
      displayOrder: 0,
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  const firm2 = await prisma.firm.create({
    data: {
      projectId: project.id,
      consultantCardId: consultantCard.id,
      entity: 'XYZ Design Group',
      abn: '98 765 432 109',
      address: '789 Innovation Ave, Melbourne VIC 3000',
      contact: 'Sarah Johnson',
      email: 'sarah.johnson@xyzdesign.com.au',
      mobile: '0423 456 789',
      shortListed: true,
      displayOrder: 1,
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  console.log(`Created ${2} firms linked to Consultant Card`);

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
