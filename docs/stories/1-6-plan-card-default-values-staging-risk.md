# Story 1.6: Plan Card Default Values - Staging & Risk

Status: Draft

## Story

As a user,
I want default staging phases and risk items,
so that I can track project phases and risks with the ability to add, edit, delete, and reorder items.

## Acceptance Criteria

1. **AC-6.1**: Staging section has 5 default stages: Stage 1 Initiation, Stage 2 Scheme Design, Stage 3 Detail Design, Stage 4 Procurement, Stage 5 Delivery
2. **AC-6.2**: Risk section has 3 default risk placeholder items (Risk 1, Risk 2, Risk 3)
3. **AC-6.3**: Users can add new stage and risk items with "Add" button
4. **AC-6.4**: Users can delete stage and risk items with confirmation
5. **AC-6.5**: Users can edit item text inline
6. **AC-6.6**: Items can be reordered via drag-and-drop
7. **AC-6.7**: Changes persist to database immediately
8. **AC-6.8**: Visual feedback during drag operations

## Tasks / Subtasks

- [ ] Task 1: Create default staging items (AC: 6.1)
  - [ ] Add 5 stage items to Staging section
  - [ ] Set proper order values (1-5)
  - [ ] Include stage descriptions
  - [ ] Add date fields for each stage
  - [ ] Create StageItem component

- [ ] Task 2: Create default risk items (AC: 6.2)
  - [ ] Add 3 risk placeholder items
  - [ ] Include fields: description, likelihood, impact
  - [ ] Create RiskItem component
  - [ ] Add risk severity calculation

- [ ] Task 3: Implement Add functionality (AC: 6.3)
  - [ ] Add "Add Stage" button to Staging section
  - [ ] Add "Add Risk" button to Risk section
  - [ ] Create modal or inline form for new items
  - [ ] Auto-increment order value
  - [ ] Save new item to database

- [ ] Task 4: Implement Delete functionality (AC: 6.4)
  - [ ] Add delete icon to each item
  - [ ] Show confirmation dialog
  - [ ] Soft delete from database
  - [ ] Re-order remaining items
  - [ ] Animate item removal

- [ ] Task 5: Enable inline editing (AC: 6.5)
  - [ ] Reuse TextField component from Story 1.5
  - [ ] Add edit mode toggle
  - [ ] Auto-save on blur
  - [ ] Escape to cancel editing

- [ ] Task 6: Implement drag-and-drop reordering (AC: 6.6, 6.8)
  - [ ] Install and configure @dnd-kit/sortable
  - [ ] Create DraggableItem wrapper
  - [ ] Add drag handles to items
  - [ ] Show drop indicators
  - [ ] Update order values on drop

- [ ] Task 7: Database operations (AC: 6.7)
  - [ ] Create addItem Server Action
  - [ ] Create deleteItem Server Action
  - [ ] Create reorderItems Server Action
  - [ ] Implement transaction for reordering
  - [ ] Add optimistic updates

- [ ] Task 8: Polish and feedback (AC: 6.8)
  - [ ] Add hover states to draggable items
  - [ ] Show grabbing cursor on drag
  - [ ] Animate reordering smoothly
  - [ ] Add loading states for operations
  - [ ] Toast notifications for actions

## Dev Notes

### Default Staging Data
```typescript
const defaultStages = [
  { name: 'Stage 1 Initiation', description: 'Project setup and planning', startDate: null, endDate: null },
  { name: 'Stage 2 Scheme Design', description: 'Initial design concepts', startDate: null, endDate: null },
  { name: 'Stage 3 Detail Design', description: 'Detailed design development', startDate: null, endDate: null },
  { name: 'Stage 4 Procurement', description: 'Tender and contractor selection', startDate: null, endDate: null },
  { name: 'Stage 5 Delivery', description: 'Construction and handover', startDate: null, endDate: null }
]
```

### Risk Item Structure
```typescript
interface RiskItem {
  description: string
  likelihood: 'Low' | 'Medium' | 'High'
  impact: 'Low' | 'Medium' | 'High'
  mitigation: string
  owner: string
  severity: number // Calculated from likelihood × impact
}
```

### Drag-and-Drop Setup
```typescript
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Wrap items in SortableContext
// Each item uses useSortable hook
// Handle onDragEnd to reorder
```

### Reordering Logic
```typescript
async function reorderItems(sectionId: string, itemIds: string[]) {
  // Use transaction to update all orders atomically
  await prisma.$transaction(
    itemIds.map((id, index) =>
      prisma.item.update({
        where: { id },
        data: { order: index + 1 }
      })
    )
  )
}
```

### Add/Delete Flow
1. **Add**: Insert at end, increment max order + 1
2. **Delete**: Soft delete, then recompact orders
3. **Reorder**: Update all affected items in transaction

### Visual Feedback
- Drag preview with opacity
- Drop zone highlighting
- Smooth animations (spring physics)
- Loading spinners on actions
- Success checkmarks

### Testing Approach
- Test drag-and-drop interactions
- Verify order persistence
- Test add/delete operations
- Check optimistic updates
- Verify transaction atomicity

### References

- [Source: docs/epics.md#Story 1.6] - Original requirements
- [Source: docs/PRD.md#FR001] - Staging and Risk sections
- [Source: docs/architecture.md#Drag-and-Drop Implementation] - dnd-kit choice
- [Source: docs/tech-spec-epic-1.md#AC-6.1 to AC-6.2] - Default values

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- Will be filled by implementing agent -->

### Debug Log References

### Completion Notes List

### File List