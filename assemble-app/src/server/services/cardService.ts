import { prisma } from '@/lib/db';
import { Card, CardType, Prisma } from '@prisma/client';

export type CardWithSections = Prisma.CardGetPayload<{
  include: { sections: { include: { items: true } } };
}>;

/**
 * Create a new card for a project
 */
export async function createCard(data: {
  projectId: string;
  type: CardType;
  createdBy: string;
}): Promise<Card> {
  return prisma.card.create({
    data: {
      projectId: data.projectId,
      type: data.type,
      createdBy: data.createdBy,
      updatedBy: data.createdBy,
    },
  });
}

/**
 * Get a card by ID with all sections and items
 */
export async function getCardById(cardId: string): Promise<CardWithSections | null> {
  return prisma.card.findUnique({
    where: { id: cardId },
    include: {
      sections: {
        orderBy: { order: 'asc' },
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });
}

/**
 * Get card by project ID and type
 */
export async function getCardByType(
  projectId: string,
  type: CardType
): Promise<CardWithSections | null> {
  return prisma.card.findFirst({
    where: {
      projectId,
      type,
    },
    include: {
      sections: {
        orderBy: { order: 'asc' },
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });
}

/**
 * List all cards for a project
 */
export async function listCardsByProject(projectId: string): Promise<Card[]> {
  return prisma.card.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Update a card
 */
export async function updateCard(
  cardId: string,
  data: {
    updatedBy: string;
    // Add other updatable fields as needed
  }
): Promise<Card> {
  return prisma.card.update({
    where: { id: cardId },
    data,
  });
}

/**
 * Soft delete a card (sets deletedAt timestamp)
 */
export async function deleteCard(cardId: string): Promise<Card> {
  return prisma.card.delete({
    where: { id: cardId },
  });
}

/**
 * Create a section within a card
 */
export async function createSection(data: {
  cardId: string;
  name: string;
  order: number;
  createdBy: string;
}) {
  return prisma.section.create({
    data: {
      cardId: data.cardId,
      name: data.name,
      order: data.order,
      createdBy: data.createdBy,
      updatedBy: data.createdBy,
    },
  });
}

/**
 * Update a section
 */
export async function updateSection(
  sectionId: string,
  data: {
    name?: string;
    order?: number;
    updatedBy: string;
  }
) {
  return prisma.section.update({
    where: { id: sectionId },
    data,
  });
}

/**
 * Create an item within a section
 */
export async function createItem(data: {
  sectionId: string;
  order: number;
  type: string;
  data: Prisma.InputJsonValue;
  sourceCardId?: string;
  sourceItemId?: string;
  locked?: boolean;
  createdBy: string;
}) {
  return prisma.item.create({
    data: {
      sectionId: data.sectionId,
      order: data.order,
      type: data.type,
      data: data.data,
      sourceCardId: data.sourceCardId,
      sourceItemId: data.sourceItemId,
      locked: data.locked ?? false,
      createdBy: data.createdBy,
      updatedBy: data.createdBy,
    },
  });
}

/**
 * Update an item
 */
export async function updateItem(
  itemId: string,
  data: {
    order?: number;
    type?: string;
    data?: Prisma.InputJsonValue;
    locked?: boolean;
    updatedBy: string;
  }
) {
  // Check if item is locked
  const item = await prisma.item.findUnique({
    where: { id: itemId },
  });

  if (item?.locked) {
    throw new Error('Cannot update locked item');
  }

  return prisma.item.update({
    where: { id: itemId },
    data,
  });
}

/**
 * Bulk update items order
 */
export async function reorderItems(
  itemIds: string[],
  updatedBy: string
): Promise<void> {
  await prisma.$transaction(
    itemIds.map((id, index) =>
      prisma.item.update({
        where: { id },
        data: { order: index, updatedBy },
      })
    )
  );
}

/**
 * Lock items (for tender package immutability)
 */
export async function lockItems(itemIds: string[], updatedBy: string): Promise<void> {
  await prisma.item.updateMany({
    where: {
      id: { in: itemIds },
    },
    data: {
      locked: true,
      updatedBy,
    },
  });
}
