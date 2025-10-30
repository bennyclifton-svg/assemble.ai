# Story 1.5: Plan Card Default Values - Details & Objectives

Status: Draft

## Story

As a user,
I want default fields in Details and Objectives sections,
so that I have a consistent structure for capturing essential project data with inline editing capabilities.

## Acceptance Criteria

1. **AC-5.1**: Details section has 8 default fields: Project Name, Address, Legal Address, Zoning, Jurisdiction, Lot Area, Number of Stories, Building Class
2. **AC-5.2**: Objectives section has 4 fields: Functional, Quality, Budget, Program
3. **AC-5.3**: All fields are editable inline with click-to-edit interaction
4. **AC-5.4**: Changes save automatically to database with optimistic updates
5. **AC-5.5**: Tab navigation between fields works smoothly
6. **AC-5.6**: Visual feedback during save (loading spinner, success indicator)
7. **AC-5.7**: Validation for required fields with error messages
8. **AC-5.8**: Undo capability for recent edits (Ctrl+Z)

## Tasks / Subtasks

- [ ] Task 1: Create field components (AC: 5.1, 5.2)
  - [ ] Create src/components/cards/fields/TextField.tsx
  - [ ] Create src/components/cards/fields/TextAreaField.tsx
  - [ ] Create src/components/cards/fields/NumberField.tsx
  - [ ] Implement click-to-edit behavior
  - [ ] Add focus management and blur handlers

- [ ] Task 2: Build Details section items (AC: 5.1)
  - [ ] Create 8 Item records for Details section
  - [ ] Set proper order for each item
  - [ ] Define field types (text, number, etc.)
  - [ ] Add placeholder text for each field
  - [ ] Configure field validation rules

- [ ] Task 3: Build Objectives section items (AC: 5.2)
  - [ ] Create 4 Item records for Objectives section
  - [ ] Use TextAreaField for longer content
  - [ ] Set proper order and labels
  - [ ] Add helper text for each objective type

- [ ] Task 4: Implement auto-save with Server Actions (AC: 5.4, 5.6)
  - [ ] Create updateItem Server Action
  - [ ] Implement debounced auto-save (500ms delay)
  - [ ] Add optimistic updates via Zustand
  - [ ] Show loading state during save
  - [ ] Display success checkmark on completion

- [ ] Task 5: Add keyboard navigation (AC: 5.5)
  - [ ] Implement Tab to move to next field
  - [ ] Shift+Tab for previous field
  - [ ] Enter to submit and move to next
  - [ ] Escape to cancel editing
  - [ ] Maintain focus ring visibility

- [ ] Task 6: Field validation (AC: 5.7)
  - [ ] Add Zod schemas for each field type
  - [ ] Validate on blur and before save
  - [ ] Display inline error messages
  - [ ] Prevent save if validation fails
  - [ ] Mark required fields with asterisk

- [ ] Task 7: Implement undo functionality (AC: 5.8)
  - [ ] Store edit history in Zustand (last 10 edits)
  - [ ] Listen for Ctrl+Z keyboard shortcut
  - [ ] Revert to previous value
  - [ ] Update database with reverted value
  - [ ] Show "Undo" toast notification

- [ ] Task 8: Database seed data (AC: 5.1, 5.2)
  - [ ] Create seed script for default fields
  - [ ] Add to prisma/seed.ts
  - [ ] Include sample data for testing
  - [ ] Document field specifications

## Dev Notes

### Field Configuration
```typescript
const detailsFields = [
  { key: 'projectName', label: 'Project Name', type: 'text', required: true },
  { key: 'address', label: 'Address', type: 'text', required: true },
  { key: 'legalAddress', label: 'Legal Address', type: 'text', required: false },
  { key: 'zoning', label: 'Zoning', type: 'text', required: false },
  { key: 'jurisdiction', label: 'Jurisdiction', type: 'text', required: false },
  { key: 'lotArea', label: 'Lot Area', type: 'number', required: false, unit: 'm²' },
  { key: 'numberOfStories', label: 'Number of Stories', type: 'number', required: false },
  { key: 'buildingClass', label: 'Building Class', type: 'text', required: false }
]

const objectivesFields = [
  { key: 'functional', label: 'Functional', type: 'textarea', placeholder: 'Define functional objectives...' },
  { key: 'quality', label: 'Quality', type: 'textarea', placeholder: 'Define quality objectives...' },
  { key: 'budget', label: 'Budget', type: 'textarea', placeholder: 'Define budget objectives...' },
  { key: 'program', label: 'Program', type: 'textarea', placeholder: 'Define program objectives...' }
]
```

### Item Data Structure
```typescript
// Item.data JSON structure for fields
{
  label: string
  value: string | number
  type: 'text' | 'textarea' | 'number'
  required?: boolean
  placeholder?: string
  unit?: string
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}
```

### Auto-save Implementation
```typescript
const debouncedSave = useMemo(
  () => debounce(async (itemId: string, data: any) => {
    // Optimistic update
    updateItemOptimistic(itemId, data)

    // Server call
    const result = await updateItemAction(itemId, data)

    if (!result.success) {
      // Rollback on failure
      rollbackItem(itemId)
      toast.error(result.error.message)
    }
  }, 500),
  []
)
```

### Tab Order Management
- Use tabIndex incrementally
- Focus trap within section
- Skip disabled/readonly fields
- Announce field labels for accessibility

### Testing Approach
- Unit tests for field components
- Test auto-save debouncing
- Verify validation messages
- Test keyboard navigation flow
- Check undo/redo functionality

### References

- [Source: docs/epics.md#Story 1.5] - Original requirements
- [Source: docs/PRD.md#FR001] - Plan Card default values specification
- [Source: docs/tech-spec-epic-1.md#AC-5.1 to AC-5.2] - Field requirements
- [Source: docs/architecture.md#Error Handling] - Validation approach

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- Will be filled by implementing agent -->

### Debug Log References

### Completion Notes List

### File List