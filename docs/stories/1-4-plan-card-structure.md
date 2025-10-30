# Story 1.4: Plan Card Structure

Status: Draft

## Story

As a user,
I want to create and view a Plan Card with predefined sections,
so that I can capture core project information in a structured, collapsible interface.

## Acceptance Criteria

1. **AC-4.1**: Plan Card displays with 7 main sections: Details, Objectives, Staging, Risk, Stakeholders, Consultant List, Contractor List
2. **AC-4.2**: Each section has collapsible/expandable chevron icon
3. **AC-4.3**: Sections can be collapsed/expanded individually with smooth animation
4. **AC-4.4**: Card state persists between sessions (collapsed/expanded state)
5. **AC-4.5**: Database properly stores all Plan Card data
6. **AC-4.6**: Plan Card auto-creates when new project is created
7. **AC-4.7**: Loading states while fetching data
8. **AC-4.8**: Error handling for failed data loads

## Tasks / Subtasks

- [ ] Task 1: Create Plan Card component structure (AC: 4.1, 4.2)
  - [ ] Create src/components/cards/PlanCard.tsx
  - [ ] Create src/components/cards/CardPanel.tsx (reusable wrapper)
  - [ ] Create src/components/cards/CardHeader.tsx
  - [ ] Define section configuration array
  - [ ] Import chevron icons from Lucide React

- [ ] Task 2: Build Section components (AC: 4.1, 4.3)
  - [ ] Create src/components/cards/Section.tsx
  - [ ] Create src/components/cards/SectionHeader.tsx
  - [ ] Create src/components/cards/SectionContent.tsx
  - [ ] Implement collapsible logic with useState
  - [ ] Add smooth height animation (CSS or Framer Motion)

- [ ] Task 3: Implement data fetching with tRPC (AC: 4.5, 4.7)
  - [ ] Create card.getByType tRPC procedure
  - [ ] Add React Query integration for caching
  - [ ] Implement loading skeleton components
  - [ ] Add error boundary for failed loads

- [ ] Task 4: Create Plan Card initialization (AC: 4.6)
  - [ ] Add Server Action createPlanCard
  - [ ] Auto-create Plan Card in project creation flow
  - [ ] Create default sections with empty items
  - [ ] Set proper order for sections

- [ ] Task 5: Implement state persistence (AC: 4.4)
  - [ ] Store collapsed state in Zustand
  - [ ] Persist to localStorage
  - [ ] Restore state on component mount
  - [ ] Handle state for multiple projects

- [ ] Task 6: Build section content containers (AC: 4.1)
  - [ ] Create placeholder content for each section
  - [ ] Add "Empty State" message for sections without data
  - [ ] Prepare ItemList component structure
  - [ ] Add section-specific layouts

- [ ] Task 7: Server-side data structure (AC: 4.5)
  - [ ] Create service function to fetch Plan Card with sections
  - [ ] Include related sections and items in query
  - [ ] Sort sections by order field
  - [ ] Filter out soft-deleted records

- [ ] Task 8: Error handling and edge cases (AC: 4.8)
  - [ ] Handle missing Plan Card gracefully
  - [ ] Add retry logic for failed fetches
  - [ ] Display user-friendly error messages
  - [ ] Log errors to Sentry

## Dev Notes

### Component Hierarchy
```
PlanCard
├── CardPanel (wrapper)
│   ├── CardHeader
│   └── SectionList
│       └── Section (x7)
│           ├── SectionHeader (with chevron)
│           └── SectionContent
│               └── ItemList (future)
```

### Section Configuration
```typescript
const planCardSections = [
  { id: 'details', name: 'Details', order: 1, icon: FileText },
  { id: 'objectives', name: 'Objectives', order: 2, icon: Target },
  { id: 'staging', name: 'Staging', order: 3, icon: Layers },
  { id: 'risk', name: 'Risk', order: 4, icon: AlertTriangle },
  { id: 'stakeholders', name: 'Stakeholders', order: 5, icon: Users },
  { id: 'consultant-list', name: 'Consultant List', order: 6, icon: Briefcase },
  { id: 'contractor-list', name: 'Contractor List', order: 7, icon: HardHat }
]
```

### State Management
```typescript
interface PlanCardState {
  collapsedSections: Record<string, boolean>
  setSectionCollapsed: (sectionId: string, collapsed: boolean) => void
  toggleSection: (sectionId: string) => void
}
```

### Database Query Pattern
```typescript
const planCard = await prisma.card.findFirst({
  where: {
    projectId,
    type: CardType.PLAN,
    deletedAt: null
  },
  include: {
    sections: {
      where: { deletedAt: null },
      orderBy: { order: 'asc' },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' }
        }
      }
    }
  }
})
```

### Animation Approach
- Use CSS transitions for smooth expand/collapse
- Height: auto doesn't animate well, use max-height trick
- Alternative: Framer Motion with AnimatePresence
- Ensure 60fps performance

### Testing Approach
- Component tests for Section expand/collapse
- Integration test for Plan Card data fetching
- Test state persistence across refreshes
- Verify auto-creation on new project

### References

- [Source: docs/epics.md#Story 1.4] - Original requirements
- [Source: docs/tech-spec-epic-1.md#Plan Card Initialization Flow] - Initialization sequence
- [Source: docs/architecture.md#Multi-Card Workspace Pattern] - Card component structure
- [Source: docs/PRD.md#FR001] - Plan Card requirements

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- Will be filled by implementing agent -->

### Debug Log References

### Completion Notes List

### File List