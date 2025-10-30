import { Prisma, PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  // Soft delete middleware - filters out deleted records by default
  client.$use(async (params, next) => {
    // Check if operation is on a model with deletedAt field
    const modelsWithSoftDelete = ['Project', 'Card', 'Section', 'Item'];

    if (modelsWithSoftDelete.includes(params.model || '')) {
      // For findMany and findFirst, add deletedAt: null to filter
      if (params.action === 'findMany' || params.action === 'findFirst') {
        params.args.where = {
          ...params.args.where,
          deletedAt: null,
        };
      }

      // For findUnique, we need to use findFirst with unique fields
      if (params.action === 'findUnique') {
        params.action = 'findFirst';
        params.args.where = {
          ...params.args.where,
          deletedAt: null,
        };
      }

      // For update, check if record is not deleted
      if (params.action === 'update') {
        params.args.where = {
          ...params.args.where,
          deletedAt: null,
        };
      }

      // For delete, convert to update with deletedAt timestamp
      if (params.action === 'delete') {
        params.action = 'update';
        params.args.data = { deletedAt: new Date() };
      }

      // For deleteMany, convert to updateMany
      if (params.action === 'deleteMany') {
        params.action = 'updateMany';
        if (params.args.data !== undefined) {
          params.args.data.deletedAt = new Date();
        } else {
          params.args.data = { deletedAt: new Date() };
        }
      }
    }

    return next(params);
  });

  return client;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
