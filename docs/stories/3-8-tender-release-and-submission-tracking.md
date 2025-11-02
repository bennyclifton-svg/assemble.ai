# Story 3.8: Tender Release and Submission Tracking

**Status: NOT USED - MERGED INTO STORY 3-9**

> **⚠️ IMPORTANT:** This story has been consolidated with Story 3-6 (RFI and Addendum Management) to create Story 3-9 (Release, RFI, Addendum, Submission Management).
>
> **Refer to Story 3-9** for the consolidated implementation that includes:
> - Tender Release tracking (from this story)
> - Submission tracking (from this story)
> - RFI management (from Story 3-6 - already implemented)
> - Addendum management (from Story 3-6 - already implemented)
>
> All functionality from this story is preserved in Story 3-9 within a unified "Release, RFI, Addendum, Submission" section.

## Story

As a user,
I want to track tender release dates and submissions received,
So that I can manage the tender timeline.

## Acceptance Criteria

50. Submissions organized in columns (1 column per firm, side-by-side)
51. Upload submissions per firm with automatic date stamp (manual override available)
52. Multiple submissions per firm supported (incremental numbering)
53. Visual indicator when submission received
54. For Consultants: Auto-filing to Documents/[Consultant]/[Discipline]/filename.pdf
55. For Contractors: Auto-filing to Documents/[Contractor]/[Trade]/filename.pdf
56. User can delete submissions and reload new submission
57. Evaluation sections enabled when submission received for that firm

## Tasks / Subtasks

- [ ] Create column-based submission layout (AC: 50)
  - [ ] Display submissions in columns (1 per firm, side-by-side)
  - [ ] Show submission slots per firm
  - [ ] Responsive layout for multiple firms

- [ ] Implement submission upload (AC: 51, 52)
  - [ ] Add upload button/zone per firm column
  - [ ] Auto-timestamp with current date
  - [ ] Allow manual date override via date picker
  - [ ] Support multiple submissions (Submission 1, Submission 2, etc.)
  - [ ] Increment submission number automatically
  - [ ] Store submission metadata in database

- [ ] Add visual indicators (AC: 53)
  - [ ] Show submission received indicator
  - [ ] Display submission date
  - [ ] Show submission count per firm
  - [ ] Highlight firms with submissions

- [ ] Implement auto-filing (AC: 54, 55)
  - [ ] For Consultants: File to Documents/[Consultant]/[Discipline]/filename.pdf
  - [ ] For Contractors: File to Documents/[Contractor]/[Trade]/filename.pdf
  - [ ] Preserve original filename
  - [ ] Store file path in TenderSubmission model

- [ ] Add delete and reload functionality (AC: 56)
  - [ ] Delete button per submission
  - [ ] Confirmation dialog before deletion
  - [ ] Allow upload of replacement submission
  - [ ] Maintain submission numbering

- [ ] Enable evaluation sections (AC: 57)
  - [ ] Detect when firm has submission
  - [ ] Enable Tender Evaluation section for that firm
  - [ ] Disable evaluation if no submission
  - [ ] Show "Waiting for submission" message

- [ ] Create database schema
  - [ ] TenderSubmission model (firmId, submissionNumber, uploadDate, documentPath, fileName)
  - [ ] Relations to Firm model
  - [ ] Create tRPC mutations for submission upload/delete

- [ ] Testing
  - [ ] Unit test: Submission column component
  - [ ] Unit test: File path generation logic
  - [ ] Integration test: Upload submission → verify filing
  - [ ] Integration test: Delete and reload submission
  - [ ] Integration test: Evaluation section enablement
  - [ ] E2E test: Complete submission workflow

## Dev Notes

### Technical Specifications

**Submission Numbering:**
- Auto-increment per firm (Submission 1, 2, 3...)
- Preserve numbers even after deletion (gaps allowed)

**Filing Paths:**
- Consultant submissions: `Documents/[Consultant]/[Discipline]/filename.pdf`
  - Example: `Documents/Consultant/Structural/ABC-Engineering-Tender.pdf`
- Contractor submissions: `Documents/[Contractor]/[Trade]/filename.pdf`
  - Example: `Documents/Contractor/Plumber/XYZ-Plumbing-Quote.pdf`

**Evaluation Integration:**
- Submission presence triggers evaluation section availability
- Tender Evaluation section (from Story 3.1) uses submission data
- Future Epic 4 will implement full evaluation logic

### References

- [Source: docs/tech-spec-epic-3.md#Data Models] - TenderSubmission model
- [Source: docs/tech-spec-epic-3.md#Workflows] - Tender Submission Flow
- [Source: docs/epics.md#Epic 3 Story 3.8] - Original acceptance criteria

## Dev Agent Record

### Context Reference

- [Story Context XML](./story-context-3.8.xml)

### Completion Notes List

<!-- Implementation notes -->

### File List

<!-- Files created/modified -->
