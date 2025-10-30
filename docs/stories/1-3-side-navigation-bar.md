# Story 1.3: Side Navigation Bar

Status: Draft

## Story

As a user,
I want a side navigation bar with all available Cards,
so that I can easily navigate between different project areas and open multiple cards simultaneously.

## Acceptance Criteria

1. **AC-3.1**: Side navigation displays all Cards in grouped order: Plan, Scheme, Detail, Procure, Deliver (gap), Consultant, Contractor (gap), Documents, Cost Planning
2. **AC-3.2**: Cards can be opened individually or in combinations (2-3 side-by-side)
3. **AC-3.3**: Active cards highlighted in navigation with visual indicator
4. **AC-3.4**: Responsive to 1920x1080 resolution minimum
5. **AC-3.5**: Collapsible navigation to maximize screen space
6. **AC-3.6**: Navigation state persists between page refreshes
7. **AC-3.7**: Smooth transitions when opening/closing cards
8. **AC-3.8**: Keyboard navigation support (Tab, Enter, Escape)

## Tasks / Subtasks

- [ ] Task 1: Create NavigationSidebar component (AC: 3.1, 3.4)
  - [ ] Create src/components/workspace/NavigationSidebar.tsx
  - [ ] Define navigation groups with visual gaps between sections
  - [ ] Implement responsive layout for 1920x1080 minimum
  - [ ] Use Lucide React icons for each card type
  - [ ] Add visual separators between groups (spacing or divider line)

- [ ] Task 2: Implement Zustand workspace store (AC: 3.2, 3.6)
  - [ ] Create src/stores/workspaceStore.ts
  - [ ] Define state: activeCards (max 3), collapsedNav
  - [ ] Implement actions: openCard, closeCard, toggleNav
  - [ ] Add persistence with zustand/middleware persist
  - [ ] Implement validation for max 3 cards open

- [ ] Task 3: Build card selection logic (AC: 3.2, 3.3)
  - [ ] Implement single card open (close others)
  - [ ] Implement add card to workspace (up to 3)
  - [ ] Add visual feedback for active cards
  - [ ] Disable cards when 3 are already open
  - [ ] Add tooltips explaining card limit

- [ ] Task 4: Create CardViewport container (AC: 3.2, 3.7)
  - [ ] Create src/components/workspace/CardViewport.tsx
  - [ ] Implement grid layout for 1-3 cards
  - [ ] Add ResizeDivider component between cards
  - [ ] Implement smooth transitions with CSS/Framer Motion
  - [ ] Calculate card widths based on count

- [ ] Task 5: Add collapse/expand functionality (AC: 3.5)
  - [ ] Add collapse button to navigation
  - [ ] Animate collapse with smooth transition
  - [ ] Show icon-only view when collapsed
  - [ ] Adjust viewport width when nav collapses
  - [ ] Persist collapsed state

- [ ] Task 6: Implement keyboard navigation (AC: 3.8)
  - [ ] Add tabIndex to navigation items
  - [ ] Handle Enter key to open cards
  - [ ] Handle Escape to close active card
  - [ ] Add focus visible styles
  - [ ] Test with screen reader

- [ ] Task 7: Style and polish (AC: 3.3, 3.7)
  - [ ] Apply Tailwind classes for consistent styling
  - [ ] Add hover states and active indicators
  - [ ] Implement dark mode support (if in design)
  - [ ] Add loading states for card switching
  - [ ] Ensure smooth 60fps animations

- [ ] Task 8: Integration and testing
  - [ ] Integrate with main layout
  - [ ] Test with placeholder card components
  - [ ] Verify state persistence works
  - [ ] Test responsive behavior
  - [ ] Manual testing of all interactions

## Dev Notes

### Component Structure
```
workspace/
├── NavigationSidebar.tsx  // Main navigation component
├── CardViewport.tsx       // Container for active cards
├── ResizeDivider.tsx      // Draggable divider between cards
└── CardPlaceholder.tsx    // Temporary placeholder for cards
```

### Zustand Store Structure
```typescript
interface WorkspaceStore {
  activeCards: CardType[]  // Max 3
  collapsedNav: boolean

  openCard: (type: CardType) => void
  closeCard: (type: CardType) => void
  replaceCards: (types: CardType[]) => void
  toggleNavigation: () => void
}
```

### Navigation Items
```typescript
const navigationGroups = [
  // Project Phases Group
  {
    id: 'phases',
    items: [
      { type: CardType.PLAN, label: 'Plan', icon: FileText },
      { type: CardType.SCHEME_DESIGN, label: 'Scheme', icon: Pencil },
      { type: CardType.DETAIL_DESIGN, label: 'Detail', icon: Ruler },
      { type: CardType.PROCURE, label: 'Procure', icon: Package },
      { type: CardType.DELIVER, label: 'Deliver', icon: Truck }
    ]
  },
  // Team Management Group
  {
    id: 'team',
    items: [
      { type: CardType.CONSULTANT, label: 'Consultant', icon: Users },
      { type: CardType.CONTRACTOR, label: 'Contractor', icon: HardHat }
    ]
  },
  // Administration Group
  {
    id: 'admin',
    items: [
      { type: CardType.DOCUMENTS, label: 'Documents', icon: Folder },
      { type: CardType.COST_PLANNING, label: 'Cost Planning', icon: Calculator }
    ]
  }
]
```

### Layout Calculations
- **1 card**: 100% width
- **2 cards**: 50% each with resizable divider
- **3 cards**: 33.33% each with 2 resizable dividers
- **Collapsed nav**: 64px width (icon only)
- **Expanded nav**: 240px width

### Testing Approach
- Component tests for NavigationSidebar
- Store tests for state management logic
- Manual testing of multi-card scenarios
- Accessibility testing with keyboard navigation

### References

- [Source: docs/epics.md#Story 1.3] - Original acceptance criteria
- [Source: docs/architecture.md#Multi-Card Workspace] - Workspace pattern design
- [Source: docs/tech-spec-epic-1.md#AC-3.1 to AC-3.3] - Navigation requirements
- [Source: docs/PRD.md#FR010] - Multi-select functionality requirement

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- Will be filled by implementing agent -->

### Debug Log References

### Completion Notes List

### File List