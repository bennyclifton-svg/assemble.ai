# Technical Specification: Epic 2: Document Management & AI Processing

Date: 2025-10-26
Author: Benny
Epic ID: 2
Status: Draft

---

## Overview

Epic 2 implements the document management foundation for assemble.ai, delivering AI-powered document processing capabilities that dramatically reduce manual data entry. Building on Epic 1's card infrastructure, this epic introduces a hierarchical document repository with drag-and-drop upload, intelligent text extraction using GPT-4 Vision, and automatic population of card fields. The system will process construction documents (PDFs, images, scanned files) within 10 seconds, extracting relevant information and organizing documents according to context-aware filing rules, directly addressing the PRD goal of eliminating 50% of manual assembly work.

## Objectives and Scope

**In Scope:**
- Two-tier document repository with folder hierarchy (category/subcategory structure)
- Drag-and-drop file upload with bulk support (up to 15MB per file)
- AWS S3 integration with signed URLs for secure document storage
- GPT-4 Vision integration for OCR and text extraction from PDFs/images
- AI-powered field population for Plan Card sections (Details, Objectives, Staging, Risk)
- Document metadata tracking (name, path, size, upload date, tags, version)
- Multi-select document functionality using Shift+click and Ctrl+click patterns
- Document schedule creation for tender packages (references without file copies)
- Context-aware auto-filing based on upload location (RFIs, invoices, submissions)
- MIME type validation and virus scanning for security

**Out of Scope:**
- Document editing or annotation features
- Real-time collaborative editing
- Version control with diff/merge capabilities
- Document approval workflows
- Integration with external document management systems
- Full-text search across document contents (deferred to future epic)
- Document templates or generation
- Email integration for document receipt

## System Architecture Alignment

This epic aligns with the established multi-card workspace architecture, extending the Card→Section→Item hierarchy to support document associations. The implementation leverages the Server Actions pattern for file uploads, tRPC for document queries, and introduces new services in the `server/services/` layer (documentProcessor.ts, s3.ts). Document processing follows the established error handling patterns with structured logging via Pino. The AI extraction service integrates with the Vercel AI SDK configuration, maintaining consistency with the architecture's decision to use GPT-4 Vision for unified OCR/extraction (ADR-003). All document operations respect the immutability constraints, preparing for Epic 4's tender package lockdown requirements.

## Detailed Design

### Services and Modules

| Service/Module | Responsibility | Inputs | Outputs | Owner |
|----------------|----------------|---------|---------|-------|
| **DocumentProcessor** | Orchestrates document upload, processing, and extraction | File buffer, metadata, context | Document record with extracted data | server/services/documentProcessor.ts |
| **S3Service** | Manages AWS S3 operations and signed URLs | File buffer, key, expiration | S3 URL, signed URL | server/services/s3.ts |
| **AIExtractor** | Extracts text and data using GPT-4 Vision | Document URL, extraction prompt | Structured extraction result | lib/ai/extractors.ts |
| **DocumentRepository** | Manages document hierarchy and metadata | Path, tags, associations | Document tree structure | server/api/routers/document.ts |
| **FileUploadAction** | Server Action for handling uploads | FormData with files | Upload result with document IDs | app/actions/document.ts |
| **AutoFiler** | Determines filing location based on context (Consultant disciplines or Contractor trades) | Upload context, document type | Target path | server/services/autoFiler.ts |
| **DocumentCard** | UI component for document management | Document list, selection state | Document grid/list view | components/cards/DocumentCard.tsx |
| **DragDropZone** | Handles drag-drop interactions | onDrop callback, accepted types | Visual feedback, file processing | components/ui/DragDropZone.tsx |

### Data Models and Contracts

```prisma
// Document entity (extends existing schema from Epic 1)
model Document {
  id            String    @id @default(cuid())
  projectId     String
  project       Project   @relation(fields: [projectId], references: [id])

  // Hierarchy
  path          String    // e.g., "Documents/Consultant/Architect"
  name          String
  displayName   String    // User-friendly name

  // S3 storage
  s3Key         String    @unique
  s3Bucket      String
  url           String    // Permanent S3 URL
  size          Int       // File size in bytes
  mimeType      String

  // Metadata
  tags          String[]  // Array of tags for filtering
  version       Int       @default(1)
  checksum      String    // MD5 hash for integrity

  // Associations
  cardId        String?   // Optional link to specific card
  card          Card?     @relation(fields: [cardId], references: [id])
  sectionId     String?   // Optional link to specific section
  section       Section?  @relation(fields: [sectionId], references: [id])

  // AI extraction
  extractedText String?   @db.Text
  extractedData Json?     // Structured data from AI
  processedAt   DateTime?
  processingError String?

  // Audit
  createdAt     DateTime  @default(now())
  createdBy     String
  updatedAt     DateTime  @updatedAt
  updatedBy     String
  deletedAt     DateTime?

  // Relations
  tenderPackages TenderPackageDocument[]

  @@index([projectId])
  @@index([path])
  @@index([cardId])
}

// Document selection for tender packages
model TenderPackageDocument {
  id              String        @id @default(cuid())
  tenderPackageId String
  tenderPackage   TenderPackage @relation(fields: [tenderPackageId], references: [id])
  documentId      String
  document        Document      @relation(fields: [documentId], references: [id])
  includeInSchedule Boolean     @default(true)
  order           Int

  @@unique([tenderPackageId, documentId])
}

// Document processing queue
model DocumentQueue {
  id          String   @id @default(cuid())
  documentId  String
  status      String   // 'pending', 'processing', 'completed', 'failed'
  attempts    Int      @default(0)
  error       String?
  createdAt   DateTime @default(now())
  processedAt DateTime?
}
```

**TypeScript Types:**
```typescript
// Document upload types
interface DocumentUploadRequest {
  files: File[]
  projectId: string
  cardId?: string
  sectionId?: string
  context?: 'plan' | 'consultant' | 'contractor' | 'cost'
  autoFile?: boolean
}

interface DocumentMetadata {
  name: string
  path: string
  tags: string[]
  associations?: {
    cardId?: string
    sectionId?: string
  }
}

// AI extraction types
interface ExtractionRequest {
  documentUrl: string
  documentType: 'pdf' | 'image' | 'scanned'
  targetFields?: string[] // Specific fields to extract
  context?: 'details' | 'objectives' | 'staging' | 'risk' | 'stakeholders' | 'scope' | 'deliverables' | 'fee_structure'
}

interface ExtractionResult {
  success: boolean
  extractedText: string
  structuredData?: {
    projectName?: string
    address?: string
    zoning?: string
    objectives?: string[]
    stages?: Array<{ name: string; date?: string }>
    risks?: string[]
    stakeholders?: Array<{ role: string; organization: string; name: string; email: string; mobile: string }>
    scopeItems?: string[]
    deliverables?: string[]
    feeStructure?: Array<{ stage: string; amount: number }>
    [key: string]: any
  }
  confidence: number
  processingTime: number
}
```

### APIs and Interfaces

**Server Actions:**
```typescript
// app/actions/document.ts
async function uploadDocuments(
  formData: FormData
): Promise<ActionResult<Document[]>>
// Returns: { success: true, data: Document[] } or error

async function processDocument(
  documentId: string
): Promise<ActionResult<ExtractionResult>>
// Returns: Extracted data or processing error

async function autoPopulateFields(
  documentId: string,
  targetCardId: string,
  targetSection: string
): Promise<ActionResult<UpdatedFields>>
// Returns: List of populated fields

async function deleteDocument(
  documentId: string
): Promise<ActionResult<void>>
// Soft delete, returns success/error
```

**tRPC Procedures:**
```typescript
// server/api/routers/document.ts
document.getByProject
  Input: { projectId: string, path?: string }
  Output: Document[]

document.getTree
  Input: { projectId: string }
  Output: DocumentTreeNode[]

document.getByTags
  Input: { projectId: string, tags: string[] }
  Output: Document[]

document.getSelectionForTender
  Input: { tenderPackageId: string }
  Output: DocumentSelection[]
```

**REST Endpoints (via Next.js API Routes):**
```typescript
POST /api/upload
  Body: FormData with files
  Response: { documents: Document[] }
  Headers: Content-Type: multipart/form-data

GET /api/documents/[id]/download
  Response: Redirect to signed S3 URL
  Query: ?expires=3600 (optional expiry in seconds)

POST /api/documents/batch-select
  Body: { documentIds: string[], operation: 'tag' | 'move' | 'delete' }
  Response: { affected: number }
```

**Error Codes:**
```typescript
type DocumentErrorCode =
  | 'FILE_TOO_LARGE'        // File exceeds 15MB limit
  | 'INVALID_MIME_TYPE'     // Unsupported file type
  | 'UPLOAD_FAILED'         // S3 upload error
  | 'EXTRACTION_FAILED'     // AI processing error
  | 'QUOTA_EXCEEDED'        // Storage limit reached
  | 'VIRUS_DETECTED'        // ClamAV detection
  | 'PROCESSING_TIMEOUT'    // Exceeded 10-second limit
```

### Workflows and Sequencing

**Document Upload Flow:**
```
1. User drags files to DragDropZone component
2. Client validates file size (<15MB) and MIME type
3. FormData sent to uploadDocuments Server Action
4. Server Action:
   a. Validates files again
   b. Generates S3 keys and uploads to S3
   c. Creates Document records in database
   d. Queues documents for AI processing
   e. Returns document IDs to client
5. Background job processes queue:
   a. Retrieves document from S3
   b. Calls GPT-4 Vision API for extraction
   c. Updates Document record with extracted data
   d. Triggers auto-population if context provided
6. Client polls for processing status
7. UI updates when processing complete
```

**Auto-Population Flow (Plan Card):**
```
1. User drags document into Plan Card section
2. System identifies target section (Details/Objectives/Staging/Risk/Stakeholders)
3. AI extraction triggered with section-specific prompt
4. Extracted data mapped to card fields:
   - Details → projectName, address, zoning, etc.
   - Objectives → functional, quality, budget, program
   - Staging → stage items with dates
   - Risk → risk items with descriptions
   - Stakeholders → role, organization, name, email, mobile
5. Fields highlighted with AI-populated indicator
6. User reviews and can edit/reject changes
7. Changes saved to database on confirmation
```

**Auto-Population Flow (Consultant/Contractor Cards):**
```
1. User drags document into Consultant or Contractor Card section
2. System identifies target section (Scope, Deliverables, Fee Structure)
3. AI extraction triggered with section-specific prompt
4. Extracted data mapped to card fields:
   - Scope → Item 1, Item 2, Item 3
   - Deliverables → Item 1, Item 2, Item 3
   - Fee Structure → stage items with pricing
5. Fields highlighted with AI-populated indicator
6. User reviews and can edit/reject changes
7. Changes saved to database on confirmation
```

**Document Selection for Tender:**
```
1. User navigates to tender package creation
2. Document tree loaded with checkbox UI
3. User selects documents using:
   - Individual clicks for single selection
   - Shift+click for range selection
   - Ctrl+click for multi-selection
4. Selected documents associated with tender package
5. Document schedule generated (list without files)
6. Schedule included in tender package output
```

**Auto-Filing Flow:**
```
1. Document uploaded in specific context (e.g., Consultant Card or Contractor Card)
2. AutoFiler service determines path based on:
   - Upload context (card type, section)
   - Document type (RFI, invoice, submission, TRR, RFT)
   - Associated entity (consultant discipline name, contractor trade name, firm name)
3. Path generated following conventions:
   - RFI → Documents/[Consultant or Contractor]/RFI01.PDF
   - Invoice → Documents/Invoices/[Firm]/
   - Submission → Documents/[Consultant or Contractor]/[Firm] Submission 01.PDF
   - TRR → Documents/[Consultant or Contractor]/TRR.PDF
   - RFT → Documents/[Consultant or Contractor]/RFT.PDF
4. Document saved with generated path
5. User can override with manual path if needed
```

**Plan, Consultant and Contractor Section & Item Selection for Tender:**
```
1. User navigates to tender package creation
2. Plan Card, Consultant Card, and Contractor Card Section & Item tree loaded with checkbox UI
3. User selects Plan Card, Consultant Card, and Contractor Card Sections & Items using:
   - Individual clicks for single selection
   - Shift+click for range selection
   - Ctrl+click for multi-selection
4. Selected Sections & Items associated with tender package
5. Sections & Items schedule generated (including content)
6. Content included in tender package output
```

## Non-Functional Requirements

### Performance

- **File Upload:** Support concurrent upload of up to 10 files (150MB total) with progress indication
- **Processing Time:** Complete AI extraction within 10 seconds for 15MB files (per PRD requirement)
- **S3 Upload:** Utilize multipart upload for files > 5MB to improve reliability
- **Response Time:** Document tree loading < 500ms for 1000 documents
- **Batch Operations:** Process multi-select operations on up to 100 documents in < 2 seconds
- **Polling Interval:** Check processing status every 2 seconds during active processing
- **Caching:** Cache document tree structure for 5 minutes to reduce database queries
- **Signed URL Generation:** Generate S3 signed URLs in < 100ms

### Security

- **File Validation:** MIME type checking against whitelist (PDF, PNG, JPG, JPEG, DOC, DOCX)
- **Virus Scanning:** ClamAV integration for all uploads before S3 storage
- **Access Control:** All document operations require authenticated user via Clerk
- **S3 Security:** Private bucket with signed URLs expiring after 1 hour
- **Input Sanitization:** File names sanitized to prevent path traversal attacks
- **Size Limits:** Enforce 15MB per file, 500MB total per project
- **Checksum Verification:** MD5 hash validation to ensure file integrity
- **Audit Trail:** Log all document operations with userId, timestamp, and action

### Reliability/Availability

- **Retry Logic:** Automatic retry (3 attempts) for failed S3 uploads with exponential backoff
- **Queue Processing:** DocumentQueue ensures processing continues after failures
- **Graceful Degradation:** If AI extraction fails, document still accessible without extracted data
- **Error Recovery:** Failed extractions can be manually re-triggered
- **Partial Upload:** Support resumable uploads for large files
- **Duplicate Detection:** Prevent duplicate uploads using checksum comparison
- **Soft Deletes:** Documents marked as deleted but retained for 30 days for recovery

### Observability

**Logging Requirements (Pino):**
- Log all document upload attempts with file size, type, and outcome
- Log AI extraction requests with processing time and success/failure
- Log S3 operations with duration and bandwidth usage
- Log auto-filing decisions with source context and target path

**Metrics to Track:**
- Upload success rate and average file size
- AI extraction success rate and average processing time
- S3 bandwidth consumption per project
- Queue depth and processing throughput
- Document count per project and storage usage

**Monitoring Alerts:**
- Alert if extraction queue depth > 50 documents
- Alert if AI processing time > 15 seconds
- Alert if upload failure rate > 10% in 5-minute window
- Alert if S3 availability issues detected

## Dependencies and Integrations

**NPM Packages (to be added):**
```json
{
  "@aws-sdk/client-s3": "^3.600.0",        // S3 operations
  "@aws-sdk/s3-request-presigner": "^3.600.0", // Signed URLs
  "pdf-parse": "^2.4.5",                   // PDF text extraction
  "openai": "^4.65.0",                     // GPT-4 Vision API
  "ai": "^2.0.53",                         // Vercel AI SDK
  "@dnd-kit/core": "^6.3.1",               // Drag-drop foundation
  "@dnd-kit/sortable": "^8.0.0",           // Sortable lists
  "react-dropzone": "^14.3.5",             // File drop zones
  "file-type": "^19.6.0",                  // MIME type detection
  "multer": "^1.4.6",                      // Multipart form handling
  "crypto": "^1.0.1",                      // MD5 checksums
  "clamscan": "^3.0.0"                     // Virus scanning
}
```

**External Services:**
- **AWS S3:** Document storage with IAM role configuration
  - Bucket: `assemble-ai-documents-{env}`
  - Region: `us-east-1`
  - Lifecycle: 30-day retention for deleted files

- **OpenAI API:** GPT-4 Vision for document processing
  - Model: `gpt-4-vision-preview`
  - Max tokens: 4096
  - Temperature: 0.3 for consistent extraction

- **ClamAV:** Local or cloud-based virus scanning
  - Docker image: `clamav/clamav:latest`
  - Update signatures daily

**Integration Points:**
- Extends Epic 1's Card/Section/Item models with Document associations
- Prepares document selection mechanism for Epic 4's tender generation
- Provides extraction capabilities for Epic 3's consultant/contractor data

## Acceptance Criteria (Authoritative)

1. **AC-2.1:** Two-tier categorization system implemented with folder hierarchy visible in Documents Card
2. **AC-2.2:** Default folder structure created (Documents/[Consultant]/, Documents/Invoices/[Firm]/, etc.)
3. **AC-2.3:** Navigate through folders with functional breadcrumb trail
4. **AC-2.4:** Database tracks document metadata including name, path, size (bytes), upload date, and tags array
5. **AC-2.5:** Drag-and-drop zones display clear visual feedback (border highlight, overlay)
6. **AC-2.6:** Support bulk file uploads with multiple files processed simultaneously
7. **AC-2.7:** File size limit of 15MB enforced with user-friendly error message
8. **AC-2.8:** Progress indicator shows upload percentage for each file
9. **AC-2.9:** Files successfully uploaded to AWS S3 with unique keys
10. **AC-2.10:** Signed URLs generated with 1-hour expiration for secure access
11. **AC-2.11:** MIME type validation prevents upload of unsupported file types
12. **AC-2.12:** Integration with OpenAI GPT-4 Vision API functional
13. **AC-2.13:** PDF text extraction works for digital PDFs (non-scanned)
14. **AC-2.14:** OCR capability extracts text from scanned documents and images
15. **AC-2.15:** Processing completes within 10 seconds for 15MB files
16. **AC-2.16:** Extracted text stored in database extractedText field
17. **AC-2.17:** Error handling logs failed extractions with retry capability
18. **AC-2.18:** Documents draggable into Plan Card sections (Details, Objectives, Staging, Risk, Stakeholders)
19. **AC-2.19:** AI analyzes document and extracts section-relevant information
20. **AC-2.20:** AI populates appropriate fields based on extracted content including stakeholder details (role, organization, name, email, mobile)
21. **AC-2.21:** AI-populated fields show visual highlight indicator
22. **AC-2.22:** User can review and edit all AI-populated content
23. **AC-2.23:** "AI Generate" button provides alternative to drag-drop
24. **AC-2.24:** Multi-select documents using Shift+click for range selection
25. **AC-2.25:** Multi-select documents using Ctrl+click for individual selection
26. **AC-2.26:** Create document schedules without copying actual files
27. **AC-2.27:** Tag documents with multiple tags for filtering
28. **AC-2.28:** Selected documents associate with specific tender packages
29. **AC-2.29:** Document selections persist across sessions
30. **AC-2.30:** RFIs auto-file to Documents/[Consultant or Contractor]/RFI##.PDF pattern
31. **AC-2.31:** Invoices auto-file to Documents/Invoices/[Firm Name]/ folder
32. **AC-2.32:** Tender submissions auto-file to Documents/[Consultant or Contractor]/[Firm] Submission ##.PDF
33. **AC-2.33:** Automatic naming convention applied based on context
34. **AC-2.34:** User can manually override auto-filing location if needed
35. **AC-2.35:** Documents draggable into Consultant/Contractor Card sections (Scope, Deliverables, Fee Structure)
36. **AC-2.36:** AI extracts and populates Scope items, Deliverables items, and Fee Structure stages from consultant/contractor documents
37. **AC-2.37:** TRR (Tender Recommendation Report) documents auto-file to Documents/[Consultant or Contractor]/TRR.PDF
38. **AC-2.38:** RFT (Request for Tender) documents auto-file to Documents/[Consultant or Contractor]/RFT.PDF
39. **AC-2.39:** Plan Card Sections & Items selectable with checkbox UI for tender package inclusion
40. **AC-2.40:** Consultant Card Sections & Items selectable with checkbox UI for tender package inclusion (for all 36 disciplines)
41. **AC-2.41:** Contractor Card Sections & Items selectable with checkbox UI for tender package inclusion (for all 20 trades)
42. **AC-2.42:** Selected Sections & Items content included in tender package generation (not just references)

## Traceability Mapping

| AC ID | Spec Section | Component/API | Test Approach |
|-------|--------------|---------------|---------------|
| AC-2.1 to AC-2.4 | Data Models, Document Repository | Document model, DocumentCard.tsx | Unit test hierarchy logic, E2E folder navigation |
| AC-2.5 to AC-2.8 | DragDropZone, FileUploadAction | DragDropZone.tsx, uploadDocuments() | Component tests for visual feedback, E2E upload flow |
| AC-2.9 to AC-2.11 | S3Service, Security | s3.ts, uploadDocuments() | Integration tests with S3, unit test validation |
| AC-2.12 to AC-2.17 | AIExtractor, DocumentProcessor | extractors.ts, processDocument() | Mock AI API, test extraction pipeline |
| AC-2.18 to AC-2.23 | Auto-Population Flow | autoPopulateFields(), Plan Card | E2E drag to populate, unit test field mapping |
| AC-2.24 to AC-2.29 | Document Selection | Multi-select UI, TenderPackageDocument | E2E selection patterns, unit test persistence |
| AC-2.30 to AC-2.34 | AutoFiler | autoFiler.ts, filing rules | Unit test path generation, E2E context uploads |
| AC-2.35 to AC-2.36 | Consultant/Contractor Auto-Population | autoPopulateFields(), Consultant/Contractor Cards | E2E drag to populate consultant fields |
| AC-2.37 to AC-2.38 | AutoFiler Extensions | autoFiler.ts, TRR/RFT patterns | Unit test new document type paths |
| AC-2.39 to AC-2.42 | Section & Item Selection | Card section selector, tender package builder | E2E selection and content inclusion for all card types |

## Risks, Assumptions, Open Questions

**Risks:**
- **Risk:** GPT-4 Vision API costs could be significant at scale → *Mitigation:* Implement caching for repeated documents, consider fallback to cheaper OCR for simple text extraction
- **Risk:** 10-second processing time may be challenging for complex documents → *Mitigation:* Process in background with progress indication, optimize prompts for speed
- **Risk:** S3 costs could escalate with large document volumes → *Mitigation:* Implement lifecycle policies, compress documents where possible
- **Risk:** Virus scanning could introduce latency → *Mitigation:* Async scanning with immediate quarantine of suspicious files

**Assumptions:**
- **Assumption:** Users have reliable internet for uploading 15MB files
- **Assumption:** GPT-4 Vision API will maintain consistent performance
- **Assumption:** Construction documents follow standard formats (PDF primarily)
- **Assumption:** Users will review AI-extracted data before accepting (not fully automated)
- **Assumption:** Single-user context (no concurrent editing conflicts)

**Open Questions:**
- **Question:** Should we support CAD file formats (DWG, DXF)? → *Next step:* Defer to future epic, gather user feedback
- **Question:** How long should processed extraction data be cached? → *Next step:* Start with 24-hour cache, monitor usage patterns
- **Question:** Should document versioning track all changes or just major versions? → *Next step:* Implement simple version counter initially
- **Question:** What's the maximum project document storage limit? → *Next step:* Start with 500MB soft limit, monitor usage

## Test Strategy Summary

**Test Levels:**
- **Unit Tests:** Document model CRUD, file validation, path generation, checksum calculation
- **Integration Tests:** S3 upload/download, GPT-4 Vision API calls, database transactions
- **Component Tests:** DragDropZone interactions, progress indicators, multi-select behavior
- **E2E Tests:** Complete upload-process-populate flow, document selection for tenders

**Test Framework:**
- Vitest for unit/integration tests
- React Testing Library for component tests
- Playwright for E2E tests
- Mock Service Worker (MSW) for API mocking

**Coverage of Acceptance Criteria:**
- All 42 ACs will have at least one automated test
- Critical paths (upload, AI extraction, auto-population for all card types) will have E2E coverage
- Security validations (MIME type, file size) will have comprehensive unit tests
- Section & Item selection for tender packages will have integration tests for all three card types (Plan, Consultant, Contractor)

**Edge Cases to Test:**
- Uploading exactly 15MB file (boundary condition)
- Uploading 11 files simultaneously (over 10-file limit)
- Network interruption during upload
- AI extraction timeout scenario
- Malformed PDF that crashes pdf-parse
- Duplicate file upload attempts
- Special characters in file names
- Deeply nested folder structures

**Performance Testing:**
- Load test with 100 concurrent uploads
- Measure extraction time for various document sizes
- Stress test document tree with 1000+ documents
- Monitor memory usage during bulk operations

---

## Post-Review Follow-ups

### Story 2.2 Review Follow-ups (2025-10-28)

**BLOCKING Issues (must fix before story completion):**
- Add S3 credentials validation with fail-fast behavior in `s3.ts` to prevent silent failures with invalid AWS credentials
- Wrap all S3 operations (uploadFile, getUploadUrl, getDownloadUrl) in try-catch blocks with structured error logging for better error handling and debugging
- Integrate Pino logger for all S3 service operations to comply with architecture logging standards and enable production debugging

**Technical Debt:**
- Configure jsdom environment for component tests - 19 tests written but failing due to missing DOM environment setup
- Resolve maxFiles specification inconsistency: Story file specifies 10 files max, Story Context XML specifies 20 files max - requires SM clarification

**Future Enhancements (Epic 2 Retrospective):**
- Add retry logic for failed S3 uploads to handle transient network failures
- Implement multipart upload for files >5MB to improve reliability and performance for large files
- Add virus scanning integration (ClamAV or AWS GuardDuty) for production security compliance
- Implement rate limiting middleware (recommendation: 5 uploads/minute per user) to prevent DOS attacks
- Add E2E tests for drag-drop workflow using Playwright
- Add integration tests with real S3 in staging environment to complement mocked unit tests
- Validate and enforce S3 bucket security configuration (private access, CORS policies)