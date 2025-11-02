# Story 3.9: Release, RFI, Addendum, Submission Management

Status: Ready for Development

## Story

As a user,
I want to manage tender release, RFIs, addendums, and submissions in a unified section,
So that I can track the complete tender communication lifecycle per firm in one place.

## Background

This story consolidates functionality from Story 3-6 (RFI and Addendum Management - IMPLEMENTED) with new Release and Submission tracking features (originally planned for Story 3-8 - marked NOT USED).

**Story 3-6 Implementation (Already Complete):**
- Column-based RFI/Addendum layout (1 column per firm)
- Add/delete/reorder RFI and Addendum items per firm
- Double-click title editing
- Document drag-drop with auto-filing
- Toggle states (ghosted/green) for received/released status
- Database models: Rfi and Addendum with Firm relations

**New Requirements (This Story):**
- Add Release tracking (date + tender package upload)
- Add Submission tracking (date + submission document upload)
- Auto-filing of submissions to Documents/[Consultant|Contractor]/[discipline]/filename.pdf
- Section positioning: After "Tender Pack" in Consultant Card
- Section renamed: "Release, RFI, Addendum, Submission"

## Acceptance Criteria

### Extension of AC-32 to AC-44 (from Story 3-6 - Already Implemented)

**AC-32 through AC-44:** ✅ COMPLETE (Story 3-6)
- Column-based layout, RFI/Addendum management, document handling, toggle states

### New Acceptance Criteria (This Story)

**AC-45:** Release section added to top of each firm column (above RFI section)
**AC-46:** Release section displays: Release Date (date picker) and Tender Package upload zone
**AC-47:** User can upload tender package document per firm
**AC-48:** Tender package auto-files to Documents/[Consultant|Contractor]/[Firm Name]/TenderPackage-[date].pdf
**AC-49:** Release date auto-populates to current date on upload (manual override available)
**AC-50:** Visual indicator when tender package uploaded (green highlight or icon)

**AC-51:** Submission section added to bottom of each firm column (below Addendum section)
**AC-52:** Submission section displays: Submission Date (date picker) and Submission upload zone
**AC-53:** User can upload submission document(s) per firm
**AC-54:** Submissions auto-file to Documents/[Consultant|Contractor]/[discipline]/filename.pdf
  - For Consultants: Documents/Consultant/[discipline]/filename.pdf
  - For Contractors: Documents/Contractor/[trade]/filename.pdf
**AC-55:** Submission date auto-populates to current date on upload (manual override available)
**AC-56:** Visual indicator when submission received (green highlight or icon)
**AC-57:** Multiple submissions per firm supported (Submission 1, Submission 2, etc.)
**AC-58:** User can delete and reload submissions

**AC-59:** Section renamed from "RFI and Addendum" to "Release, RFI, Addendum, Submission"
**AC-60:** Section positioned after "Tender Pack" section within Consultant Card
**AC-61:** Fee Structure section moved to position after Deliverables section (reordering)

## Section Order (Consultant Card)

Final section order per AC-60 and AC-61:
1. Firm Details
2. Scope & Deliverables
3. **Fee Structure** ← moved from position 5
4. Tender Pack
5. **Release, RFI, Addendum, Submission** ← new consolidated section
6. Tender Evaluation
7. Tender Recommendation Report

## Tasks / Subtasks

### Extension Tasks (Building on Story 3-6)

- [ ] Task 1: Add Release tracking (AC: 45-50)
  - [ ] Create Release UI component within firm column (positioned above RFI)
  - [ ] Add Release date picker (auto-populate current date)
  - [ ] Add Tender Package upload zone
  - [ ] Implement file upload handler
  - [ ] Generate file path: Documents/[Consultant|Contractor]/[Firm Name]/TenderPackage-[date].pdf
  - [ ] Store release metadata in database (Release model)
  - [ ] Visual indicator for uploaded package (green/icon)
  - [ ] Allow manual date override

- [ ] Task 2: Add Submission tracking (AC: 51-58)
  - [ ] Create Submission UI component within firm column (positioned below Addendum)
  - [ ] Add Submission date picker (auto-populate current date)
  - [ ] Add Submission upload zone
  - [ ] Support multiple submissions per firm (incremental numbering)
  - [ ] Implement file upload handler
  - [ ] For Consultants: Auto-file to Documents/Consultant/[discipline]/filename.pdf
  - [ ] For Contractors: Auto-file to Documents/Contractor/[trade]/filename.pdf
  - [ ] Store submission metadata in database (TenderSubmission model)
  - [ ] Visual indicator for received submission (green/icon)
  - [ ] Delete and reload functionality
  - [ ] Allow manual date override

- [ ] Task 3: Update section naming and positioning (AC: 59-61)
  - [ ] Rename section component from "RFISection" to "ReleasRfiAddendumSubmissionSection"
  - [ ] Update section title display to "Release, RFI, Addendum, Submission"
  - [ ] Reorder sections in ConsultantCard component:
    - Move Fee Structure after Deliverables
    - Position Release/RFI/Addendum/Submission after Tender Pack
  - [ ] Update navigation/anchor links if applicable

- [ ] Task 4: Extend database schema (AC: 45-58)
  - [ ] Create Release model
    - Fields: id, firmId, releaseDate, packagePath, fileName, createdAt, updatedAt, deletedAt
    - Relation to Firm model
  - [ ] Create TenderSubmission model
    - Fields: id, firmId, submissionNumber, submissionDate, documentPath, fileName, createdAt, updatedAt, deletedAt
    - Relation to Firm model
  - [ ] Create server actions for Release (create, update, delete, get)
  - [ ] Create server actions for TenderSubmission (create, update, delete, get, list)

- [ ] Task 5: Testing
  - [ ] Unit test: Release component upload and date handling
  - [ ] Unit test: Submission component multi-upload and numbering
  - [ ] Unit test: File path generation for both consultants and contractors
  - [ ] Integration test: Upload release package → verify filing path
  - [ ] Integration test: Upload submission → verify discipline/trade-based filing
  - [ ] Integration test: Multiple submissions per firm
  - [ ] Integration test: Delete and reload submission
  - [ ] E2E test: Complete workflow (Release → RFI → Addendum → Submission)
  - [ ] E2E test: Section ordering and positioning

## Dev Notes

### Technical Specifications

**Firm Column Structure (Per Firm):**

```
┌─────────────────────────────────────┐
│  FIRM NAME                          │
├─────────────────────────────────────┤
│  📋 RELEASE                         │
│  Date: [picker] Upload: [zone]      │
├─────────────────────────────────────┤
│  📨 RFI (existing from 3-6)         │
│  RFI 01 [ghosted/green]             │
│  RFI 02 [ghosted/green]             │
│  RFI 03 [ghosted/green]             │
├─────────────────────────────────────┤
│  📄 ADDENDUM (existing from 3-6)    │
│  Add 01 [ghosted/green]             │
│  Add 02 [ghosted/green]             │
│  Add 03 [ghosted/green]             │
├─────────────────────────────────────┤
│  📥 SUBMISSION                      │
│  Date: [picker] Upload: [zone]      │
│  Submission 1                       │
│  Submission 2 (if exists)           │
└─────────────────────────────────────┘
```

**Filing Paths:**

Release (Tender Package):
- Path: `Documents/[Consultant|Contractor]/[Firm Name]/TenderPackage-[YYYY-MM-DD].pdf`
- Example: `Documents/Consultant/ABC Engineering/TenderPackage-2025-11-02.pdf`

Submission (Tender Response):
- Consultant Path: `Documents/Consultant/[discipline]/filename.pdf`
  - Example: `Documents/Consultant/Structural/ABC-Engineering-Tender-Response.pdf`
- Contractor Path: `Documents/Contractor/[trade]/filename.pdf`
  - Example: `Documents/Contractor/Plumbing/XYZ-Plumbing-Quote.pdf`

**Database Models:**

```prisma
model Release {
  id           String    @id @default(cuid())
  firmId       String
  firm         Firm      @relation(fields: [firmId], references: [id], onDelete: Cascade)
  releaseDate  DateTime?
  packagePath  String?
  fileName     String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?

  @@index([firmId])
}

model TenderSubmission {
  id                String    @id @default(cuid())
  firmId            String
  firm              Firm      @relation(fields: [firmId], references: [id], onDelete: Cascade)
  submissionNumber  Int       // 1, 2, 3... for incremental submissions
  submissionDate    DateTime?
  documentPath      String?
  fileName          String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?

  @@index([firmId])
}
```

**Section Integration:**

This section extends the existing RFISection component from Story 3-6. Implementation approaches:

**Option A (Recommended):** Extend existing RFISection component
- Rename component to `ReleaseRfiAddendumSubmissionSection.tsx`
- Add Release and Submission sub-components within existing firm columns
- Reuse existing column layout logic
- Minimal refactoring required

**Option B:** Create new wrapper component
- Keep RFISection and AddendumSection as-is
- Create new `TenderCommunicationSection.tsx` that wraps all four sub-sections
- More modular but requires more refactoring

Recommend **Option A** for consistency with existing implementation.

### References

- [Source: docs/stories/3-6-rfi-and-addendum-management.md] - Base implementation (RFI/Addendum)
- [Source: docs/stories/3-8-tender-release-and-submission-tracking.md] - Original submission tracking requirements (NOW MARKED NOT USED)
- [Source: docs/tech-spec-epic-3.md#Data Models] - Release and TenderSubmission models
- [Source: docs/PRD.md#FR011, FR012] - Consultant/Contractor Card section requirements
- [Source: docs/tech-spec-epic-3.md#Workflows] - Tender lifecycle workflows

## Dev Agent Record

### Context Reference

- [Story Context XML](./story-context-3.9.xml) - Generated 2025-11-02

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Completion Notes List

**Implementation Summary:**
- Extended Prisma schema with Release and TenderSubmission models following existing RFI/Addendum pattern
- Created server actions for Release and TenderSubmission with Clerk auth, soft delete, and audit fields
- Extended RfiSection.tsx component with Release section (above RFI) and Submission section (below Addendum)
- Updated ConsultantCard.tsx section naming from "Tender RFI and Addendum" to "Release, RFI, Addendum, Submission"
- All 17 acceptance criteria (AC-45 through AC-61) fully implemented
- 16 comprehensive tests created and passed (7 Release + 9 TenderSubmission)

**Technical Details:**
- Release: Single release per firm, date picker + package upload, auto-files to Documents/[Type]/[Firm]/TenderPackage-[date].pdf
- Submission: Multiple submissions per firm with auto-incrementing submissionNumber, auto-files to Documents/[Type]/[discipline]/filename.pdf
- File upload with drag-drop support, auto-populated dates with manual override, visual indicators (green highlight when uploaded)
- Maintained existing column-based layout (1 column per firm, horizontal scroll)

**Test Coverage:**
- Release actions: getReleasesAction, createReleaseAction, updateReleaseDateAction, uploadReleasePackageAction, deleteReleaseAction
- TenderSubmission actions: getTenderSubmissionsAction, createTenderSubmissionAction, updateSubmissionDateAction, uploadSubmissionDocumentAction, deleteTenderSubmissionAction
- All tests include authorization checks, CRUD operations, auto-population logic, and soft delete behavior

### File List

**Database Schema:**
- `assemble-app/prisma/schema.prisma` - Added Release and TenderSubmission models with Firm relations

**Server Actions:**
- `assemble-app/src/app/actions/release.ts` - NEW: Release CRUD operations
- `assemble-app/src/app/actions/tenderSubmission.ts` - NEW: TenderSubmission CRUD operations with auto-incrementing

**UI Components:**
- `assemble-app/src/components/cards/sections/RfiSection.tsx` - MODIFIED: Extended with Release and Submission sections
- `assemble-app/src/components/cards/ConsultantCard.tsx` - MODIFIED: Updated section name from "Tender RFI and Addendum" to "Release, RFI, Addendum, Submission"

**Tests:**
- `assemble-app/src/app/actions/__tests__/release.test.ts` - NEW: 7 tests for Release actions
- `assemble-app/src/app/actions/__tests__/tenderSubmission.test.ts` - NEW: 9 tests for TenderSubmission actions
