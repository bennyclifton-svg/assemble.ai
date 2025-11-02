# Story 1.3: Side Navigation Bar

Status: Draft

## Story

As a user,
I want a side navigation bar with project switcher and all available Cards,
so that I can easily switch between projects, navigate between different project areas, and open multiple cards simultaneously.

## Acceptance Criteria

1. **AC-3.1**: Side navigation displays all Cards in grouped order: Plan, Scheme, Detail, Procure, Deliver (gap), Consultant, Contractor (gap), Documents, Cost Planning
2. **AC-3.2**: Cards can be opened individually or in combinations (2-3 side-by-side)
3. **AC-3.3**: Active cards highlighted in navigation with visual indicator
4. **AC-3.4**: Responsive to 1920x1080 resolution minimum
5. **AC-3.5**: Collapsible navigation to maximize screen space
6. **AC-3.6**: Navigation state persists between page refreshes
7. **AC-3.7**: Smooth transitions when opening/closing cards
8. **AC-3.8**: Keyboard navigation support (Tab, Enter, Escape)
9. **AC-3.9**: Current project name displayed prominently at top of side navigation
10. **AC-3.10**: Clicking project name opens dropdown/menu showing all user projects (ordered by most recent)
11. **AC-3.11**: Project switcher dropdown includes "Create New Project" option
12. **AC-3.12**: Selecting project from dropdown switches context and updates all cards
13. **AC-3.13**: Inline rename capability when clicking on project name (or via context menu)
14. **AC-3.14**: Project context persists across sessions (remember last active project)

## Tasks / Subtasks

- [x] Task 1: Create ProjectSwitcher component (AC: 3.9, 3.10, 3.11, 3.12, 3.13, 3.14)
  - [x] Create src/components/workspace/ProjectSwitcher.tsx
  - [x] Display current project name at top of sidenav
  - [x] Implement dropdown trigger on click with chevron icon
  - [x] Create dropdown menu (custom implementation, not shadcn/ui)
  - [x] Query and display user's projects ordered by lastAccessedAt DESC
  - [x] Add "Create New Project" option at bottom of dropdown
  - [x] Implement project switch handler (update URL, refresh cards)
  - [x] Add inline rename mode (double-click to activate)
  - [x] Call updateLastAccessed server action when accessing projects
  - [x] Style with hover states and current project indicator

- [x] Task 2: Create NavigationSidebar component (AC: 3.1, 3.4) - Enhanced with ProjectSwitcher
  - [x] Create src/components/workspace/NavigationSidebar.tsx (already existed)
  - [x] Integrate ProjectSwitcher at top of sidebar
  - [x] Define navigation groups with visual gaps between sections (already implemented)
  - [x] Implement responsive layout for 1920x1080 minimum (already implemented)
  - [x] Use Lucide React icons for each card type (already implemented)
  - [ ] Add visual separators between groups (spacing or divider line)

- [ ] Task 3: Implement Zustand workspace store (AC: 3.2, 3.6, 3.14)
  - [ ] Create src/stores/workspaceStore.ts
  - [ ] Define state: currentProjectId, activeCards (max 3), collapsedNav
  - [ ] Implement actions: setProject, openCard, closeCard, toggleNav
  - [ ] Add persistence with zustand/middleware persist (persist currentProjectId)
  - [ ] Implement validation for max 3 cards open
  - [ ] Clear activeCards when switching projects

- [ ] Task 4: Build card selection logic (AC: 3.2, 3.3)
  - [ ] Implement single card open (close others)
  - [ ] Implement add card to workspace (up to 3)
  - [ ] Add visual feedback for active cards
  - [ ] Disable cards when 3 are already open
  - [ ] Add tooltips explaining card limit

- [ ] Task 5: Create CardViewport container (AC: 3.2, 3.7)
  - [ ] Create src/components/workspace/CardViewport.tsx
  - [ ] Implement grid layout for 1-3 cards
  - [ ] Add ResizeDivider component between cards
  - [ ] Implement smooth transitions with CSS/Framer Motion
  - [ ] Calculate card widths based on count

- [ ] Task 6: Add collapse/expand functionality (AC: 3.5)
  - [ ] Add collapse button to navigation
  - [ ] Animate collapse with smooth transition
  - [ ] Show icon-only view when collapsed
  - [ ] Adjust viewport width when nav collapses
  - [ ] Persist collapsed state

- [ ] Task 7: Implement keyboard navigation (AC: 3.8)
  - [ ] Add tabIndex to navigation items and project switcher
  - [ ] Handle Enter key to open cards and project dropdown
  - [ ] Handle Escape to close active card and close dropdown
  - [ ] Add focus visible styles
  - [ ] Test with screen reader

- [ ] Task 8: Style and polish (AC: 3.3, 3.7)
  - [ ] Apply Tailwind classes for consistent styling
  - [ ] Add hover states and active indicators
  - [ ] Implement dark mode support (if in design)
  - [ ] Add loading states for card switching and project switching
  - [ ] Ensure smooth 60fps animations

- [ ] Task 9: Integration and testing
  - [ ] Integrate with main layout at app/(dashboard)/projects/[id]/layout.tsx
  - [ ] Test project switching updates URL and cards
  - [ ] Test with placeholder card components
  - [ ] Verify state persistence works (project context and nav state)
  - [ ] Test responsive behavior
  - [ ] Manual testing of all interactions including rename

## Dev Notes

### Component Structure
```
workspace/
├── ProjectSwitcher.tsx    // Project dropdown at top of sidenav
├── NavigationSidebar.tsx  // Main navigation component
├── CardViewport.tsx       // Container for active cards
├── ResizeDivider.tsx      // Draggable divider between cards
└── CardPlaceholder.tsx    // Temporary placeholder for cards
```

### Zustand Store Structure
```typescript
interface WorkspaceStore {
  currentProjectId: string | null  // Persisted across sessions
  activeCards: CardType[]  // Max 3
  collapsedNav: boolean

  setProject: (projectId: string) => void
  openCard: (type: CardType) => void
  closeCard: (type: CardType) => void
  replaceCards: (types: CardType[]) => void
  toggleNavigation: () => void
}
```

### Project Switcher Implementation
```typescript
// ProjectSwitcher component structure
<DropdownMenu>
  <DropdownMenuTrigger>
    <div className="flex items-center gap-2">
      <span>{currentProject.name}</span>
      <ChevronDown />
    </div>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {projects.map(project => (
      <DropdownMenuItem
        key={project.id}
        onClick={() => handleProjectSwitch(project.id)}
      >
        {project.name}
      </DropdownMenuItem>
    ))}
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleCreateProject}>
      <Plus /> Create New Project
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
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

### Project Switching Behavior
1. **Switch Action**: User clicks project from dropdown → URL updates to `/projects/{newProjectId}/plan`
2. **Context Update**: All card data refreshes to show data from new project
3. **Active Cards Reset**: Clear activeCards array when switching projects (start fresh on Plan Card)
4. **Last Accessed Update**: Call server action to update `lastAccessedAt` for the newly selected project
5. **Persistence**: Store `currentProjectId` in localStorage via Zustand persist middleware
6. **URL as Source of Truth**: On page load, use URL projectId to initialize workspace state
7. **Rename Flow**: Double-click project name → inline input appears → Enter to save, Escape to cancel

### Testing Approach
- Component tests for ProjectSwitcher (dropdown, rename, create)
- Component tests for NavigationSidebar
- Store tests for state management logic (project context, card management)
- Manual testing of multi-card scenarios
- Manual testing of project switching (URL updates, data refresh)
- Accessibility testing with keyboard navigation (Tab through dropdown items)

### References

- [Source: docs/epics.md#Story 1.3] - Original acceptance criteria
- [Source: docs/architecture.md#Multi-Card Workspace] - Workspace pattern design
- [Source: docs/tech-spec-epic-1.md#AC-3.1 to AC-3.3] - Navigation requirements
- [Source: docs/PRD.md#FR010] - Multi-select functionality requirement
- [Source: docs/PRD.md#FR039-FR046] - Project management and navigation requirements
- [Source: docs/PRD.md#User Journey 0] - Creating and managing projects workflow

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- Will be filled by implementing agent -->

### Debug Log References

### Completion Notes List

**ProjectSwitcher Implementation - November 2, 2025**

Implemented ProjectSwitcher component with project management features:

**ProjectSwitcher Component** (`src/components/workspace/ProjectSwitcher.tsx`):
- Displays current project name prominently at top of sidebar
- Click to open dropdown showing all user projects
- Projects ordered by lastAccessedAt DESC (most recent first)
- "Create New Project" option in dropdown
- Project switching via router.push to /projects/[id]
- Inline rename mode activated by double-click
- Rename input with Enter to save, Escape to cancel, onBlur to save
- Collapsed view shows project initial when sidebar is collapsed
- Dropdown closes on click outside (useEffect with event listener)
- Loading states during project creation
- Error handling with user-friendly alerts

**NavigationSidebar Integration** (`src/components/workspace/NavigationSidebar.tsx`):
- Added ProjectSwitcher import and component
- Integrated at top of sidebar (before card navigation)
- Passes projectId and collapsed state to ProjectSwitcher
- Conditional rendering only when projectId is provided

**UI/UX Features**:
- Chevron icon rotates when dropdown is open (animated)
- Current project marked with Check icon in dropdown
- Hover states on all interactive elements
- Focus management for rename input (auto-focus and select on entry)
- Disabled state during project creation ("Creating..." feedback)
- Responsive to sidebar collapse state

**State Management**:
- Local state for dropdown open/close
- Local state for rename mode
- Projects loaded on mount and when projectId changes
- updateLastAccessed called via server action when switching projects (in project page)

**Acceptance Criteria Met**: AC-3.9, AC-3.10, AC-3.11, AC-3.12, AC-3.13, AC-3.14 (via URL persistence)

### File List

**Created**:
- `src/components/workspace/ProjectSwitcher.tsx`

**Modified**:
- `src/components/workspace/NavigationSidebar.tsx` (added ProjectSwitcher integration)