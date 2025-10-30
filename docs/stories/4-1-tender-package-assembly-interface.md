# Story 4.1: Tender Package Assembly Interface

Status: Ready

## Story

As a construction manager,
I want to select components for tender package assembly,
So that I can specify exactly what to include in a tender package.

## Acceptance Criteria

1. Interface for selecting Plan Card sections (checkbox selection)
2. Interface for selecting Consultant/Contractor Card sections
3. Interface for selecting document schedules from Documents Card
4. Selected items highlighted visually
5. "Generate Tender Package" button prominently displayed
6. Preview of selected components before generation

## Tasks / Subtasks

- [ ] Task 1: Create Tender Package Assembly UI component (AC: #1, #2, #3, #4, #5)
  - [ ] Subtask 1.1: Design and implement the Tender Pack section layout within Consultant/Contractor Cards (common configuration for all firms in the discipline/trade)
  - [ ] Subtask 1.2: Add checkbox selection interface for Plan Card sections (Details, Objectives, Staging, Risk, Stakeholders)
  - [ ] Subtask 1.3: Add checkbox selection interface for current Consultant/Contractor Card sections (Scope, Deliverables, Fee Structure, Release dates)
  - [ ] Subtask 1.4: Add document schedule retrieval from Consultant Card/Tender Documents section (retrieve saved document list, not multi-select from Documents Card)
  - [ ] Subtask 1.5: Implement visual highlighting for selected components
  - [ ] Subtask 1.6: Add firm selector dropdown to choose which firm(s) to generate tender for
  - [ ] Subtask 1.7: Add prominent "Generate Tender Package" button with AI icon per selected firm
- [ ] Task 2: Implement component preview functionality (AC: #6)
  - [ ] Subtask 2.1: Create preview panel showing selected sections summary
  - [ ] Subtask 2.2: Display document schedule list in preview
  - [ ] Subtask 2.3: Add ability to review and deselect items before generation
- [ ] Task 3: Add data persistence and state management (AC: #1, #2, #3)
  - [ ] Subtask 3.1: Store selection state in Zustand workspace store
  - [ ] Subtask 3.2: Persist selections to database for recovery
  - [ ] Subtask 3.3: Implement tRPC endpoints for loading/saving tender package configurations
- [ ] Task 4: Write tests for assembly interface (AC: All)
  - [ ] Subtask 4.1: Unit tests for selection state management
  - [ ] Subtask 4.2: Integration tests for checkbox interactions
  - [ ] Subtask 4.3: E2E test for complete assembly workflow

## Dev Notes

### Architecture Constraints

- Follow Multi-Card Workspace pattern from architecture.md for cross-card data selection
- Implement optimistic updates for selection state changes
- Leverage existing Card system components (CardPanel, Section) for consistent UI
- Retrieve document schedule from existing Tender Documents section (established in Epic 2)
- Configuration applies to entire discipline/trade, not per-firm
- Support single or multiple firm selection for batch generation

### Component Structure

Primary components to implement:
- `TenderPackSection.tsx` - Main container for tender pack assembly
- `ComponentSelector.tsx` - Reusable checkbox selector for cards/sections
- `DocumentScheduleDisplay.tsx` - Display component showing saved document list from Tender Documents section
- `FirmSelector.tsx` - Dropdown to select which firm(s) to generate tender for
- `TenderPackPreview.tsx` - Preview panel component
- `GenerateTenderButton.tsx` - Action button component (per firm)

### Workflow Pattern

**Configure Once, Generate Many:**
1. User configures tender package selection once per discipline/trade:
   - Select Plan Card sections
   - Select Consultant/Contractor Card sections
   - Document schedule automatically retrieved from Tender Documents section (established in Story 2.5/2.6)
2. Configuration is saved and applies to all firms in the discipline/trade
3. User selects individual firm(s) from dropdown
4. User clicks "Generate Tender Package" for selected firm(s)
5. Same configuration used for each firm, personalized per firm details

### Database Schema

Extend Prisma schema to support:
```prisma
model TenderPackageConfig {
  id                    String   @id @default(cuid())
  consultantCardId      String?  // FK to ConsultantCard (one of these)
  contractorCardId      String?  // FK to ContractorCard (one of these)
  selectedPlanSections  Json     // Array of Plan Card section IDs
  selectedCardSections  Json     // Array of Consultant/Contractor Card section IDs
  // Note: Document schedule retrieved from ConsultantCard/ContractorCard.tenderDocuments
  // No selectedDocuments field needed - already stored in Card
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@unique([consultantCardId])
  @@unique([contractorCardId])
}
```

**Key Design Note:** The document schedule is NOT stored in TenderPackageConfig. It is retrieved dynamically from the Consultant/Contractor Card's Tender Documents section, which was established in Epic 2 (Stories 2.5/2.6). This maintains a single source of truth for document selections.

### Source Tree Components

Files to create/modify:
- `/src/components/cards/sections/TenderPackSection.tsx` (new)
- `/src/components/tender/ComponentSelector.tsx` (new)
- `/src/components/tender/DocumentScheduleDisplay.tsx` (new - displays saved document list)
- `/src/components/tender/FirmSelector.tsx` (new - dropdown for firm selection)
- `/src/components/tender/TenderPackPreview.tsx` (new)
- `/src/stores/tenderStore.ts` (new)
- `/src/server/api/routers/tender.ts` (modify/create - add endpoint to retrieve tender documents)
- `/prisma/schema.prisma` (modify)

### Project Structure Notes

- Aligns with unified project structure: tender components under `/src/components/tender/`
- State management follows Zustand pattern established in Epic 1
- Database modifications follow three-tier Card → Section → Item hierarchy
- API layer uses tRPC routers as established in architecture.md
- **Configure once per discipline/trade:** TenderPackageConfig has unique constraint on consultantCardId/contractorCardId
- **Document schedule:** Retrieved from Tender Documents section (Epic 2), not re-selected in Tender Pack
- **Firm selection:** User selects firm(s) from dropdown to generate personalized packages
- **Reusability:** Same configuration applies to all firms, reducing repetitive work

### Testing Standards

- Unit tests: Vitest for component logic and state management
- Integration tests: Testing Library for user interactions
- E2E tests: Playwright for full tender assembly workflow
- Target coverage: >80% for tender selection logic

### References

- [Source: docs/epics.md#Story 4.1] - Acceptance criteria and story definition
- [Source: docs/PRD.md#Tender Package Generation FR016-FR020] - Functional requirements for tender generation
- [Source: docs/PRD.md#FR009-FR010] - Document selection established in Epic 2
- [Source: docs/epics.md#Story 2.5] - Document Selection for Tender Packages (saved list)
- [Source: docs/architecture.md#Multi-Card Workspace Pattern] - Cross-card data flow pattern
- [Source: docs/architecture.md#Component Structure] - Standard component organization
- [Source: docs/tech-spec-epic-3.md] - Consultant/Contractor Card structure context

### Key Workflow Clarifications (User Feedback)

1. **Document Schedule Source:** Documents are NOT re-selected in Tender Pack section. The document list is retrieved from the Consultant Card/Tender Documents section which was established in Stories 2.5/2.6.

2. **Configuration Scope:** The tender package configuration (which Plan sections, Card sections, and document schedule to include) is set once per Consultant/Contractor discipline/trade and applies to ALL firms within that discipline/trade.

3. **Firm Selection:** After configuring the tender package components once, user selects individual firm(s) from a dropdown to generate personalized tender packages. This "configure once, generate many" approach eliminates repetitive configuration work.

## Dev Agent Record

### Context Reference

- docs/stories/story-context-4.1.xml

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

### File List
