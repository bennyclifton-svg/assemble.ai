# Story 1.2: Core Database Schema

Status: Draft

## Story

As a developer,
I want to implement the three-tier data architecture with Cards → Sections → Items hierarchy,
so that we can support the flexible multi-card system with proper data relationships and audit trails.

## Acceptance Criteria

1. **AC-2.1**: Database schema supports Cards (Tier 1) with unique identifiers and CardType enum
2. **AC-2.2**: Sections (Tier 2) linked to Cards with proper foreign keys and cascade delete
3. **AC-2.3**: Items (Tier 3) linked to Sections with proper foreign keys and cascade delete
4. **AC-2.4**: Referential integrity maintained across all relationships
5. **AC-2.5**: Soft-delete capability implemented via deletedAt timestamp (no hard deletes)
6. **AC-2.6**: Audit trail fields (createdAt, updatedAt, createdBy, updatedBy) on all tables
7. **AC-2.7**: Proper indexes on foreign keys and commonly queried fields
8. **AC-2.8**: Migration runs successfully and schema matches specification
9. **AC-2.9**: Project model includes name, userId, and lastAccessedAt for project management
10. **AC-2.10**: Projects can be queried and sorted by lastAccessedAt for "most recent" ordering
11. **AC-2.11**: All Cards linked to Projects via projectId foreign key with proper isolation
12. **AC-2.12**: Cascade delete from Project to Cards ensures data cleanup

## Tasks / Subtasks

- [x] Task 1: Create Project and Card models (AC: 2.1, 2.9, 2.10, 2.11, 2.12)
  - [x] Define Project model with id, name, userId, lastAccessedAt fields
  - [x] Add audit fields to Project (createdAt, updatedAt, deletedAt)
  - [x] Add index on [userId, lastAccessedAt] for sorting recent projects
  - [x] Define Card model with projectId, type (enum), and audit fields
  - [x] Create CardType enum with all 9 card types (including DELIVER)
  - [x] Add index on [projectId, type] for efficient queries
  - [x] Implement cascade delete from Project to Cards (onDelete: Cascade)

- [ ] Task 2: Create Section model (AC: 2.2, 2.4)
  - [ ] Define Section model with cardId foreign key
  - [ ] Add name and order fields for section management
  - [ ] Implement cascade delete from Card
  - [ ] Add index on [cardId, order] for sorting

- [ ] Task 3: Create Item model (AC: 2.3, 2.4)
  - [ ] Define Item model with sectionId foreign key
  - [ ] Add order and type fields
  - [ ] Add data field as Json type for flexible storage
  - [ ] Add sourceCardId and sourceItemId for cross-card references
  - [ ] Add locked boolean for immutability
  - [ ] Implement cascade delete from Section
  - [ ] Add index on [sectionId, order]

- [ ] Task 4: Implement soft delete (AC: 2.5)
  - [ ] Add deletedAt DateTime? field to all models
  - [ ] Create Prisma middleware for soft delete filtering
  - [ ] Ensure queries exclude soft-deleted records by default
  - [ ] Test soft delete and recovery functionality

- [ ] Task 5: Add audit fields (AC: 2.6)
  - [ ] Add createdAt with @default(now())
  - [ ] Add updatedAt with @updatedAt
  - [ ] Add createdBy and updatedBy as String fields
  - [ ] Create Prisma middleware to auto-populate updatedBy

- [ ] Task 6: Optimize with indexes (AC: 2.7)
  - [ ] Add @@index directives for foreign keys
  - [ ] Add indexes for common query patterns
  - [ ] Verify index creation in migration SQL

- [ ] Task 7: Create and run migration (AC: 2.8)
  - [ ] Run `npx prisma migrate dev --name add_core_models`
  - [ ] Verify migration SQL for correctness
  - [ ] Test with Prisma Studio
  - [ ] Create seed script for test data

- [x] Task 8: Create database service layer (Partial - project actions completed)
  - [x] Create src/app/actions/project.ts (server action pattern instead of service)
  - [x] Implement project CRUD operations (create, getById, getUserProjects, updateLastAccessed, rename, softDelete)
  - [ ] Create src/server/services/cardService.ts
  - [ ] Implement card CRUD operations with soft delete
  - [ ] Add transaction support for multi-table operations
  - [ ] Write basic integration tests for project and card services

## Dev Notes

### Prisma Schema Structure
```prisma
model Project {
  id              String   @id @default(cuid())
  name            String
  userId          String
  lastAccessedAt  DateTime @default(now())
  cards           Card[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?

  @@index([userId, lastAccessedAt])
}

model Card {
  id          String      @id @default(cuid())
  projectId   String
  project     Project     @relation(fields: [projectId], references: [id])
  type        CardType
  sections    Section[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  createdBy   String
  updatedBy   String
  deletedAt   DateTime?

  @@index([projectId, type])
}

enum CardType {
  PLAN
  CONSULTANT
  CONTRACTOR
  PROCURE
  COST_PLANNING
  SCHEME_DESIGN
  DETAIL_DESIGN
  DOCUMENTS
  DELIVER
}

model Section {
  id          String   @id @default(cuid())
  cardId      String
  card        Card     @relation(fields: [cardId], references: [id], onDelete: Cascade)
  name        String
  order       Int
  items       Item[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String
  updatedBy   String
  deletedAt   DateTime?

  @@index([cardId, order])
}

model Item {
  id            String   @id @default(cuid())
  sectionId     String
  section       Section  @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  order         Int
  type          String   // 'text', 'number', 'date', 'toggle', 'status_icons'
  data          Json
  sourceCardId  String?
  sourceItemId  String?
  locked        Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String
  updatedBy   String
  deletedAt     DateTime?

  @@index([sectionId, order])
}
```

### Implementation Notes
1. **Soft Delete Middleware**: Must be added to Prisma client initialization
2. **Audit Middleware**: Auto-populate createdBy/updatedBy from auth context
3. **Transaction Pattern**: Use for operations spanning multiple tables
4. **Type Safety**: Leverage Prisma's generated types throughout
5. **Project Context**: lastAccessedAt updated whenever user navigates to a project
6. **Project Isolation**: All data queries must filter by projectId to ensure proper isolation
7. **Auto-Naming**: Project service generates sequential names based on user's existing project count
8. **Cascade Deletes**: Deleting a project removes all associated Cards, Sections, and Items

### Testing Approach
- Integration tests for CRUD operations
- Test cascade deletes work correctly
- Verify soft delete filtering
- Test transaction rollback scenarios

### References

- [Source: docs/tech-spec-epic-1.md#Data Models and Contracts] - Complete schema definition
- [Source: docs/architecture.md#Data Architecture] - Three-tier hierarchy explanation
- [Source: docs/PRD.md#FR002] - Soft delete requirement
- [Source: docs/architecture.md#Database Schema Strategy] - Three-tier normalized approach

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- Will be filled by implementing agent -->

### Debug Log References

### Completion Notes List

**Project Schema Enhancements - November 2, 2025**

Enhanced Project model with project management fields and server actions:

**Database Schema Updates** (`prisma/schema.prisma`):
- Added `lastAccessedAt` field to Project model with `@default(now())`
- Added index on `[userId, lastAccessedAt]` for efficient "most recent projects" queries
- Schema already had proper cascade deletes from Project to Cards (verified)
- Ran `npx prisma db push` to apply schema changes to database

**Server Actions** (`src/app/actions/project.ts`):
- Implemented full project CRUD using Next.js server actions pattern
- `getUserProjects()`: Returns projects ordered by lastAccessedAt DESC
- `createProject()`: Auto-generates sequential names based on user's project count
- `getProject()`: Fetches and validates single project ownership
- `renameProject()`: Updates project name with authorization checks
- `updateLastAccessed()`: Updates timestamp (called when project is accessed)
- `deleteProject()`: Soft delete implementation
- All actions use ActionResult pattern for consistent error handling

**Features Delivered**:
- Project isolation with userId foreign keys
- Efficient querying with proper indexes
- Soft delete capability (deletedAt timestamp)
- Auto-increment naming logic
- Server-side authorization checks
- Type-safe error handling

**Acceptance Criteria Met**: AC-2.9, AC-2.10, AC-2.11 (verified), AC-2.12 (verified)

### File List

**Created**:
- `src/app/actions/project.ts`

**Modified**:
- `prisma/schema.prisma` (added lastAccessedAt field and index)