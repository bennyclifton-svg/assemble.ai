# Story 4.3: Tender Package Review and Edit

Status: Ready

## Story

As a construction manager,
I want to review and edit generated tender packages,
So that I can ensure accuracy and make refinements before releasing to firms.

## Acceptance Criteria

1. Generated package displayed for review
2. In-line editing capabilities for all sections
3. Track changes/revision marking
4. Save draft versions before finalizing
5. Preview in final format (PDF layout)

## Tasks / Subtasks

- [ ] Task 1: Create tender package review UI (AC: #1, #5)
  - [ ] Subtask 1.1: Build GeneratedTenderView component to display complete tender package
  - [ ] Subtask 1.2: Implement section-by-section layout with clear visual hierarchy
  - [ ] Subtask 1.3: Add document schedule display showing referenced documents
  - [ ] Subtask 1.4: Create PDF preview mode showing final formatted output
  - [ ] Subtask 1.5: Add navigation for quick section jumping
- [ ] Task 2: Implement in-line editing (AC: #2)
  - [ ] Subtask 2.1: Make all text sections editable with contentEditable or controlled inputs
  - [ ] Subtask 2.2: Create EditableSection component with edit/view mode toggle
  - [ ] Subtask 2.3: Implement rich text editing for formatting (bold, lists, etc.)
  - [ ] Subtask 2.4: Add section add/delete/reorder capabilities
  - [ ] Subtask 2.5: Ensure edits update tender package state immediately
- [ ] Task 3: Add track changes and revision marking (AC: #3)
  - [ ] Subtask 3.1: Implement change tracking system to highlight edits
  - [ ] Subtask 3.2: Show AI-generated vs user-edited content differently
  - [ ] Subtask 3.3: Store revision history with timestamps and user attribution
  - [ ] Subtask 3.4: Add "accept all changes" and "revert" functionality
- [ ] Task 4: Implement draft version management (AC: #4)
  - [ ] Subtask 4.1: Create "Save Draft" action to persist changes
  - [ ] Subtask 4.2: Support multiple draft versions with version numbering
  - [ ] Subtask 4.3: Add tRPC mutations for saving tender package edits
  - [ ] Subtask 4.4: Display last saved timestamp and version info
  - [ ] Subtask 4.5: Implement auto-save functionality every 30 seconds
- [ ] Task 5: Create PDF preview system (AC: #5)
  - [ ] Subtask 5.1: Implement PDF rendering using react-pdf or similar
  - [ ] Subtask 5.2: Apply professional formatting template
  - [ ] Subtask 5.3: Add print-optimized styles for preview
  - [ ] Subtask 5.4: Enable toggle between edit mode and preview mode
- [ ] Task 6: Write tests for review and edit functionality (AC: All)
  - [ ] Subtask 6.1: Unit tests for EditableSection component
  - [ ] Subtask 6.2: Integration tests for saving draft versions
  - [ ] Subtask 6.3: Test track changes functionality
  - [ ] Subtask 6.4: E2E test for complete review-edit-save workflow

## Dev Notes

### Architecture Constraints

- Follow optimistic update pattern for immediate UI feedback on edits
- Use Zustand store for tender edit state management
- Implement proper debouncing for auto-save to avoid excessive DB writes
- Maintain separation between draft (editable) and locked (immutable) states
- Store complete revision history for audit trail compliance

### Editing Interface Design

Component hierarchy:
```
TenderReviewPage
├── TenderHeader (metadata, status, actions)
├── TenderNavigationSidebar (section quick-jump)
├── TenderContentArea
│   ├── EditableSection (repeated for each section)
│   │   ├── SectionHeader (title, edit toggle)
│   │   ├── SectionContent (editable text/tables)
│   │   └── SectionActions (add, delete, reorder)
│   └── DocumentScheduleSection (read-only reference list)
└── TenderActionBar (Save Draft, Preview, Finalize)
```

### Track Changes Implementation

Store changes as structured diffs:
```typescript
interface TenderRevision {
  id: string;
  tenderPackageId: string;
  versionNumber: number;
  changes: {
    sectionId: string;
    fieldPath: string;  // e.g., "scope.description"
    oldValue: string;
    newValue: string;
    changeType: 'edit' | 'add' | 'delete';
    timestamp: Date;
    userId: string;
  }[];
  snapshot: Json;  // Full tender content at this version
  createdAt: Date;
}
```

### Rich Text Editing

Consider using:
- TipTap or Lexical for rich text editing
- Limit formatting to: bold, italic, lists, headings
- Ensure markdown compatibility for export
- Preserve AI-generated structure while allowing content edits

### Database Schema Extension

```prisma
model TenderPackage {
  // ... existing fields from Story 4.2
  currentVersion        Int      @default(1)
  revisions            TenderRevision[]
}

model TenderRevision {
  id                  String        @id @default(cuid())
  tenderPackageId     String
  tenderPackage       TenderPackage @relation(fields: [tenderPackageId], references: [id])
  versionNumber       Int
  changes             Json          // Array of change objects
  snapshot            Json          // Complete tender content
  createdAt           DateTime      @default(now())
  createdBy           String

  @@unique([tenderPackageId, versionNumber])
}
```

### Source Tree Components

Files to create/modify:
- `/src/app/(dashboard)/projects/[id]/tender/[tenderId]/page.tsx` (new - review page)
- `/src/components/tender/TenderReviewPage.tsx` (new)
- `/src/components/tender/EditableSection.tsx` (new)
- `/src/components/tender/TenderNavigationSidebar.tsx` (new)
- `/src/components/tender/TenderActionBar.tsx` (new)
- `/src/components/tender/PDFPreview.tsx` (new)
- `/src/stores/tenderEditStore.ts` (new)
- `/src/server/api/routers/tender.ts` (modify - add save/revision endpoints)
- `/prisma/schema.prisma` (modify)

### Project Structure Notes

- Tender review page follows Next.js App Router dynamic route pattern
- Editing state managed locally in Zustand with periodic server sync
- Revision history enables rollback and audit trail
- PDF preview prepares for finalization in Story 4.4

### Auto-Save Strategy

- Debounce edits: wait 30 seconds after last change before auto-saving
- Show "Saving..." indicator during save operation
- Display "All changes saved" confirmation with timestamp
- Handle conflicts if multiple sessions editing (unlikely in single-user MVP)

### Performance Considerations

- Load only current version for editing, lazy-load revision history
- Optimize rich text editor to handle large documents smoothly
- Implement virtual scrolling if tender packages become very long
- Cache PDF preview generation to avoid re-rendering on every edit

### Testing Standards

- Unit tests for EditableSection with various content types
- Test auto-save with simulated user typing patterns
- Verify revision history accurately captures all changes
- E2E test covering edit → save → preview → edit again workflow

### References

- [Source: docs/epics.md#Story 4.3] - Acceptance criteria and story definition
- [Source: docs/PRD.md#FR020] - Review and edit requirement
- [Source: docs/PRD.md#NFR008] - Audit trail requirement
- [Source: docs/architecture.md#Implementation Patterns] - Optimistic updates
- [Source: docs/PRD.md#User Journey 1 Step 5] - Finalize and release workflow

## Dev Agent Record

### Context Reference

- docs/stories/story-context-4.3.xml

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

### File List
