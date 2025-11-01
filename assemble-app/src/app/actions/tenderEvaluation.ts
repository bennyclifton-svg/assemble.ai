'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';
import { TenderEvaluation, TenderEvaluationTable, EvaluationLineItem } from '@/stores/tenderEvaluationStore';

export async function getTenderEvaluation(
  projectId: string,
  disciplineId: string,
  consultantCardId?: string,
  contractorCardId?: string
) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    const evaluation = await prisma.tenderEvaluation.findFirst({
      where: {
        projectId,
        disciplineId,
        ...(consultantCardId ? { consultantCardId } : {}),
        ...(contractorCardId ? { contractorCardId } : {}),
      },
      include: {
        tables: {
          include: {
            items: {
              include: {
                firmPrices: {
                  include: {
                    firm: true,
                  },
                },
              },
              orderBy: {
                sortOrder: 'asc',
              },
            },
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    if (!evaluation) {
      return null;
    }

    // Transform database model to client model
    return transformEvaluationFromDb(evaluation);
  } catch (error) {
    console.error('Error fetching tender evaluation:', error);
    throw new Error('Failed to fetch tender evaluation');
  }
}

export async function saveTenderEvaluation(evaluation: TenderEvaluation) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    // Check if evaluation exists
    let existingEvaluation = null;
    if (evaluation.id) {
      existingEvaluation = await prisma.tenderEvaluation.findUnique({
        where: { id: evaluation.id },
      });
    } else {
      // Try to find by unique constraint
      existingEvaluation = await prisma.tenderEvaluation.findFirst({
        where: {
          projectId: evaluation.projectId,
          disciplineId: evaluation.disciplineId,
          ...(evaluation.consultantCardId ? { consultantCardId: evaluation.consultantCardId } : {}),
          ...(evaluation.contractorCardId ? { contractorCardId: evaluation.contractorCardId } : {}),
        },
      });
    }

    if (existingEvaluation) {
      // Update existing evaluation
      await prisma.$transaction(async (tx) => {
        // Delete existing tables and items
        await tx.evaluationLineItem.deleteMany({
          where: {
            table: {
              evaluationId: existingEvaluation.id,
            },
          },
        });

        await tx.tenderEvaluationTable.deleteMany({
          where: {
            evaluationId: existingEvaluation.id,
          },
        });

        // Update evaluation and create new tables
        await tx.tenderEvaluation.update({
          where: { id: existingEvaluation.id },
          data: {
            grandTotal: new Decimal(evaluation.grandTotal || 0),
            updatedBy: userId,
            tables: {
              create: evaluation.tables.map((table) => ({
                tableNumber: table.tableNumber,
                tableName: table.tableName,
                subTotal: new Decimal(table.subTotal || 0),
                sortOrder: table.sortOrder,
                items: {
                  create: flattenItemsForDb(table.items).map((item) => ({
                    description: item.description,
                    isCategory: item.isCategory,
                    parentCategoryId: item.parentCategoryId,
                    categorySubTotal: item.categorySubTotal ? new Decimal(item.categorySubTotal) : null,
                    sortOrder: item.sortOrder,
                    firmPrices: {
                      create: item.firmPrices.map((price) => ({
                        firmId: price.firmId,
                        amount: new Decimal(price.amount || 0),
                      })),
                    },
                  })),
                },
              })),
            },
          },
        });
      });
    } else {
      // Create new evaluation
      await prisma.tenderEvaluation.create({
        data: {
          projectId: evaluation.projectId,
          disciplineId: evaluation.disciplineId,
          consultantCardId: evaluation.consultantCardId,
          contractorCardId: evaluation.contractorCardId,
          grandTotal: new Decimal(evaluation.grandTotal || 0),
          createdBy: userId,
          updatedBy: userId,
          tables: {
            create: evaluation.tables.map((table) => ({
              tableNumber: table.tableNumber,
              tableName: table.tableName,
              subTotal: new Decimal(table.subTotal || 0),
              sortOrder: table.sortOrder,
              items: {
                create: flattenItemsForDb(table.items).map((item) => ({
                  description: item.description,
                  isCategory: item.isCategory,
                  parentCategoryId: item.parentCategoryId,
                  categorySubTotal: item.categorySubTotal ? new Decimal(item.categorySubTotal) : null,
                  sortOrder: item.sortOrder,
                  firmPrices: {
                    create: item.firmPrices.map((price) => ({
                      firmId: price.firmId,
                      amount: new Decimal(price.amount || 0),
                    })),
                  },
                })),
              },
            })),
          },
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving tender evaluation:', error);
    throw new Error('Failed to save tender evaluation');
  }
}

export async function retrieveFromTenderSchedules(
  projectId: string,
  disciplineId: string,
  evaluationId?: string
) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    // Check if tender submission documents exist
    const tenderDocuments = await prisma.document.findMany({
      where: {
        projectId,
        path: {
          contains: 'Tender Submissions',
        },
        processingStatus: 'completed',
      },
    });

    if (tenderDocuments.length === 0) {
      return {
        success: false,
        message: 'No tender submission documents found. Please upload tender documents first.',
      };
    }

    // For now, return a mock response
    // In a real implementation, this would:
    // 1. Parse the tender submission documents
    // 2. Extract price schedule data using AI
    // 3. Match line items with Table 1 structure
    // 4. Return populated prices

    // Mock data for demonstration
    const mockPriceData = {
      items: [
        {
          id: 'retrieved_1',
          description: 'Concept Design',
          isCategory: false,
          firmPrices: [
            { firmId: 'firm1', firmName: 'Firm A', amount: 15000 },
            { firmId: 'firm2', firmName: 'Firm B', amount: 18000 },
          ],
          sortOrder: 0,
        },
        {
          id: 'retrieved_2',
          description: 'Schematic Design',
          isCategory: false,
          firmPrices: [
            { firmId: 'firm1', firmName: 'Firm A', amount: 25000 },
            { firmId: 'firm2', firmName: 'Firm B', amount: 22000 },
          ],
          sortOrder: 1,
        },
        {
          id: 'retrieved_3',
          description: 'Design Development',
          isCategory: false,
          firmPrices: [
            { firmId: 'firm1', firmName: 'Firm A', amount: 35000 },
            { firmId: 'firm2', firmName: 'Firm B', amount: 38000 },
          ],
          sortOrder: 2,
        },
      ],
    };

    return {
      success: true,
      data: mockPriceData,
    };
  } catch (error) {
    console.error('Error retrieving tender schedules:', error);
    return {
      success: false,
      message: 'Failed to retrieve tender schedule data',
    };
  }
}

// Helper function to flatten hierarchical items for database storage
function flattenItemsForDb(
  items: EvaluationLineItem[],
  parentId?: string
): any[] {
  const result: any[] = [];

  items.forEach((item) => {
    const dbItem = {
      description: item.description,
      isCategory: item.isCategory,
      parentCategoryId: parentId,
      categorySubTotal: item.categorySubTotal,
      sortOrder: item.sortOrder,
      firmPrices: item.firmPrices || [],
    };

    result.push(dbItem);

    if (item.children && item.children.length > 0) {
      result.push(...flattenItemsForDb(item.children, item.id));
    }
  });

  return result;
}

// Helper function to transform database model to client model
function transformEvaluationFromDb(dbEvaluation: any): TenderEvaluation {
  return {
    id: dbEvaluation.id,
    consultantCardId: dbEvaluation.consultantCardId,
    contractorCardId: dbEvaluation.contractorCardId,
    projectId: dbEvaluation.projectId,
    disciplineId: dbEvaluation.disciplineId,
    grandTotal: dbEvaluation.grandTotal ? Number(dbEvaluation.grandTotal) : 0,
    tables: dbEvaluation.tables.map((table: any) => ({
      id: table.id,
      tableNumber: table.tableNumber,
      tableName: table.tableName,
      subTotal: table.subTotal ? Number(table.subTotal) : 0,
      sortOrder: table.sortOrder,
      items: buildHierarchicalItems(table.items),
    })),
  };
}

// Helper function to build hierarchical structure from flat database items
function buildHierarchicalItems(flatItems: any[]): EvaluationLineItem[] {
  const itemMap = new Map<string, EvaluationLineItem>();
  const rootItems: EvaluationLineItem[] = [];

  // First pass: create all items
  flatItems.forEach((item) => {
    const evaluationItem: EvaluationLineItem = {
      id: item.id,
      description: item.description,
      isCategory: item.isCategory,
      parentCategoryId: item.parentCategoryId,
      categorySubTotal: item.categorySubTotal ? Number(item.categorySubTotal) : undefined,
      sortOrder: item.sortOrder,
      firmPrices: item.firmPrices.map((fp: any) => ({
        firmId: fp.firmId,
        firmName: fp.firm.entity,
        amount: fp.amount ? Number(fp.amount) : 0,
      })),
      children: [],
    };

    itemMap.set(item.id, evaluationItem);
  });

  // Second pass: build hierarchy
  itemMap.forEach((item) => {
    if (item.parentCategoryId) {
      const parent = itemMap.get(item.parentCategoryId);
      if (parent && parent.children) {
        parent.children.push(item);
      }
    } else {
      rootItems.push(item);
    }
  });

  return rootItems;
}

