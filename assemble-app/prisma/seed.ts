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

  // Create sample documents for the project
  const timestamp = Date.now();
  const documents = [
    // Project Documents (will appear in Document Schedule)
    {
      name: 'architectural-drawings-rev-a.pdf',
      displayName: 'Architectural Drawings Rev A',
      path: 'Consultants/Architecture/Drawings',
      s3Key: `demo/consultants/architecture/drawings-rev-a-${timestamp}-1.pdf`,
      s3Bucket: 'assemble-demo-bucket',
      url: 'https://s3.amazonaws.com/assemble-demo-bucket/demo/consultants/architecture/drawings-rev-a.pdf',
      size: 2048000, // 2MB
      mimeType: 'application/pdf',
      checksum: 'abc123def456',
      version: 1,
      projectId: project.id,
    },
    {
      name: 'structural-calculations.pdf',
      displayName: 'Structural Calculations',
      path: 'Consultants/Structure/Calculations',
      s3Key: `demo/consultants/structure/calculations-${timestamp}-2.pdf`,
      s3Bucket: 'assemble-demo-bucket',
      url: 'https://s3.amazonaws.com/assemble-demo-bucket/demo/consultants/structure/calculations.pdf',
      size: 1536000, // 1.5MB
      mimeType: 'application/pdf',
      checksum: 'def789ghi012',
      version: 1,
      projectId: project.id,
    },
    {
      name: 'mep-specifications.pdf',
      displayName: 'MEP Specifications',
      path: 'Consultants/MEP/Specifications',
      s3Key: `demo/consultants/mep/specifications-${timestamp}-3.pdf`,
      s3Bucket: 'assemble-demo-bucket',
      url: 'https://s3.amazonaws.com/assemble-demo-bucket/demo/consultants/mep/specifications.pdf',
      size: 1024000, // 1MB
      mimeType: 'application/pdf',
      checksum: 'ghi345jkl678',
      version: 2,
      projectId: project.id,
    },
    {
      name: 'project-schedule.xlsx',
      displayName: 'Project Schedule',
      path: 'Project/Planning/Schedule',
      s3Key: `demo/project/planning/schedule-${timestamp}-4.xlsx`,
      s3Bucket: 'assemble-demo-bucket',
      url: 'https://s3.amazonaws.com/assemble-demo-bucket/demo/project/planning/schedule.xlsx',
      size: 512000, // 500KB
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      checksum: 'jkl901mno234',
      version: 3,
      projectId: project.id,
    },
    {
      name: 'site-survey-report.pdf',
      displayName: 'Site Survey Report',
      path: 'Project/Survey/Report',
      s3Key: `demo/project/survey/report-${timestamp}-5.pdf`,
      s3Bucket: 'assemble-demo-bucket',
      url: 'https://s3.amazonaws.com/assemble-demo-bucket/demo/project/survey/report.pdf',
      size: 3072000, // 3MB
      mimeType: 'application/pdf',
      checksum: 'mno567pqr890',
      version: 1,
      projectId: project.id,
    },
    // Reference Documents
    {
      name: 'building-code-requirements.pdf',
      displayName: 'Building Code Requirements',
      path: 'Reference/Codes/Building',
      s3Key: `demo/reference/codes/building-${timestamp}-6.pdf`,
      s3Bucket: 'assemble-demo-bucket',
      url: 'https://s3.amazonaws.com/assemble-demo-bucket/demo/reference/codes/building.pdf',
      size: 4096000, // 4MB
      mimeType: 'application/pdf',
      checksum: 'pqr123stu456',
      version: 1,
      projectId: project.id,
    },
    {
      name: 'environmental-impact-study.pdf',
      displayName: 'Environmental Impact Study',
      path: 'Reference/Environmental/EIS',
      s3Key: `demo/reference/environmental/eis-${timestamp}-7.pdf`,
      s3Bucket: 'assemble-demo-bucket',
      url: 'https://s3.amazonaws.com/assemble-demo-bucket/demo/reference/environmental/eis.pdf',
      size: 5120000, // 5MB
      mimeType: 'application/pdf',
      checksum: 'stu789vwx012',
      version: 1,
      projectId: project.id,
    },
    {
      name: 'zoning-regulations.pdf',
      displayName: 'Zoning Regulations',
      path: 'Reference/Legal/Zoning',
      s3Key: `demo/reference/legal/zoning-${timestamp}-8.pdf`,
      s3Bucket: 'assemble-demo-bucket',
      url: 'https://s3.amazonaws.com/assemble-demo-bucket/demo/reference/legal/zoning.pdf',
      size: 2560000, // 2.5MB
      mimeType: 'application/pdf',
      checksum: 'vwx345yz678',
      version: 1,
      projectId: project.id,
    },
  ];

  for (const docData of documents) {
    await prisma.document.create({
      data: {
        ...docData,
        createdBy: 'test-user-123',
        updatedBy: 'test-user-123',
      },
    });
  }

  console.log(`Created ${documents.length} sample documents`);

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

  // Create a Consultant Card with ID matching the discipline
  // IMPORTANT: Consultant Card IDs must match discipline strings (e.g., 'architect', 'structural')
  // This ensures DisciplineData queries work correctly in tenderGenerator.ts
  const consultantCard = await prisma.card.upsert({
    where: { id: 'architect' },
    update: {},
    create: {
      id: 'architect', // Use discipline string as Card ID
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

  // IMPORTANT: Fee Structure items MUST be populated for tender generation to work
  // Without these items, Fee Structure section will return no content in reports
  // DO NOT REMOVE: These items enable Fee Structure display in tender packages
  await prisma.item.create({
    data: {
      sectionId: feeStructureSection.id,
      order: 0,
      type: 'category',
      data: {
        name: 'Design Phase',
        description: 'Design and Documentation Services',
        type: 'category',
      },
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  await prisma.item.create({
    data: {
      sectionId: feeStructureSection.id,
      order: 1,
      type: 'text',
      data: {
        name: 'Schematic Design',
        description: '15% of total fee',
      },
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  await prisma.item.create({
    data: {
      sectionId: feeStructureSection.id,
      order: 2,
      type: 'text',
      data: {
        name: 'Design Development',
        description: '25% of total fee',
      },
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  await prisma.item.create({
    data: {
      sectionId: feeStructureSection.id,
      order: 3,
      type: 'text',
      data: {
        name: 'Construction Documentation',
        description: '35% of total fee',
      },
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  await prisma.item.create({
    data: {
      sectionId: feeStructureSection.id,
      order: 4,
      type: 'category',
      data: {
        name: 'Construction Phase',
        description: 'Construction Administration',
        type: 'category',
      },
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  await prisma.item.create({
    data: {
      sectionId: feeStructureSection.id,
      order: 5,
      type: 'text',
      data: {
        name: 'Site Observation',
        description: '20% of total fee',
      },
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  await prisma.item.create({
    data: {
      sectionId: feeStructureSection.id,
      order: 6,
      type: 'text',
      data: {
        name: 'Project Close-out',
        description: '5% of total fee',
      },
      createdBy: 'test-user-123',
      updatedBy: 'test-user-123',
    },
  });

  console.log('Created 7 items in Fee Structure section');

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
      consultantCardId: 'architect', // Use discipline string directly
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
      consultantCardId: 'architect', // Use discipline string directly
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
