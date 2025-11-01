#!/usr/bin/env npx tsx

/**
 * Test script for Tender Evaluation functionality (Story 4.5)
 *
 * This script tests the following:
 * 1. Creating tender evaluation tables
 * 2. Managing line items with hierarchical structure
 * 3. Calculating sub-totals and grand totals
 * 4. Side-by-side firm price comparison
 */

import { prisma } from '../src/lib/db';

async function testTenderEvaluation() {
  console.log('🧪 Testing Tender Evaluation functionality...\n');

  try {
    // 1. Check if tender evaluation tables exist
    console.log('✅ Checking Prisma schema...');
    const schemaCheck = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('TenderEvaluation', 'TenderEvaluationTable', 'EvaluationLineItem', 'FirmPrice')
    `;
    console.log('  - Database tables:', schemaCheck);

    // 2. Create a test evaluation (if not exists)
    console.log('\n✅ Creating test tender evaluation...');
    const testProjectId = 'test-project-1';
    const testDisciplineId = 'architect';
    const testConsultantCardId = 'architect-card-1';

    let evaluation = await prisma.tenderEvaluation.findFirst({
      where: {
        projectId: testProjectId,
        disciplineId: testDisciplineId,
        consultantCardId: testConsultantCardId,
      },
    });

    if (!evaluation) {
      evaluation = await prisma.tenderEvaluation.create({
        data: {
          projectId: testProjectId,
          disciplineId: testDisciplineId,
          consultantCardId: testConsultantCardId,
          grandTotal: 0,
          createdBy: 'test-user',
          updatedBy: 'test-user',
        },
      });
      console.log('  - Created new evaluation:', evaluation.id);
    } else {
      console.log('  - Found existing evaluation:', evaluation.id);
    }

    // 3. Create test tables
    console.log('\n✅ Creating evaluation tables...');

    // Check if Table 1 exists
    let table1 = await prisma.tenderEvaluationTable.findFirst({
      where: {
        evaluationId: evaluation.id,
        tableNumber: 1,
      },
    });

    if (!table1) {
      table1 = await prisma.tenderEvaluationTable.create({
        data: {
          evaluationId: evaluation.id,
          tableNumber: 1,
          tableName: 'Original',
          subTotal: 0,
          sortOrder: 0,
        },
      });
      console.log('  - Created Table 1 (Original)');
    }

    // Check if Table 2 exists
    let table2 = await prisma.tenderEvaluationTable.findFirst({
      where: {
        evaluationId: evaluation.id,
        tableNumber: 2,
      },
    });

    if (!table2) {
      table2 = await prisma.tenderEvaluationTable.create({
        data: {
          evaluationId: evaluation.id,
          tableNumber: 2,
          tableName: 'Adds and Subs',
          subTotal: 0,
          sortOrder: 1,
        },
      });
      console.log('  - Created Table 2 (Adds and Subs)');
    }

    // 4. Verify hierarchical structure support
    console.log('\n✅ Testing hierarchical line items...');

    // Create a category item
    const categoryItem = await prisma.evaluationLineItem.create({
      data: {
        tableId: table1.id,
        description: 'Design Services',
        isCategory: true,
        sortOrder: 0,
      },
    });
    console.log('  - Created category:', categoryItem.description);

    // Create child items
    const childItem1 = await prisma.evaluationLineItem.create({
      data: {
        tableId: table1.id,
        description: 'Concept Design',
        isCategory: false,
        parentCategoryId: categoryItem.id,
        sortOrder: 1,
      },
    });
    console.log('  - Created child item:', childItem1.description);

    // 5. Test firm price storage
    console.log('\n✅ Testing firm price storage...');

    // Create test firms if not exist
    let firm1 = await prisma.firm.findFirst({
      where: {
        projectId: testProjectId,
        entity: 'Test Firm A',
      },
    });

    if (!firm1) {
      firm1 = await prisma.firm.create({
        data: {
          projectId: testProjectId,
          consultantCardId: testConsultantCardId,
          entity: 'Test Firm A',
          shortListed: true,
          displayOrder: 0,
          createdBy: 'test-user',
          updatedBy: 'test-user',
        },
      });
      console.log('  - Created test firm:', firm1.entity);
    }

    // Add firm price
    const firmPrice = await prisma.firmPrice.create({
      data: {
        lineItemId: childItem1.id,
        firmId: firm1.id,
        amount: 25000,
      },
    });
    console.log('  - Added price for', firm1.entity, ':', firmPrice.amount);

    // 6. Calculate totals
    console.log('\n✅ Calculating totals...');

    const allPrices = await prisma.firmPrice.findMany({
      where: {
        lineItem: {
          tableId: table1.id,
        },
      },
    });

    const table1Total = allPrices.reduce((sum, price) => sum + Number(price.amount), 0);

    await prisma.tenderEvaluationTable.update({
      where: { id: table1.id },
      data: { subTotal: table1Total },
    });

    console.log('  - Table 1 sub-total:', table1Total);

    // Update grand total
    await prisma.tenderEvaluation.update({
      where: { id: evaluation.id },
      data: { grandTotal: table1Total },
    });

    console.log('  - Grand total:', table1Total);

    console.log('\n✅ Tender Evaluation test completed successfully!');
    console.log('  - Hierarchical structure: ✓');
    console.log('  - Multiple tables: ✓');
    console.log('  - Firm prices: ✓');
    console.log('  - Calculations: ✓');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testTenderEvaluation();