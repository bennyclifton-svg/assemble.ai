# Technical Specification: Foundation & Core Data Architecture

Date: 2025-10-25
Author: Benny
Epic ID: epic-1
Status: Draft

---

## Overview

This epic establishes the technical foundation for assemble.ai, implementing the core infrastructure, database schema for the three-tier Card system (Cards → Sections → Items), and the Plan Card with comprehensive default values. Drawing from the PRD's goal of reducing tender package creation from days to <2 hours, this foundation provides the data architecture and UI framework that enables AI-powered automation and multi-card workspace functionality. The implementation follows the architecture's decision for Next.js 15 with TypeScript, PostgreSQL with Prisma ORM, and Zustand for state management.

## Objectives and Scope

**In Scope:**
- Next.js 15 project initialization with TypeScript and Tailwind CSS
- PostgreSQL database setup with Prisma 6.0.1 ORM
- Three-tier data model (Cards, Sections, Items) with soft delete
- AWS S3 configuration for file storage
- Clerk authentication integration (single user initially)
- Side navigation bar with multi-card support
- Complete Plan Card implementation with all 7 sections
- Consultant list (36 disciplines) and Contractor list (20 trades)
- Status tracking icons (Brief, Tender, Rec, Award)

**Out of Scope:**
- Document processing (Epic 2)
- Tender generation (Epic 4)
- Cost tracking features (Epic 5)
- Multi-user/role management (future enhancement)
- Mobile responsiveness (v2 feature per PRD)

## System Architecture Alignment

This epic implements the foundation layer of the Multi-Card Workspace pattern defined in the architecture. It establishes the three-tier normalized database schema, initializes the Zustand stores for workspace state management, and creates the navigation components that enable 2-3 cards to be displayed simultaneously. The implementation strictly follows the technology decisions: Next.js 15.0.0 App Router, Prisma 6.0.1 for database access, and component naming conventions (PascalCase for components, camelCase for utilities).

## Detailed Design

### Services and Modules

| Module | Responsibility | Input/Output | Owner |
|--------|---------------|--------------|--------|
| Database Service | Prisma client singleton, connection pooling | Connection string → Prisma client instance | server/db.ts |
| Card Service | CRUD operations for Cards | Card data → Card entity with sections/items | server/services/cardService.ts |
| Section Service | Section management within Cards | Section data, cardId → Section entity | server/services/sectionService.ts |
| Item Service | Item CRUD with audit trail | Item data, sectionId → Item entity | server/services/itemService.ts |
| Workspace Store | Client state for active cards | Card operations → Zustand state updates | stores/workspaceStore.ts |
| Auth Middleware | Protect routes, attach userId | Request → userId or redirect | middleware.ts |

### Data Models and Contracts

```prisma
model Project {
  id          String   @id @default(cuid())
  name        String
  userId      String
  cards       Card[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
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
  data          Json     // Flexible storage
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String
  updatedBy   String
  deletedAt     DateTime?

  @@index([sectionId, order])
}
```

### APIs and Interfaces

**Server Actions (app/actions/card.ts):**
```typescript
async function createPlanCard(projectId: string): Promise<ActionResult<Card>>
async function updateSection(sectionId: string, data: Json): Promise<ActionResult<Section>>
async function updateItem(itemId: string, data: Json): Promise<ActionResult<Item>>
async function reorderItems(sectionId: string, itemIds: string[]): Promise<ActionResult<void>>
```

**tRPC Procedures (server/api/routers/card.ts):**
```typescript
card.getByType: { projectId, type } → Card with sections/items
card.list: { projectId } → Card[]
section.getWithItems: { sectionId } → Section with items
item.bulkUpdate: { updates: ItemUpdate[] } → Item[]
```

### Workflows and Sequencing

**Plan Card Initialization Flow:**
1. User creates new project → Project entity created
2. System auto-creates Plan Card → Card with CardType.PLAN
3. System creates 7 default sections → Details, Objectives, Staging, Risk, Stakeholders, Consultant List, Contractor List
4. System populates default items:
   - Details: 8 fields (Project Name, Address, etc.)
   - Objectives: 4 fields (Functional, Quality, Budget, Program)
   - Staging: 5 default stages
   - Risk: 3 placeholder items
   - Consultant List: 36 disciplines with toggle + 4 status icons each
   - Contractor List: 20 trades with toggle + 4 status icons each
5. UI renders Plan Card with collapsible sections

## Non-Functional Requirements

### Performance

- Initial page load < 2 seconds (per NFR003)
- Card switching < 500ms (optimistic updates via Zustand)
- Database queries use indexes on projectId, cardId, sectionId
- Pagination for items if section contains > 100 items
- React Suspense boundaries for streaming SSR

### Security

- All routes protected by Clerk middleware (NFR011)
- User ID attached to all database writes (createdBy, updatedBy)
- Environment variables for sensitive config (NFR014)
- Input validation with Zod schemas
- SQL injection prevented by Prisma parameterized queries

### Reliability/Availability

- Soft delete only (deletedAt timestamp) for audit trail (NFR009)
- Database transactions for multi-table operations
- Optimistic UI updates with rollback on server error
- Connection pooling with automatic retry

### Observability

- Structured logging with pino (action, userId, cardId, duration)
- Sentry error tracking with context
- Database query performance monitoring
- React DevTools profiling in development

## Dependencies and Integrations

**Package Dependencies (package.json):**
- next: 15.0.0
- react: 19.0.0
- typescript: 5.1.0+
- @prisma/client: 6.0.1
- prisma: 6.0.1 (devDependency)
- @clerk/nextjs: latest
- zustand: 5.0.8
- @aws-sdk/client-s3: 3.x
- tailwindcss: 4.0.0
- lucide-react: latest (icons)
- zod: 3.x (validation)
- pino: 9.0.0 (logging)

**External Services:**
- PostgreSQL 16.0 database
- AWS S3 for file storage
- Clerk for authentication

## Acceptance Criteria (Authoritative)

1. **AC-1.1**: Next.js 15 project runs locally with TypeScript strict mode
2. **AC-1.2**: PostgreSQL connected via Prisma with migrations applied
3. **AC-1.3**: AWS S3 bucket accessible with signed URL generation
4. **AC-1.4**: Single user can sign in/out via Clerk
5. **AC-1.5**: Git repository initialized with .gitignore for .env files
6. **AC-2.1**: Card, Section, Item tables created with proper relationships
7. **AC-2.2**: Soft delete implemented (deletedAt field)
8. **AC-2.3**: Audit fields (createdAt, updatedAt, createdBy, updatedBy) populated
9. **AC-3.1**: Side nav displays all 8 card types
10. **AC-3.2**: 2-3 cards can be opened side-by-side
11. **AC-3.3**: Active cards highlighted in navigation
12. **AC-4.1**: Plan Card shows 7 collapsible sections
13. **AC-4.2**: Section state persists between sessions
14. **AC-5.1**: Details section has 8 editable fields
15. **AC-5.2**: Objectives section has 4 editable fields
16. **AC-6.1**: Staging section shows 5 default stages
17. **AC-6.2**: Risk section has 3 editable risk items
18. **AC-7.1**: 36 consultant disciplines displayed with toggles
19. **AC-7.2**: 4 status icons per discipline (Brief, Tender, Rec, Award)
20. **AC-8.1**: 20 contractor trades displayed with toggles
21. **AC-8.2**: Status changes persist to database

## Traceability Mapping

| Acceptance Criteria | Spec Section | Component/API | Test Approach |
|-------------------|--------------|---------------|---------------|
| AC-1.1 to AC-1.5 | Infrastructure Setup | Project init, middleware.ts | Manual verification, smoke test |
| AC-2.1 to AC-2.3 | Data Models | schema.prisma, migrations | Unit tests for Prisma operations |
| AC-3.1 to AC-3.3 | Side Navigation | NavigationSidebar.tsx, workspaceStore | Component tests, E2E navigation |
| AC-4.1 to AC-4.2 | Plan Card Structure | CardPanel.tsx, SectionList.tsx | Integration test full card render |
| AC-5.1 to AC-5.2 | Default Values | Item.tsx, updateItem action | Unit test field updates |
| AC-6.1 to AC-6.2 | Staging & Risk | Section components | Component test drag-drop |
| AC-7.1 to AC-7.2 | Consultant List | ConsultantList.tsx, status icons | E2E test status toggle flow |
| AC-8.1 to AC-8.2 | Contractor List | ContractorList.tsx | Database persistence test |

## Risks, Assumptions, Open Questions

**Risks:**
- **Risk-1**: Starter template complexity - Mitigation: Use documented command, follow architecture exactly
- **Risk-2**: Database connection issues locally - Mitigation: Docker Compose for PostgreSQL
- **Risk-3**: AWS S3 configuration - Mitigation: Use LocalStack for local development

**Assumptions:**
- **Assumption-1**: Developer has Node.js 20.9+ installed
- **Assumption-2**: PostgreSQL accessible (local or cloud)
- **Assumption-3**: Clerk account created with API keys

**Questions:**
- **Q-1**: Should consultant/contractor lists be configurable or hard-coded initially?
- **Q-2**: What's the max number of cards that can be open? (Architecture says 2-3)
- **Q-3**: Should we implement drag-drop in Epic 1 or defer to Epic 3?

## Test Strategy Summary

**Test Levels:**
- **Unit Tests (70%)**: Services, stores, utilities using Vitest
- **Integration Tests (20%)**: API routes, database operations
- **E2E Tests (10%)**: Critical path - create project, add Plan Card data using Playwright

**Test Coverage Focus:**
- Database CRUD operations with soft delete
- State persistence across sessions
- Navigation between cards
- Field editing and saving
- Status icon toggling

**Edge Cases:**
- Maximum cards open simultaneously
- Very long text in fields
- Concurrent edits (optimistic update conflicts)
- Network failure during save