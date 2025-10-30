# Retrieve Staging Implementation

**Date:** 2025-10-30
**Feature:** Fee Structure Management - Retrieve Staging from Plan Card
**Status:** ✅ Complete

## Overview

Implemented the "Retrieve Staging" functionality that allows users to retrieve stage names from the Plan Card and automatically add them as top-level categories in the Fee Structure table.

## Implementation Details

### 1. Server Action: `retrieveStages`

**Location:** `src/app/actions/feeStructure.ts`

```typescript
export async function retrieveStages(
  planCardId: string
): Promise<ActionResult<string[]>>
```

**Functionality:**
- Accepts Plan Card ID as parameter
- Queries Prisma for PLAN card with 'stages' section
- Extracts stage names from section items
- Returns array of stage name strings
- Handles errors gracefully (NOT_FOUND, SECTION_NOT_FOUND, SERVER_ERROR)

### 2. Utility Functions

**Location:** `src/lib/feeStructureUtils.ts`

```typescript
export function transformStagesToCategories(
  stageNames: string[],
  startingOrder: number = 0
): FeeStructureItem[]
```

**Functionality:**
- Transforms stage name strings into FeeStructureItem category objects
- Assigns unique IDs with timestamp to avoid collisions
- Sets type as 'category'
- Handles order numbering starting from specified order

```typescript
export function appendCategoriesToFeeStructure(
  existingData: FeeStructureItem[],
  newCategories: FeeStructureItem[]
): FeeStructureItem[]
```

**Functionality:**
- Merges new categories with existing fee structure data
- Updates order numbers based on existing data length
- Returns combined array

### 3. Zustand Store

**Location:** `src/stores/feeStructureStore.ts`

```typescript
interface FeeStructureState {
  items: FeeStructureItem[];
  setItems: (items: FeeStructureItem[]) => void;
  appendCategories: (newCategories: FeeStructureItem[]) => void;
  reset: () => void;
}

export const useFeeStructureStore = create<FeeStructureState>(...)
```

**Features:**
- Global state management for fee structure items
- `setItems`: Replace all items
- `appendCategories`: Append new categories with automatic order management
- `reset`: Clear all items

### 4. Component Integration

**Location:** `src/components/cards/sections/FeeStructureSection.tsx`

**New Props:**
- `planCardId?: string` - Plan Card ID for retrieving stages

**New State:**
- `isRetrievingStaging: boolean` - Loading state for retrieve staging operation

**New Handler:**
```typescript
const handleRetrieveStaging = async () => {
  // 1. Validate planCardId exists
  // 2. Call retrieveStages server action
  // 3. Transform stage names to categories
  // 4. Append to Zustand store
  // 5. Update local rowData state
  // 6. Trigger auto-save
}
```

**New UI Button:**
```tsx
<button
  onClick={handleRetrieveStaging}
  disabled={isRetrievingStaging || !planCardId}
  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  title="Retrieve stages from Plan Card and add as categories"
>
  {isRetrievingStaging ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin" />
      Retrieving...
    </>
  ) : (
    <>
      <Download className="w-4 h-4" />
      Retrieve Staging
    </>
  )}
</button>
```

## Technical Specifications

### Data Flow

1. **User Action:** User clicks "Retrieve Staging" button
2. **Validation:** Component checks if planCardId exists
3. **Server Action Call:** `retrieveStages(planCardId)` fetches stage names from database
4. **Transformation:** `transformStagesToCategories(stageNames)` converts to FeeStructureItem format
5. **State Update:** Zustand store's `appendCategories()` adds to global state
6. **Local Sync:** Component updates local `rowData` state
7. **Persistence:** Auto-save triggers to persist to database

### Error Handling

- **Missing planCardId:** Button disabled, no action taken
- **Plan Card not found:** Graceful error logged to console
- **Stages section not found:** Graceful error logged to console
- **Server error:** Caught and logged

### State Management

- **Local State:** `rowData` for AG Grid rendering
- **Global State:** Zustand store for cross-component access
- **Sync:** Two-way sync between local and global state via useEffect

## Testing

### Zustand Store Tests

**Location:** `src/stores/__tests__/feeStructureStore.test.ts`

**Test Coverage:**
- ✅ Initialize with empty items
- ✅ Set items
- ✅ Append categories with updated order
- ✅ Reset to empty state

**Results:** 4/4 tests passing

### Integration Tests

**Location:** `src/app/actions/__tests__/feeStructure.test.ts`

**Test Coverage:**
- ✅ All existing fee structure operations
- ✅ Server actions (getFeeStructure, saveFeeStructure, retrieveFromCostPlanning)

**Results:** 10/10 tests passing

## Files Created/Modified

### Created
- ✅ `src/stores/feeStructureStore.ts` - Zustand store for fee structure state
- ✅ `src/lib/feeStructureUtils.ts` - Utility functions for data transformation
- ✅ `src/stores/__tests__/feeStructureStore.test.ts` - Store unit tests

### Modified
- ✅ `src/app/actions/feeStructure.ts` - Added retrieveStages server action
- ✅ `src/components/cards/sections/FeeStructureSection.tsx` - Integrated Zustand, added handler and button

## Architecture Decisions

### 1. Zustand for State Management

**Rationale:**
- Lightweight and performant
- Type-safe with TypeScript
- Simple API for global state
- No provider wrapper needed
- Supports middleware if needed later

### 2. Server Actions Pattern

**Rationale:**
- Follows Next.js 13+ best practices
- Built-in type safety
- Automatic client-server serialization
- Reduced boilerplate vs API routes

### 3. Utility Functions for Transformation

**Rationale:**
- Separation of concerns
- Reusable across components
- Easy to test in isolation
- Clear single responsibility

### 4. Auto-save on Append

**Rationale:**
- Consistent with existing fee structure behavior
- Prevents data loss
- Better user experience (no manual save needed)

## User Experience

### Visual Design
- **Button Color:** Blue theme (distinct from purple "Retrieve from Cost Planning")
- **Icon:** Download icon for consistency with related actions
- **Loading State:** Spinner and "Retrieving..." text during operation
- **Disabled State:** Grayed out when planCardId not provided

### Interaction Flow
1. User views Fee Structure section
2. Clicks "Retrieve Staging" button
3. Loading spinner appears
4. Stage categories append to table
5. Auto-save persists changes
6. User can immediately edit new categories

### Error Scenarios
- **No Plan Card ID:** Button disabled, tooltip explains why
- **Plan Card not found:** Silent failure, allows manual creation
- **Network error:** Error logged, user can retry

## Future Enhancements

### Potential Improvements
1. **Success Toast:** Show confirmation message when stages retrieved
2. **Duplicate Detection:** Warn if stage names already exist in fee structure
3. **Batch Operations:** Allow retrieving from multiple Plan Cards
4. **Undo/Redo:** Support undoing the retrieve staging action
5. **Preview:** Show preview of stages before appending

### Technical Debt
- None identified - implementation follows established patterns

## Related Documentation

- Story 3.5: Fee Structure Management (`docs/stories/3-5-fee-structure-management.md`)
- Tech Spec Epic 3 (`docs/tech-spec-epic-3.md`)
- PRD (`docs/PRD.md`)

## Conclusion

The "Retrieve Staging" feature is fully implemented and tested. It follows the established architecture patterns, uses Server Actions for data fetching, Zustand for state management, and provides a clean user experience consistent with the rest of the Fee Structure interface.

All acceptance criteria met:
- ✅ Server Action defined (retrieveStages)
- ✅ Utility function created (transformStagesToCategories)
- ✅ Handler implemented in component (handleRetrieveStaging)
- ✅ Zustand store integrated
- ✅ UI button added with proper states
- ✅ Tests passing (4/4 store tests, 10/10 integration tests)
