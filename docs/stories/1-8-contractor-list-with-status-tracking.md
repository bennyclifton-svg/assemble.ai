# Story 1.8: Contractor List with Status Tracking

Status: Draft

## Story

As a user,
I want a comprehensive contractor list with status tracking,
so that I can manage all contractor trades and track their procurement status throughout the project lifecycle.

## Acceptance Criteria

1. **AC-8.1**: Display all 20 default contractor trades in a scrollable list
2. **AC-8.2**: Toggle on/off for each trade to indicate if needed for project
3. **AC-8.3**: 4 status icons per trade: Brief, Tender, Rec (Recommendation), Award (all default to off/ghosted)
4. **AC-8.4**: When contractor toggled on, creates corresponding tab in Contractor Card
5. **AC-8.5**: When contractor toggled off, removes tab from Contractor Card (with confirmation)
6. **AC-8.6**: Status changes persist to database immediately
7. **AC-8.7**: Visual indication of current status (icons change color when activated)
8. **AC-8.8**: Reuse components and logic from consultant list for consistency

## Tasks / Subtasks

- [ ] Task 1: Create contractor list data structure (AC: 8.1)
  - [ ] Define all 20 contractor trades in constants
  - [ ] Create ContractorTrade type
  - [ ] Add to database seed script
  - [ ] Group trades by work phase

- [ ] Task 2: Build ContractorList component (AC: 8.1, 8.2, 8.8)
  - [ ] Create src/components/cards/ContractorList.tsx
  - [ ] Reuse ConsultantList layout and patterns
  - [ ] Implement scrollable container
  - [ ] Create ContractorRow component
  - [ ] Add toggle switch for each trade

- [ ] Task 3: Implement status icons (AC: 8.3, 8.7, 8.8)
  - [ ] Reuse StatusIcon component from Story 1.7
  - [ ] Apply same 4 status types: Brief, Tender, Rec, Award
  - [ ] Use consistent color scheme
  - [ ] Add tooltips for status meanings

- [ ] Task 4: Connect to Contractor Card tabs (AC: 8.4, 8.5)
  - [ ] Create contractor tab mapping in Zustand
  - [ ] When toggled on, add to activeContractors array
  - [ ] When toggled off, show confirmation dialog
  - [ ] Update Contractor Card to show active tabs
  - [ ] Preserve data when toggling off

- [ ] Task 5: Database persistence (AC: 8.6, 8.8)
  - [ ] Create ContractorStatus model (parallel to ConsultantStatus)
  - [ ] Store: tradeId, projectId, isActive, statuses
  - [ ] Create updateContractorStatus Server Action
  - [ ] Implement optimistic updates
  - [ ] Share persistence logic where possible

- [ ] Task 6: Bulk operations
  - [ ] Add "Select All" checkbox
  - [ ] Add preset groups (e.g., "Structure", "Finishes", "Services")
  - [ ] Implement Shift+click for range selection
  - [ ] Show selection count

- [ ] Task 7: Visual consistency (AC: 8.8)
  - [ ] Match styling with ConsultantList
  - [ ] Use same animations and transitions
  - [ ] Consistent loading states
  - [ ] Same success/error feedback patterns

- [ ] Task 8: Testing and documentation
  - [ ] Test all toggle and status operations
  - [ ] Verify database persistence
  - [ ] Document shared components
  - [ ] Add Storybook stories if applicable

## Dev Notes

### Contractor Trades List
```typescript
const contractorTrades = [
  // Structure
  { id: 'concrete-finisher', name: 'Concrete Finisher', category: 'Structure' },
  { id: 'steel-fixer', name: 'Steel Fixer', category: 'Structure' },
  { id: 'scaffolder', name: 'Scaffolder', category: 'Structure' },
  { id: 'carpenter', name: 'Carpenter', category: 'Structure' },

  // Envelope
  { id: 'bricklayer', name: 'Bricklayer', category: 'Envelope' },
  { id: 'roofer', name: 'Roofer', category: 'Envelope' },
  { id: 'glazier', name: 'Glazier', category: 'Envelope' },
  { id: 'waterproofer', name: 'Waterproofer', category: 'Envelope' },

  // Services
  { id: 'plumber', name: 'Plumber', category: 'Services' },
  { id: 'electrician', name: 'Electrician', category: 'Services' },
  { id: 'hvac-technician', name: 'HVAC Technician', category: 'Services' },

  // Finishes
  { id: 'insulation-installer', name: 'Insulation Installer', category: 'Finishes' },
  { id: 'drywaller', name: 'Drywaller', category: 'Finishes' },
  { id: 'plasterer', name: 'Plasterer', category: 'Finishes' },
  { id: 'tiler', name: 'Tiler', category: 'Finishes' },
  { id: 'flooring-installer', name: 'Flooring Installer', category: 'Finishes' },
  { id: 'painter', name: 'Painter', category: 'Finishes' },
  { id: 'cabinetmaker', name: 'Cabinetmaker', category: 'Finishes' },

  // Specialist
  { id: 'mason', name: 'Mason', category: 'Specialist' },
  { id: 'welder', name: 'Welder', category: 'Specialist' },
  { id: 'landscaper', name: 'Landscaper', category: 'External' }
]
```

### Shared Components Architecture
```typescript
// Base components to share
interface DisciplineListProps {
  items: DisciplineItem[]
  type: 'consultant' | 'contractor'
  onToggle: (id: string, active: boolean) => void
  onStatusChange: (id: string, status: string, value: boolean) => void
}

// Shared StatusIcon component
// Shared toggle logic
// Shared persistence patterns
```

### State Management (Parallel to Consultant)
```typescript
interface ContractorState {
  activeContractors: string[]
  contractorStatuses: Record<string, ContractorStatus>
  toggleContractor: (tradeId: string) => void
  updateStatus: (tradeId: string, status: string, value: boolean) => void
  bulkUpdate: (tradeIds: string[], updates: Partial<ContractorStatus>) => void
}
```

### Code Reuse Strategy
1. **Extract shared components** from Story 1.7
2. **Create base DisciplineList** component
3. **Share StatusIcon** component completely
4. **Reuse Server Action patterns**
5. **Common Zustand store patterns**

### Visual Consistency Requirements
- Same toggle switch design
- Identical status icon behavior
- Matching color scheme
- Same animation timings
- Consistent spacing and layout

### Testing Approach
- Test contractor-specific functionality
- Verify shared component behavior
- Test parallel to consultant list
- Ensure no interference between lists
- Check performance with both lists active

### References

- [Source: docs/epics.md#Story 1.8] - Original requirements
- [Source: docs/PRD.md#FR001] - Contractor list specification (20 trades)
- [Source: docs/tech-spec-epic-1.md#AC-8.1 to AC-8.2] - Status tracking requirements
- [Source: Story 1.7] - Consultant list implementation to match

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- Will be filled by implementing agent -->

### Debug Log References

### Completion Notes List

### File List