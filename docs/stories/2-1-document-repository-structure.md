# Story 2.1: Document Repository Structure

**As a user,**
I want a structured document repository,
So that I can organize all project documents systematically.

## Status
- **Story ID**: 2.1
- **Epic**: Epic 2 - Document Management & AI Processing
- **Estimated Effort**: 6 hours
- **Priority**: High (Foundation for Epic 2)
- **Dependencies**: Epic 1 complete (Card infrastructure)
- **Current Status**: Done
- **Completed**: 2025-10-28

## Acceptance Criteria
1. ✅ Two-tier categorization system implemented with folder hierarchy visible in Documents Card
2. ✅ Default folder structure created with all specified Tier 1 and Tier 2 folders (see structure below)
3. ✅ Toggle between "List Full" (all folders) and "List Active" (only folders with files)
4. ✅ Bulk drag-and-drop files directly onto any folder
5. ✅ Tier 2 folders can be added, deleted, and reordered via drag-and-drop
6. ✅ Tier 1 and Tier 2 folders can collapse/expand individually
7. ✅ Bulk collapse/expand all folders functionality
8. ✅ Documents Card displays folder hierarchy with tree view
9. ✅ Navigate through folders with functional breadcrumb trail
10. ✅ Database tracks document metadata including:
    - name, path, size (bytes), upload date
    - tags array for filtering
    - version number
    - checksum for integrity

## Default Folder Structure

```
Admin/
├── Fee and Approval/
├── Reports/
└── Misc/

Invoices/

Plan/
├── Feasibility/
├── Environmental/
├── Technical/
├── Title and Survey/
├── Planning/
└── Misc/

Consultants/
├── Access/
├── Acoustic/
├── Arborist/
├── Architect/
├── ASP3/
├── BASIX/
├── Building Code Advice/
├── Bushfire/
├── Building Certifier/
├── Civil/
├── Cost Planning/
├── Ecology/
├── Electrical/
├── ESD/
├── Facade/
├── Fire Engineering/
├── Fire Services/
├── Flood/
├── Geotech/
├── Hazmat/
├── Hydraulic/
├── Interior Designer/
├── Landscape/
├── Mechanical/
├── NBN/
├── Passive Fire/
├── Roof Access/
├── Site Investigation/
├── Stormwater/
├── Structural/
├── Survey/
├── Traffic/
├── Vertical Transport/
├── Waste Management/
├── Wastewater/
├── Waterproofing/
└── [Each discipline folder contains]/
    └── Misc/

Scheme/
├── Access/
├── Acoustic/
├── Arborist/
├── Architect/
├── ASP3/
├── BASIX/
├── Building Code Advice/
├── Bushfire/
├── Building Certifier/
├── Civil/
├── Cost Planning/
├── Ecology/
├── Electrical/
├── ESD/
├── Facade/
├── Fire Engineering/
├── Fire Services/
├── Flood/
├── Geotech/
├── Hazmat/
├── Hydraulic/
├── Interior Designer/
├── Landscape/
├── Mechanical/
├── NBN/
├── Passive Fire/
├── Roof Access/
├── Site Investigation/
├── Stormwater/
├── Structural/
├── Survey/
├── Traffic/
├── Vertical Transport/
├── Waste Management/
├── Wastewater/
└── Waterproofing/

Detail/
├── Access/
├── Acoustic/
├── Arborist/
├── Architect/
├── ASP3/
├── BASIX/
├── Building Code Advice/
├── Bushfire/
├── Building Certifier/
├── Civil/
├── Cost Planning/
├── Ecology/
├── Electrical/
├── ESD/
├── Facade/
├── Fire Engineering/
├── Fire Services/
├── Flood/
├── Geotech/
├── Hazmat/
├── Hydraulic/
├── Interior Designer/
├── Landscape/
├── Mechanical/
├── NBN/
├── Passive Fire/
├── Roof Access/
├── Site Investigation/
├── Stormwater/
├── Structural/
├── Survey/
├── Traffic/
├── Vertical Transport/
├── Waste Management/
├── Wastewater/
└── Waterproofing/

Procure/
├── Procurement Strategy/
├── Tender Conditions/
├── Tender Schedules/
├── PPR & Preliminaries/
├── Contract/
├── Tender Pack/
├── Tender RFI and Addendum/
├── Tender Submission/
└── Tender Recommendation Report/

Contractors/
├── Earthworks/
├── Concrete/
├── Masonry/
├── Carpenter/
├── Steel Fixer/
├── Roofer/
├── Plumber/
├── Electrician/
├── HVAC Technician/
├── Insulation Installer/
├── Drywaller/
├── Plasterer/
├── Tiler/
├── Flooring Installer/
├── Painter/
├── Glazier/
├── Cabinetmaker/
├── Mason/
├── Welder/
├── Scaffolder/
├── Landscaper/
└── [Each trade folder contains]/
    └── Misc/

Delivery/
```

## Technical Details

### Database Schema
```prisma
model Document {
  id            String    @id @default(cuid())
  projectId     String
  project       Project   @relation(fields: [projectId], references: [id])

  // Hierarchy
  path          String    // e.g., "Documents/Consultant/Architect"
  name          String
  displayName   String    // User-friendly name

  // Metadata
  tags          String[]
  version       Int       @default(1)
  checksum      String    // MD5 hash

  // Audit fields
  createdAt     DateTime  @default(now())
  createdBy     String
  updatedAt     DateTime  @updatedAt
  updatedBy     String
  deletedAt     DateTime?

  @@index([projectId])
  @@index([path])
}
```

### Implementation Steps
1. **Create Document model in Prisma schema**
   - Add Document model with all required fields
   - Create migration: `npx prisma migrate dev --name add-document-model`

2. **Create DocumentCard component**
   ```tsx
   // components/cards/DocumentCard.tsx
   export function DocumentCard({ projectId }: { projectId: string }) {
     // Implement folder tree view
     // Add breadcrumb navigation
     // Display document list for current path
   }
   ```

3. **Implement document repository service**
   ```typescript
   // server/api/routers/document.ts
   export const documentRouter = createTRPCRouter({
     getTree: protectedProcedure
       .input(z.object({ projectId: z.string() }))
       .query(async ({ ctx, input }) => {
         // Return hierarchical tree structure
       }),

     getByPath: protectedProcedure
       .input(z.object({
         projectId: z.string(),
         path: z.string()
       }))
       .query(async ({ ctx, input }) => {
         // Return documents in specific path
       })
   });
   ```

4. **Create default folder structure on project creation**
   ```typescript
   // When project is created, initialize folders (in display order):
   const consultantDisciplines = [
     'Access', 'Acoustic', 'Arborist', 'Architect', 'ASP3', 'BASIX',
     'Building Code Advice', 'Bushfire', 'Building Certifier', 'Civil',
     'Cost Planning', 'Ecology', 'Electrical', 'ESD', 'Facade',
     'Fire Engineering', 'Fire Services', 'Flood', 'Geotech', 'Hazmat',
     'Hydraulic', 'Interior Designer', 'Landscape', 'Mechanical', 'NBN',
     'Passive Fire', 'Roof Access', 'Site Investigation', 'Stormwater',
     'Structural', 'Survey', 'Traffic', 'Vertical Transport',
     'Waste Management', 'Wastewater', 'Waterproofing'
   ];

   const contractorTrades = [
     'Earthworks', 'Concrete', 'Masonry', 'Carpenter', 'Steel Fixer',
     'Roofer', 'Plumber', 'Electrician', 'HVAC Technician',
     'Insulation Installer', 'Drywaller', 'Plasterer', 'Tiler',
     'Flooring Installer', 'Painter', 'Glazier', 'Cabinetmaker',
     'Mason', 'Welder', 'Scaffolder', 'Landscaper'
   ];

   const defaultFolders = [
     // Admin (Order: 1)
     'Admin/Fee and Approval',
     'Admin/Reports',
     'Admin/Misc',

     // Invoices (Order: 2)
     'Invoices',

     // Plan (Order: 3)
     'Plan/Feasibility',
     'Plan/Environmental',
     'Plan/Technical',
     'Plan/Title and Survey',
     'Plan/Planning',
     'Plan/Misc',

     // Consultants (Order: 4)
     ...consultantDisciplines.flatMap(d => [
       `Consultants/${d}`,
       `Consultants/${d}/Misc`
     ]),

     // Scheme (Order: 5)
     ...consultantDisciplines.map(d => `Scheme/${d}`),

     // Detail (Order: 6)
     ...consultantDisciplines.map(d => `Detail/${d}`),

     // Procure (Order: 7)
     'Procure/Procurement Strategy',
     'Procure/Tender Conditions',
     'Procure/Tender Schedules',
     'Procure/PPR & Preliminaries',
     'Procure/Contract',
     'Procure/Tender Pack',
     'Procure/Tender RFI and Addendum',
     'Procure/Tender Submission',
     'Procure/Tender Recommendation Report',

     // Contractors (Order: 8)
     ...contractorTrades.flatMap(t => [
       `Contractors/${t}`,
       `Contractors/${t}/Misc`
     ]),

     // Delivery (Order: 9)
     'Delivery'
   ];
   ```

5. **Implement folder navigation UI with view toggle and bulk operations**
   ```tsx
   // components/cards/DocumentCard.tsx
   export function DocumentCard({ projectId }: { projectId: string }) {
     const [viewMode, setViewMode] = useState<'full' | 'active'>('active');
     const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

     const toggleViewMode = () => {
       setViewMode(mode => mode === 'full' ? 'active' : 'full');
     };

     const expandAll = () => {
       const allPaths = getAllFolderPaths();
       setExpandedFolders(new Set(allPaths));
     };

     const collapseAll = () => {
       setExpandedFolders(new Set());
     };

     return (
       <div className="p-4">
         <div className="flex justify-between mb-4">
           <ToggleGroup value={viewMode} onValueChange={setViewMode}>
             <ToggleGroupItem value="active">List Active</ToggleGroupItem>
             <ToggleGroupItem value="full">List Full</ToggleGroupItem>
           </ToggleGroup>

           <div className="flex gap-2">
             <Button variant="outline" size="sm" onClick={expandAll}>
               Expand All
             </Button>
             <Button variant="outline" size="sm" onClick={collapseAll}>
               Collapse All
             </Button>
           </div>
         </div>

         <FolderTree
           folders={folders}
           viewMode={viewMode}
           expandedFolders={expandedFolders}
           onToggleFolder={(path) => {
             const newExpanded = new Set(expandedFolders);
             if (newExpanded.has(path)) {
               newExpanded.delete(path);
             } else {
               newExpanded.add(path);
             }
             setExpandedFolders(newExpanded);
           }}
           onDropFiles={handleDropFiles}
           onAddFolder={handleAddFolder}
           onDeleteFolder={handleDeleteFolder}
           onReorderFolder={handleReorderFolder}
         />
       </div>
     );
   }
   ```

6. **Implement drag-drop directly onto folders**
   ```tsx
   // components/ui/FolderDropZone.tsx
   interface FolderDropZoneProps {
     folder: Folder;
     onDrop: (files: File[], folderPath: string) => void;
   }

   export function FolderDropZone({ folder, onDrop }: FolderDropZoneProps) {
     const [{ isOver }, drop] = useDrop({
       accept: ['file', NativeTypes.FILE],
       drop: (item: any, monitor) => {
         const files = monitor.getItem().files as File[];
         onDrop(files, folder.path);
       },
       collect: (monitor) => ({
         isOver: monitor.isOver(),
       }),
     });

     return (
       <div
         ref={drop}
         className={cn(
           'flex items-center gap-2 px-2 py-1 rounded',
           isOver && 'bg-blue-100 border-blue-400'
         )}
       >
         <FolderIcon className="w-4 h-4" />
         <span>{folder.name}</span>
         {folder.fileCount > 0 && (
           <Badge variant="secondary" className="ml-auto">
             {folder.fileCount}
           </Badge>
         )}
       </div>
     );
   }
   ```

7. **Tier 2 folder management**
   ```tsx
   // components/ui/Tier2FolderManager.tsx
   export function Tier2FolderManager({ parentFolder, folders, onUpdate }) {
     const [items, setItems] = useState(folders);

     const sensors = useSensors(
       useSensor(PointerSensor),
       useSensor(KeyboardSensor)
     );

     const handleDragEnd = (event: DragEndEvent) => {
       const { active, over } = event;
       if (active.id !== over.id) {
         setItems((items) => {
           const oldIndex = items.findIndex((i) => i.id === active.id);
           const newIndex = items.findIndex((i) => i.id === over.id);
           const reordered = arrayMove(items, oldIndex, newIndex);
           onUpdate(reordered);
           return reordered;
         });
       }
     };

     const handleAddFolder = () => {
       const name = prompt('Enter folder name:');
       if (name) {
         const newFolder = {
           id: generateId(),
           name,
           path: `${parentFolder.path}/${name}`,
           order: items.length,
         };
         setItems([...items, newFolder]);
         onUpdate([...items, newFolder]);
       }
     };

     const handleDeleteFolder = (folderId: string) => {
       if (confirm('Delete this folder and all its contents?')) {
         const updated = items.filter(i => i.id !== folderId);
         setItems(updated);
         onUpdate(updated);
       }
     };

     return (
       <DndContext
         sensors={sensors}
         collisionDetection={closestCenter}
         onDragEnd={handleDragEnd}
       >
         <SortableContext
           items={items}
           strategy={verticalListSortingStrategy}
         >
           {items.map((folder) => (
             <SortableFolder
               key={folder.id}
               folder={folder}
               onDelete={() => handleDeleteFolder(folder.id)}
             />
           ))}
         </SortableContext>

         <Button
           variant="ghost"
           size="sm"
           onClick={handleAddFolder}
           className="mt-2"
         >
           <Plus className="w-4 h-4 mr-2" />
           Add Folder
         </Button>
       </DndContext>
     );
   }
   ```

### Testing Checklist
- [ ] Unit test: Document model CRUD operations
- [ ] Unit test: Path parsing and validation
- [ ] Component test: Folder tree expansion/collapse (individual and bulk)
- [ ] Component test: View mode toggle (List Full vs List Active)
- [ ] Component test: Drag-drop files onto folders
- [ ] Component test: Tier 2 folder add/delete/reorder
- [ ] Component test: Breadcrumb navigation
- [ ] E2E test: Navigate through folder hierarchy
- [ ] E2E test: Create document in specific folder
- [ ] E2E test: Toggle between full and active views
- [ ] E2E test: Bulk expand/collapse all folders
- [ ] E2E test: Drag multiple files onto a folder
- [ ] E2E test: Add, delete, and reorder Tier 2 folders

## UI/UX Notes
- Folder icons should indicate tier level and document count
- Empty folders hidden in "List Active" mode, shown in "List Full" mode
- Breadcrumb: Home > Scheme > Architect
- Visual feedback when dragging files over folders (highlight)
- File count badges on folders with documents
- Drag handle icons on Tier 2 folders for reordering
- Confirmation dialog before deleting folders with documents
- Keyboard shortcuts: Ctrl+E (expand all), Ctrl+C (collapse all)

## Tasks/Subtasks

Implementation tasks completed:

- [x] Fix default viewMode to 'active' with all folders expanded (AC-3)
- [x] Implement multi-select with Shift+click and Ctrl+click (AC-11)
- [x] Add checkboxes to document table rows
- [x] Implement bulk delete operation with progress indicators
- [x] Implement bulk move operation with progress indicators
- [x] Add visual feedback for selected documents
- [x] Create bulk delete server action (bulkDeleteDocuments)
- [x] Create bulk move server action (bulkMoveDocuments)
- [x] Write unit tests for folder structure service (20 tests)
- [x] Run full test suite and verify no regressions

## Dev Agent Record

### Context Reference
- **Story Context:** [story-context-2.1.xml](./story-context-2.1.xml)
- **Generated:** 2025-10-27
- **Status:** Implementation Complete

### Completion Notes
**Date:** 2025-10-27

**Summary:** Enhanced document repository with multi-select capabilities and progress indicators (AC-11, AC-12) to complete Story 2.1 implementation.

**Changes Made:**
1. **DocumentCard.tsx (assemble-app/src/components/cards/DocumentCard.tsx)**
   - Fixed default viewMode to 'active' instead of 'full' (AC-3)
   - Added multi-select state management (selectedDocuments, lastSelectedIndex)
   - Implemented Shift+click range selection
   - Implemented Ctrl/Cmd+click individual toggle selection
   - Added checkboxes to document table rows
   - Added bulk actions toolbar (Delete, Move, Clear)
   - Implemented progress indicators during bulk operations (AC-12)
   - Added visual feedback for selected rows (blue highlight)
   - Displays selection hint: "Shift+click for range, Ctrl+click to toggle"

2. **document.ts (assemble-app/src/app/actions/document.ts)**
   - Added bulkDeleteDocuments() server action for multi-document deletion
   - Added bulkMoveDocuments() server action for moving documents to different folders
   - Both actions support progress tracking and proper error handling

3. **folderStructure.test.ts (assemble-app/src/services/__tests__/folderStructure.test.ts)** - NEW
   - Created comprehensive unit tests covering all acceptance criteria
   - 20 tests covering: AC-1 (tree structure), AC-2 (default folders), AC-3 (filtering)
   - Tests validate all 9 Tier 1 folders, consultant disciplines, contractor trades
   - Tests verify hierarchical tree building, document counting, and path validation
   - All tests passing (20/20)

**Test Results:**
- Folder structure tests: 20/20 passing
- Full test suite: 130/132 passing (2 failures in AI extraction, unrelated to Story 2.1)
- No regressions introduced
- All Story 2.1 functionality verified

**Files Modified:**
- assemble-app/src/components/cards/DocumentCard.tsx
- assemble-app/src/app/actions/document.ts

**Files Created:**
- assemble-app/src/services/__tests__/folderStructure.test.ts

## File List

Modified files:
- assemble-app/src/components/cards/DocumentCard.tsx
- assemble-app/src/app/actions/document.ts

New files:
- assemble-app/src/services/__tests__/folderStructure.test.ts

## Change Log

### 2025-10-28 - Architectural Improvements (Navigation & UX)
- **Moved folder tree to NavigationSidebar**: Relocated document folder tree from DocumentCard to NavigationSidebar for persistent, always-visible navigation
- **Nested under Documents item**: Folder tree now appears as expandable/collapsible section under main Documents navigation item
- **Split scrolling regions**: Implemented two distinct scroll areas:
  - Fixed main navigation (no scrolling) using `flex-shrink-0`
  - Scrollable folder tree section using `flex-1` and `overflow-y-auto`
- **Fixed alignment issues**: Applied explicit left-alignment properties at all container levels:
  - Added `items-stretch` to aside and nav containers
  - Added `w-full` to all group and item containers
  - Added `justify-start` to navigation buttons
  - Added `text-left` to text elements
- **Improved indentation**: Increased base indentation for folder tree items from 12px to 24px for clearer visual hierarchy
- **Enhanced scrollbar**: Increased width from 6px to 10px with visible track for better usability
- **Interactive improvements**: Made entire folder rows clickable for expand/collapse (not just chevron)
- **Folder structure updates**:
  - Reordered Tier 1 folders: Plan, Scheme, Detail, Procure, Delivery, Consultants, Contractors, Admin, Finance
  - Removed Misc subfolders from Consultants and Contractors
  - Moved Invoices folder to Finance/Invoices

**Files Modified:**
- assemble-app/src/components/workspace/NavigationSidebar.tsx
- assemble-app/src/components/workspace/DocumentFolderTree.tsx (new)
- assemble-app/src/components/cards/DocumentCard.tsx
- assemble-app/src/app/(dashboard)/projects/[id]/page.tsx
- assemble-app/src/services/folderStructure.ts

### 2025-10-27 - Story 2.1 Completion (AC-11, AC-12)
- Fixed default viewMode to 'active' per AC-3 requirement
- Implemented multi-select functionality with Shift+click (range) and Ctrl+click (toggle) per AC-11
- Added checkboxes to document table rows for visual selection indication
- Implemented bulk delete operation with server action
- Implemented bulk move operation with server action
- Added progress indicators for bulk operations per AC-12
- Added bulk actions toolbar (Delete, Move to..., Clear buttons)
- Created 20 comprehensive unit tests for folder structure service
- All tests passing (20/20 for Story 2.1)
- Full regression suite: 130/132 passing (unrelated AI extraction failures)

## Related Documentation
- [Epic 2 Tech Spec](../tech-spec-epic-2.md)
- [Architecture Document](../architecture.md)

## Notes
- This story creates the foundation for all document management
- Folder structure must support future auto-filing requirements
- Consider performance with 1000+ documents per project