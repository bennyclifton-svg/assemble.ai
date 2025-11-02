# Technical Specification: Tender Package Generation & Evaluation

Date: 2025-11-02
Author: Benny
Epic ID: 4
Status: Draft

---

## Overview

Epic 4 implements the core value proposition of assemble.ai: AI-powered tender package assembly and comprehensive tender evaluation. This epic transforms the manual process of tender package creation from days of work into hours, delivering on the PRD's primary goal. Building on the foundation from Epics 1-3, this implementation enables users to select components from multiple cards, generate professional tender packages with AI, lock finalized packages for immutability, and systematically evaluate submissions using both price and non-price criteria. The tender recommendation report generation and contract award flow complete the procurement cycle, automatically flowing winning bid prices to Cost Planning for budget tracking.

## Objectives and Scope

### In Scope
- Component selection interface for Plan Card, Consultant Card, and Contractor Card sections
- Document schedule selection from Documents Card
- AI-powered tender package generation with sharp, project-specific content
- In-line editing and review capabilities for generated packages
- Tender package finalization with immutability lock
- Multi-format export (PDF and Word)
- Price evaluation tables with side-by-side firm comparison
- AI-powered price extraction from tender submissions
- Advanced price evaluation features (table management, item movement, Excel export)
- Non-price evaluation with weighted scoring across multiple criteria
- AI content extraction from submissions for non-price criteria
- Tender recommendation report generation with AI synthesis
- Contract award workflow with price flow to Cost Planning Card
- Audit trail for all tender operations

### Out of Scope
- Email distribution of tender packages (future enhancement)
- Automated scoring algorithms for non-price criteria (manual scoring required)
- Integration with external procurement systems
- Real-time collaboration on tender evaluation (single user)
- Advanced statistical analysis of tender responses
- Tender addendum versioning and comparison
- Automated compliance checking against tender requirements
- Supplier performance tracking over multiple projects

## System Architecture Alignment

This epic represents the culmination of the multi-card workspace architecture, orchestrating data from Plan, Consultant, Contractor, and Documents cards into cohesive tender packages. The implementation leverages Server Actions for AI generation with streaming responses, tRPC for complex data queries, and Zustand for tender package state management. The tender package lockdown mechanism introduces immutability patterns that ensure finalized packages cannot be altered, maintaining audit trail integrity. Document generation uses React-PDF for PDF creation and docx library for Word format. The AI integration extends the established OpenAI client with specialized prompts for tender package generation, price extraction, and recommendation report synthesis. All operations follow the three-tier data architecture with proper audit fields (createdBy, updatedBy, createdAt, updatedAt).

### Implementation Architecture Updates (As-Built)

**Component Selection Interface (Story 4.1):**
- **As-Implemented:** `CardSectionSelector` component with 2-column grid layout
- **Original Spec:** Referenced generic `ComponentSelector` pattern
- **Rationale:** CardSectionSelector provides better UX with compact checkbox display and vertical stacking (Plan → Consultant/Contractor → Documents)
- **Impact:** Document schedule retrieved from existing Tender Documents section (Epic 2), not re-selected during assembly

**Price Evaluation Tables (Stories 4.5-4.7):**
- **As-Implemented:** Handsontable library integration for spreadsheet functionality
- **Why Required:** Native Excel-like editing, formula engine, hierarchical rows, copy/paste compatibility
- **License Impact:** Commercial license required at $899/developer/year for production
- **Alternative Rejected:** Custom shadcn/ui components would require 2-3 weeks additional development

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs/Outputs | Owner |
|--------|---------------|----------------|-------|
| TenderPackageAssembler | Orchestrates component selection and assembly | Selected sections/documents → TenderPackage draft | src/server/services/tenderPackageAssembler.ts |
| TenderPackageGenerator | AI-powered tender package content generation | Draft package → Generated content | src/server/services/tenderPackageGenerator.ts |
| TenderPackageLock | Manages finalization and immutability | Package ID → Locked state | src/server/services/tenderPackageLock.ts |
| DocumentExporter | Exports packages to PDF and Word formats | Package content → PDF/Word files | src/server/services/documentExporter.ts |
| PriceEvaluationManager | Manages price evaluation tables and calculations | Firm data, fee structures → Evaluation tables | src/server/services/priceEvaluationManager.ts |
| PriceExtractor | AI-powered price extraction from submissions | Submission PDFs → Extracted prices | src/server/services/priceExtractor.ts |
| NonPriceEvaluator | Manages non-price criteria and scoring | Criteria, submissions → Scores | src/server/services/nonPriceEvaluator.ts |
| RecommendationReportGenerator | AI synthesis of evaluation data into report | Evaluation data → Recommendation report | src/server/services/recommendationReportGenerator.ts |
| ContractAwardManager | Handles contract award and price flow | Award decision → Cost Planning update | src/server/services/contractAwardManager.ts |

### Data Models and Contracts

```prisma
// Tender Package Models
model TenderPackage {
  id                String   @id @default(cuid())
  projectId         String
  project           Project  @relation(fields: [projectId], references: [id])

  // Package metadata
  name              String
  description       String?
  packageType       String   // 'consultant' | 'contractor'
  disciplineOrTrade String   // Which consultant/contractor this is for

  // Assembly data
  selectedSections  Json     // References to Plan/Consultant/Contractor sections
  selectedDocuments String[] // Document IDs for schedule

  // Generated content
  generatedContent  Json     // Full package content structure

  // State management
  status            TenderPackageStatus @default(DRAFT)
  isLocked          Boolean  @default(false)
  lockedAt          DateTime?
  lockedBy          String?

  // Export
  pdfUrl            String?
  wordUrl           String?

  // Relations
  evaluations       TenderEvaluation[]

  // Audit
  createdAt         DateTime @default(now())
  createdBy         String
  updatedAt         DateTime @updatedAt
  updatedBy         String
  deletedAt         DateTime?

  @@index([projectId, status])
  @@index([disciplineOrTrade])
}

enum TenderPackageStatus {
  DRAFT
  REVIEW
  FINALIZED
  RELEASED
}

model TenderEvaluation {
  id                String   @id @default(cuid())
  tenderPackageId   String
  tenderPackage     TenderPackage @relation(fields: [tenderPackageId], references: [id])

  // Price evaluation
  priceEvaluation   Json     // Tables structure with firm columns

  // Non-price evaluation
  nonPriceCriteria  Json     // Criteria definitions with weights
  nonPriceScores    Json     // Scores per firm per criterion

  // Evaluation state
  isComplete        Boolean  @default(false)

  // Recommendation
  recommendedFirmId String?
  recommendationReport Json?
  reportPdfUrl      String?

  // Audit
  createdAt         DateTime @default(now())
  createdBy         String
  updatedAt         DateTime @updatedAt
  updatedBy         String

  @@unique([tenderPackageId])
}

model PriceEvaluationTable {
  id                String   @id @default(cuid())
  evaluationId      String

  name              String   // "Original", "Adds and Subs", etc.
  displayOrder      Int
  isCollapsed       Boolean  @default(false)

  // Line items
  lineItems         Json     // Array of { description, firmPrices: { [firmId]: amount } }

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([evaluationId, displayOrder])
}

model NonPriceCriterion {
  id                String   @id @default(cuid())
  evaluationId      String

  name              String   // "Relevant Experience", etc.
  description       String?
  weight            Float    @default(1.0)
  displayOrder      Int

  // Extracted content per firm
  extractedContent  Json     // { [firmId]: { content, confidence } }

  // Scores per firm
  scores            Json     // { [firmId]: score }

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([evaluationId, displayOrder])
}

model ContractAward {
  id                String   @id @default(cuid())
  tenderPackageId   String   @unique
  evaluationId      String   @unique

  awardedFirmId     String
  awardedFirm       Firm     @relation(fields: [awardedFirmId], references: [id])

  contractValue     Float
  awardDate         DateTime @default(now())

  // Cost Planning integration
  costPlanningId    String?
  costItemId        String?  // Which Tier 3 cost item receives this value

  // Approval workflow
  approvedBy        String?
  approvalDate      DateTime?

  createdAt         DateTime @default(now())
  createdBy         String

  @@index([awardedFirmId])
}
```

**TypeScript Types:**

```typescript
// Tender Package Assembly Types
interface ComponentSelection {
  planCardSections: {
    sectionId: string
    sectionName: string
    includeItems: string[] // Item IDs to include
  }[]
  consultantCardSections: {
    cardId: string
    discipline: string
    sections: {
      sectionId: string
      sectionName: string
      includeItems: string[]
    }[]
  }[]
  contractorCardSections: {
    cardId: string
    trade: string
    sections: {
      sectionId: string
      sectionName: string
      includeItems: string[]
    }[]
  }[]
  documentSchedule: {
    documentId: string
    documentName: string
    path: string
  }[]
}

interface GeneratedPackageContent {
  coverPage: {
    projectName: string
    tenderTitle: string
    issueDate: string
    closingDate: string
  }
  sections: {
    id: string
    title: string
    content: string // Generated markdown/HTML
    order: number
  }[]
  documentSchedule: {
    title: string
    documents: {
      name: string
      reference: string
    }[]
  }
  appendices: {
    title: string
    content: string
  }[]
}

// Price Evaluation Types
interface PriceEvaluationTable {
  id: string
  name: string
  displayOrder: number
  isCollapsed: boolean
  lineItems: PriceLineItem[]
  subtotal: number
}

interface PriceLineItem {
  id: string
  description: string
  category?: string // For hierarchical structure
  firmPrices: Record<string, number> // firmId -> amount
  order: number
}

interface FirmComparison {
  firmId: string
  firmName: string
  totalPrice: number
  tableBreakdown: {
    tableId: string
    tableName: string
    subtotal: number
  }[]
  rank: number
}

// Non-Price Evaluation Types
interface NonPriceCriterion {
  id: string
  name: string
  description: string
  weight: number
  maxScore: number
  extractedContent: Record<string, ExtractedContent> // firmId -> content
  scores: Record<string, number> // firmId -> score
  order: number
}

interface ExtractedContent {
  content: string
  confidence: number
  sourcePages: number[]
}

interface NonPriceEvaluation {
  firmId: string
  firmName: string
  criteriaScores: {
    criterionId: string
    score: number
    weightedScore: number
  }[]
  totalWeightedScore: number
  rank: number
}

// Recommendation Report Types
interface RecommendationReport {
  executiveSummary: string
  priceAnalysis: {
    summary: string
    comparisonTable: FirmComparison[]
    lowestBidder: string
    priceRange: { min: number; max: number }
  }
  nonPriceAnalysis: {
    summary: string
    criteriaBreakdown: {
      criterion: string
      topPerformer: string
      analysis: string
    }[]
    rankings: NonPriceEvaluation[]
  }
  recommendation: {
    recommendedFirm: string
    rationale: string
    riskConsiderations: string[]
    conditions: string[]
  }
  appendices: {
    detailedScoring: any
    submissionSummaries: any
  }
}
```

### APIs and Interfaces

**Server Actions:**

```typescript
// app/actions/tenderPackage.ts

export async function createTenderPackageDraft(
  projectId: string,
  packageType: 'consultant' | 'contractor',
  disciplineOrTrade: string
): Promise<ActionResult<TenderPackage>> {
  // Creates draft tender package
  // Returns: { success: true, data: TenderPackage } or error
}

export async function updateComponentSelection(
  packageId: string,
  selection: ComponentSelection
): Promise<ActionResult<TenderPackage>> {
  // Updates selected components for package assembly
}

export async function generateTenderPackage(
  packageId: string
): Promise<ActionResult<GeneratedPackageContent>> {
  // AI generates tender package content from selected components
  // Streams progress updates
  // Returns generated content structure
}

export async function updatePackageContent(
  packageId: string,
  sectionId: string,
  updatedContent: string
): Promise<ActionResult<void>> {
  // Allows in-line editing of generated content
}

export async function finalizeTenderPackage(
  packageId: string
): Promise<ActionResult<{ pdfUrl: string; wordUrl: string }>> {
  // Locks package, generates PDF/Word exports
  // Returns download URLs
}

export async function extractPricesFromSubmission(
  submissionId: string,
  feeStructure: any
): Promise<ActionResult<Record<string, number>>> {
  // AI extracts prices from submission PDF
  // Returns map of line item -> price
}

export async function generateRecommendationReport(
  evaluationId: string
): Promise<ActionResult<RecommendationReport>> {
  // AI synthesizes evaluation data into recommendation report
}

export async function awardContract(
  evaluationId: string,
  firmId: string,
  costItemId: string
): Promise<ActionResult<ContractAward>> {
  // Creates contract award and flows price to Cost Planning
}
```

**tRPC Procedures:**

```typescript
// server/api/routers/tenderPackage.ts

export const tenderPackageRouter = createTRPCRouter({

  // Package Management
  create: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      packageType: z.enum(['consultant', 'contractor']),
      disciplineOrTrade: z.string(),
      name: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tenderPackage.create({ data: input })
    }),

  getById: protectedProcedure
    .input(z.object({ packageId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tenderPackage.findUnique({
        where: { id: input.packageId },
        include: { evaluations: true }
      })
    }),

  updateSelection: protectedProcedure
    .input(z.object({
      packageId: z.string(),
      selectedSections: z.any(),
      selectedDocuments: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tenderPackage.update({
        where: { id: input.packageId },
        data: {
          selectedSections: input.selectedSections,
          selectedDocuments: input.selectedDocuments,
        }
      })
    }),

  // Evaluation Management
  createEvaluation: protectedProcedure
    .input(z.object({
      tenderPackageId: z.string(),
      firms: z.array(z.string()), // Shortlisted firm IDs
    }))
    .mutation(async ({ ctx, input }) => {
      // Creates evaluation with default tables and criteria
      return ctx.db.tenderEvaluation.create({
        data: {
          tenderPackageId: input.tenderPackageId,
          priceEvaluation: createDefaultPriceTables(input.firms),
          nonPriceCriteria: createDefaultNonPriceCriteria(),
          nonPriceScores: {},
        }
      })
    }),

  updatePriceTable: protectedProcedure
    .input(z.object({
      evaluationId: z.string(),
      tableId: z.string(),
      lineItems: z.array(z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      // Updates specific price table with new line items
    }),

  updateNonPriceScore: protectedProcedure
    .input(z.object({
      evaluationId: z.string(),
      criterionId: z.string(),
      firmId: z.string(),
      score: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Updates score for specific criterion and firm
    }),
});
```

### Workflows and Sequencing

**Tender Package Assembly Flow (As-Implemented):**
```
1. User navigates to Tender Pack section in Consultant/Contractor Card
   → Configuration is per-discipline/trade (not per-firm)
   → TenderPackageConfig stores selections for entire discipline

2. User selects components using CardSectionSelector:
   → Plan Card sections displayed in 2-column grid with checkboxes
   → Consultant/Contractor Card sections in 2-column grid
   → Document schedule automatically retrieved from Tender Documents section (Epic 2)
   → NO re-selection of documents - single source of truth maintained

3. User selects firm(s) for generation:
   → FirmSelector dropdown shows shortlisted firms
   → Can select single or multiple firms for batch generation
   → Same configuration applies to all selected firms

4. User clicks "Generate Tender Package" (per firm):
   → GenerateTenderButton triggers AI generation
   → Streams progress updates to UI
   → Creates personalized package per firm using shared configuration
   → Status set to DRAFT for editing
```

**Key Differences from Original Spec:**
- Document schedule NOT multi-selected - retrieved from saved Tender Documents
- Configuration saved once per discipline/trade, applied to multiple firms
- No "Generate without AI" option - all generation uses AI (Story 4.2)
- Component selection uses CardSectionSelector (not generic ComponentSelector)

**Tender Package Generation Flow:**
```
1. System gathers selected component data
   → Retrieves Plan Card section content
   → Retrieves Consultant/Contractor Card section content
   → Retrieves document metadata for schedule (if selected)

2. If user selected "Generate without AI":
   → System assembles content directly from database
   → Creates cover page with project details from Plan Card
   → Compiles selected sections without modification
   → Generates document schedule table (if documents selected)
   → Organizes into package structure
   → Saves to database and proceeds to step 6

3. If user selected "Generate with AI":
   → System constructs AI generation prompt
   → Includes project context from Plan Card
   → Includes discipline-specific scope/deliverables
   → Includes fee structure
   → Specifies professional tender package format

4. System calls OpenAI API (streaming) [AI generation only]
   → Model: GPT-4 or GPT-4-Turbo
   → Temperature: 0.3 for consistency
   → Streams response to client for progress indication

5. System structures generated content [AI generation only]
   → Parses AI output into sections
   → Creates cover page with project details
   → Formats scope and deliverables
   → Generates document schedule table (if documents selected)
   → Organizes appendices

6. System saves generated content to database
   → Updates TenderPackage.generatedContent field
   → Sets status to REVIEW

7. System displays generated package for review
   → Renders content in package preview
   → Processing complete in < 30 seconds (AI) or < 5 seconds (non-AI)
```

**Tender Package Review and Edit Flow:**
```
1. System displays generated package content
   → Sections rendered with in-line editing capability

2. User reviews each section
   → Edits content directly in browser
   → Changes auto-save as drafts every 30 seconds

3. User can regenerate specific sections
   → Select section for regeneration
   → AI regenerates with updated context
   → User accepts or reverts

4. User previews final format
   → System renders PDF layout preview
   → User verifies formatting and content

5. User saves draft or proceeds to finalization
   → Draft saved with current state
   → Can return to editing later
```

**Tender Package Finalization Flow:**
```
1. User clicks "Finalize Tender Pack"
   → System displays confirmation dialog

2. User confirms finalization
   → System locks package (isLocked = true)
   → Records lockedAt timestamp and lockedBy user
   → Sets status to FINALIZED

3. System generates exports in parallel:
   a. PDF Generation:
      → Uses React-PDF to render package
      → Applies professional formatting
      → Includes headers, footers, page numbers
      → Uploads PDF to S3
      → Returns signed URL

   b. Word Generation:
      → Uses docx library to create document
      → Preserves formatting and structure
      → Uploads to S3
      → Returns signed URL

4. System files exports to Documents Card
   → Auto-files to Documents/[Consultant or Contractor]/Tender Pack.PDF
   → Auto-files to Documents/[Consultant or Contractor]/Tender Pack.DOCX

5. System creates audit trail entry
   → Logs finalization event
   → Records user, timestamp, package version

6. System displays success with download links
   → User can download PDF and Word versions
   → Package cannot be edited (immutable)
```

**Price Evaluation Setup Flow (using Handsontable):**
```
1. System creates evaluation for finalized package
   → Retrieves shortlisted firms from Consultant/Contractor Card
   → Creates TenderEvaluation record

2. System creates default price tables
   → Table 1: "Original" configured using Fee Structure from Consultant Card
   → Table 2: "Adds and Subs" with 3 default placeholder items
   → Each table has columns for all shortlisted firms

3. System displays evaluation interface
   → Firms shown side-by-side
   → Tables displayed with firm columns
   → Input fields for price entry

4. User can add/delete line items
   → Click to add row within table
   → Enter description and prices per firm
   → Delete rows with confirmation

5. System calculates subtotals automatically
   → Each table shows subtotal row
   → Grand total calculated across all tables
   → Updates in real-time as prices entered
```

**AI Price Extraction Flow (using Handsontable):**
```
1. User clicks "AI generate fee table from latest Submission" for specific firm
   → System identifies latest submission for that firm
   → Retrieves submission document from S3

2. System calls AI price extraction service
   → Sends submission PDF to GPT-4 Vision
   → Provides fee structure template for matching
   → Specifies extraction format

3. AI extracts pricing data
   → Identifies line items matching fee structure
   → Extracts amounts
   → Returns structured price data

4. System populates price table
   → Maps extracted prices to line items
   → Fills firm column with prices
   → Highlights AI-populated cells (visual indicator)

5. User reviews extracted prices
   → Manual override available for any value
   → Can edit directly in table
   → Changes save immediately

6. If extraction fails or incomplete
   → System logs error
   → User notified to enter manually
   → Partial extraction still populated
```

**Advanced Price Evaluation Flow (using Handsontable):**
```
1. User moves items between tables
   → Click item in Table 1
   → Single click moves to Table 2
   → Vice versa
   → Subtotals recalculate automatically

2. User adds custom tables
   → Click "Add Table"
   → Enter table name
   → Table created with same firm columns
   → Add line items to new table

3. User manages table layout
   → Drag tables to reorder
   → Collapse/expand tables for space management
   → Delete tables (with confirmation)

4. System maintains calculations
   → Each table shows subtotal
   → Grand total includes all table subtotals
   → Updates in real-time

5. User exports evaluation to Excel
   → Click "Export to Excel"
   → System generates XLSX file
   → Includes all tables and calculations
   → Preserves firm comparison layout
```

**Non-Price Evaluation Flow:**
```
1. System displays default evaluation criteria
   → Relevant Experience
   → Methodology/Approach
   → Team Qualifications
   → References/Past Performance
   → Program/Timeline
   → Resource Allocation

2. For each criterion, user can extract content from submissions
   → User clicks "Retrieve" icon (accent color) for criterion
   → System calls AI extraction service
   → AI searches all firm submissions for relevant content
   → Extracted content displayed per firm

3. AI Content Extraction:
   → System retrieves submission PDFs for all shortlisted firms
   → Sends to GPT-4 Vision with criterion-specific prompt
   → AI extracts relevant sections from each submission
   → Returns content with confidence score and source pages

4. User scores each criterion per firm
   → Side-by-side comparison view
   → Extracted content displayed for reference
   → User enters score (e.g., 1-10 scale)
   → System applies weight to calculate weighted score

5. System calculates rankings
   → Total weighted score per firm
   → Ranks firms by total score
   → Displays comparison table

6. User can adjust criteria weights
   → Change weight values
   → System recalculates weighted scores
   → Rankings update automatically
```

**Recommendation Report Generation Flow:**
```
1. User clicks "Generate Report" in Recommendation Report section
   → System validates evaluation completeness
   → Checks price and non-price evaluations complete

2. System gathers evaluation data
   → Price evaluation tables and totals
   → Non-price scores and rankings
   → Extracted content from submissions
   → Firm details and submission metadata

3. System constructs AI synthesis prompt
   → Includes all price data
   → Includes all non-price scores
   → Specifies report format and sections
   → Requests executive summary, analysis, recommendation

4. AI generates recommendation report
   → Executive summary with key findings
   → Price analysis section with comparison tables
   → Non-price analysis with criterion breakdown
   → Overall recommendation with rationale
   → Risk considerations
   → Conditions of award if applicable

5. System structures report content
   → Parses AI output into sections
   → Includes data tables from evaluation
   → Formats for professional presentation

6. System displays generated report
   → User reviews content
   → Can edit sections if needed
   → Can regenerate if not satisfied

7. System exports report to PDF
   → Professional template formatting
   → Includes all tables and analysis
   → Files to Documents/[Consultant or Contractor]/TRR.PDF
   → Returns download URL
```

**Contract Award and Price Flow:**
```
1. User selects winning firm
   → Reviews recommendation report
   → Makes award decision
   → Clicks "Award Contract" for selected firm

2. System displays award confirmation dialog
   → Shows firm name and contract value
   → Requests confirmation

3. User confirms contract award
   → System creates ContractAward record
   → Records awarded firm, contract value, date
   → Links to tender evaluation

4. System flows prices to Cost Planning Card
   → Identifies corresponding Tier 3 cost item
   → Updates "Contract" column with awarded amount
   → Creates link between award and cost item

5. System updates Plan Card status
   → Activates "Award" icon for discipline/trade
   → Updates consultant/contractor status

6. System creates audit trail
   → Logs award decision
   → Records approver and timestamp

7. System displays success confirmation
   → Shows award summary
   → Confirms cost planning update
   → Provides link to cost planning view
```

## Non-Functional Requirements

### Performance

- **Package Generation:** Complete AI generation within 30 seconds for standard tender package (PRD: NFR004)
- **Price Extraction:** AI price extraction from 15MB submission within 10 seconds
- **Recommendation Report:** Generate recommendation report within 15 seconds
- **Export Generation:** PDF export generation < 5 seconds, Word export < 3 seconds
- **Real-time Calculations:** Price table subtotals and grand total update within 100ms
- **Component Selection:** Render selection interface with 100+ components within 500ms
- **Concurrent Editing:** Support auto-save drafts every 30 seconds without blocking user
- **Document Preview:** Render PDF preview within 2 seconds

### Security

- **Package Immutability:** Finalized packages cannot be modified by any user (enforced at database and API level)
- **Access Control:** Only authenticated users can create/edit tender packages
- **Audit Trail:** All package operations logged with userId, timestamp, action, and changes
- **Exported Documents:** PDF and Word files stored in private S3 bucket with signed URLs
- **Price Data Protection:** Firm pricing data encrypted at rest
- **API Rate Limiting:** AI generation endpoints limited to prevent abuse (10 requests/hour per user)
- **Input Sanitization:** All user-edited content sanitized before storage and export

### Reliability/Availability

- **Package Lock Integrity:** Once locked, package remains immutable even if database connection fails mid-operation
- **AI Generation Retry:** Failed AI generations retry automatically (up to 3 attempts) with exponential backoff
- **Draft Auto-save:** Content saves every 30 seconds to prevent data loss
- **Export Redundancy:** Generated PDF/Word files stored with redundancy in S3
- **Calculation Accuracy:** Floating-point precision handling for price calculations (use Decimal type)
- **Graceful Degradation:** If AI extraction fails, manual entry always available
- **Transaction Safety:** Contract award and cost flow happen in single database transaction

### Observability

**Logging Requirements (Pino):**
- Log all tender package creation, editing, finalization events
- Log AI generation requests with duration, token usage, success/failure
- Log price extraction attempts with accuracy metrics
- Log export generation with file sizes and durations
- Log contract award decisions with full context

**Metrics to Track:**
- Average tender package generation time
- AI price extraction accuracy rate (manual corrections needed)
- Package finalization rate (drafts that reach finalized state)
- Export format preference (PDF vs Word usage)
- Contract award cycle time (package creation to award)

**Monitoring Alerts:**
- Alert if AI generation time > 45 seconds
- Alert if price extraction failure rate > 20%
- Alert if export generation fails
- Alert if package lock integrity violated
- Alert if contract award transaction fails

## Dependencies and Integrations

### NPM Packages (to be added)

```json
{
  "@react-pdf/renderer": "^3.4.0",        // PDF generation
  "docx": "^8.5.0",                       // Word document generation
  "handsontable": "^14.0.0",              // ⚠️ CRITICAL: Excel-like spreadsheet for price evaluation (Stories 4.5-4.7)
  "@handsontable/react": "^14.0.0",       // ⚠️ CRITICAL: Handsontable React wrapper
  "@dnd-kit/core": "^6.1.0",              // Drag-and-drop for table reordering (Story 4.7)
  "@dnd-kit/sortable": "^8.0.0",          // Sortable items with drag-and-drop
  "@dnd-kit/utilities": "^3.2.2",         // Utilities for dnd-kit
  "decimal.js": "^10.4.3",                // Precise decimal calculations
  "react-markdown": "^9.0.0",             // Markdown rendering for content
  "react-diff-viewer": "^3.1.1",          // Track changes visualization (Story 4.3)
  "recharts": "^2.12.0",                  // Charts for price comparison
  "jspdf": "^2.5.1",                      // Alternative PDF generation
  "html2canvas": "^1.4.1",                // Screenshot for preview
  "react-to-print": "^2.15.1"             // Print functionality
}
```

**⚠️ LICENSING NOTE:**
- **Handsontable** requires a commercial license for production use at $899 per developer per year
- **Current Approach:** Using non-commercial evaluation license for MVP development
- **License Key:** `'non-commercial-and-evaluation'`
- **Production Decision:** License procurement deferred until production deployment
- See: https://handsontable.com/pricing

### External Services

**OpenAI API:**
- Model: gpt-4-turbo for tender package generation
- Model: gpt-4-vision-preview for price extraction from PDFs
- Max tokens: 8192 for package generation, 4096 for extraction
- Temperature: 0.3 for consistent output

**AWS S3:**
- Bucket for tender package exports
- Lifecycle policy: retain exports for 7 years (compliance)
- Signed URLs with 24-hour expiration

### Integration Points

**Plan Card Integration:**
- Reads sections: Details, Objectives, Staging, Risk, Stakeholders
- Retrieves project metadata for cover page generation
- Updates procurement status icons on contract award

**Consultant/Contractor Card Integration:**
- Reads sections: Scope, Deliverables, Fee Structure
- Retrieves shortlisted firms for evaluation
- Accesses tender submissions for price extraction
- Updates "Award" status on contract award

**Documents Card Integration:**
- Retrieves document metadata for schedule generation
- Files generated packages to Documents/[Consultant or Contractor]/ folders
- Accesses submission PDFs for AI extraction

**Cost Planning Card Integration (Epic 5):**
- Flows contract values to "Contract" column
- Links award to specific Tier 3 cost item
- Updates cost summary calculations

### State Management

**Zustand Stores:**
- tenderPackageStore: manages package draft state, component selection
- evaluationStore: manages price tables, non-price scores, calculations
- exportStore: manages PDF/Word generation state

## Acceptance Criteria (Authoritative)

### Story 4.1: Tender Package Assembly Interface
1. **AC-4.1.1:** Interface displays Plan Card sections with checkbox selection
2. **AC-4.1.2:** Interface displays Consultant/Contractor Card sections with checkbox selection
3. **AC-4.1.3:** Interface displays document schedules from Documents Card with multi-select
4. **AC-4.1.4:** Selected items highlighted visually with distinct styling
5. **AC-4.1.5:** "Generate Tender Package" button prominently displayed and enabled when components selected
6. **AC-4.1.6:** Preview of selected components shows before generation

### Story 4.2: AI Tender Package Generation
7. **AC-4.2.1:** AI compiles selected components into coherent tender package
8. **AC-4.2.2:** Generated content is sharp, focused, and project-specific (not generic templates)
9. **AC-4.2.3:** Package includes all selected sections with appropriate formatting
10. **AC-4.2.4:** Document schedule created with document names and references (not actual file copies)
11. **AC-4.2.5:** Generation completes within 30 seconds
12. **AC-4.2.6:** Progress indicator displays during generation with streaming updates

### Story 4.3: Tender Package Review and Edit
13. **AC-4.3.1:** Generated package displayed in readable format for review
14. **AC-4.3.2:** In-line editing capabilities for all sections
15. **AC-4.3.3:** Track changes/revision marking visible for edited content
16. **AC-4.3.4:** Save draft versions before finalizing
17. **AC-4.3.5:** Preview in final PDF layout available

### Story 4.4: Tender Package Finalization and Lock
18. **AC-4.4.1:** "Finalize Tender Pack" action available with confirmation dialog
19. **AC-4.4.2:** Package becomes immutable after finalization (no edits allowed)
20. **AC-4.4.3:** Locked status clearly indicated in UI
21. **AC-4.4.4:** Export to PDF format functional
22. **AC-4.4.5:** Export to Word format functional
23. **AC-4.4.6:** Automatic filing to Documents/[Consultant or Contractor]/Tender Pack.PDF
24. **AC-4.4.7:** Audit trail records finalization (who, when)

### Story 4.5: Tender Evaluation - Price Setup
25. **AC-4.5.1:** Display shortlisted firms side-by-side in evaluation interface
26. **AC-4.5.2:** Table 1 ("Original") created with fee structure from tender package
27. **AC-4.5.3:** Table 2 ("Adds and Subs") created with 3 default placeholder items
28. **AC-4.5.4:** Add line items to tables
29. **AC-4.5.5:** Delete line items from tables with confirmation
30. **AC-4.5.6:** Sub-total calculations displayed for each table
31. **AC-4.5.7:** Grand total calculation across all tables

### Story 4.6: AI Price Extraction from Submissions
32. **AC-4.6.1:** "AI generate fee table from latest Submission" button available per firm
33. **AC-4.6.2:** AI reads tender submission PDFs from Documents folder
34. **AC-4.6.3:** AI extracts pricing data and populates evaluation tables
35. **AC-4.6.4:** AI-populated cells highlighted with visual indicator
36. **AC-4.6.5:** Manual override available for all price values
37. **AC-4.6.6:** Handles multiple submission versions (uses latest)

### Story 4.7: Price Evaluation - Advanced Features
38. **AC-4.7.1:** Move items between Table 1 and Table 2 with single click
39. **AC-4.7.2:** Add additional tables beyond default 2
40. **AC-4.7.3:** Delete custom tables
41. **AC-4.7.4:** Rename tables
42. **AC-4.7.5:** Collapse/expand tables for space management
43. **AC-4.7.6:** Drag to reorder tables
44. **AC-4.7.7:** Each new table adds to grand total calculation
45. **AC-4.7.8:** Export evaluation to Excel format

### Story 4.8: Non-Price Evaluation
46. **AC-4.8.1:** Default criteria displayed: Relevant Experience, Methodology/Approach, Team Qualifications, References/Past Performance, Program/Timeline, Resource Allocation
47. **AC-4.8.2:** "Retrieve" icon (accent color) available for each criterion
48. **AC-4.8.3:** AI extracts relevant content from submissions for each criterion
49. **AC-4.8.4:** Extracted content displayed per firm for comparison
50. **AC-4.8.5:** Scoring interface available for each criterion per firm
51. **AC-4.8.6:** Weighted scoring calculation applied
52. **AC-4.8.7:** Side-by-side comparison view of firms

### Story 4.9: Tender Recommendation Report Generation
53. **AC-4.9.1:** "Generate Report" button available in Recommendation Report section
54. **AC-4.9.2:** AI synthesizes price evaluation data into report
55. **AC-4.9.3:** AI synthesizes non-price evaluation scores into report
56. **AC-4.9.4:** Executive summary generated with recommendation
57. **AC-4.9.5:** Comparison tables included in report
58. **AC-4.9.6:** Rationale for recommendation provided
59. **AC-4.9.7:** Export to PDF format
60. **AC-4.9.8:** Template-based formatting for consistency

### Story 4.10: Contract Award and Price Flow
61. **AC-4.10.1:** "Award Contract" action available for winning firm
62. **AC-4.10.2:** Winning bid prices flow to Cost Planning Card
63. **AC-4.10.3:** Prices appear in Cost Summary under "Contract" column
64. **AC-4.10.4:** Link maintained between tender evaluation and cost planning
65. **AC-4.10.5:** Award status updated in Plan Card ("Award" icon activated)
66. **AC-4.10.6:** Notification/confirmation of successful award displayed

## Traceability Mapping

| AC# | Spec Section | Component/API | Test Approach |
|-----|--------------|---------------|---------------|
| AC-4.1.1 to AC-4.1.6 | Services/TenderPackageAssembler, Workflows/Assembly | TenderPackageAssembly.tsx, ComponentSelector.tsx | E2E test component selection flow |
| AC-4.2.1 to AC-4.2.6 | Services/TenderPackageGenerator, Workflows/Generation | generateTenderPackage action, streaming UI | Integration test AI generation with mock, performance test 30s limit |
| AC-4.3.1 to AC-4.3.5 | Workflows/Review and Edit | PackageEditor.tsx, updatePackageContent action | E2E test editing and preview |
| AC-4.4.1 to AC-4.4.7 | Services/TenderPackageLock, DocumentExporter | finalizeTenderPackage action, PDF/Word export | Unit test immutability, integration test export generation |
| AC-4.5.1 to AC-4.5.7 | Services/PriceEvaluationManager, Data Models/PriceEvaluationTable | PriceEvaluationTable.tsx, calculation logic | Unit test calculations, component test table UI |
| AC-4.6.1 to AC-4.6.6 | Services/PriceExtractor, Workflows/Price Extraction | extractPricesFromSubmission action | Integration test AI extraction with sample PDFs |
| AC-4.7.1 to AC-4.7.8 | Workflows/Advanced Price Evaluation | Advanced table controls, Excel export | E2E test table operations, verify Excel output |
| AC-4.8.1 to AC-4.8.7 | Services/NonPriceEvaluator, Data Models/NonPriceCriterion | NonPriceEvaluation.tsx, scoring UI | E2E test AI content extraction and scoring |
| AC-4.9.1 to AC-4.9.8 | Services/RecommendationReportGenerator | generateRecommendationReport action | Integration test AI synthesis, verify PDF output |
| AC-4.10.1 to AC-4.10.6 | Services/ContractAwardManager, Workflows/Award | awardContract action, Cost Planning integration | E2E test award flow, verify cost planning update |

## Risks, Assumptions, Open Questions

### Risks

- **Risk:** AI-generated tender packages may lack project-specific details if context insufficient
  - *Mitigation:* Enforce minimum component selection requirements; allow users to provide additional context prompts; implement content quality checks

- **Risk:** Package immutability could be circumvented if database constraints not properly enforced
  - *Mitigation:* Implement database triggers to prevent updates to locked packages; add API-level validation; conduct security audit

- **Risk:** AI price extraction accuracy may be low for non-standard submission formats
  - *Mitigation:* Provide manual entry as primary method; AI extraction as convenience feature; track accuracy metrics and improve prompts

- **Risk:** Large tender packages (50+ pages) may exceed AI token limits
  - *Mitigation:* Generate packages in sections; implement chunking strategy; provide section-by-section regeneration

- **Risk:** Concurrent editing of price tables could cause data conflicts
  - *Mitigation:* Implement optimistic locking; auto-save with conflict detection; show last-write-wins warnings

- **Risk:** PDF/Word export formatting may break with complex content structures
  - *Mitigation:* Extensive testing with sample packages; fallback to simpler formatting; provide export preview

### Assumptions

- **Assumption:** Users will review AI-generated content before finalization (not fully automated)
- **Assumption:** Tender submissions are PDF format (95% of construction industry standard)
- **Assumption:** Shortlisted firms already identified in Consultant/Contractor Cards before evaluation
- **Assumption:** Cost Planning Card exists (Epic 5) when contract award occurs
- **Assumption:** Maximum 6 firms per tender for side-by-side display at 1920x1080 resolution
- **Assumption:** Users have authority to award contracts without external approval workflow

### Open Questions

- **Question:** Should tender packages support versioning if edits needed after finalization?
  - *Next Step:* Defer to future enhancement; require new package creation for changes in MVP

- **Question:** How to handle confidential pricing data in multi-user scenarios?
  - *Next Step:* Single user in MVP; design role-based access control for future

- **Question:** Should non-price criteria be customizable or fixed list?
  - *Next Step:* Fixed list for MVP; add custom criteria capability in v2

- **Question:** What happens if Cost Planning Card doesn't have matching cost item for award?
  - *Next Step:* Provide option to create new cost item during award flow

- **Question:** Should recommendation report include all firm submissions or only shortlisted?
  - *Next Step:* Only shortlisted firms included in evaluation and report

## Test Strategy Summary

### Test Levels

**Unit Tests (50% coverage target):**
- Component selection logic
- Price calculation functions (subtotals, grand total)
- Package immutability enforcement
- Content sanitization functions
- Weighted scoring calculations

**Integration Tests (30% coverage target):**
- AI tender package generation with mocked OpenAI responses
- AI price extraction accuracy testing with sample PDFs
- PDF/Word export generation with React-PDF and docx libraries
- Database transactions for contract award and cost flow
- Document filing to correct repository paths

**E2E Tests (20% coverage target):**
- Complete tender package creation flow (select → generate → edit → finalize → export)
- Price evaluation flow (setup → AI extraction → manual entry → calculations)
- Non-price evaluation flow (extract content → score → compare)
- Recommendation report generation and export
- Contract award flow with cost planning update

### Test Framework

- Vitest for unit/integration tests
- React Testing Library for component tests
- Playwright for E2E tests
- Mock Service Worker (MSW) for AI API mocking
- Snapshot testing for PDF/Word export validation

### Coverage of Acceptance Criteria

- All 66 ACs will have at least one automated test
- Critical paths (package generation, price evaluation, contract award) will have comprehensive E2E coverage
- Package immutability will have dedicated security tests
- AI extraction features will have accuracy benchmarking tests

### Edge Cases to Test

- Empty component selection (should prevent generation)
- Very large tender packages (100+ page limit)
- All firms have identical pricing (tie-breaking logic)
- AI extraction returns no data (graceful fallback)
- Concurrent price table edits (optimistic locking)
- Network interruption during package generation (retry logic)
- Locked package edit attempts (security validation)
- Contract award without matching cost item (error handling)
- Non-numeric price values in AI extraction
- Special characters in firm names and descriptions

### Performance Testing

- Load test: Generate 10 packages concurrently
- Measure average package generation time across 50 samples
- Stress test: 1000+ line items in price evaluation tables
- Benchmark AI extraction time for various submission sizes (1MB, 5MB, 10MB, 15MB)
- Monitor memory usage during PDF generation for large packages

---

*This technical specification provides the detailed design foundation for implementing Epic 4: Tender Package Generation & Evaluation. All implementation stories should reference and align with the data models, APIs, workflows, and acceptance criteria defined in this document.*
