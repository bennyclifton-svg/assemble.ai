# Decision Architecture

## Executive Summary

assemble.ai's architecture leverages Next.js 15 with a novel multi-card workspace system, enabling construction managers to work with 2-3 cards simultaneously while maintaining data consistency. The system uses AI-powered document processing via GPT-4 Vision, three-tier normalized database architecture, and combines Server Actions with tRPC for type-safe operations. This architecture ensures rapid tender package generation (<30 seconds) while maintaining complete audit trails and immutability for released packages.

## Project Initialization

First implementation story should execute:
```bash
git clone --depth=1 https://github.com/ixartz/Next-js-Boilerplate.git assemble-ai
cd assemble-ai
npm install
```

This establishes the base architecture with these decisions:
- Next.js 15 with App Router
- TypeScript with strict mode
- Tailwind CSS 4
- Prisma ORM with PostgreSQL
- Clerk authentication (passwordless, social auth, MFA)
- Testing setup (Vitest, Testing Library, Playwright)
- ESLint, Prettier, Husky for code quality
- Sentry for error monitoring

## Decision Summary

| Category | Decision | Version | Affects Epics | Rationale |
| -------- | -------- | ------- | ------------- | --------- |
| Framework | Next.js with App Router | 15.0.0 | All | Latest stable, server components, built-in optimizations |
| Language | TypeScript | 5.1.0+ | All | Type safety critical for AI agent consistency |
| Styling | Tailwind CSS | 4.0.0 | Epic 1, 3, 4 | Utility-first, rapid development |
| Database | PostgreSQL | 16.0 | All | JSONB support, robust for complex data |
| ORM | Prisma | 6.0.1 | All | Type-safe database access, excellent DX |
| Authentication | Clerk | Latest | Epic 1 | Complete auth solution with MFA, social |
| State Management | Zustand | 5.0.8 | Epic 1, 3, 4 | Lightweight, perfect for card state management |
| AI/LLM | Vercel AI SDK + OpenAI GPT-4 | 2.0.53 | Epic 2, 4 | Best document understanding, construction knowledge |
| File Processing | GPT-4 Vision + pdf-parse | 2.4.5 | Epic 2 | Unified OCR/extraction approach |
| Real-time Updates | Polling + Optimistic Updates | N/A | Epic 3, 4 | Simpler than WebSockets, sufficient for use case |
| Drag-and-Drop | dnd-kit | 6.3.1 | Epic 1, 3, 4 | Modern, accessible, TypeScript-first |
| API Layer | Server Actions + tRPC | 11.0.0 | All | Type-safe, efficient for complex queries |
| File Storage | AWS S3 | SDK v3 | Epic 2 | Scalable, signed URLs for security |
| Logging | Pino | 9.0.0 | All | Structured JSON logging |
| Date Handling | date-fns | 3.0.0 | All | Lightweight, tree-shakeable |
| Testing | Vitest + Playwright | Latest | All | Fast unit tests, reliable E2E |
| Error Monitoring | Sentry | Latest | All | Production error tracking |

## Project Structure

```
assemble-ai/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── sign-in/
│   │   │   │   └── [[...sign-in]]/
│   │   │   │       └── page.tsx
│   │   │   └── sign-up/
│   │   │       └── [[...sign-up]]/
│   │   │           └── page.tsx
│   │   ├── (dashboard)/              # Protected routes
│   │   │   ├── layout.tsx
│   │   │   └── projects/
│   │   │       ├── page.tsx
│   │   │       ├── new/
│   │   │       │   └── page.tsx
│   │   │       └── [id]/
│   │   │           ├── page.tsx      # Workspace view
│   │   │           ├── loading.tsx
│   │   │           ├── error.tsx
│   │   │           └── components/
│   │   │               ├── Workspace.tsx
│   │   │               └── CardPanel/
│   │   ├── api/
│   │   │   └── trpc/
│   │   │       └── [trpc]/
│   │   │           └── route.ts
│   │   ├── actions/                  # Server Actions
│   │   │   ├── card.ts
│   │   │   ├── document.ts
│   │   │   ├── tender.ts
│   │   │   └── ai.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/                   # Shared components
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── table.tsx
│   │   │   └── toast.tsx
│   │   ├── cards/                    # Card system components
│   │   │   ├── CardPanel.tsx
│   │   │   ├── CardHeader.tsx
│   │   │   ├── SectionList.tsx
│   │   │   ├── Section.tsx
│   │   │   ├── ItemRow.tsx
│   │   │   └── ItemTable.tsx
│   │   └── workspace/
│   │       ├── NavigationSidebar.tsx
│   │       ├── DocumentFolderTree.tsx
│   │       ├── CardViewport.tsx
│   │       ├── ResizeDivider.tsx
│   │       └── DragOverlay.tsx
│   ├── lib/                          # Utilities and config
│   │   ├── db.ts                     # Prisma client singleton
│   │   ├── utils.ts                  # cn(), formatters
│   │   ├── validators.ts             # Zod schemas
│   │   ├── constants.ts              # App constants
│   │   └── ai/
│   │       ├── openai.ts             # AI SDK setup
│   │       ├── prompts.ts            # System prompts
│   │       └── extractors.ts         # Document extractors
│   ├── server/                       # Backend logic
│   │   ├── api/
│   │   │   ├── root.ts               # tRPC app router
│   │   │   ├── trpc.ts               # tRPC setup
│   │   │   └── routers/
│   │   │       ├── project.ts
│   │   │       ├── card.ts
│   │   │       ├── document.ts
│   │   │       ├── tender.ts
│   │   │       └── firm.ts
│   │   └── services/
│   │       ├── documentProcessor.ts
│   │       ├── tenderGenerator.ts
│   │       ├── priceStructure.ts
│   │       └── s3.ts
│   ├── stores/                       # Zustand stores
│   │   ├── workspaceStore.ts
│   │   ├── selectionStore.ts
│   │   ├── dragStore.ts
│   │   └── types.ts
│   ├── types/                        # TypeScript types
│   │   ├── card.ts
│   │   ├── tender.ts
│   │   ├── api.ts
│   │   └── global.d.ts
│   └── middleware.ts                 # Clerk auth middleware
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/
│   ├── images/
│   └── favicon.ico
├── tests/
│   ├── unit/
│   ├── integration/
│   └── setup.ts
├── e2e/
│   ├── tender-generation.spec.ts
│   └── playwright.config.ts
├── .env.local
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## Epic to Architecture Mapping

| Epic | Architecture Components | Key Technologies |
|------|------------------------|------------------|
| Epic 1: Foundation & Core Data | - Prisma schema (Card, Section, Item)<br/>- Zustand stores (workspaceStore)<br/>- Navigation components<br/>- Card system components | Next.js 15, Prisma 6, Zustand, TypeScript |
| Epic 2: Document Management & AI | - S3 service layer<br/>- Document processor service<br/>- AI extractors<br/>- Server Actions for uploads | AWS S3, GPT-4 Vision, pdf-parse, Vercel AI SDK |
| Epic 3: Consultant & Contractor | - Firm management routers<br/>- Consultant/Contractor Card components<br/>- Tender evaluation tables<br/>- Multi-select implementation | tRPC, dnd-kit, React Hook Form |
| Epic 4: Tender Package Generation | - Tender generator service<br/>- Price structure service<br/>- Immutability enforcement<br/>- PDF generation | GPT-4, react-pdf, Server Actions |
| Epic 5: Cost Planning & Financial | - Cost tracking components<br/>- Invoice/variation registers<br/>- Financial calculations<br/>- Reporting views | tRPC queries, Recharts, date-fns |

## Technology Stack Details

### Core Technologies

**Frontend Framework:**
- Next.js 15.0.0 with App Router for server components and streaming
- React 19 for concurrent features
- TypeScript 5.1.0+ for type safety

**Styling & UI:**
- Tailwind CSS 4.0.0 for utility-first styling
- shadcn/ui for component library
- Lucide React for icons
- CSS Variables for theming

**State Management:**
- Zustand 5.0.8 for global state (workspace, selection, drag)
- React Hook Form for form state
- TanStack Query (via tRPC) for server state

**Database & ORM:**
- PostgreSQL 16.0 for primary database
- Prisma 6.0.1 for type-safe ORM
- Redis (optional) for session cache

### Integration Points

**AI Services:**
- OpenAI GPT-4 Turbo for document processing
- GPT-4 Vision for OCR and image extraction
- Vercel AI SDK for unified AI interface

**File Storage:**
- AWS S3 for document storage
- Signed URLs with 1-hour expiration
- Multipart upload for large files

**Authentication:**
- Clerk for complete auth solution
- JWT tokens for API authentication
- Role-based access control (future)

**External Services:**
- Sentry for error monitoring
- LogTape/Axiom for production logging
- Vercel for deployment
- GitHub Actions for CI/CD

## Novel Pattern Designs

### Multi-Card Workspace Pattern

This innovative pattern enables simultaneous work across 2-3 cards with seamless data flow and drag-and-drop capabilities.

**Pattern Name:** Multi-Card Workspace
**Purpose:** Enable concurrent editing and data transfer across multiple card contexts while maintaining consistency

**Components:**
```
WorkspaceController
├── CardManager (handles card lifecycle)
├── StateCoordinator (synchronizes card states)
├── DragController (manages cross-card drag-drop)
└── DataFlowEngine (handles price structure flow)
```

**Data Flow:**
```typescript
interface DataFlowEngine {
  // Price structure propagation
  propagatePriceStructure(
    source: CardType.PLAN,
    target: CardType.CONSULTANT | CardType.CONTRACTOR
  ): Promise<void>

  // Tender to contract conversion
  convertTenderToContract(
    tenderPackageId: string,
    winnerId: string
  ): Promise<ContractData>

  // Cost tracking linkage
  linkContractToCostTracking(
    contractId: string,
    costPlanId: string
  ): Promise<void>
}
```

**Implementation Guide:**
1. Each card maintains independent state slice in Zustand
2. DragController uses dnd-kit sensors for cross-card detection
3. Optimistic updates applied immediately with rollback on failure
4. Data references maintained via sourceCardId/sourceItemId
5. Immutability enforced post-tender release via locked flag

**Affects Epics:** Epic 1 (foundation), Epic 3 (consultant/contractor), Epic 4 (tender generation)

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

### Naming Conventions

**Database:**
- Tables: PascalCase singular (`Card`, `Section`)
- Columns: camelCase (`createdAt`, `sourceCardId`)
- Foreign keys: `{model}Id` pattern
- Enums: SCREAMING_SNAKE_CASE values

**API:**
- tRPC procedures: camelCase (`getByType`)
- Server Actions: camelCase (`processDocument`)
- Routes: kebab-case (`/tender-packages`)

**Frontend:**
- Components: PascalCase (`CardPanel.tsx`)
- Hooks: `use` prefix (`useWorkspace`)
- Utils: camelCase (`formatCurrency`)

### Code Organization

**Component Structure:**
- Pages in `app/` directory
- Shared components in `components/`
- Page-specific components co-located
- Server components default, "use client" when needed

**Service Layer:**
- Business logic in `server/services/`
- Database queries via Prisma in services
- AI operations isolated in `lib/ai/`

### Error Handling

```typescript
// Consistent error structure
type AppError = {
  code: 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'AI_PROCESSING_ERROR'
  message: string
  field?: string
}

// Server Action pattern
try {
  const result = await operation()
  return { success: true, data: result }
} catch (error) {
  return { success: false, error: mapError(error) }
}
```

### Logging Strategy

```typescript
// Structured logging with pino
logger.info({
  action: 'tender_package_generated',
  projectId,
  duration: Date.now() - startTime,
  metadata: { firmCount, documentCount }
})
```

## Consistency Rules

### Naming Conventions

**Files & Folders:**
- Components: PascalCase (`CardPanel.tsx`)
- Utilities: camelCase (`dateHelpers.ts`)
- Types: camelCase (`card.types.ts`)
- Routes: kebab-case (`tender-packages`)

**Variables & Functions:**
- Variables: camelCase (`activeCards`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_FILE_SIZE`)
- Functions: camelCase (`calculateTotal`)
- React components: PascalCase (`NavigationSidebar`)

### Code Organization

**Import Order:**
1. React/Next.js imports
2. Third-party libraries
3. Internal aliases (`@/components`)
4. Relative imports
5. Types

**Component Structure:**
1. Type definitions
2. Component declaration
3. Hooks
4. Event handlers
5. Render logic

### Error Handling

**User-Facing Errors:**
- Be specific about the problem
- Provide actionable next steps
- Avoid technical jargon
- Example: "File too large. Maximum size is 15MB."

**Developer Errors:**
- Include error codes
- Add context in logs
- Report to Sentry in production

### Logging Strategy

**Log Levels:**
- `error`: Failures requiring attention
- `warn`: Potential issues
- `info`: Important business events
- `debug`: Development debugging

**What to Log:**
- All API calls with duration
- File uploads/processing
- Tender generation events
- Authentication events
- Errors with full context

## Data Architecture

### Core Models

**Three-Tier Hierarchy:**
```
Project
  └── Card (8 types)
      └── Section (predefined per card type)
          └── Item (flexible data structure)
```

**Audit Trail:**
- All models include: `createdAt`, `updatedAt`, `createdBy`, `updatedBy`
- Soft deletes via `deletedAt` timestamp
- Version tracking for documents

**Immutability:**
- Tender packages locked after release
- Items flagged with `locked: true`
- No edits allowed post-release

### Relationships

**Cross-Card References:**
- Items maintain `sourceCardId` and `sourceItemId`
- Enables traceability from Plan → Tender → Contract → Cost

**Document Associations:**
- Documents linked to project, optionally to card/section
- Many-to-many with tender packages

## API Contracts

### tRPC Procedures

```typescript
// Query procedures for complex data fetching
card.getWithSections
card.compareVersions
tender.evaluationMatrix
cost.summaryReport

// Mutations via Server Actions
// (Create, Update, Delete operations)
```

### Server Actions

```typescript
// Standard result type
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: AppError }

// All mutations follow this pattern
async function createCard(data: CardInput): Promise<ActionResult<Card>>
async function updateSection(id: string, data: SectionData): Promise<ActionResult<Section>>
async function processDocument(fileId: string): Promise<ActionResult<ExtractedData>>
```

## Security Architecture

### Authentication & Authorization

**Authentication:**
- Clerk handles all auth flows
- Social login (Google, GitHub)
- Passwordless with magic links
- Multi-factor authentication

**Authorization:**
- Middleware protects all `/projects` routes
- Server Actions check `auth()` from Clerk
- User ID attached to all database writes

### Data Protection

**File Security:**
- S3 private bucket
- Signed URLs with expiration
- Virus scanning on upload (ClamAV)

**API Security:**
- Rate limiting on AI operations
- Input validation with Zod
- SQL injection prevented by Prisma
- XSS prevention via React

**Audit Trail:**
- All changes logged with user ID
- Immutable tender packages
- Complete version history

## Performance Considerations

### Frontend Performance

**Optimization Strategies:**
- Server Components for initial load
- Suspense boundaries for streaming
- Image optimization with next/image
- Code splitting per route

**Target Metrics:**
- Initial page load < 2 seconds
- Tender generation < 30 seconds
- AI processing < 10 seconds
- File upload progress indication

### Backend Performance

**Database Optimization:**
- Indexes on foreign keys and common queries
- Connection pooling with Prisma
- Pagination for large datasets

**AI Optimization:**
- Streaming responses for long generation
- Caching of repeated extractions
- Batch processing for multiple documents

## Deployment Architecture

### Infrastructure

**Hosting:**
- Vercel for Next.js application
- Vercel Postgres or Supabase for database
- AWS S3 for file storage
- Clerk Cloud for authentication

**Environment Configuration:**
```
Production: app.assemble.ai
Staging: staging.assemble.ai
Development: localhost:3000
```

### CI/CD Pipeline

**GitHub Actions Workflow:**
1. Type checking with TypeScript
2. Linting with ESLint
3. Unit tests with Vitest
4. Build verification
5. Deploy to Vercel (preview for PRs, production for main)

### Monitoring

**Application Monitoring:**
- Sentry for error tracking
- Vercel Analytics for performance
- Custom metrics for business KPIs

**Infrastructure Monitoring:**
- Database connection pool metrics
- S3 bandwidth usage
- AI API usage and costs

## Development Environment

### Prerequisites

**Required Software:**
- Node.js 20.9.0 or later
- npm 10.0.0 or later
- PostgreSQL 16.0 (or Docker)
- Git

**Recommended Tools:**
- VS Code with extensions
- Prisma VS Code extension
- Tailwind CSS IntelliSense
- ESLint extension

### Setup Commands

```bash
# Clone and setup
git clone --depth=1 https://github.com/ixartz/Next-js-Boilerplate.git assemble-ai
cd assemble-ai
npm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your credentials

# Database setup
npx prisma migrate dev
npx prisma db seed

# Development
npm run dev

# Type checking
npm run type-check

# Testing
npm run test
npm run test:e2e
```

## Architecture Decision Records (ADRs)

### ADR-001: Multi-Card Workspace Architecture
**Date:** 2024-10-25
**Status:** Accepted
**Context:** Users need to work with multiple cards simultaneously
**Decision:** Implement novel multi-card workspace pattern with Zustand state management
**Consequences:** More complex state management but enables core value proposition

### ADR-002: Server Actions + tRPC Hybrid
**Date:** 2024-10-25
**Status:** Accepted
**Context:** Need type-safe API with good DX
**Decision:** Use Server Actions for mutations, tRPC for complex queries
**Consequences:** Two patterns to learn but optimal for different use cases

### ADR-003: GPT-4 Vision for Document Processing
**Date:** 2024-10-25
**Status:** Accepted
**Context:** Need OCR and intelligent extraction from construction documents
**Decision:** Use GPT-4 Vision API instead of separate OCR service
**Consequences:** Higher API costs but superior extraction quality

### ADR-004: Three-Tier Normalized Database
**Date:** 2024-10-25
**Status:** Accepted
**Context:** Complex hierarchical data with audit requirements
**Decision:** Fully normalized Card→Section→Item structure
**Consequences:** More complex queries but better data integrity

### ADR-005: Immutable Tender Packages
**Date:** 2024-10-25
**Status:** Accepted
**Context:** Legal requirement for tender audit trail
**Decision:** Lock all data after tender release, no edits allowed
**Consequences:** Must handle amendments as new versions

### ADR-006: Document Navigation in Sidebar
**Date:** 2025-10-28
**Status:** Accepted
**Context:** Document folder tree was initially embedded in DocumentCard, causing usability issues:
- Folder navigation not always visible
- Users had to open Documents card to navigate folders
- Folder tree took up valuable card space
- No persistent navigation state across cards

**Decision:** Move document folder tree to NavigationSidebar as persistent, always-visible navigation
- Nest folder tree under Documents navigation item
- Implement split scrolling regions (fixed nav + scrollable tree)
- Apply strict left-alignment for all navigation items
- Increase folder indentation for clearer hierarchy

**Implementation:**
```typescript
// NavigationSidebar structure
<aside className="flex flex-col items-stretch">
  {/* Header - fixed */}

  {/* Main Navigation - fixed, no scrolling */}
  <nav className="flex-shrink-0 w-full flex flex-col items-stretch">
    {/* Plan, Scheme, Detail, Procure, Deliver */}
    {/* Consultant, Contractor */}
    {/* Cost Planning, Documents */}
  </nav>

  {/* Folder Tree - scrollable */}
  {isDocumentsExpanded && (
    <div className="flex-1 overflow-hidden">
      <DocumentFolderTree projectId={projectId} documents={documents} />
    </div>
  )}

  {/* Footer - fixed */}
</aside>

// DocumentFolderTree with increased indentation
<div className="h-full overflow-y-auto" style={{ paddingLeft: '24px' }}>
  {/* Folder items with baseIndent=24px for level 0 */}
</div>
```

**Consequences:**
- ✅ Folder navigation always visible and accessible
- ✅ Clearer separation between navigation and content
- ✅ More space in DocumentCard for document table
- ✅ Better UX with persistent folder selection across cards
- ✅ Reduced cognitive load - users don't switch contexts to navigate
- ⚠️ Slightly reduced horizontal space for folder names (acceptable trade-off)

**Files Affected:**
- `src/components/workspace/NavigationSidebar.tsx` - Added folder tree section
- `src/components/workspace/DocumentFolderTree.tsx` - New reusable component
- `src/components/cards/DocumentCard.tsx` - Removed folder tree, full-width table
- `src/app/(dashboard)/projects/[id]/page.tsx` - Pass projectId and documents to sidebar
- `src/services/folderStructure.ts` - Updated folder order and structure

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2024-10-25_
_Updated: 2025-10-28_
_For: Benny_