# Story 4.4: Tender Package Finalization and Lock

Status: Ready

## Story

As a construction manager,
I want to finalize and lock tender packages,
So that released packages cannot be altered and maintain integrity throughout the tender process.

## Acceptance Criteria

1. "Finalize Tender Pack" action with confirmation
2. Package becomes immutable (no edits allowed)
3. Locked status clearly indicated
4. Export to PDF and Word formats
5. Automatic filing to Documents/[Consultant]/Tender Pack.PDF
6. Audit trail of finalization (who, when)

## Tasks / Subtasks

- [ ] Task 1: Implement finalization workflow (AC: #1, #2, #3, #6)
  - [ ] Subtask 1.1: Add "Finalize Tender Pack" button to TenderActionBar
  - [ ] Subtask 1.2: Create confirmation dialog explaining immutability
  - [ ] Subtask 1.3: Create server action to lock tender package (set status = "locked")
  - [ ] Subtask 1.4: Store finalization metadata (userId, timestamp, version)
  - [ ] Subtask 1.5: Prevent all edit operations on locked tender packages
  - [ ] Subtask 1.6: Display locked status prominently in UI (lock icon, banner)
- [ ] Task 2: Implement PDF export (AC: #4)
  - [ ] Subtask 2.1: Create PDF generation service using react-pdf or Puppeteer
  - [ ] Subtask 2.2: Apply professional formatting template for tender documents
  - [ ] Subtask 2.3: Include all sections, tables, and document schedule
  - [ ] Subtask 2.4: Add header/footer with project name, date, page numbers
  - [ ] Subtask 2.5: Generate PDF synchronously as part of finalization
- [ ] Task 3: Implement Word export (AC: #4)
  - [ ] Subtask 3.1: Create Word (.docx) generation using docx library
  - [ ] Subtask 3.2: Apply consistent formatting matching PDF output
  - [ ] Subtask 3.3: Include all sections and preserve structure
  - [ ] Subtask 3.4: Handle tables and lists correctly in Word format
- [ ] Task 4: Implement automatic filing to Documents (AC: #5)
  - [ ] Subtask 4.1: Generate file path: Documents/[Consultant]/Tender Pack.PDF
  - [ ] Subtask 4.2: Upload generated PDF to S3 at appropriate path
  - [ ] Subtask 4.3: Create document record in database linking to tender package
  - [ ] Subtask 4.4: Update Documents Card to show newly filed tender pack
- [ ] Task 5: Build export and download UI (AC: #4)
  - [ ] Subtask 5.1: Add "Export PDF" and "Export Word" buttons post-finalization
  - [ ] Subtask 5.2: Trigger browser download for exported files
  - [ ] Subtask 5.3: Show export progress indicator
  - [ ] Subtask 5.4: Handle export errors gracefully with user feedback
- [ ] Task 6: Enforce immutability throughout application (AC: #2)
  - [ ] Subtask 6.1: Add guards in all tender edit mutations to reject locked packages
  - [ ] Subtask 6.2: Disable edit UI elements when viewing locked tender
  - [ ] Subtask 6.3: Add read-only indicator throughout locked tender view
  - [ ] Subtask 6.4: Prevent re-generation or modification of locked tenders
- [ ] Task 7: Write tests for finalization and export (AC: All)
  - [ ] Subtask 7.1: Unit tests for lock enforcement logic
  - [ ] Subtask 7.2: Integration tests for PDF and Word generation
  - [ ] Subtask 7.3: Test automatic filing to Documents
  - [ ] Subtask 7.4: E2E test for complete finalize → export → file workflow

## Dev Notes

### Architecture Constraints

- Immutability is critical: locked packages must never be editable
- Audit trail requirement (NFR008) mandates complete finalization record
- Soft delete pattern: never hard-delete finalized tenders
- Export formats must be professional quality, suitable for external distribution
- File storage on S3 with signed URLs for secure access

### Finalization State Machine

Tender package states:
```
draft → (finalize action) → locked
locked → (no transitions allowed)
```

Once locked:
- All edit operations blocked at API level
- UI disables all edit controls
- Only export and view operations permitted

### PDF Generation

Library options:
- **react-pdf**: Generate PDF from React components (recommended for complex layouts)
- **Puppeteer**: Render HTML to PDF (good for print stylesheets)
- **PDFKit**: Low-level PDF generation (more control but more code)

Template structure:
```
Cover Page
  - Project Name
  - Consultant Discipline
  - Date of Tender Release
  - Closing Date

Table of Contents

Selected Plan Card Sections
  - Details
  - Objectives
  - Staging
  - etc.

Consultant/Contractor Card Sections
  - Scope
  - Deliverables
  - Fee Structure
  - Release Dates

Document Schedule
  - Categorized list of reference documents

Appendices (if any)
```

### Word Document Generation

Use `docx` npm package:
```typescript
import { Document, Packer, Paragraph, TextRun, Table } from 'docx';

// Generate structured Word document
const doc = new Document({
  sections: [
    {
      children: [
        new Paragraph({
          text: "Tender Package",
          heading: HeadingLevel.HEADING_1,
        }),
        // ... more content
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
```

### Automatic Filing Logic

File path pattern:
- Consultants: `Documents/[ConsultantDiscipline]/Tender Pack.PDF`
- Contractors: `Documents/[ContractorTrade]/Tender Pack.PDF`

S3 key structure:
```
projects/{projectId}/documents/{category}/{filename}
```

Create Document record:
```typescript
await prisma.document.create({
  data: {
    projectId,
    name: 'Tender Pack.PDF',
    category: consultantDiscipline, // or contractorTrade
    path: s3Key,
    size: fileSize,
    mimeType: 'application/pdf',
    sourceType: 'tender_package',
    sourceTenderPackageId: tenderPackageId,
  },
});
```

### Database Schema Extension

```prisma
model TenderPackage {
  // ... existing fields
  status                String   @default("draft") // draft, locked
  finalizedAt           DateTime?
  finalizedBy           String?
  pdfPath               String?  // S3 path to generated PDF
  docxPath              String?  // S3 path to generated Word doc
  filedDocumentId       String?  // FK to Document record
}

// Add index for querying locked packages
@@index([status])
```

### Source Tree Components

Files to create/modify:
- `/src/server/services/pdfGenerator.ts` (new)
- `/src/server/services/wordGenerator.ts` (new)
- `/src/app/actions/tender.ts` (modify - add finalize action)
- `/src/components/tender/FinalizeTenderDialog.tsx` (new)
- `/src/components/tender/TenderActionBar.tsx` (modify - add finalize button)
- `/src/components/tender/ExportButtons.tsx` (new)
- `/src/server/api/routers/tender.ts` (modify - add export endpoints)
- `/src/server/services/s3.ts` (modify - add filing methods)
- `/prisma/schema.prisma` (modify)

### Project Structure Notes

- PDF/Word generation services in `/src/server/services/` following service layer pattern
- Finalization enforced at database level (status field) and application level (guards)
- Export files temporarily generated then uploaded to S3
- Document filing updates Documents Card automatically

### Immutability Enforcement

Multi-layer protection:
1. **Database**: Check `status !== 'locked'` in all update queries
2. **API**: Validate status in tRPC mutations before allowing edits
3. **Server Actions**: Reject edit operations on locked packages
4. **UI**: Disable edit controls and show read-only indicators
5. **Types**: TypeScript guards to prevent accidental edits

### Export Performance

- PDF generation may take 5-10 seconds for complex documents
- Show progress indicator during generation
- Consider background job for very large packages (future enhancement)
- Cache generated exports on S3 to avoid regenerating

### Testing Standards

- Unit tests for status guards in all edit operations
- Test PDF generation with various tender configurations
- Test Word export produces valid .docx files
- Verify automatic filing creates correct S3 paths and database records
- E2E test covering edit → finalize → export → verify locked workflow

### References

- [Source: docs/epics.md#Story 4.4] - Acceptance criteria and story definition
- [Source: docs/PRD.md#FR034-FR038] - Export and immutability requirements
- [Source: docs/PRD.md#NFR008-NFR009] - Audit trail and immutability requirements
- [Source: docs/architecture.md#File Storage] - AWS S3 with signed URLs
- [Source: docs/PRD.md#User Journey 1 Step 5] - Finalize and release workflow
- [Source: docs/PRD.md#Document Filing Automation FR024] - Auto-filing pattern

## Dev Agent Record

### Context Reference

- docs/stories/story-context-4.4.xml

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

### File List
