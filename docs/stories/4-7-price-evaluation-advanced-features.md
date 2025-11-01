# Story 4.7: Price Evaluation - Advanced Features

Status: Draft

## Story

As a user,
I want advanced price evaluation features,
So that I can perform detailed analysis.

## Acceptance Criteria

1. Move items between Table 1 and Table 2 with single click
2. Add/delete/rename additional tables beyond default 2
3. Collapse/expand tables for space management
4. Drag to reorder tables
5. Each new table adds to grand total calculation
6. Export evaluation to Excel

## Tasks / Subtasks

- [ ] Implement move items between tables (AC: #1)
  - [ ] Add "Move to Table X" context menu option in Handsontable rows
  - [ ] Implement server action `moveEvaluationLineItem(itemId, targetTableId)`
  - [ ] Update Zustand store to reflect item movement
  - [ ] Recalculate sub-totals for both source and target tables
  - [ ] Test moving items with nested children (category moves all sub-items)

- [ ] Dynamic table management (AC: #2)
  - [ ] Add "New Table" button in Tender Evaluation section header
  - [ ] Implement table creation dialog (name input, optional description)
  - [ ] Server action `createEvaluationTable(evaluationId, tableName)`
  - [ ] Add delete table icon to table headers (confirm before delete)
  - [ ] Implement inline rename for table headers (double-click to edit)
  - [ ] Cascade delete: removing table deletes all line items

- [ ] Collapsible table UI (AC: #3)
  - [ ] Add chevron icon to each table header (expand/collapse state)
  - [ ] Store collapse state in Zustand and persist to database
  - [ ] Smooth CSS transition for expand/collapse animation
  - [ ] Keyboard shortcut: Ctrl+Click table header to toggle all tables
  - [ ] Preserve collapse state across page reloads

- [ ] Drag-to-reorder tables (AC: #4)
  - [ ] Implement drag handle icon on table headers
  - [ ] Use `@dnd-kit/core` for drag-and-drop functionality
  - [ ] Update `sortOrder` field on drop
  - [ ] Server action `reorderEvaluationTables(tableIds[])`
  - [ ] Optimistic UI update during drag
  - [ ] Test reordering with 5+ tables

- [ ] Grand total recalculation (AC: #5)
  - [ ] Extend `useTenderCalculations` hook to sum across all tables
  - [ ] Display grand total section below all tables
  - [ ] Update grand total whenever any table data changes
  - [ ] Show per-firm totals across all tables in summary row
  - [ ] Highlight grand total row with distinct styling

- [ ] Excel export functionality (AC: #6)
  - [ ] Add "Export to Excel" button in section header
  - [ ] Use Handsontable's built-in export plugin
  - [ ] Include all tables in single workbook (separate sheets)
  - [ ] Preserve formatting: currency, hierarchical indentation
  - [ ] Export filename: `[ProjectName]-Tender-Evaluation-[Date].xlsx`
  - [ ] Test export with multiple tables and nested rows

- [ ] Testing (AC: All)
  - [ ] Test moving items between 3+ tables
  - [ ] Test adding/deleting tables updates grand total correctly
  - [ ] Test collapse/expand with multiple tables
  - [ ] Test drag-to-reorder with various table counts
  - [ ] Test Excel export includes all data and formatting
  - [ ] Test data persistence after table operations

## Dev Notes

### Architecture Patterns

- Extends Story 4.5 Handsontable implementation with multi-table orchestration
- Use Zustand store for table list management and collapse states
- Server actions handle table CRUD operations
- Client-side calculations for grand totals using extended `useTenderCalculations` hook
- Follow existing patterns from Story 1.6 for drag-and-drop (dnd-kit library)

### Components to Create/Modify

- `src/components/tender/PriceEvaluationTable.tsx` (modify) - Add move item context menu
- `src/components/tender/TableManager.tsx` (new) - Orchestrates multiple tables with add/delete/reorder
- `src/components/tender/TableHeader.tsx` (new) - Collapsible header with drag handle and rename
- `src/components/tender/useTenderCalculations.ts` (modify) - Extend to calculate grand totals across all tables
- `src/components/tender/ExcelExportButton.tsx` (new) - Export all tables to Excel
- `src/app/actions/tender.ts` (modify) - Add `moveEvaluationLineItem`, `createEvaluationTable`, `deleteEvaluationTable`, `reorderEvaluationTables`

### Handsontable Features Used

**Context Menu Extension (AC #1):**
```typescript
// Add "Move to Table X" option to context menu
contextMenu: {
  items: {
    'move_item': {
      name: 'Move to...',
      submenu: {
        items: tables.map(table => ({
          key: `move_to_${table.id}`,
          name: table.tableName,
          callback: () => handleMoveItem(selectedRow, table.id)
        }))
      }
    },
    'row_above': {},
    'row_below': {},
    'remove_row': {}
  }
}
```

**Excel Export (AC #6):**
```typescript
import { registerPlugin } from 'handsontable/plugins';
import { ExportFile } from 'handsontable/plugins';

registerPlugin(ExportFile);

// Export all tables to Excel
function handleExcelExport() {
  const exportPlugin = hotTableRef.current?.hotInstance.getPlugin('exportFile');

  exportPlugin.downloadFile('xlsx', {
    filename: `${projectName}-Tender-Evaluation-${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Price Evaluation',
    exportHiddenRows: false,
    exportHiddenColumns: false
  });
}
```

### Multi-Table Management Implementation

```typescript
// src/components/tender/TableManager.tsx
'use client';

import { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { PriceEvaluationTable } from './PriceEvaluationTable';
import { TableHeader } from './TableHeader';
import { useTenderCalculations } from './useTenderCalculations';

export function TableManager({ evaluation, firms }: TableManagerProps) {
  const [tables, setTables] = useState(evaluation.tables);
  const { grandTotal } = useTenderCalculations(tables, firms);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const newOrder = arrayMove(tables, active.id, over.id);
      setTables(newOrder);
      await reorderEvaluationTables(newOrder.map(t => t.id));
    }
  };

  const handleAddTable = async (tableName: string) => {
    const newTable = await createEvaluationTable(evaluation.id, tableName);
    setTables([...tables, newTable]);
  };

  const handleDeleteTable = async (tableId: string) => {
    if (confirm('Delete this table and all its items?')) {
      await deleteEvaluationTable(tableId);
      setTables(tables.filter(t => t.id !== tableId));
    }
  };

  return (
    <div className="table-manager space-y-6">
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tables.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tables.map((table) => (
            <CollapsibleTable
              key={table.id}
              table={table}
              firms={firms}
              onDelete={handleDeleteTable}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button onClick={() => handleAddTable(`Table ${tables.length + 1}`)}>
        + Add Table
      </button>

      {/* Grand Total Section */}
      <div className="grand-total-section border-t-4 border-gray-800 pt-4 mt-6">
        <h3 className="text-xl font-bold mb-2">Grand Total (All Tables)</h3>
        <div className="flex justify-between">
          {firms.map(firm => (
            <div key={firm.id} className="text-center">
              <p className="font-semibold">{firm.name}</p>
              <p className="text-2xl">
                ${grandTotal[firm.id]?.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Collapsible Table Component

```typescript
// src/components/tender/CollapsibleTable.tsx
'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, GripVertical, Trash2 } from 'lucide-react';
import { PriceEvaluationTable } from './PriceEvaluationTable';

export function CollapsibleTable({ table, firms, onDelete }: CollapsibleTableProps) {
  const [isCollapsed, setIsCollapsed] = useState(table.isCollapsed || false);
  const [isEditingName, setIsEditingName] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: table.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleRename = async (newName: string) => {
    await renameEvaluationTable(table.id, newName);
    setIsEditingName(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg">
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="cursor-grab">
          <GripVertical size={20} className="text-gray-400" />
        </div>

        {/* Collapse Toggle + Table Name */}
        <div className="flex items-center gap-2 flex-1">
          <button onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
          </button>

          {isEditingName ? (
            <input
              autoFocus
              defaultValue={table.tableName}
              onBlur={(e) => handleRename(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename(e.currentTarget.value)}
              className="border rounded px-2 py-1"
            />
          ) : (
            <h3
              className="text-lg font-semibold cursor-pointer"
              onDoubleClick={() => setIsEditingName(true)}
            >
              {table.tableName}
            </h3>
          )}
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(table.id)}
          className="text-red-600 hover:text-red-800"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Table Content */}
      {!isCollapsed && (
        <div className="p-4">
          <PriceEvaluationTable
            tableNumber={table.tableNumber}
            tableName={table.tableName}
            firms={firms}
            initialData={table.items}
            onDataChange={(data) => handleTableDataChange(table.id, data)}
          />
        </div>
      )}
    </div>
  );
}
```

### Extended Calculation Hook

```typescript
// src/components/tender/useTenderCalculations.ts (modified)
import { useMemo } from 'react';

export function useTenderCalculations(tables: EvaluationTable[], firms: Firm[]) {
  return useMemo(() => {
    // Calculate per-table sub-totals (existing logic from Story 4.5)
    const tablesWithTotals = tables.map(table => {
      const categoriesWithTotals = table.items.map((category) => {
        const subTotal = category.__children?.reduce(
          (sum, item) => sum + (item.amount || 0),
          0
        ) || 0;
        return { ...category, subTotal, __children: category.__children };
      });

      const tableTotal = categoriesWithTotals.reduce(
        (sum, cat) => sum + cat.subTotal,
        0
      );

      return { ...table, categoriesWithTotals, tableTotal };
    });

    // NEW: Calculate grand total across all tables (AC #5)
    const grandTotal = {};
    firms.forEach(firm => {
      grandTotal[firm.id] = tablesWithTotals.reduce((sum, table) => {
        return sum + (table.tableTotal[firm.id] || 0);
      }, 0);
    });

    return { tablesWithTotals, grandTotal };
  }, [tables, firms]);
}
```

### Server Actions

```typescript
// src/app/actions/tender.ts (additions)
'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function moveEvaluationLineItem(itemId: string, targetTableId: string) {
  await db.evaluationLineItem.update({
    where: { id: itemId },
    data: { tableId: targetTableId }
  });

  revalidatePath('/projects/[id]');
  return { success: true };
}

export async function createEvaluationTable(evaluationId: string, tableName: string) {
  const existingTables = await db.tenderEvaluationTable.count({
    where: { evaluationId }
  });

  const newTable = await db.tenderEvaluationTable.create({
    data: {
      evaluationId,
      tableNumber: existingTables + 1,
      tableName,
      sortOrder: existingTables + 1,
      subTotal: 0
    }
  });

  revalidatePath('/projects/[id]');
  return newTable;
}

export async function deleteEvaluationTable(tableId: string) {
  // Cascade delete handled by Prisma schema onDelete: Cascade
  await db.tenderEvaluationTable.delete({
    where: { id: tableId }
  });

  revalidatePath('/projects/[id]');
  return { success: true };
}

export async function renameEvaluationTable(tableId: string, newName: string) {
  await db.tenderEvaluationTable.update({
    where: { id: tableId },
    data: { tableName: newName }
  });

  revalidatePath('/projects/[id]');
  return { success: true };
}

export async function reorderEvaluationTables(tableIds: string[]) {
  await Promise.all(
    tableIds.map((id, index) =>
      db.tenderEvaluationTable.update({
        where: { id },
        data: { sortOrder: index + 1 }
      })
    )
  );

  revalidatePath('/projects/[id]');
  return { success: true };
}
```

### Data Model Extensions

```prisma
// Add to existing TenderEvaluationTable model (from Story 4.5)
model TenderEvaluationTable {
  id                String   @id @default(cuid())
  evaluationId      String
  evaluation        TenderEvaluation @relation(fields: [evaluationId], references: [id])
  tableNumber       Int
  tableName         String
  items             EvaluationLineItem[]
  subTotal          Decimal  @db.Decimal(12, 2)
  sortOrder         Int
  isCollapsed       Boolean  @default(false)  // NEW: Collapse state (AC #3)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([sortOrder])  // NEW: For efficient ordering
}
```

### Testing Standards

- **Unit tests**:
  - Test `useTenderCalculations` grand total calculation with 1-5 tables
  - Test move item logic updates both source and target table totals
  - Test reorder tables updates sortOrder correctly

- **Integration tests**:
  - Test context menu "Move to Table X" with Handsontable
  - Test add/delete table updates Zustand store and database
  - Test collapse/expand state persistence
  - Test drag-to-reorder with @dnd-kit

- **E2E tests** (Playwright):
  - Complete workflow: Add 3rd table → Move items → Collapse Table 1 → Reorder → Export to Excel
  - Test Excel export file integrity (download, open in Excel, verify data)
  - Test with 5 tables and 50+ line items (performance)

### Performance Considerations

- **Bundle Size**: `@dnd-kit/core` adds ~15 KB gzipped (lightweight drag-and-drop)
- **Calculation Throttling**: Debounce grand total recalculation to 300ms when items move
- **Virtual Scrolling**: Handsontable's virtualization handles large datasets (100+ items per table)
- **Optimistic Updates**: UI updates immediately on drag, server syncs in background

### Project Structure Notes

- Follows existing `src/components/tender/` structure from Story 4.5
- Reuses Handsontable installation and configuration from Story 4.5
- Drag-and-drop pattern follows Story 1.6 (if drag-drop previously implemented)
- Excel export uses Handsontable's built-in ExportFile plugin (no additional dependencies)

### References

- [Source: docs/epics.md#Epic 4, Story 4.7]
- [Source: docs/stories/4-5-tender-evaluation-price-setup.md] - Foundational Handsontable implementation
- [Source: docs/architecture.md#ADR-007] - Handsontable decision
- [Source: docs/PRD.md#FR012_TE] - Tender Evaluation requirements

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
