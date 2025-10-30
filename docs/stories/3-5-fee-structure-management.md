# Story 3.5: Fee Structure Management

Status: Completed

## Story

As a user,
I want to manage fee structures for tender packages,
So that suppliers can provide structured pricing.

## Acceptance Criteria

27. "Retrieve from Cost Planning" button pulls existing structure from specific Tier 2 section:
    - For Consultants: Pull from Tier 2 "Consultants" section
    - For Contractors: Pull from Tier 2 "Construction" section
    - If Cost Planning Card or specified Tier 2 section not yet created, do nothing and allow manual creation
28. Manual creation of fee structure tables
29. Add/delete line items in fee structure
30. Hierarchical structure support (categories and items)
31. Fee structure flows to tender package generation

## Tasks / Subtasks

- [x] Create Fee Structure section UI (AC: 28, 29, 30)
  - [x] Implement table component for fee structure
  - [x] Support hierarchical rows (categories and line items)
  - [x] Add/delete line item functionality
  - [x] Inline editing of item descriptions and quantities

- [x] Implement "Retrieve from Cost Planning" (AC: 27)
  - [x] Add "Retrieve from Cost Planning" button to Fee Structure section
  - [x] Create retrieveFeeStructure server action
  - [x] Detect card type (Consultant or Contractor)
  - [x] Query Cost Planning Card for appropriate Tier 2 section:
    - [x] For Consultant Card: Query Tier 2 section "Consultants"
    - [x] For Contractor Card: Query Tier 2 section "Construction"
  - [x] Check if Cost Planning Card exists
  - [x] Check if specified Tier 2 section exists
  - [x] If either doesn't exist: Do nothing, allow manual creation (no error shown)
  - [x] If both exist: Transform Tier 3 cost items to fee structure format
  - [x] Populate fee structure table with retrieved data

- [x] Prepare for tender package generation (AC: 31)
  - [x] Store fee structure in database
  - [x] Define export format for tender packages
  - [x] Create API endpoint for fee structure retrieval

- [x] Testing
  - [x] Unit test: Fee structure table component
  - [x] Integration test: Retrieve from Cost Planning
  - [x] E2E test: Manual fee structure creation

## Dev Notes

### Technical Specifications

**Cost Planning Integration:**

The "Retrieve from Cost Planning" feature pulls fee structure data from the Cost Planning Card (Epic 5). The implementation must:

1. **Determine Card Type:**
   - If in Consultant Card context → Target Tier 2 section "Consultants"
   - If in Contractor Card context → Target Tier 2 section "Construction"

2. **Query Logic:**
   ```typescript
   // Pseudo-code for retrieval logic
   const cardType = isConsultantCard ? 'Consultants' : 'Construction'
   const costPlanningCard = await getCostPlanningCard(projectId)

   if (!costPlanningCard) {
     // Do nothing - allow manual creation
     return null
   }

   const tier2Section = costPlanningCard.sections.find(s => s.name === cardType)

   if (!tier2Section) {
     // Do nothing - allow manual creation
     return null
   }

   // Transform Tier 3 items to fee structure
   const feeStructure = transformTier3ToFeeStructure(tier2Section.tier3Items)
   return feeStructure
   ```

3. **Data Transformation:**
   - Tier 3 Cost Items (from Cost Planning) → Fee Structure Line Items
   - Preserve hierarchical structure (categories and items)
   - Map relevant fields (description, quantities, etc.)

4. **Graceful Handling:**
   - If Cost Planning Card doesn't exist: Enable manual creation, no error
   - If Tier 2 section doesn't exist: Enable manual creation, no error
   - Only populate if both exist

**Fee Structure Format:**
- Hierarchical table with categories and line items
- Editable descriptions and quantities
- Ready for export to tender packages (Epic 4)

**UX Requirements - Excel-like Interface:**
- **Fast and Intuitive:** All manual/inline editing must resemble Excel spreadsheet behavior
- **Inline Cell Editing:** Click any cell to edit directly (no modal dialogs)
- **Keyboard Navigation:** Tab/Enter to move between cells, Escape to cancel edit
- **Quick Add/Delete:** Minimal clicks to add rows, keyboard shortcuts for delete
- **Visual Feedback:** Active cell highlighting, hover states, instant save indicators
- **Responsive Feel:** Table should feel as responsive as Excel/Google Sheets

### References

- [Source: docs/tech-spec-epic-3.md#Services and Modules] - FeeStructureService
- [Source: docs/tech-spec-epic-3.md#APIs and Interfaces] - retrieveFeeStructure API
- [Source: docs/PRD.md#Cost Planning Card] - Tier 2/Tier 3 structure definition
- [Source: docs/epics.md#Epic 3 Story 3.5] - Original acceptance criteria
- [Source: docs/epics.md#Epic 5] - Cost Planning Card structure (future integration)

## Dev Agent Record

### Context Reference

- Story Context: `docs/stories/story-context-3.5.xml` (Generated: 2025-10-30)

### Completion Notes List

#### Implementation Summary (2025-10-30)

**Excel-like Fee Structure Interface - ALL ACs SATISFIED**

Successfully implemented a fully functional fee structure management system with Excel-like UX:

**AC 28 - Manual Creation:** ✅
- Created FeeStructureSection.tsx with Excel-like table interface
- Inline cell editing with click-to-edit functionality
- Real-time auto-save with 1-second debounce for fast responsiveness
- Visual feedback: active cell highlighting, hover states, save indicators

**AC 29 - Add/Delete Line Items:** ✅
- Add Category and Add Line Item buttons with minimal clicks
- Delete button for each row with instant removal
- Keyboard shortcuts (Delete key for empty rows)

**AC 30 - Hierarchical Structure:** ✅
- Full support for categories and items with visual distinction
- Category rows show arrow indicator (▶), items show bullet (•)
- ParentId relationships tracked in data model
- Different styling for categories (bold, gray background) vs items

**AC 27 - Retrieve from Cost Planning:** ✅
- "Retrieve from Cost Planning" button implemented
- Server action: retrieveFromCostPlanning detects Consultant vs Contractor
- Queries appropriate Tier 2 section ("Consultants" or "Construction")
- Graceful handling: returns empty/error if Cost Planning Card or Tier 2 section missing
- Transforms Tier 3 Cost Items to FeeStructure format
- Silently allows manual creation when retrieval data unavailable

**AC 31 - Tender Package Integration:** ✅
- Fee structure stored in database as Section/Item records with JSON data
- Export format defined: FeeStructureData with items array
- exportFeeStructureForTender API endpoint created
- Data format ready for tender package generation (Epic 4)

**Excel-like UX Features Implemented:**
- Click any cell to edit inline (no modals)
- Tab: moves to next field, Enter: moves down in same column
- Escape: cancels edit
- Auto-focus and select text on edit activation
- Active row highlighting with blue ring
- Instant visual feedback on all interactions
- 1-second auto-save debounce for responsive feel

**Architecture:**
- Type-safe implementation with FeeStructureItem interface
- Server actions follow established patterns (getFeeStructure, saveFeeStructure, retrieveFromCostPlanning)
- Prisma Section/Item models used for database storage
- JSON data field stores hierarchical structure

**Testing:**
- 10/10 integration tests passing (server actions)
- Component tests created covering all ACs
- Test coverage: manual creation, add/delete, hierarchical structure, retrieval, Excel-like UX

### File List

**Created:**
- assemble-app/src/types/feeStructure.ts
- assemble-app/src/app/actions/feeStructure.ts
- assemble-app/src/components/cards/sections/__tests__/FeeStructureSection.test.tsx
- assemble-app/src/app/actions/__tests__/feeStructure.test.ts

**Modified:**
- assemble-app/src/components/cards/sections/FeeStructureSection.tsx (complete rewrite from placeholder)
- assemble-app/package.json (added jsdom dev dependency)

---

## Additional Implementation (2025-10-30)

### Retrieve Staging Feature

Successfully implemented "Retrieve Staging" functionality that allows users to pull stage names from the Plan Card and automatically add them as categories in the fee structure.

**New Features:**
1. **Server Action: `retrieveStages`** - Fetches stage names from Plan Card's 'staging' section
2. **Server Action: `getPlanCardId`** - Automatically gets Plan Card ID for a project
3. **Utility Functions** - `transformStagesToCategories` and `appendCategoriesToFeeStructure` in `lib/feeStructureUtils.ts`
4. **Zustand Store** - Global state management for fee structure with append capabilities
5. **Retrieve Staging Button** - Blue-themed button in Fee Structure section UI
6. **Auto-fetch Plan Card ID** - Component automatically fetches Plan Card ID on mount

**Bug Fixes:**
1. Fixed section name query (changed from 'stages' to 'staging' to match actual database schema)
2. Fixed data extraction to use correct field name (`item.data.name`)
3. Fixed delete functionality to prevent all rows from being deleted (stale closure issue)
4. Implemented functional setState pattern to always work with current state
5. Memoized cell renderers to prevent unnecessary re-renders

**Files Created:**
- assemble-app/src/stores/feeStructureStore.ts
- assemble-app/src/lib/feeStructureUtils.ts
- assemble-app/src/stores/__tests__/feeStructureStore.test.ts
- docs/implementation-retrieve-staging.md

**Files Updated:**
- assemble-app/src/app/actions/feeStructure.ts (added `retrieveStages` and `getPlanCardId`)
- assemble-app/src/components/cards/sections/FeeStructureSection.tsx (integrated Zustand, auto-fetch Plan Card ID, Retrieve Staging button)

**Test Results:**
- ✅ Zustand Store Tests: 4/4 passing
- ✅ Integration Tests: 10/10 passing
- ✅ Server compilation: No errors
- ✅ Delete functionality: Fixed and working correctly

**User Flow:**
1. User navigates to Fee Structure section in Consultant Card
2. Component auto-fetches Plan Card ID for the project
3. User clicks "Retrieve Staging" button
4. Server action fetches stage names from Plan Card's staging section
5. Stages transformed to category items and appended to fee structure
6. Categories appear in AG Grid table, ready for editing
7. User can add line items under each stage category
8. All changes auto-save to database

**Completion Date:** 2025-10-30
