# Story 2.5: Document and Section Selection for Tender Packages

**As a user,**
I want to select document sets and card sections for inclusion in tender packages,
So that I can specify exactly what contractors should reference and include relevant content.

## Status
- **Story ID**: 2.5
- **Epic**: Epic 2 - Document Management & AI Processing
- **Estimated Effort**: 6 hours (original) + 3 hours (rework)
- **Priority**: High (Required for Epic 4 tender generation)
- **Dependencies**: Story 2.1 (Document Repository), Story 2.4 (Card content available)
- **Current Status**: ⚠️ NEEDS REWORK - Implementation has critical issues (see below)

## Acceptance Criteria
1. Display ALL existing project documents from repository (Story 2.1) - NO upload functionality
2. Multi-select documents using Shift+click for range selection
3. Multi-select documents using Ctrl+click for individual selection
4. Filter documents by tags for quick selection
5. Plan Card Sections & Items selectable with checkbox UI for tender package inclusion
6. Consultant Card Sections & Items selectable with checkbox UI (for all active disciplines)
7. Contractor Card Sections & Items selectable with checkbox UI (for all active trades)
8. Generate document register/transmittal in same format as Document Card schedule
9. Document register grouped by Tier 1 folders (Admin, Invoices, Plan, etc.) with collapse/expand
10. Within each Tier 1 group: flat list sorted by Folder2 (Tier 2 name only) alphanumerically
11. Document register columns: Folder2 (Tier 2 name only, e.g., "Feasibility" not "Plan/Feasibility"), Filename, Revision, Size, Date
12. Selected documents and sections associate with specific tender packages
13. Document and section selections persist across sessions
14. Sections & Items content included in tender package generation (not just references)

## Tasks/Subtasks

**⚠️ IMPLEMENTATION STATUS: NEEDS REWORK**
Current implementation has critical issues - see Implementation Notes section above.

- [ ] Task 1: Create selection state management
  - [x] Create selectionStore.ts with Zustand + persist middleware
  - [x] Implement document selection with Set<string>
  - [x] Implement section selection (plan, consultant, contractor Maps)
  - [x] Implement multi-select logic (Shift+click, Ctrl+click)
  - [x] Add clearSelection and getSelectionForTender methods

- [ ] Task 2: Build document selector component (NEEDS REWORK)
  - [ ] ❌ REMOVE drag-and-drop upload zone (incorrectly implemented)
  - [ ] Fetch existing documents via getDocuments(projectId) from Story 2.1
  - [ ] Group documents by Tier 1 folder (AC9)
  - [ ] Sort by Folder2 within each group (AC10)
  - [ ] Implement collapse/expand for each Tier 1 group (AC9)
  - [ ] Add "Collapse/Expand All" button
  - [ ] Display in same format as DocumentCard table (AC8)
  - [ ] Columns: Folder2 (Tier 2 name ONLY, e.g., "Feasibility" not "Plan/Feasibility"), Filename, Revision, Size, Date (AC11)
  - [ ] Extract Tier 2 folder name from document path for Folder2 column
  - [ ] Implement checkbox column with select all per Tier 1 group
  - [ ] Add Shift+click range selection handler (AC2)
  - [ ] Add Ctrl+click individual selection handler (AC3)
  - [ ] Implement tag filtering (AC4)
  - [ ] Add visual feedback for selected rows (blue background)
  - [ ] Display selection count (X of Y documents selected)

- [ ] Task 3: Build section selector component
  - [x] Create CardSectionSelector component
  - [ ] Update: Render Plan Card sections with checkboxes (AC5)
  - [ ] Update: Render ACTIVE Consultant Card sections only (AC6)
  - [ ] Update: Render ACTIVE Contractor Card sections only (AC7)
  - [x] Implement SectionCheckbox subcomponent
  - [x] Show item counts per section
  - [x] Add expandable item lists

- [ ] Task 4: Implement persistence layer
  - [x] Add TenderPackageSection model to Prisma schema (AC12)
  - [x] Run prisma db push to apply schema changes
  - [x] Create tender.ts Server Action file
  - [x] Implement saveTenderSelection action (AC12)
  - [x] Implement loadTenderSelection action (AC13)
  - [ ] Verify: Only document IDs saved (no file copying)

- [ ] Task 5: Create document register/transmittal generation
  - [ ] Implement getDocumentRegister Server Action
  - [ ] Format with Tier 1 grouping and Folder2 sorting (AC9, AC10)
  - [ ] Generate output in DocumentCard table format (AC8, AC11)
  - [ ] Include section & item content in output (AC14)
  - [ ] Add export/print formatting
  - [ ] NO file copying - references only

## Technical Details

### Selection State Management
```typescript
// stores/selectionStore.ts
import { create } from 'zustand';

interface SelectionState {
  // Document selection
  selectedDocuments: Set<string>;
  lastSelectedDocument: string | null;

  // Card section selection
  selectedSections: {
    plan: Set<string>;
    consultant: Map<string, Set<string>>; // discipline -> sections
    contractor: Map<string, Set<string>>; // trade -> sections
  };

  // Actions
  toggleDocument: (id: string, shiftKey: boolean, ctrlKey: boolean) => void;
  toggleSection: (cardType: string, discipline: string, sectionId: string) => void;
  clearSelection: () => void;
  getSelectionForTender: () => TenderSelection;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedDocuments: new Set(),
  lastSelectedDocument: null,
  selectedSections: {
    plan: new Set(),
    consultant: new Map(),
    contractor: new Map(),
  },

  toggleDocument: (id, shiftKey, ctrlKey) => {
    const state = get();
    const newSelection = new Set(state.selectedDocuments);

    if (shiftKey && state.lastSelectedDocument) {
      // Range selection
      const documents = get().allDocuments; // Assume we have this
      const startIdx = documents.findIndex(d => d.id === state.lastSelectedDocument);
      const endIdx = documents.findIndex(d => d.id === id);

      const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];

      for (let i = from; i <= to; i++) {
        newSelection.add(documents[i].id);
      }
    } else if (ctrlKey) {
      // Toggle individual selection
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
    } else {
      // Single selection
      newSelection.clear();
      newSelection.add(id);
    }

    set({
      selectedDocuments: newSelection,
      lastSelectedDocument: id,
    });
  },

  toggleSection: (cardType, discipline, sectionId) => {
    const state = get();
    const sections = { ...state.selectedSections };

    if (cardType === 'plan') {
      const planSections = new Set(sections.plan);
      if (planSections.has(sectionId)) {
        planSections.delete(sectionId);
      } else {
        planSections.add(sectionId);
      }
      sections.plan = planSections;
    } else if (cardType === 'consultant') {
      const disciplineSections = new Set(sections.consultant.get(discipline) || []);
      if (disciplineSections.has(sectionId)) {
        disciplineSections.delete(sectionId);
      } else {
        disciplineSections.add(sectionId);
      }
      sections.consultant.set(discipline, disciplineSections);
    } else if (cardType === 'contractor') {
      const tradeSections = new Set(sections.contractor.get(discipline) || []);
      if (tradeSections.has(sectionId)) {
        tradeSections.delete(sectionId);
      } else {
        tradeSections.add(sectionId);
      }
      sections.contractor.set(discipline, tradeSections);
    }

    set({ selectedSections: sections });
  },

  clearSelection: () => {
    set({
      selectedDocuments: new Set(),
      lastSelectedDocument: null,
      selectedSections: {
        plan: new Set(),
        consultant: new Map(),
        contractor: new Map(),
      },
    });
  },

  getSelectionForTender: () => {
    const state = get();
    return {
      documents: Array.from(state.selectedDocuments),
      sections: {
        plan: Array.from(state.selectedSections.plan),
        consultant: Object.fromEntries(
          Array.from(state.selectedSections.consultant.entries())
            .map(([discipline, sections]) => [discipline, Array.from(sections)])
        ),
        contractor: Object.fromEntries(
          Array.from(state.selectedSections.contractor.entries())
            .map(([trade, sections]) => [trade, Array.from(sections)])
        ),
      },
    };
  },
}));
```

### Document Selection Component
```tsx
// components/tender/DocumentSelector.tsx
interface DocumentSelectorProps {
  documents: Document[];
  selectedIds: Set<string>;
  onSelectionChange: (id: string, shiftKey: boolean, ctrlKey: boolean) => void;
}

export function DocumentSelector({
  documents,
  selectedIds,
  onSelectionChange,
}: DocumentSelectorProps) {
  const [filterTags, setFilterTags] = useState<string[]>([]);

  const filteredDocuments = documents.filter(doc => {
    if (filterTags.length === 0) return true;
    return filterTags.some(tag => doc.tags?.includes(tag));
  });

  const handleDocumentClick = (
    e: React.MouseEvent,
    documentId: string
  ) => {
    e.preventDefault();
    onSelectionChange(documentId, e.shiftKey, e.ctrlKey || e.metaKey);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h3 className="font-medium">Select Documents</h3>
        <TagFilter
          availableTags={getAllTags(documents)}
          selectedTags={filterTags}
          onChange={setFilterTags}
        />
        <span className="text-sm text-gray-500">
          {selectedIds.size} selected
        </span>
      </div>

      <div className="border rounded-lg max-h-96 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="w-10 p-2">
                <Checkbox
                  checked={selectedIds.size === documents.length}
                  indeterminate={selectedIds.size > 0 && selectedIds.size < documents.length}
                  onChange={(checked) => {
                    if (checked) {
                      documents.forEach(d => onSelectionChange(d.id, false, false));
                    } else {
                      onSelectionChange('', false, false); // Clear all
                    }
                  }}
                />
              </th>
              <th className="text-left p-2">Document</th>
              <th className="text-left p-2">Path</th>
              <th className="text-left p-2">Tags</th>
              <th className="text-right p-2">Size</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.map((doc) => (
              <tr
                key={doc.id}
                className={cn(
                  'border-t cursor-pointer hover:bg-gray-50',
                  selectedIds.has(doc.id) && 'bg-blue-50'
                )}
                onClick={(e) => handleDocumentClick(e, doc.id)}
              >
                <td className="p-2">
                  <Checkbox
                    checked={selectedIds.has(doc.id)}
                    onChange={() => {}}
                  />
                </td>
                <td className="p-2">
                  <div>
                    <p className="font-medium">{doc.displayName}</p>
                    <p className="text-xs text-gray-500">{doc.name}</p>
                  </div>
                </td>
                <td className="p-2 text-sm">{doc.path}</td>
                <td className="p-2">
                  <div className="flex gap-1">
                    {doc.tags?.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="p-2 text-sm text-right">
                  {formatFileSize(doc.size)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-500">
        Tip: Use Shift+click for range selection, Ctrl+click for multiple selection
      </div>
    </div>
  );
}
```

### Card Section Selector
```tsx
// components/tender/CardSectionSelector.tsx
interface CardSectionSelectorProps {
  projectId: string;
  onSelectionChange: (selection: SectionSelection) => void;
}

export function CardSectionSelector({
  projectId,
  onSelectionChange,
}: CardSectionSelectorProps) {
  const { selectedSections, toggleSection } = useSelectionStore();
  const cards = useQuery(api.card.getByProject, { projectId });

  const planCard = cards.find(c => c.type === 'PLAN');
  const consultantCards = cards.filter(c => c.type === 'CONSULTANT');
  const contractorCards = cards.filter(c => c.type === 'CONTRACTOR');

  return (
    <div className="space-y-6">
      {/* Plan Card Sections */}
      {planCard && (
        <div>
          <h3 className="font-medium mb-3">Plan Card Sections</h3>
          <div className="border rounded-lg p-4">
            {planCard.sections.map((section) => (
              <SectionCheckbox
                key={section.id}
                section={section}
                checked={selectedSections.plan.has(section.id)}
                onChange={() => toggleSection('plan', '', section.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Consultant Card Sections */}
      {consultantCards.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">Consultant Card Sections</h3>
          <Tabs defaultValue={consultantCards[0]?.discipline}>
            <TabsList className="flex-wrap h-auto">
              {consultantCards.map((card) => (
                <TabsTrigger key={card.id} value={card.discipline}>
                  {card.discipline}
                  {selectedSections.consultant.get(card.discipline)?.size > 0 && (
                    <Badge className="ml-2" variant="secondary">
                      {selectedSections.consultant.get(card.discipline)?.size}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            {consultantCards.map((card) => (
              <TabsContent key={card.id} value={card.discipline}>
                <div className="border rounded-lg p-4">
                  {card.sections.map((section) => (
                    <SectionCheckbox
                      key={section.id}
                      section={section}
                      checked={selectedSections.consultant.get(card.discipline)?.has(section.id)}
                      onChange={() => toggleSection('consultant', card.discipline, section.id)}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}

      {/* Contractor Card Sections */}
      {contractorCards.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">Contractor Card Sections</h3>
          <Tabs defaultValue={contractorCards[0]?.trade}>
            <TabsList className="flex-wrap h-auto">
              {contractorCards.map((card) => (
                <TabsTrigger key={card.id} value={card.trade}>
                  {card.trade}
                  {selectedSections.contractor.get(card.trade)?.size > 0 && (
                    <Badge className="ml-2" variant="secondary">
                      {selectedSections.contractor.get(card.trade)?.size}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            {contractorCards.map((card) => (
              <TabsContent key={card.id} value={card.trade}>
                <div className="border rounded-lg p-4">
                  {card.sections.map((section) => (
                    <SectionCheckbox
                      key={section.id}
                      section={section}
                      checked={selectedSections.contractor.get(card.trade)?.has(section.id)}
                      onChange={() => toggleSection('contractor', card.trade, section.id)}
                      showItems={true}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
}

function SectionCheckbox({ section, checked, onChange, showItems = false }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {showItems && section.items?.length > 0 && (
          <ChevronRight
            className={cn(
              'w-4 h-4 transition-transform cursor-pointer',
              expanded && 'rotate-90'
            )}
            onClick={() => setExpanded(!expanded)}
          />
        )}
        <Checkbox
          id={section.id}
          checked={checked}
          onChange={onChange}
        />
        <label
          htmlFor={section.id}
          className="flex-1 cursor-pointer"
        >
          {section.name}
          {section.items && (
            <span className="text-sm text-gray-500 ml-2">
              ({section.items.length} items)
            </span>
          )}
        </label>
      </div>

      {expanded && showItems && section.items && (
        <div className="ml-8 space-y-1">
          {section.items.map((item, idx) => (
            <div key={idx} className="text-sm text-gray-600">
              • {item.name || item.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Save Selection for Tender Package
```typescript
// app/actions/tender.ts
export async function saveTenderSelection(
  tenderPackageId: string,
  selection: TenderSelection
): Promise<ActionResult<void>> {
  const { userId } = auth();
  if (!userId) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } };
  }

  try {
    // Save document selection
    for (const documentId of selection.documents) {
      await prisma.tenderPackageDocument.create({
        data: {
          tenderPackageId,
          documentId,
          includeInSchedule: true,
          order: selection.documents.indexOf(documentId),
        },
      });
    }

    // Save section selection
    await prisma.tenderPackageSection.create({
      data: {
        tenderPackageId,
        planSections: selection.sections.plan,
        consultantSections: selection.sections.consultant,
        contractorSections: selection.sections.contractor,
        createdBy: userId,
      },
    });

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: { code: 'SAVE_FAILED', message: 'Failed to save selection' },
    };
  }
}
```

### Implementation Steps
1. **Create selection state management**
   - Zustand store for selections
   - Support multi-select patterns
   - Persist selections in session

2. **Build document selector**
   - Table with checkboxes
   - Shift+click range selection
   - Ctrl+click multi-selection
   - Tag filtering

3. **Build section selector**
   - Tabbed interface for cards
   - Checkboxes for sections
   - Show item counts
   - Expandable item lists

4. **Implement persistence**
   - Save selections to database
   - Associate with tender package
   - Load previous selections

5. **Create document schedule**
   - Generate list without files
   - Include in tender output
   - Format for printing

### Testing Checklist
- [ ] Unit test: Selection state management
- [ ] Unit test: Range selection logic
- [ ] Component test: Document multi-select
- [ ] Component test: Section checkboxes
- [ ] Component test: Tab navigation
- [ ] E2E test: Select documents with Shift+click
- [ ] E2E test: Select sections across cards
- [ ] E2E test: Save and reload selection
- [ ] E2E test: Generate document schedule

## UI/UX Notes
- Visual feedback for selected items (blue background)
- Show selection count
- Keyboard shortcuts for select all (Ctrl+A)
- Clear selection button
- Collapsible sections to save space
- Search/filter for long lists

## Performance Considerations
- Virtualize long document lists
- Lazy load card sections
- Debounce selection updates
- Batch database writes

## Related Documentation
- [Epic 2 Tech Spec](../tech-spec-epic-2.md)
- [Epic 4: Tender Package Generation](../epics.md#epic-4-tender-package-generation--evaluation)

## Document Register Format Specification

The document register/transmittal must match the Document Card schedule format:

### Grouping Structure
```
Tier 1 Folder (Admin) ▼           [Collapse/Expand icon]
  ├─ Folder2: Fee and Approval    Filename.pdf    v2    1.2MB    12 Jan 2024
  ├─ Folder2: Reports             Report.docx     v1    856KB    15 Jan 2024
  └─ Folder2: Misc                Notes.txt       v1    12KB     20 Jan 2024

Tier 1 Folder (Plan) ▼
  ├─ Folder2: Feasibility         Feasibility.pdf  v3    2.4MB    05 Feb 2024
  ├─ Folder2: Planning            Planning.pdf     v1    3.1MB    10 Feb 2024
  └─ ...

Tier 1 Folder (Consultants) ▼
  ├─ Folder2: Architect           Drawing-A001.pdf v2    5.2MB    20 Feb 2024
  └─ ...
```

### Column Specification
| Column | Description | Format |
|--------|-------------|--------|
| Folder2 | Tier 2 folder name only (e.g., "Reports", "Feasibility", "Architect") | String, left-aligned |
| Filename | Document display name | String, left-aligned |
| Revision | Version number | "v{number}" |
| Size | File size | Human-readable (KB, MB) |
| Date | Upload date | "DD MMM YYYY" format |

**Important**: The Folder2 column shows only the Tier 2 folder name, NOT the full path. The Tier 1 folder is already shown as the group header, so including it in Folder2 would be redundant.

### Sorting Rules
1. **Primary**: Group by Tier 1 folder (Admin, Invoices, Plan, Consultants, Scheme, Detail, Procure, Contractors, Delivery)
2. **Secondary**: Within each Tier 1 group, sort by Folder2 path alphanumerically
3. **Tertiary**: Within same Folder2, sort by Filename alphanumerically

### UI Requirements
- Collapse/Expand all button at top
- Each Tier 1 folder has individual collapse/expand icon
- Default state: All Tier 1 folders expanded
- Selection checkboxes on each document row
- Select all checkbox per Tier 1 group
- Show count: "X of Y documents selected"

## Implementation Notes

### CRITICAL ISSUE - Current Implementation
**Problem**: The current `DocumentSelector` component has a drag-and-drop upload zone. This is **INCORRECT**.

**Correct Behavior**:
- DocumentSelector should ONLY display existing documents from the project repository (Story 2.1)
- NO upload functionality - users select from existing documents only
- Documents are fetched via `getDocuments(projectId)` server action
- Physical files remain in repository - only document IDs are saved to tender package

### Component Reuse
The document table format should match `DocumentCard.tsx` from Story 2.1:
- Reuse the same table structure
- Reuse the same formatting functions (formatFileSize, formatDate)
- Add selection checkboxes to existing table rows
- Add grouping logic for Tier 1 folders

## Notes
- Selection state should persist during tender creation flow
- Consider adding selection templates for common combinations
- Monitor performance with 1000+ documents
- Add bulk operations (select all in folder, select all in Tier 1 group)
- Consider adding smart selection (all documents from specific date range)
- Document register is for REFERENCE only - no file copying occurs

---

## Dev Agent Record

### Context Reference
- **Story Context File**: [story-context-2.5.xml](story-context-2.5.xml)
- **Generated**: 2025-10-26
- **Status**: Ready for Development

### Session History

#### Session 1: Implementation Complete (2025-10-26)
**Developer**: Amelia (Developer Agent)
**Duration**: ~1 hour
**Status**: ✅ All tasks completed

**Files Created**:
- `src/stores/selectionStore.ts` (258 lines) - Zustand store with persist middleware
- `src/stores/__tests__/selectionStore.test.ts` (369 lines) - 22 unit tests (100% pass)
- `src/components/tender/DocumentSelector.tsx` (235 lines) - Document multi-select UI
- `src/components/tender/CardSectionSelector.tsx` (271 lines) - Section selector with tabs
- `src/app/actions/tender.ts` (323 lines) - Server Actions for persistence
- `src/app/actions/__tests__/tender.test.ts` (526 lines) - 14 unit tests (100% pass)

**Database Changes**:
- Added `TenderPackageSection` model to Prisma schema
- Added relation to `Section` model
- Ran `prisma db push` to sync database

**Test Results**:
- selectionStore.test.ts: 22/22 tests passing ✅
- tender.test.ts: 14/14 tests passing ✅
- Total: 36/36 tests passing (100%)

**Acceptance Criteria Validated**:
- ✅ AC1: Shift+click range selection implemented and tested
- ✅ AC2: Ctrl+click individual selection implemented and tested
- ✅ AC3: Plan Card section checkboxes implemented and tested
- ✅ AC4: Consultant Card sections (37 disciplines) implemented with tabs
- ✅ AC5: Contractor Card sections (20 trades) implemented with tabs
- ✅ AC6: Document schedule generation without file copying
- ✅ AC7: Tag filtering for documents implemented
- ✅ AC8: Persistence to database via saveTenderSelection
- ✅ AC9: Session persistence via Zustand persist + loadTenderSelection
- ✅ AC10: Section & item content included in tender output

**Technical Highlights**:
- Custom serialization for Set/Map to support localStorage persistence
- Tab-based UI for consultant/contractor cards (better UX than nested lists)
- Expandable section items with ChevronRight icon
- Visual feedback with blue background for selected rows
- Transaction-based database operations for atomicity
- Comprehensive test coverage with mocked dependencies

**Notes**:
- Story ready for integration testing
- All 5 tasks and 25 subtasks completed
- No TypeScript errors in new files
- Ready for Story 2.6: Tender Package Creation

---

#### Correction Session: Implementation Review (2025-10-27)
**Reviewer**: Benny (Product Owner)
**Status**: ⚠️ **CRITICAL ISSUES IDENTIFIED - NEEDS REWORK**

**Issues Found**:

1. **CRITICAL - Wrong UI Pattern (AC1)**:
   - ❌ Current: `DocumentSelector` has drag-and-drop upload zone
   - ✅ Required: Display existing documents from repository only (NO upload)
   - Impact: Users cannot see project documents for selection
   - Fix: Remove upload zone, fetch documents via `getDocuments(projectId)`

2. **Missing Grouping Structure (AC8, AC9, AC10)**:
   - ❌ Current: Flat document list
   - ✅ Required: Group by Tier 1 folders (Admin, Invoices, Plan, etc.)
   - ✅ Required: Sort by Folder2 within each group (alphanumeric)
   - ✅ Required: Collapse/expand per Tier 1 group + Collapse/Expand All button
   - Impact: Cannot organize documents by project structure
   - Fix: Add grouping logic matching DocumentCard format

3. **Wrong Column Format (AC11)**:
   - ❌ Current: Unknown columns (need to verify implementation)
   - ✅ Required: Folder2 (Tier 2 name ONLY), Filename, Revision, Size, Date
   - ✅ Example: "Feasibility" NOT "Plan/Feasibility" (Tier 1 is already the group header)
   - Impact: Doesn't match Document Card schedule format
   - Fix: Reuse DocumentCard table structure and formatting
   - Fix: Extract only Tier 2 folder name from full path for Folder2 column

4. **Section Selector Not Filtered (AC6, AC7)**:
   - Current: Shows all 37 consultant disciplines and 20 contractor trades
   - ✅ Required: Show ONLY active consultants and contractors from project
   - Impact: Users see irrelevant disciplines/trades
   - Fix: Filter by active consultants/contractors from Story 2.1

5. **Terminology Confusion (AC8)**:
   - "Document schedule" should be called "Document register" or "Document transmittal"
   - This is a reference list, not an actual file schedule
   - No file copying - document IDs only

**Action Required**:
- Update sprint-status.yaml: Change from "done" to "in-progress"
- Developer to rework Task 2 (DocumentSelector) completely
- Developer to update Task 3 (filter sections)
- Developer to rename Task 5 outputs
- Re-test all 14 acceptance criteria

**Estimated Rework**: 3 hours

**Updated Dependencies**:
- Story 2.1 must be complete (document repository with grouping)
- Need `getActiveConsultantsAndContractors()` from Story 2.1 corrections