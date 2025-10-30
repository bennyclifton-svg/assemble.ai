# Technical Specification: Consultant & Contractor Management

Date: 2025-10-26
Author: Benny
Epic ID: 3
Status: Draft

---

## Overview

Epic 3 implements comprehensive Consultant and Contractor Card functionality to manage the entire procurement lifecycle from initial brief through contract award. This epic builds upon the foundation established in Epic 1 and the document management capabilities from Epic 2, delivering the core procurement management system. The implementation enables users to manage multiple firms per discipline/trade, define scope and deliverables with AI assistance, track tender submissions, and evaluate both price and non-price criteria systematically. This directly addresses the PRD goal of eliminating manual assembly work by automating firm management, scope definition, and tender evaluation processes.

## Objectives and Scope

### In Scope
- Consultant Card implementation with all 10 predefined sections for each toggled-on consultant discipline
- Contractor Card implementation mirroring Consultant Card functionality for contractor trades
- Firms management system supporting 3+ firms per discipline/trade with full CRUD operations
- AI-powered scope and deliverables generation based on project context
- Fee structure management with retrieval from Cost Planning integration
- RFI and Addendum tracking tables with drag-drop document handling
- Tender release and submission tracking with automatic timestamping
- Multi-firm side-by-side display for evaluation
- Automatic document filing to structured repository paths
- Status synchronization with Plan Card toggle states

### Out of Scope
- Tender package generation (Epic 4)
- Cost flow to Cost Planning Card (Epic 4/5 integration)
- Automated tender recommendation reports (Epic 4)
- Invoice processing and variation management (Epic 5)
- External firm database integration (future enhancement)
- Email notification system for tender releases (future enhancement)

## System Architecture Alignment

This epic aligns with the architecture's multi-card workspace system, enabling users to work with Plan, Consultant, and Contractor Cards simultaneously. Implementation leverages Zustand stores for card state management, tRPC routers for firm and tender operations, and Server Actions for AI-powered content generation. The drag-and-drop functionality uses dnd-kit for firm reordering and document uploads. Data persistence follows the three-tier architecture (Cards → Sections → Items) established in Epic 1, with PostgreSQL storing firm details, scope definitions, and tender submissions using Prisma ORM's type-safe models.

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs/Outputs | Owner |
|--------|---------------|----------------|-------|
| ConsultantCardManager | Manages consultant card lifecycle, tab creation/deletion | Plan Card toggles → Card state updates | src/components/cards/ConsultantCard.tsx |
| ContractorCardManager | Manages contractor card lifecycle, tab creation/deletion | Plan Card toggles → Card state updates | src/components/cards/ContractorCard.tsx |
| FirmManager | CRUD operations for firms, drag-drop handling | Firm data, vCards → Firm records | src/server/services/firmManager.ts |
| ScopeGenerator | AI-powered scope and deliverables generation | Document context → Generated content | src/server/services/scopeGenerator.ts |
| FeeStructureService | Retrieves and manages fee structures | Cost Planning data → Fee tables | src/server/services/feeStructure.ts |
| TenderSubmissionTracker | Tracks tender releases and submissions | Upload events → Submission records | src/server/services/tenderTracker.ts |
| RFIManager | Manages RFI entries and responses | RFI documents → RFI table entries | src/components/cards/sections/RFISection.tsx |
| DocumentAutoFiler | Auto-files documents to repository paths | Document + context → Filed paths | src/server/services/documentFiler.ts |

### Data Models and Contracts

```prisma
// Consultant/Contractor Card Models
model ConsultantCard {
  id          String   @id @default(cuid())
  projectId   String
  discipline  String   // From Plan Card consultant list
  isActive    Boolean  @default(true)
  sections    ConsultantSection[]
  firms       Firm[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  project     Project  @relation(fields: [projectId], references: [id])
  @@index([projectId, discipline])
}

model ContractorCard {
  id          String   @id @default(cuid())
  projectId   String
  trade       String   // From Plan Card contractor list
  isActive    Boolean  @default(true)
  sections    ContractorSection[]
  firms       Firm[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  project     Project  @relation(fields: [projectId], references: [id])
  @@index([projectId, trade])
}

model Firm {
  id              String   @id @default(cuid())
  consultantCardId String?
  contractorCardId String?
  entity          String
  abn             String?
  address         String?
  contact         String?
  email           String?
  mobile          String?
  shortListed     Boolean  @default(false)
  displayOrder    Int
  submissions     TenderSubmission[]
  rfis            RFI[]
  addendums       Addendum[]

  consultantCard  ConsultantCard? @relation(fields: [consultantCardId], references: [id])
  contractorCard  ContractorCard? @relation(fields: [contractorCardId], references: [id])
}

model ConsultantSection {
  id            String   @id @default(cuid())
  cardId        String
  sectionType   ConsultantSectionType
  content       Json     // Flexible content storage
  isCollapsed   Boolean  @default(false)

  card          ConsultantCard @relation(fields: [cardId], references: [id])
}

enum ConsultantSectionType {
  FIRMS
  SCOPE
  DELIVERABLES
  FEE_STRUCTURE
  TENDER_DOCUMENT
  TENDER_RELEASE
  TENDER_PACK
  RFI_ADDENDUM
  TENDER_EVALUATION
  RECOMMENDATION_REPORT
}

model RFI {
  id            String   @id @default(cuid())
  sectionId     String
  firmId        String   // Associates RFI with specific firm
  rfiNumber     String
  title         String   // User-editable title (default: "RFI 01")
  dateReceived  DateTime?
  isReceived    Boolean  @default(false) // Toggle: green (received) vs ghosted
  documentPath  String?
  displayOrder  Int

  firm          Firm     @relation(fields: [firmId], references: [id])
  @@index([sectionId, firmId])
}

model Addendum {
  id            String   @id @default(cuid())
  sectionId     String
  firmId        String   // Associates Addendum with specific firm
  addendumNumber String
  title         String   // User-editable title (default: "Addendum 01")
  dateReleased  DateTime?
  isReleased    Boolean  @default(false) // Toggle: green (released) vs ghosted
  documentPath  String?
  displayOrder  Int

  firm          Firm     @relation(fields: [firmId], references: [id])
  @@index([sectionId, firmId])
}

model TenderSubmission {
  id            String   @id @default(cuid())
  firmId        String
  submissionNumber Int
  uploadDate    DateTime @default(now())
  documentPath  String
  fileName      String

  firm          Firm     @relation(fields: [firmId], references: [id])
  @@index([firmId, submissionNumber])
}
```

### APIs and Interfaces

```typescript
// tRPC Router: src/server/api/routers/consultant.ts
export const consultantRouter = createTRPCRouter({
  // Card Management
  createCard: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      discipline: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Creates consultant card with default sections
      return ctx.db.consultantCard.create({...})
    }),

  // Firm Management
  addFirm: protectedProcedure
    .input(z.object({
      cardId: z.string(),
      firmData: FirmSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      // Adds new firm column
      return ctx.db.firm.create({...})
    }),

  updateFirmOrder: protectedProcedure
    .input(z.object({
      cardId: z.string(),
      firmIds: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      // Updates display order after drag-drop
    }),

  // AI Generation
  generateScope: protectedProcedure
    .input(z.object({
      cardId: z.string(),
      discipline: z.string(),
      projectContext: z.object({
        planCard: z.any(),
        documents: z.array(z.string()),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      // Calls AI to generate discipline-specific scope
      const scope = await scopeGenerator.generate(input)
      return ctx.db.consultantSection.update({...})
    }),

  // RFI Management
  addRFI: protectedProcedure
    .input(z.object({
      sectionId: z.string(),
      rfiData: RFISchema,
      documentFile: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Creates RFI entry and auto-files document
      if (input.documentFile) {
        const filePath = await documentFiler.fileRFI(input.documentFile)
        input.rfiData.documentPath = filePath
      }
      return ctx.db.rfi.create({...})
    }),

  // Tender Submission
  recordSubmission: protectedProcedure
    .input(z.object({
      firmId: z.string(),
      file: z.any(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Records submission with timestamp
      const submission = await tenderTracker.recordSubmission(input)
      return submission
    }),
});

// Server Actions: src/app/actions/consultant.ts
export async function extractFirmDetails(file: File): Promise<FirmData> {
  // Uses AI to extract firm details from vCard or document
  const content = await file.text()
  const extracted = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: "Extract firm details: entity, ABN, address, contact, email, mobile"
    }, {
      role: "user",
      content
    }]
  })
  return parseFirmResponse(extracted)
}

export async function retrieveFeeStructure(
  cardId: string,
  costPlanningId: string
): Promise<FeeStructure> {
  // Retrieves fee structure from Cost Planning Card
  const costData = await db.costPlanning.findUnique({
    where: { id: costPlanningId }
  })
  return transformToFeeStructure(costData)
}
```

### Workflows and Sequencing

```
1. Consultant or Contractor Card Creation Flow:
   User toggles consultant or contractor in Plan Card
   → System creates ConsultantCard with discipline, or ContractorCard with trade
   → System creates 10 default sections
   → System adds tab to UI
   → User sees empty Consultant Card or Contractor Card ready for data

2. Firm Management Flow (applicable to both Consultant and Contractor Cards):
   User clicks "Add Firm"
   → System adds new firm column (max display: 3)
   → User drags vCard (or email message or other document containing firm details) to firm area
   → Alternative: User pastes body of text containing firm details
   → System extracts firm details via AI
   → System populates firm fields
   → User manually edits if needed
   → User toggles "Short Listed" for tender invites
   → OPTIONAL: User clicks "Add to Stakeholders" to add firm to Plan/Stakeholders list

3. Scope and Deliverables Generation Flow (applicable to both Consultant and Contractor Cards):
   User may first add/delete/reorder items in Scope or Deliverables sections
   → User populates text with keywords, lists, etc.
   → User clicks "AI Generate" in Scope or Deliverables section
   → Alternative: User drags document into Scope or Deliverables section
   → System gathers project context (Plan Card, Consultant/Contractor Card, documents)
   → System calls AI with discipline-specific or trade-specific prompt
   → AI generates scope/deliverables based on context
   → System displays generated content
   → User edits/refines content
   → System auto-saves changes to database for later retrieval in Tender Pack assembly
   → Flow repeats for other sections gathering context from Consultant/Contractor Card sections

4. RFI and Addendum Processing Flow (applicable to both Consultant and Contractor Cards):
   System organizes RFI and Addendum sections in column-based layout (1 column per firm, side-by-side)
   → Each firm column displays 3 default placeholders: RFI 01, RFI 02, RFI 03 (all ghosted)
   → Each firm column displays 3 default placeholders: Addendum 01, 02, 03 (all ghosted)
   → User has option to add/delete/reorder RFI and Addendum items per firm
   → User double-clicks to amend RFI/Addendum title within firm column
   → User drags RFI or Addendum document to specific firm's drag-drop zone
   → System files document to Documents/[Consultant or Contractor]/[Firm Name]/filename.pdf
   → System auto-populates date with current date (manual override available)
   → One click highlights green (received/released), click again ghosts (not received/released)
   → For RFI: Green = RFI received from that firm, Ghosted = anticipated but not received
   → For Addendum: Green = released to that firm, Ghosted = pre-prepared but not issued to that firm
   → User can selectively issue Addendum to 1 or more firms (not necessarily all)
   → No requirement to track responses against RFI

5. Tender Submission Flow (applicable to both Consultant and Contractor Cards):
   System organizes submissions into columns (1 column per firm, side-by-side)
   → User uploads submission for specific firm
   → System timestamps submission with current date (manual override available)
   → System increments submission number
   → For Consultants: System files to Documents/[Consultant]/[Discipline]/filename.pdf
   → For Contractors: System files to Documents/[Contractor]/[Trade]/filename.pdf
   → System marks submission received in UI
   → Evaluation sections enabled for that firm
   → User may delete submissions and reload new submission
```

## Non-Functional Requirements

### Performance

- Firm details extraction via AI must complete within 5 seconds for vCard/contact data (PRD: NFR004)
- Scope/deliverables AI generation must provide feedback within 10 seconds (PRD: NFR004)
- Tab switching between consultant/contractor disciplines must be instant (<100ms)
- Drag-drop firm reordering must provide immediate visual feedback (<50ms)
- RFI/Addendum table updates must persist within 500ms
- Tender submission upload must handle files up to 15MB (PRD: FR007)
- Side-by-side firm display must support up to 6 firms without horizontal scrolling at 1920x1080

### Security

- Firm contact details (email, mobile) must be encrypted at rest
- ABN validation must prevent SQL injection attempts
- Document uploads must validate MIME types before processing (PRD: NFR012)
- AI-generated content must be sanitized before database storage
- Tender submissions must use signed S3 URLs with 1-hour expiry (PRD: NFR013)
- User must be authenticated to access any consultant/contractor data

### Reliability/Availability

- Firm data changes must be atomic - all fields update together or rollback
- Section collapse/expand state must persist across sessions
- Draft scope/deliverables must auto-save every 30 seconds
- Failed AI generation must not lose existing content
- Document filing must be idempotent - re-uploads create new versions, not duplicates
- Card state must remain consistent when Plan Card toggles change

### Observability

- Log all firm CRUD operations with user ID and timestamp
- Track AI generation requests: discipline, duration, success/failure
- Monitor document filing paths for naming conflicts
- Log tender submission events with firm ID and file metadata
- Track RFI response times (date received to response date)
- Measure tab load times per discipline/trade
- Alert on AI generation failures exceeding threshold (>3 in 5 minutes)

## Dependencies and Integrations

### External Dependencies
- **@dnd-kit/sortable** (^8.0.0) - Drag-and-drop for firm column reordering
- **@dnd-kit/utilities** (^3.2.2) - Utilities for drag-drop functionality
- **react-hook-form** (^7.52.0) - Form state management for firm details
- **@hookform/resolvers** (^3.9.0) - Validation for firm data entry
- **zod** (^3.23.8) - Schema validation for API inputs
- **@tanstack/react-table** (^8.20.0) - RFI and Addendum table displays
- **date-fns** (^3.0.0) - Date handling for submissions and RFIs
- **vcard-parser** (^1.0.0) - Parsing vCard format for firm imports

### Internal Integrations

**Plan Card Integration:**
- Reads consultant/contractor toggle states from PlanCard store
- Subscribes to toggle changes to create/activate cards
- Syncs procurement status icons back to Plan Card

**Document Repository Integration:**
- Files RFIs to `Documents/[Consultant or Contractor]/[Firm Name]/filename.pdf` (preserves original filename, firm-specific)
- Files Consultant submissions to `Documents/[Consultant]/[Discipline]/filename.pdf`
- Files Contractor submissions to `Documents/[Contractor]/[Trade]/filename.pdf`
- Files Addendums to `Documents/[Consultant or Contractor]/[Firm Name]/filename.pdf` (firm-specific)
- Uses DocumentService from Epic 2 for upload handling
- Supports delete and reload operations for submissions
- Enables selective document issuance to specific firms

**Cost Planning Integration (Preparation for Epic 5):**
- Defines fee structure interface for future retrieval
- Prepares contract sum fields for cost flow
- Establishes linkage pattern for winning bids

**AI Service Integration:**
- Uses established OpenAI client from Epic 2
- Extends prompt templates for discipline-specific generation
- Shares document extraction patterns for firm details

### Database Relationships
- ConsultantCard → Project (many-to-one)
- ContractorCard → Project (many-to-one)
- Firm → ConsultantCard/ContractorCard (many-to-one)
- TenderSubmission → Firm (many-to-one)
- RFI/Addendum → ConsultantSection (via sectionId)

### State Management Integration
- Extends workspaceStore for multi-card display
- Creates firmSelectionStore for evaluation views
- Integrates with dragStore for firm reordering

## Acceptance Criteria (Authoritative)

### Story 3.1: Consultant Card Structure
1. Consultant Card displays tabs for each toggled-on consultant from Plan Card
2. Each tab contains sections: Firms, Scope, Deliverables, Fee Structure, Tender Document, Tender Release and Submission, Tender Pack, Tender RFI and Addendum, Tender Evaluation, Tender Recommendation Report
3. Sections are collapsible/expandable with chevrons
4. Tab navigation between consultants functions correctly
5. State persists between sessions

### Story 3.2: Firms Management - Layout and Controls
6. Display 3 default firm columns side-by-side
7. Add new firm (adds column) up to reasonable limit
8. Delete firm (removes column) with confirmation dialog
9. Drag to reorder firm columns with visual feedback
10. Each firm has fields: Entity, ABN, Address, Contact, Email, Mobile, Short Listed toggle
11. Data persists to database

### Story 3.3: Drag-and-Drop Firm Details
12. Drag contact vCard, email message, or document with firm details triggers processing
13. Alternative: Paste body of text containing firm details
14. AI parses and extracts: Entity name, ABN, Address, Contact, Email, Mobile
15. Auto-populates appropriate fields
16. Manual override available for all fields
17. Validation for email format and ABN format
18. Optional "Add to Stakeholders" button adds firm to Plan/Stakeholders list

### Story 3.4: Scope and Deliverables with AI Generation
19. User can add/delete/reorder items in Scope and Deliverables sections
20. Text areas for Scope and Deliverables sections with keyword/list input
21. "AI Generate" button for each section
22. Alternative: Drag-drop documents into section to trigger AI generation
23. AI generates discipline-specific or trade-specific scope based on project context
24. AI uses context from Plan Card, Consultant/Contractor Card, and documents
25. Manual editing of all generated content
26. Content auto-saves to database for later retrieval in Tender Pack assembly

### Story 3.5: Fee Structure Management
27. "Retrieve from Cost Planning" button pulls existing structure
28. Manual creation of fee structure tables
29. Add/delete line items in fee structure
30. Hierarchical structure support (categories and items)
31. Fee structure flows to tender package generation

### Story 3.6: RFI and Addendum Management
32. RFI and Addendum sections organized in column-based layout (1 column per firm, side-by-side)
33. Each firm column displays 3 default placeholders: RFI 01, RFI 02, RFI 03 (all ghosted)
34. Each firm column displays 3 default placeholders: Addendum 01, 02, 03 (all ghosted)
35. User can add/delete/reorder RFI and Addendum items per firm
36. Double-click to edit RFI/Addendum title within firm column
37. Drag-drop zone for RFI and Addendum documents within each firm column
38. Drag-drop document auto-files to Documents/[Consultant or Contractor]/[Firm Name]/filename.pdf
39. Auto-populate date with current date (manual override available)
40. One-click toggle: Green highlight (received/released), ghosted (not received/released)
41. For RFI: Green = received from that firm, Ghosted = anticipated but not received
42. For Addendum: Green = released to that firm, Ghosted = pre-prepared but not issued
43. User can selectively issue Addendum to 1 or more firms (not necessarily all)
44. No requirement to track responses against RFI

### Story 3.7: Contractor Card Implementation
45. Contractor Card structure identical to Consultant Card
46. Tabs for each toggled-on contractor trade
47. All sections replicated from Consultant Card
48. Contractor-specific terminology where appropriate
49. Independent data storage from Consultant Card

### Story 3.8: Tender Release and Submission Tracking
50. Submissions organized in columns (1 column per firm, side-by-side)
51. Upload submissions per firm with automatic date stamp (manual override available)
52. Multiple submissions per firm supported (incremental numbering)
53. Visual indicator when submission received
54. For Consultants: Auto-filing to Documents/[Consultant]/[Discipline]/filename.pdf
55. For Contractors: Auto-filing to Documents/[Contractor]/[Trade]/filename.pdf
56. User can delete submissions and reload new submission
57. Evaluation sections enabled when submission received for that firm

## Traceability Mapping

| AC# | Spec Section(s) | Component(s)/API(s) | Test Approach |
|-----|----------------|---------------------|---------------|
| 1-5 | Services/ConsultantCardManager, Data Models/ConsultantCard | ConsultantCard.tsx, consultantRouter.createCard | Integration test: toggle consultant, verify card creation |
| 6-11 | Services/FirmManager, Data Models/Firm | FirmSection.tsx, consultantRouter.addFirm | Unit test: firm CRUD operations |
| 12-18 | APIs/extractFirmDetails, Workflows/Firm Management | consultant.ts server action, Plan/Stakeholders integration | E2E test: drag vCard/email/text paste, verify extraction and stakeholder link |
| 19-26 | Services/ScopeGenerator, APIs/generateScope, Workflows/Scope Generation | ScopeSection.tsx, DeliverableSection.tsx, scopeGenerator.generate | Integration test: AI generation with context from multiple sources |
| 27-31 | Services/FeeStructureService, APIs/retrieveFeeStructure | FeeStructureSection.tsx | Unit test: fee structure retrieval and hierarchical management |
| 32-44 | Services/RFIManager, Data Models/RFI, Addendum, Workflows/RFI Processing | RFISection.tsx, consultantRouter.addRFI, firm-based column layout, toggle UI logic | E2E test: column-based layout per firm, drag document to specific firm, toggle state, verify firm association and selective issuance |
| 45-49 | Services/ContractorCardManager, Data Models/ContractorCard | ContractorCard.tsx, contractorRouter | Integration test: verify parity with consultant card |
| 50-57 | Services/TenderSubmissionTracker, Data Models/TenderSubmission, Workflows/Submission | TenderReleaseSection.tsx, recordSubmission | E2E test: upload/delete submission, verify filing paths for consultants and contractors |

## Risks, Assumptions, Open Questions

### Risks
- **Risk:** AI scope generation may produce generic content if project context is insufficient
  - *Mitigation:* Allow user to pre-populate keywords/lists before AI generation; support drag-drop documents for additional context
- **Risk:** Firm data extraction from emails/documents may fail due to format variations
  - *Mitigation:* Support multiple input methods (vCard, email, text paste); provide manual entry as primary method, AI extraction as enhancement
- **Risk:** Large number of consultants (36) may cause UI performance issues
  - *Mitigation:* Implement virtual scrolling for tabs, lazy-load card content
- **Risk:** Document auto-filing may create naming conflicts
  - *Mitigation:* Use original filename instead of auto-generated names; implement versioning for duplicates
- **Risk:** Toggle UI state (green/ghosted) for RFI/Addendum may confuse users
  - *Mitigation:* Provide clear visual indicators and tooltips; green = received/released, ghosted = anticipated/pre-prepared

### Assumptions
- **Assumption:** Users will have firm contact details available in digital format
- **Assumption:** Cost Planning Card exists (Epic 5) before fee structure retrieval is used
- **Assumption:** Document repository structure from Epic 2 is established
- **Assumption:** Maximum 6 firms per discipline/trade is sufficient for tender evaluation
- **Assumption:** RFI numbering follows sequential pattern (RFI01, RFI02, etc.)

### Open Questions
- **Question:** Should firm data be shareable across projects or project-specific?
  - *Next Step:* Defer to v2 - implement project-specific for MVP
- **Question:** How to handle consultant disciplines not in the default list of 36?
  - *Next Step:* Provide "Other" option with custom naming
- **Question:** Should tender submissions trigger email notifications to firms?
  - *Next Step:* Out of scope for Epic 3, consider for future enhancement
- **Question:** What happens to Consultant Card when discipline is untoggled in Plan Card?
  - *Next Step:* Soft-delete card, preserve data but hide from UI

## Test Strategy Summary

### Test Levels

**Unit Tests (60% coverage target):**
- Firm CRUD operations in FirmManager service
- Fee structure transformation logic
- Document path generation for auto-filing
- Validation schemas for firm data, RFI entries
- State management for card tabs and sections

**Integration Tests (30% coverage target):**
- Plan Card toggle → Consultant/Contractor Card creation
- AI scope generation with mocked OpenAI responses
- Database transactions for firm updates
- Document upload → auto-filing → database update flow
- Multi-card state synchronization

**E2E Tests (10% coverage target):**
- Complete firm management workflow: add, edit, reorder, delete
- Drag-drop vCard → extraction → population → save
- RFI document upload → filing → table update
- Tender submission workflow with timestamp verification
- Tab navigation across multiple consultants

### Test Data Requirements
- Sample vCard files in multiple formats
- Mock project data with Plan Card populated
- Test documents for RFI/submission uploads (PDFs under 15MB)
- Pre-seeded database with consultants/contractors toggled

### Edge Cases to Test
- Maximum firms (10+) per discipline
- Concurrent updates to same firm
- AI generation timeout handling
- Duplicate document upload attempts
- Invalid ABN/email format validation
- Browser refresh during unsaved changes