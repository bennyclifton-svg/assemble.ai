# Story 1.7: Consultant List with Status Tracking

Status: Draft

## Story

As a user,
I want a comprehensive consultant list with status tracking,
so that I can manage all consultant disciplines and track their procurement status throughout the project lifecycle.

## Acceptance Criteria

1. **AC-7.1**: Display all 36 default consultant disciplines in a scrollable list
2. **AC-7.2**: Toggle on/off for each discipline to indicate if needed for project
3. **AC-7.3**: 4 status icons per discipline: Brief, Tender, Rec (Recommendation), Award (all default to off/ghosted)
4. **AC-7.4**: When consultant toggled on, creates corresponding tab in Consultant Card
5. **AC-7.5**: When consultant toggled off, removes tab from Consultant Card (with confirmation)
6. **AC-7.6**: Status changes persist to database immediately
7. **AC-7.7**: Visual indication of current status (icons change color when activated)
8. **AC-7.8**: Bulk select/deselect functionality for common consultant groups

## Tasks / Subtasks

- [ ] Task 1: Create consultant list data structure (AC: 7.1)
  - [ ] Define all 36 consultant disciplines in constants
  - [ ] Create ConsultantDiscipline type
  - [ ] Add to database seed script
  - [ ] Group consultants by category for better UX

- [ ] Task 2: Build ConsultantList component (AC: 7.1, 7.2)
  - [ ] Create src/components/cards/ConsultantList.tsx
  - [ ] Implement scrollable container with max-height
  - [ ] Add search/filter functionality
  - [ ] Create ConsultantRow component
  - [ ] Add toggle switch for each discipline

- [ ] Task 3: Implement status icons (AC: 7.3, 7.7)
  - [ ] Create StatusIcon component
  - [ ] Add 4 icons: Brief, Tender, Rec, Award
  - [ ] Implement click to toggle status
  - [ ] Use different colors: gray (off), blue (active), green (complete)
  - [ ] Add tooltips explaining each status

- [ ] Task 4: Connect to Consultant Card tabs (AC: 7.4, 7.5)
  - [ ] Create consultant tab mapping in Zustand
  - [ ] When toggled on, add to activeConsultants array
  - [ ] When toggled off, show confirmation dialog
  - [ ] Update Consultant Card to show active tabs
  - [ ] Preserve data when toggling off (soft disable)

- [ ] Task 5: Database persistence (AC: 7.6)
  - [ ] Create ConsultantStatus model if needed
  - [ ] Store: disciplineId, projectId, isActive, statuses
  - [ ] Create updateConsultantStatus Server Action
  - [ ] Implement optimistic updates
  - [ ] Handle batch updates efficiently

- [ ] Task 6: Bulk operations (AC: 7.8)
  - [ ] Add "Select All" checkbox
  - [ ] Add preset groups (e.g., "Essential", "Full Team")
  - [ ] Implement Shift+click for range selection
  - [ ] Add "Apply to Selected" for status changes
  - [ ] Show selection count

- [ ] Task 7: Visual design and feedback
  - [ ] Style toggle switches consistently
  - [ ] Add hover states to status icons
  - [ ] Animate status changes
  - [ ] Show loading state during saves
  - [ ] Add success feedback

- [ ] Task 8: Search and organization
  - [ ] Add search bar to filter disciplines
  - [ ] Group by category with collapsible headers
  - [ ] Sort alphabetically within groups
  - [ ] Highlight active consultants
  - [ ] Show count of active disciplines

## Dev Notes

### Consultant Disciplines List
```typescript
const consultantDisciplines = [
  // Planning & Compliance
  { id: 'access', name: 'Access', category: 'Planning' },
  { id: 'acoustic', name: 'Acoustic', category: 'Planning' },
  { id: 'arborist', name: 'Arborist', category: 'Planning' },
  { id: 'asp3', name: 'ASP3', category: 'Planning' },
  { id: 'basix', name: 'BASIX', category: 'Planning' },
  { id: 'bushfire', name: 'Bushfire', category: 'Planning' },
  { id: 'ecology', name: 'Ecology', category: 'Planning' },
  { id: 'flood', name: 'Flood', category: 'Planning' },
  { id: 'traffic', name: 'Traffic', category: 'Planning' },
  { id: 'waste-management', name: 'Waste Management', category: 'Planning' },

  // Design Team
  { id: 'architect', name: 'Architect', category: 'Design' },
  { id: 'interior-designer', name: 'Interior Designer', category: 'Design' },
  { id: 'landscape', name: 'Landscape', category: 'Design' },

  // Engineering
  { id: 'civil', name: 'Civil', category: 'Engineering' },
  { id: 'electrical', name: 'Electrical', category: 'Engineering' },
  { id: 'facade', name: 'Facade', category: 'Engineering' },
  { id: 'fire-engineering', name: 'Fire Engineering', category: 'Engineering' },
  { id: 'fire-services', name: 'Fire Services', category: 'Engineering' },
  { id: 'hydraulic', name: 'Hydraulic', category: 'Engineering' },
  { id: 'mechanical', name: 'Mechanical', category: 'Engineering' },
  { id: 'structural', name: 'Structural', category: 'Engineering' },

  // Site Investigation
  { id: 'geotech', name: 'Geotech', category: 'Site Investigation' },
  { id: 'hazmat', name: 'Hazmat', category: 'Site Investigation' },
  { id: 'site-investigation', name: 'Site Investigation', category: 'Site Investigation' },
  { id: 'survey', name: 'Survey', category: 'Site Investigation' },

  // Compliance & Certification
  { id: 'building-certifier', name: 'Building Certifier', category: 'Compliance' },
  { id: 'building-code-advice', name: 'Building Code Advice', category: 'Compliance' },
  { id: 'esd', name: 'ESD', category: 'Compliance' },
  { id: 'passive-fire', name: 'Passive Fire', category: 'Compliance' },
  { id: 'roof-access', name: 'Roof Access', category: 'Compliance' },

  // Project Management
  { id: 'cost-planning', name: 'Cost Planning', category: 'Project Management' },

  // Infrastructure
  { id: 'nbn', name: 'NBN', category: 'Infrastructure' },
  { id: 'stormwater', name: 'Stormwater', category: 'Infrastructure' },
  { id: 'wastewater', name: 'Wastewater', category: 'Infrastructure' },
  { id: 'waterproofing', name: 'Waterproofing', category: 'Infrastructure' }
]
```

### Status Configuration
```typescript
const statusConfig = [
  { key: 'brief', label: 'Brief', icon: FileText, color: 'blue' },
  { key: 'tender', label: 'Tender', icon: Send, color: 'orange' },
  { key: 'rec', label: 'Rec.', icon: CheckCircle, color: 'purple' },
  { key: 'award', label: 'Award', icon: Award, color: 'green' }
]
```

### Data Structure
```typescript
interface ConsultantStatus {
  disciplineId: string
  isActive: boolean
  statuses: {
    brief: boolean
    tender: boolean
    rec: boolean
    award: boolean
  }
}
```

### State Management
```typescript
// In Zustand store
interface ConsultantState {
  activeConsultants: string[]
  consultantStatuses: Record<string, ConsultantStatus>
  toggleConsultant: (disciplineId: string) => void
  updateStatus: (disciplineId: string, status: string, value: boolean) => void
  bulkUpdate: (disciplineIds: string[], updates: Partial<ConsultantStatus>) => void
}
```

### Testing Approach
- Test toggle on/off functionality
- Verify tab creation/removal
- Test status persistence
- Check bulk operations
- Verify search/filter works

### References

- [Source: docs/epics.md#Story 1.7] - Original requirements
- [Source: docs/PRD.md#FR001] - Consultant list specification (36 disciplines)
- [Source: docs/tech-spec-epic-1.md#AC-7.1 to AC-7.2] - Status tracking requirements
- [Source: docs/architecture.md#Implementation Patterns] - Consistency rules

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- Will be filled by implementing agent -->

### Debug Log References

### Completion Notes List

### File List