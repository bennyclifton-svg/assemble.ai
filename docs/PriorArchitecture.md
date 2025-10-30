# UI Architecture

## Overview

The Assemble.ai UI is built using a component-based architecture with React 19 and Next.js 15. The system uses Zustand for state management, providing a clean separation between UI components and application state.

## Architecture Principles

1. **Component Composition**: Complex UIs built from smaller, reusable components
2. **State Centralization**: All data and view state managed in Zustand stores
3. **Unidirectional Data Flow**: Data flows down via props, actions flow up via callbacks
4. **Separation of Concerns**: UI components separated from business logic
5. **Real-Time Synchronization**: Parent-child relationships maintained for instant updates

---

## Component Hierarchy

```
App
└── RootLayout
    └── DndProvider
        ├── Header (Fixed top navigation)
        │   ├── Logo & Branding
        │   └── Layout Toggle Button
        │
        └── Main Content Area
            ├── Sidebar (Navigation)
            │   ├── Project Header
            │   ├── Card Groups
            │   │   ├── Core Cards Group
            │   │   ├── Project Resources Group
            │   │   └── Project Control Group
            │   └── Footer Stats
            │
            └── ProjectView (Main Content)
                ├── Multi-Card Layout (Grid/Stacked)
                │   ├── Core Card (selected)
                │   ├── Cross Card (selected)
                │   └── Control Card (selected)
                │
                └── Card Rendering
                    ├── Card Header (with gradient)
                    ├── Special Views
                    │   ├── ConsultantCardTabs (for Consultants)
                    │   └── DocumentsCardContent (for Documents)
                    └── Standard Card Content
                        └── Sections
                            └── Items
```

---

## State Management Architecture

### Two-Store Pattern

The application uses **two independent Zustand stores**:

#### 1. Main Data Store (`store.ts`)

**Purpose**: Manages all application data entities

**State Structure**:
```typescript
interface AppState {
  // Normalized entities
  project: Project | null;
  cards: Record<string, Card>;      // Indexed by card ID
  sections: Record<string, Section>;  // Indexed by section ID
  items: Record<string, Item>;       // Indexed by item ID
  files: Record<string, FileMetadata>; // Indexed by file ID

  // Upload tracking
  uploads: Record<string, UploadProgress>;

  // Multi-selection
  selectedIds: Set<string>;
  lastSelectedId: string | null;

  // Actions
  setProject, setCards, addSection, addItem, deleteSection, deleteItem, ...
}
```

**Key Characteristics**:
- Normalized data structure for efficient lookups
- Parent-child relationships maintained in **both** normalized stores AND relationship arrays
- Reactive hooks for component subscriptions
- Automatic persistence via API calls

#### 2. View State Store (`viewStore.ts`)

**Purpose**: Manages UI state independent of data

**State Structure**:
```typescript
interface ViewState {
  // Card Selection (Triple-Card System)
  selectedCoreCardId: string | null;
  selectedCrossCardId: string | null;
  selectedControlCardId: string | null;

  // Layout Mode
  viewLayout: 'stacked' | 'side-by-side';  // Default: 'side-by-side'

  // Sidebar Expansion
  expandedCards: Set<string>;
  expandedSections: Set<string>;

  // Highlighted Elements (for navigation)
  highlightedSectionId: string | null;
  highlightedItemId: string | null;
  highlightedFileId: string | null;

  // Actions
  selectCoreCard, selectCrossCard, selectControlCard,
  toggleLayout, toggleCardExpanded, toggleSectionExpanded, ...
}
```

**Key Characteristics**:
- Separate from data state for flexibility
- Persists UI preferences
- No API calls (pure client state)
- Fast updates without data re-fetching

---

## Card Type System

### Three Card Categories

The application organizes cards into **three distinct categories**, allowing one card from each to be displayed simultaneously:

#### 1. Core Cards (5 total)
**Purpose**: Project phase organization

Cards:
- **Plan** (INITIATE): Project initiation and planning
- **Scheme**: Schematic design phase
- **Detail**: Detailed design phase
- **Procure**: Procurement and tendering
- **Deliver**: Construction delivery

**Properties**:
- `isCore: true`
- Fixed position in sidebar
- Blue → Purple gradient header
- Selected via `selectedCoreCardId`

#### 2. Cross-Functional Cards (2 total)
**Purpose**: Team and stakeholder management

Cards:
- **Consultants**: Consultant coordination and management
- **Contractors**: Contractor management

**Properties**:
- `isCore: false`
- `type: 'CONSULTANTS' | 'CONTRACTORS'`
- Purple → Blue gradient header (reversed)
- Selected via `selectedCrossCardId`
- Special UI for Consultants (tab navigation)

#### 3. Control Cards (2 total)
**Purpose**: Project control and governance

Cards:
- **Documents**: Document management system
- **Regulation**: Regulatory compliance

**Properties**:
- `isCore: false`
- `type: 'DOCUMENTS' | 'REGULATION'`
- Amber → Orange gradient header
- Selected via `selectedControlCardId`
- Special UI for Documents (folder navigation)

---

## Multi-Card Layout System

### Layout Modes

#### Side-by-Side Layout (Default)
- **Description**: Cards displayed horizontally in a grid
- **Grid Columns**:
  - 1 card selected: Full width
  - 2 cards selected: `grid-cols-2`
  - 3 cards selected: `grid-cols-3`
- **Use Case**: Maximum information density, desktop-optimized

#### Stacked Layout (Alternative)
- **Description**: Cards displayed vertically
- **Layout**: `space-y-3` (vertical spacing)
- **Use Case**: Single-card focus, vertical scrolling

### Selection Logic

```typescript
// Card selection is managed per category
viewStore.selectCoreCard(cardId)       // Select from Core cards
viewStore.selectCrossCard(cardId)      // Select from Cross cards
viewStore.selectControlCard(cardId)    // Select from Control cards

// Each selection is independent
// Example state:
{
  selectedCoreCardId: 'plan-card-id',
  selectedCrossCardId: 'consultants-card-id',
  selectedControlCardId: 'documents-card-id',
}
```

### Default Behavior

On initial load:
1. **First Core Card** selected (usually Plan/INITIATE)
2. **Consultants Card** selected (cross-functional)
3. **Documents Card** selected (control)
4. Layout mode: **side-by-side**

Result: User sees 3 cards immediately (Plan | Consultants | Documents)

---

## Component Communication Patterns

### Pattern 1: Parent → Child (Props)

```typescript
// Parent passes data down
<Card card={selectedCard} />

// Child receives and renders
function Card({ card }: CardProps) {
  return <div>{card.name}</div>
}
```

### Pattern 2: Child → Parent (Callbacks)

```typescript
// Parent provides callback
<FileUploadZone onUploadComplete={handleUpload} />

// Child calls callback
function FileUploadZone({ onUploadComplete }) {
  const upload = async () => {
    await uploadFile(...)
    onUploadComplete() // Notify parent
  }
}
```

### Pattern 3: Store → Components (Hooks)

```typescript
// Component subscribes to store
function ProjectView() {
  const selectedCoreCardId = useSelectedCoreCardId()
  const cards = useCards()

  const selectedCard = cards.find(c => c.id === selectedCoreCardId)

  return <Card card={selectedCard} />
}
```

### Pattern 4: Components → Store (Actions)

```typescript
// Component dispatches action
function CardItem({ card }) {
  const selectCoreCard = useViewStore(state => state.selectCoreCard)

  const handleClick = () => {
    selectCoreCard(card.id) // Update store
  }

  return <button onClick={handleClick}>{card.name}</button>
}
```

---

## Routing and Navigation

### Client-Side Routing

The application uses **client-side routing** via state management:

1. **No URL changes**: Navigation handled by store state, not router
2. **Sidebar navigation**: Clicking cards updates `selectedCoreCardId` etc.
3. **Deep linking**: Not currently implemented (future enhancement)
4. **Browser back/forward**: Not currently implemented (future enhancement)

### Navigation Flow

```
User clicks "Consultants" in sidebar
  ↓
CardItem.handleClick() called
  ↓
selectCrossCard('consultants-id') dispatched
  ↓
viewStore.selectedCrossCardId updated
  ↓
ProjectView re-renders with new selection
  ↓
ConsultantCardTabs component rendered
```

---

## Special Card Implementations

### Consultants Card

**Unique Behavior**: Tab navigation instead of section list

**Component**: `ConsultantCardTabs`

**Architecture**:
```
ConsultantCardTabs
├── Horizontal Tab Bar
│   └── Consultant Tabs (dynamically fetched from "Consultant List")
└── Content Area
    └── Sections for Selected Consultant
        ├── Firms Section
        ├── Background Section
        ├── Service Brief Section
        ├── Deliverables Section
        └── ... (10 standard sections)
```

**Data Source**: Consultants pulled from "Consultant List" sections in Core Cards (filtered by `isActive: true`)

**State**: Local state tracks `selectedConsultantId`

### Consultant Active State Workflow

**Purpose**: Dynamic feature activation for consultants via checkbox control

**Architecture Overview**:

All 29 consultants from the COMMERCIAL type are seeded by default with `isActive: false`. Users activate consultants by checking the "Active" checkbox, which creates dedicated sections in the Consultants card.

**Element Order in ConsultantRow**:
```
[Consultant Name] [Active Checkbox] [Brief] [Tender] [Rec] [Contract] [Delete]
```

**Workflow**:

**1. Initial State (All Consultants Inactive)**
```typescript
// Project creation seeds all 29 COMMERCIAL consultants
metadata: {
  status: 'brief',
  projectType: 'HOUSE',
  isActive: false  // Default: inactive
}
```

**2. Activation (User Checks "Active" Checkbox)**
```typescript
// Frontend: ConsultantRow.tsx → handleActiveToggle()
activateConsultant(consultantItemId)
  ↓
// Backend: ConsultantService.ts → activateConsultant()
- Find Consultants card
- Create 5 mandatory sections:
  1. [Discipline] - Firms
  2. [Discipline] - Background
  3. [Discipline] - Service Brief
  4. [Discipline] - Deliverables
  5. [Discipline] - Fee Structure
- Update metadata: { isActive: true }
  ↓
// Frontend: Store update
- Update item in store
- Add sections to store (via addSection)
- ConsultantCardTabs re-renders with new tab
- Sidebar shows new consultant sections
```

**3. Deactivation (User Unchecks "Active" Checkbox)**
```typescript
// Check for associated data first
hasData = await checkConsultantHasData(consultantItemId)
if (hasData) {
  // Show confirmation dialog
  confirm("This consultant has existing data. Deactivate anyway?")
}
  ↓
// Backend: ConsultantService.ts → deactivateConsultant()
- Find all sections matching consultantItemId
- Soft-delete sections (set deletedAt timestamp)
- Update metadata: { isActive: false }
  ↓
// Frontend: Store update
- Update item in store
- Tab disappears from ConsultantCardTabs
- Sections hidden from sidebar
```

**UI States**:

| State | Active Checkbox | Status Buttons | Sections | Tab Visible |
|-------|----------------|----------------|----------|-------------|
| Inactive | Unchecked | Ghosted (`opacity-40`) | Not created | No |
| Activating | Disabled | Ghosted | Creating... | No |
| Active | Checked | Interactive | Created | Yes |
| Deactivating | Disabled | Ghosted | Soft-deleting... | Yes |

**Data Filtering**:
- ConsultantCardTabs: Only displays consultants with `metadata.isActive === true`
- ConsultantTabs: Only creates tabs for active consultants
- Consultant List: Shows ALL consultants (both active and inactive) for management

**Multi-Select Behavior**:
- Works on both active AND inactive consultants
- Shift+click: Range selection
- Ctrl/Cmd+click: Multi-selection
- Bulk delete: Works on all selected items

**API Endpoints**:
```
POST /items/:id/activate      → Create sections, set isActive: true
POST /items/:id/deactivate    → Soft-delete sections, set isActive: false
GET  /items/:id/has-data      → Check if consultant has associated data
```

**Section Naming Convention**:
```
Format: "[Consultant Discipline] - [Section Name]"
Example: "Architect - Firms"
         "Structural - Background"
```

**Metadata Tracking**:
```typescript
// Item metadata (consultant)
{
  status: 'brief' | 'tender' | 'recommendation' | 'contract',
  projectType: 'KITCHEN_BATH' | 'HOUSE' | 'COMMERCIAL',
  isActive: boolean
}

// Section metadata (created for consultant)
{
  consultantItemId: string,      // Links section to consultant
  sectionType: string            // e.g., 'firms', 'background'
}
```

### Documents Card

**Unique Behavior**: Folder navigation + full DMS interface

**Component**: `DocumentsCardContent`

**Architecture**:
```
DocumentsCardContent
├── Folder Tab Bar
│   ├── All Documents
│   ├── Plan
│   ├── Scheme
│   ├── Detail
│   ├── Procure
│   └── Deliver
├── File Upload Zone
├── File List
└── Modals
    ├── File Preview
    └── Metadata Editor
```

**Filtering**: Files filtered by tags matching folder names

**State**: Local state tracks `selectedFolder`

### Tender Document Schedule Manager

**Location**: Consultants Card → Tender Document Section

**Unique Behavior**: Cross-card content retrieval system with strict source validation

**Component**: `TenderDocumentSchedule`

**Architecture**:
```
TenderDocumentSection
├── Section Header with Action Buttons
│   ├── Retrieve Button (Blue)
│   ├── Clear Button (Gray)
│   └── Update Button (Blue)
└── TenderDocumentSchedule Component
    ├── Empty State (when schedule.length === 0)
    └── Schedule Table (when documents added)
        ├── Grouped by Source Section
        │   ├── Plan Documents
        │   ├── Scheme Documents
        │   ├── Detail Documents
        │   ├── Procure Documents
        │   └── Deliver Documents
        └── Columns: File Name, Owner, Revision
```

**Data Flow**:
```typescript
1. User selects files in Documents Card
2. User navigates to Consultants > Tender Document section
3. User clicks "Retrieve" button
4. System validates:
   - Are selected files from Documents card?
   - Are they already in schedule (duplicate check)?
5. If valid:
   - Fetch file metadata from store or API
   - Extract revision, owner, tags
   - Group by tags (source folder)
   - Add to schedule state
6. If invalid:
   - Show alert: "Please select documents from the Documents card"
```

**Source Validation Logic**:
```typescript
// Find Documents card ID
const documentsCard = Object.values(allCards).find(card => card.type === 'DOCUMENTS');
const documentsCardId = documentsCard?.id;

// Validate each selected file
for (const fileId of selectedIds) {
  let file = allFiles[fileId];

  // Fetch from API if not in store
  if (!file) {
    file = await getFile(fileId);
  }

  // Validate parent is Documents card
  if (file.parentType === 'card' && file.parentId === documentsCardId) {
    // Valid - add to schedule
  } else {
    // Invalid - reject with error count
  }
}
```

**Grouping Logic**:
```typescript
// Group by source section (first tag)
const getSectionName = (file: FileMetadata): string => {
  if (file.tags && file.tags.length > 0) {
    return file.tags[0];  // "Plan", "Scheme", "Detail", etc.
  }
  return 'Uncategorized';
};

// Render groups
Object.entries(groupedBySection).map(([section, docs]) => (
  <div key={section}>
    <h3>{section}</h3>
    <table>
      {docs.map(doc => (
        <tr>
          <td>{doc.fileName}</td>
          <td>{doc.owner}</td>
          <td>{doc.revision}</td>
        </tr>
      ))}
    </table>
  </div>
));
```

**Action Behaviors**:

1. **Retrieve**:
   - Validates source (Documents card only)
   - Prevents duplicates by file ID
   - Fetches from API if file not in global store
   - Shows error count if some files rejected

2. **Clear**:
   - Removes all documents from schedule
   - Requires confirmation
   - Clears selection in Documents card

3. **Update**:
   - Refreshes revision info for all schedule documents
   - Fetches latest metadata from API
   - Updates owner and revision fields
   - Maintains grouping structure

**Ref Exposure Pattern**:
```typescript
// Parent can imperatively trigger actions
const scheduleRef = useRef<TenderDocumentScheduleActions>(null);

<TenderDocumentSchedule ref={scheduleRef} />

// Parent calls
scheduleRef.current?.retrieve();
scheduleRef.current?.clear();
scheduleRef.current?.update();
```

---

## File Categorization System

### Tag-Based Organization

**Philosophy**: Files are automatically categorized by the active folder when uploaded to the Documents card.

**Tag Mapping**:
- "Plan" folder → `tags: ["Plan"]`
- "Scheme" folder → `tags: ["Scheme"]`
- "Detail" folder → `tags: ["Detail"]`
- "Procure" folder → `tags: ["Procure"]`
- "Deliver" folder → `tags: ["Deliver"]`
- "All Documents" folder → No automatic tag

**Upload Flow**:
```typescript
// 1. DocumentsCardContent determines active folder
const selectedFolder = useViewStore(state => state.selectedDocFolder);
const activeFolder = DEFAULT_FOLDERS.find(f => f.id === selectedFolder);
const activeFolderTags = activeFolder?.tag ? [activeFolder.tag] : undefined;

// 2. Pass tags to FileUploadZone
<FileUploadZone
  parentId={cardId}
  parentType="card"
  tags={activeFolderTags}  // ["Plan"] or ["Scheme"] etc.
/>

// 3. FileUploadZone passes to uploadFile API
const uploadFile = async (file, options) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('parentId', options.parentId);
  formData.append('parentType', options.parentType);

  // Add tags for categorization
  if (options.tags) {
    formData.append('tags', JSON.stringify(options.tags));
  }

  await fetch('/api/v1/files/upload', {
    method: 'POST',
    body: formData
  });
};

// 4. Backend saves file with tags
// FileMetadata.tags = ["Plan"]
```

**Filtering by Tags**:
```typescript
// In Documents card folder view
const filteredFiles = files.filter(file => {
  if (selectedFolder === 'all') {
    return true;  // Show all files
  }

  // Match folder name with file tags
  const folderName = DEFAULT_FOLDERS.find(f => f.id === selectedFolder)?.name;
  return file.tags && file.tags.includes(folderName);
});
```

**Benefits**:
- Automatic organization without manual tagging
- Consistent categorization across features
- Enables cross-card filtering (Tender Document Schedule)
- Maintains file provenance (which phase it belongs to)

---

## Global Density Standards

### Minimal Vertical Padding

**Philosophy**: Maximum information density matching sidebar navigation style throughout the application.

**Implementation Values**:

```typescript
// Table Headers
className="px-4 py-1.5 text-sm"
// Padding: 16px horizontal, 6px vertical
// Text: 14px (STANDARDIZED)

// Table Rows
className="px-4 py-0.5 text-sm"
// Padding: 16px horizontal, 2px vertical
// Text: 14px (STANDARDIZED)

// Sidebar Items
className="px-2 py-0.5 text-sm"
// Padding: 8px horizontal, 2px vertical
// Text: 14px (STANDARDIZED)

// Icons (uniform throughout)
className="w-4 h-4"
// Size: 16x16px

// Action Button Spacing
className="space-x-1.5"
// Horizontal gap: 6px between buttons
```

**Typography Standardization**: All primary text elements use `text-sm` (14px) for global consistency and improved legibility. This applies uniformly to tables, sidebar navigation, forms, and all data displays.

**Applied Throughout**:
- FileListTable.tsx (Documents card file list)
- TenderDocumentSchedule.tsx (schedule table)
- FileListByFolder.tsx (sidebar file items)
- All future table components

**Rationale**:
- Maximizes visible rows/items on screen
- Reduces scrolling for professional users
- Maintains consistency with sidebar density
- Still meets minimum touch target size (with padding)

---

## Data Model Enhancements

### FileMetadata Interface

```typescript
interface FileMetadata {
  // Standard fields
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  parentId: string;
  parentType: 'card' | 'section' | 'item';

  // New/Enhanced fields
  revision: string | null;          // Display: "Rev: 0", "Rev: A", etc.
  tags: string[];                   // For categorization ["Plan", "Scheme", ...]
  scanStatus: 'PENDING' | 'SCANNING' | 'SAFE' | 'INFECTED';  // Backend only
}
```

**Display Formats**:

```typescript
// Revision Field
display: file.revision || 'Rev: 0'
examples: "Rev: 0", "Rev: A", "Rev: B", "Rev: 1.0"

// Tags Field (first tag used for section grouping)
sourceSection: file.tags[0] || 'Uncategorized'

// Removed from UI
// scanStatus - Security scanning not user-facing
// Status column removed from all file tables
```

**Migration Notes**:
- Existing files without `revision` field display "Rev: 0"
- Existing files without `tags` show as "Uncategorized"
- `scanStatus` still stored in database but not displayed in UI

---

## Visual Design Standards

### Card Header Transparency

**Opacity**: 50% (Tailwind: `/50` suffix)

**Implementation**:
```typescript
const getCardColorClass = (): string => {
  if (card.isCore) {
    return 'bg-gradient-to-r from-blue-600/50 to-purple-600/50';
  }
  if (card.type === 'DOCUMENTS' || card.type === 'REGULATION') {
    return 'bg-gradient-to-r from-amber-600/50 to-orange-600/50';
  }
  return 'bg-gradient-to-r from-purple-600/50 to-blue-600/50';
};
```

**Visual Effect**:
- Semi-transparent headers allow dark background to show through
- Creates depth and visual hierarchy
- Maintains color distinction between card types
- Elegant, modern aesthetic

**Previous Value**: 90% opacity (`/90`) - changed to 50% for subtlety

---

## Responsive Behavior

### Sidebar Width
- **Desktop**: 288px (`w-72`) - 10% narrower than original design
- **Tablet**: Same (responsive design not fully implemented yet)
- **Mobile**: Future enhancement

### Card Layout
- **Desktop**: Side-by-side (3 columns)
- **Tablet**: Stacked or 2 columns (responsive behavior to be added)
- **Mobile**: Future enhancement

### Content Overflow
- **Sidebar**: Vertical scroll for card list
- **Main Content**: Vertical scroll for card content
- **Card Headers**: Fixed during scroll

---

## Performance Optimizations

### 1. Memoized Selectors

```typescript
// Prevents unnecessary re-renders
export const useCards = () => {
  return useStore(
    useShallow((state) => {
      const project = state.project;
      if (!project) return [];

      return project.cards
        .map((card) => state.cards[card.id] || card)
        .sort((a, b) => a.position - b.position);
    })
  );
};
```

### 2. Normalized State

- Entities stored in `Record<string, Entity>` for O(1) lookups
- Parent-child relationships maintained separately
- Reduces redundant data

### 3. Local Component State

- UI state (hover, expanded, etc.) kept local when possible
- Only global state goes in Zustand stores
- Reduces store update frequency

### 4. Auto-Refresh Intervals

- Document list: 5 second refresh
- Scan status updates: Polled every 5 seconds
- Prevents constant re-fetching

---

## Extension Points

### Adding New Card Types

1. Define card type in database schema
2. Add type to `CardType` enum in types.ts
3. Create card entry in default project seed
4. Implement custom UI component (optional)
5. Add conditional rendering in Card.tsx
6. Update color scheme in `getCardColorClass()`

### Adding New Stores

```typescript
// Create new store file
export const useFeatureStore = create<FeatureState>((set) => ({
  // State
  featureData: null,

  // Actions
  setFeatureData: (data) => set({ featureData: data }),
}));

// Use in components
function FeatureComponent() {
  const featureData = useFeatureStore((state) => state.featureData);
  return <div>{featureData}</div>;
}
```

### Adding New Special Views

```typescript
// In Card.tsx, add new condition
{card.type === 'YOUR_CARD_TYPE' ? (
  <YourCustomComponent cardId={card.id} />
) : (
  // Regular sections
  <div>...</div>
)}
```

---

## Best Practices

### 1. Component Design
- Keep components small and focused (Single Responsibility Principle)
- Use TypeScript interfaces for props
- Provide default prop values
- Document complex components with comments

### 2. State Management
- Use normalized stores for entities
- Use view store for UI state
- Keep local state when data doesn't need to be shared
- Update parent arrays when modifying child entities

### 3. Performance
- Use `useShallow` for Zustand selectors to prevent unnecessary re-renders
- Memoize expensive computations with `useMemo`
- Use callback refs for DOM manipulation
- Lazy load heavy components

### 4. Error Handling
- Wrap API calls in try-catch blocks
- Show user-friendly error messages
- Log errors for debugging
- Provide fallback UI for error states

---

## Future Enhancements

1. **URL-based routing**: Deep linking to specific cards/sections
2. **Mobile responsive design**: Optimized layouts for mobile devices
3. **Virtualized lists**: Handle 1000+ items without performance degradation
4. **Offline support**: Service workers and IndexedDB caching
5. **Real-time collaboration**: WebSocket updates for multi-user editing
6. **Undo/redo**: Command pattern for action history
7. **Keyboard shortcuts**: Global hotkeys for power users
8. **Search**: Global search across all cards, sections, and items

---

## Troubleshooting

### Issue: Sections/items don't appear after creation
**Solution**: Ensure `addSection`/`addItem` updates both normalized store AND parent relationship array

### Issue: Cards not selecting properly
**Solution**: Check if correct selection action is called (selectCoreCard vs selectCrossCard vs selectControlCard)

### Issue: Layout not responsive
**Solution**: Verify viewLayout state and grid classes applied correctly

### Issue: Real-time updates not working
**Solution**: Check if useEffect dependencies include proper state variables

---

## References

### Internal Documentation
- [UI Design Standards](./UI-DESIGN-STANDARDS.md) - Global density, typography, color standards
- [Design System Config](./standards/config.yml) - Machine-readable design system values
- [Component Library](./COMPONENT-LIBRARY.md)
- [Design System](./DESIGN-SYSTEM.md)

### External Resources
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React 19 Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
