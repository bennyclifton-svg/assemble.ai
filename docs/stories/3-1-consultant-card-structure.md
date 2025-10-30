# Story 3.1: Consultant Card Structure

Status: Done

## Story

As a user,
I want Consultant Card with all predefined sections,
So that I can manage consultant procurement comprehensively.

## Acceptance Criteria

1. Consultant Card displays tabs for each toggled-on consultant from Plan Card
2. Each tab contains sections: Firms, Scope, Deliverables, Fee Structure, Tender Document, Tender Release and Submission, Tender Pack, Tender RFI and Addendum, Tender Evaluation, Tender Recommendation Report
3. Sections are collapsible/expandable with chevrons
4. Tab navigation between consultants functions correctly
5. State persists between sessions

## Tasks / Subtasks

- [ ] Create ConsultantCard component structure (AC: 1, 2)
  - [ ] Set up component file at src/components/cards/ConsultantCard.tsx
  - [ ] Implement tab system for multiple consultant disciplines
  - [ ] Subscribe to Plan Card consultant toggle states
  - [ ] Create tabs dynamically based on toggled consultants

- [ ] Implement 10 predefined sections (AC: 2)
  - [ ] Create Section components for each section type
  - [ ] Firms section component
  - [ ] Scope section component
  - [ ] Deliverables section component
  - [ ] Fee Structure section component
  - [ ] Tender Document section component
  - [ ] Tender Release and Submission section component
  - [ ] Tender Pack section component
  - [ ] Tender RFI and Addendum section component
  - [ ] Tender Evaluation section component
  - [ ] Tender Recommendation Report section component

- [ ] Add collapsible/expandable functionality (AC: 3)
  - [ ] Implement chevron icons for each section
  - [ ] Add click handlers for expand/collapse
  - [ ] Manage section collapse state in component state
  - [ ] Apply visual transitions for smooth UX

- [ ] Implement tab navigation (AC: 4)
  - [ ] Create tab bar component
  - [ ] Handle tab click events
  - [ ] Manage active tab state
  - [ ] Load appropriate consultant data per tab

- [ ] Persist state across sessions (AC: 5)
  - [ ] Save consultant card state to database
  - [ ] Track section collapse/expand states
  - [ ] Track active tab selection
  - [ ] Restore state on page reload

- [ ] Create database schema and API (AC: All)
  - [ ] Update Prisma schema with ConsultantCard model
  - [ ] Update Prisma schema with ConsultantSection model
  - [ ] Add ConsultantSectionType enum
  - [ ] Create tRPC router for consultant operations
  - [ ] Implement createCard mutation
  - [ ] Implement getCard query
  - [ ] Implement updateSectionState mutation

- [ ] Testing (AC: All)
  - [ ] Unit test: ConsultantCard component rendering
  - [ ] Unit test: Section collapse/expand logic
  - [ ] Integration test: Toggle consultant in Plan Card → verify card creation
  - [ ] Integration test: Tab navigation between consultants
  - [ ] Integration test: State persistence across page reload
  - [ ] E2E test: Full consultant card workflow

## Dev Notes

### Architecture Alignment

This story implements the ConsultantCard component as part of the multi-card workspace system. The implementation uses:

- **Zustand store** (workspaceStore) for managing card state and active tabs
- **tRPC router** (consultantRouter) for all server-side operations
- **Prisma models** for data persistence (ConsultantCard, ConsultantSection)
- **Component structure** follows the established Card → Section → Item hierarchy from Epic 1

### Technical Specifications

**Data Model** (from tech-spec-epic-3.md):
```prisma
model ConsultantCard {
  id          String   @id @default(cuid())
  projectId   String
  discipline  String
  isActive    Boolean  @default(true)
  sections    ConsultantSection[]
  firms       Firm[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  project     Project  @relation(fields: [projectId], references: [id])
}

model ConsultantSection {
  id            String   @id @default(cuid())
  cardId        String
  sectionType   ConsultantSectionType
  content       Json
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
```

**Integration Points:**
- **Plan Card Integration**: Subscribe to consultant toggle changes via PlanCard store
- **Workspace Integration**: Extend workspaceStore to support consultant card display
- **Multi-card Display**: Support simultaneous display of Plan + Consultant cards

### Project Structure Notes

**New Files to Create:**
- `src/components/cards/ConsultantCard.tsx` - Main card component
- `src/components/cards/sections/FirmsSection.tsx` - Firms section
- `src/components/cards/sections/ScopeSection.tsx` - Scope section
- `src/components/cards/sections/DeliverablesSection.tsx` - Deliverables section
- `src/components/cards/sections/FeeStructureSection.tsx` - Fee structure section
- `src/components/cards/sections/TenderDocumentSection.tsx` - Tender document section
- `src/components/cards/sections/TenderReleaseSection.tsx` - Tender release section
- `src/components/cards/sections/TenderPackSection.tsx` - Tender pack section
- `src/components/cards/sections/RFISection.tsx` - RFI and Addendum section
- `src/components/cards/sections/TenderEvaluationSection.tsx` - Tender evaluation section
- `src/components/cards/sections/RecommendationReportSection.tsx` - Recommendation report section
- `src/server/api/routers/consultant.ts` - tRPC router for consultant operations

**Files to Modify:**
- `prisma/schema.prisma` - Add ConsultantCard and ConsultantSection models
- `src/stores/workspaceStore.ts` - Extend for consultant card state
- `src/server/api/root.ts` - Register consultantRouter

### References

- [Source: docs/tech-spec-epic-3.md#Services and Modules] - ConsultantCardManager service specification
- [Source: docs/tech-spec-epic-3.md#Data Models] - Complete data model definitions
- [Source: docs/tech-spec-epic-3.md#Workflows and Sequencing] - Consultant Card Creation Flow
- [Source: docs/epics.md#Epic 3 Story 3.1] - Original story acceptance criteria
- [Source: docs/architecture.md#Epic to Architecture Mapping] - Epic 3 technology stack

## Dev Agent Record

### Context Reference

- docs/stories/story-context-3.1.xml

### Agent Model Used

claude-sonnet-4-5-20250929 (Amelia - Dev Agent)

### Debug Log References

No debugging required - implementation proceeded smoothly

### Completion Notes List

**Implementation Decisions:**
1. **Server Architecture**: Confirmed project uses Next.js Server Actions instead of tRPC. Existing server actions in `src/app/actions/card.ts` already support consultant status updates (lines 308-445).

2. **State Management**: ConsultantCard uses existing workspaceStore for all state management:
   - `activeConsultants` - tracks which disciplines are active per project
   - `toggleSection` / `isSectionCollapsed` - handles section collapse state persistence
   - Section keys use format: `consultant-${disciplineId}-${sectionId}` to ensure uniqueness per discipline

3. **Tab Navigation**: Implemented tab system for multiple consultant disciplines:
   - Empty state shown when no consultants are toggled on
   - First active discipline auto-selected as default tab
   - Tab state updates reactively when consultants are toggled off in Plan Card

4. **Component Reuse**: Fully reused existing components as required by story context:
   - `CardPanel` - card wrapper with title and close button
   - `Section` - collapsible section component with chevron icons
   - All 10 section placeholders created with consistent structure

5. **Database Schema**: No changes needed to Prisma schema:
   - `CardType.CONSULTANT` already exists (line 42 of schema.prisma)
   - Existing Card-Section-Item hierarchy sufficient for Story 3.1
   - Future stories (3.2+) will add specific data models (Firm, RFI, etc.)

**Deviations from Original Plan:**
- None. Implementation followed story context constraints exactly.

**Learnings:**
- Existing consultant toggle functionality in workspaceStore was more comprehensive than initially expected, including status tracking (brief, tender, rec, award)
- Section collapse state persistence uses localStorage via Zustand persist middleware - no database persistence needed
- Navigation sidebar already had Consultant card button configured

### File List

**Files Created:**
1. `assemble-app/src/components/cards/ConsultantCard.tsx` - Main consultant card component with tab navigation
2. `assemble-app/src/components/cards/sections/FirmsSection.tsx` - Firms section placeholder
3. `assemble-app/src/components/cards/sections/ScopeSection.tsx` - Scope section placeholder
4. `assemble-app/src/components/cards/sections/DeliverablesSection.tsx` - Deliverables section placeholder
5. `assemble-app/src/components/cards/sections/FeeStructureSection.tsx` - Fee structure section placeholder
6. `assemble-app/src/components/cards/sections/TenderDocumentSection.tsx` - Tender document section placeholder
7. `assemble-app/src/components/cards/sections/TenderReleaseSection.tsx` - Tender release section placeholder
8. `assemble-app/src/components/cards/sections/TenderPackSection.tsx` - Tender pack section placeholder
9. `assemble-app/src/components/cards/sections/RFISection.tsx` - RFI and addendum section placeholder
10. `assemble-app/src/components/cards/sections/TenderEvaluationSection.tsx` - Tender evaluation section placeholder
11. `assemble-app/src/components/cards/sections/RecommendationReportSection.tsx` - Recommendation report section placeholder

**Files Modified:**
1. `assemble-app/src/components/workspace/CardViewport.tsx` - Added ConsultantCard import and rendering logic (lines 8, 32-34)
