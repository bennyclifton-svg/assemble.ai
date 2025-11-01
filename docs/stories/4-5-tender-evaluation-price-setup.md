# Story 4.5: Tender Evaluation - Price Setup

Status: Draft

## Story

As a user,
I want price evaluation tables for comparing submissions,
So that I can analyze pricing systematically.

## Acceptance Criteria

1. Display firms side-by-side (those marked as short-listed in Consultant/Contractor Card Firms section)
2. Table 1 - Original with fee structure retrieved from tender package
3. Table 2 - Adds and Subs with 3 default items
4. Add/delete line items in both tables
5. Hierarchical structure support (categories and sub-items with sub-totals)
6. Sub-total calculations for each table automatically calculated
7. Grand total calculation across all tables automatically calculated

## Tasks / Subtasks

- [ ] Create Tender Evaluation/Price section in Consultant Card (AC: #1, #2, #3)
  - [ ] Add Tender Evaluation section to ConsultantCard schema and UI
  - [ ] Implement side-by-side firm columns for short-listed firms only
  - [ ] Create Table 1 - Original with structure matching tender package fee structure
  - [ ] Create Table 2 - Adds and Subs with 3 default placeholder items
  - [ ] Add 'Retrieve from Procure/Tender Schedules Price' icon next to section header

- [ ] Implement line item management (AC: #4, #5)
  - [ ] Add/delete line items in Table 1
  - [ ] Add/delete line items in Table 2
  - [ ] Support hierarchical structure (categories with sub-items)
  - [ ] Enable inline editing of item descriptions and amounts

- [ ] Implement calculation logic (AC: #6, #7)
  - [ ] Calculate sub-totals for categories within each table
  - [ ] Calculate table-level sub-totals for Table 1 and Table 2
  - [ ] Calculate Grand Total across all tables
  - [ ] Auto-recalculate on any price change

- [ ] Replicate for Contractor Card (AC: All)
  - [ ] Apply identical Tender Evaluation/Price structure to ContractorCard
  - [ ] Ensure independent data storage between Consultant and Contractor cards

- [ ] Testing (AC: All)
  - [ ] Test with 1-3 short-listed firms displayed side-by-side
  - [ ] Test adding/deleting line items updates calculations correctly
  - [ ] Test hierarchical structure with nested categories
  - [ ] Test Grand Total calculation with multiple tables
  - [ ] Test data persistence across page reloads

## Dev Notes

### CRITICAL: Use Enterprise Spreadsheet Library

**Decision**: Use **Handsontable** for `PriceEvaluationTable.tsx` component

The Price Evaluation Tables require advanced Excel-like functionality that cannot be efficiently implemented with custom shadcn/ui extensions. Handsontable provides:

1. **Inline Editing** (AC #4): Native spreadsheet-style cell editing
2. **Formula Engine** (AC #6, #7): HyperFormula with 386+ Excel functions for sub-totals and Grand Total
3. **Hierarchical Structure** (AC #5): Built-in nested rows with collapsible/expandable categories
4. **Copy/Paste**: Native Excel/Google Sheets compatibility for bulk data operations
5. **Dynamic Columns** (AC #1): Flexible column structure for side-by-side firm comparison
6. **React Integration**: First-class React support via `@handsontable/react`

**Installation**:
```bash
npm install handsontable @handsontable/react
```

**Licensing Note**: Handsontable commercial license required for production deployment at **$899 per developer per year**. Non-commercial license available for evaluation. HyperFormula engine (formula calculation) is included with Handsontable license.

**⚠️ CRITICAL LIMITATION**: Handsontable documentation states "No support for nested data structures with formulas". This means hierarchical rows (AC #5) and formula calculations (AC #6, #7) may conflict. **Mitigation strategy** is documented below in "Hierarchical + Formula Workaround" section.

**Documentation**:
- Handsontable React: https://handsontable.com/docs/react-data-grid/
- Formula Plugin: https://handsontable.com/docs/react-data-grid/formula-calculation/
- Nested Rows: https://handsontable.com/docs/react-data-grid/row-parent-child/

**Alternatives Considered**:
1. **AG Grid Enterprise** - Powerful but overkill for this use case. Better suited for analytics dashboards than spreadsheet-style data entry. Missing true Excel formula compatibility.
2. **TanStack Table** - Headless and flexible, but would require extensive custom development for formulas, nested rows, and copy/paste. Estimated 2-3 weeks additional dev time.
3. **Custom shadcn/ui extensions** - Original plan. Rejected because implementing formula engine, hierarchical editing, and Excel copy/paste from scratch is not feasible within sprint timeline.

**Why Handsontable Wins**:
- True Excel-like UX (exactly what users expect for price evaluation)
- HyperFormula engine handles 386+ Excel functions natively
- Nested rows with collapsible categories built-in
- Copy/paste from Excel/Sheets works out of the box
- Non-commercial license available for development/evaluation
- First-class React integration via `@handsontable/react`

### Architecture Patterns
- Follow existing Card/Section/Item three-tier hierarchy established in Story 1.2
- Use Zustand store pattern for managing evaluation table state (similar to workspaceStore)
  - Store manages: table data, firm list, selected table view
  - Handsontable's `afterChange` callback syncs changes back to Zustand store
  - Zustand provides initial data to Handsontable via props
- Implement auto-calculation using **Handsontable's HyperFormula engine** (replaces React useMemo approach)
  - No manual calculation code needed - formulas execute automatically
  - Grand Total calculated via formula: `=SUM(Table1_Total, Table2_Total)`
- Side-by-side firm display uses **Handsontable's dynamic column configuration** based on short-listed firms
  - Columns generated dynamically: `['Description', ...firms.map(f => f.name)]`
  - Each firm gets one numeric column with currency formatting

### Components to Create/Modify
- `src/components/cards/sections/TenderEvaluationSection.tsx` (new) - Container for evaluation tables
- `src/components/tender/PriceEvaluationTable.tsx` (new) - **Handsontable-based** reusable spreadsheet component for both Table 1 and Table 2
- `src/components/tender/useHandsontableConfig.ts` (new) - Custom hook for Handsontable configuration (columns, formulas, validation)
- `src/components/tender/useTenderCalculations.ts` (new) - Custom hook for handling sub-total/grand total calculations (workaround for nested + formula limitation)
- `src/app/actions/tender.ts` - Add server actions for CRUD operations on evaluation data
- Prisma schema: Extend ConsultantCard/ContractorCard models with TenderEvaluation relation

**Next.js 15 Compatibility**: All Handsontable components must use `'use client'` directive as Handsontable is a client-side library. Server Components can fetch initial data and pass to client components.

### Data Model
```typescript
// Prisma schema extension
model TenderEvaluation {
  id              String   @id @default(cuid())
  consultantId    String?  // FK to Consultant
  contractorId    String?  // FK to Contractor
  tables          TenderEvaluationTable[]
  grandTotal      Decimal  @db.Decimal(12, 2)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model TenderEvaluationTable {
  id                String   @id @default(cuid())
  evaluationId      String
  evaluation        TenderEvaluation @relation(fields: [evaluationId], references: [id])
  tableNumber       Int      // 1 for Original, 2 for Adds/Subs, etc.
  tableName         String   // "Original", "Adds and Subs"
  items             EvaluationLineItem[]
  subTotal          Decimal  @db.Decimal(12, 2)
  sortOrder         Int
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model EvaluationLineItem {
  id                String   @id @default(cuid())
  tableId           String
  table             TenderEvaluationTable @relation(fields: [tableId], references: [id])
  firmId            String   // FK to Firm
  description       String
  amount            Decimal  @db.Decimal(12, 2)
  isCategory        Boolean  @default(false)  // True for category headers
  parentCategoryId  String?  // Self-referential for hierarchy
  sortOrder         Int
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### Handsontable Implementation Example

```typescript
// src/components/tender/PriceEvaluationTable.tsx
'use client';

import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.css';
import { HyperFormula } from 'hyperformula';

// Register all Handsontable modules
registerAllModules();

interface PriceEvaluationTableProps {
  tableNumber: number; // 1 for Original, 2 for Adds/Subs
  firms: Array<{ id: string; name: string }>;
  initialData: any[];
  onDataChange: (data: any[]) => void;
}

export function PriceEvaluationTable({
  tableNumber,
  firms,
  initialData,
  onDataChange,
}: PriceEvaluationTableProps) {
  // Configure HyperFormula for calculations
  const hyperformulaInstance = HyperFormula.buildEmpty({
    licenseKey: 'non-commercial-and-evaluation',
  });

  // Dynamic columns: Description + one column per firm
  const columns = [
    { data: 'description', type: 'text', width: 300 },
    ...firms.map((firm) => ({
      data: `firm_${firm.id}`,
      type: 'numeric',
      numericFormat: { pattern: '$0,0.00' },
      width: 150,
    })),
  ];

  // Column headers
  const colHeaders = ['Item Description', ...firms.map((f) => f.name)];

  // Nested rows configuration for hierarchical structure (AC #5)
  const nestedRows = true;

  return (
    <HotTable
      data={initialData}
      columns={columns}
      colHeaders={colHeaders}
      rowHeaders={true}
      width="100%"
      height="auto"
      licenseKey="non-commercial-and-evaluation"
      formulas={{
        engine: hyperformulaInstance,
      }}
      nestedRows={nestedRows}
      contextMenu={true} // Right-click menu for add/delete rows (AC #4)
      manualRowMove={true} // Drag to reorder
      afterChange={(changes, source) => {
        if (source !== 'loadData') {
          onDataChange(this.getSourceData());
        }
      }}
      // Enable copy/paste from Excel
      copyPaste={true}
    />
  );
}
```

**Key Handsontable Features Used**:

1. **Formula Engine** (AC #6, #7):
   ```typescript
   // Example: Sub-total formula in data
   {
     description: 'Sub-Total',
     firm_1: '=SUM(B2:B5)', // Auto-calculates sum of rows 2-5
     firm_2: '=SUM(C2:C5)',
   }
   ```

2. **Nested Rows** (AC #5):
   ```typescript
   const data = [
     { description: 'Design Services', __children: [
       { description: 'Concept Design', firm_1: 10000 },
       { description: 'Detailed Design', firm_1: 25000 },
     ]},
   ];
   ```

3. **Context Menu** (AC #4):
   - Right-click to insert/remove rows
   - Built-in support for row operations

4. **Copy/Paste**:
   - Native Excel/Google Sheets compatibility
   - Bulk data operations

### Hierarchical + Formula Workaround

**Problem**: Handsontable's NestedRows plugin (hierarchical structure) does not work with the Formulas plugin simultaneously.

**Solution Strategy**: Use **hybrid approach** combining Handsontable for data entry with React-side calculations:

```typescript
// src/components/tender/useTenderCalculations.ts
import { useMemo } from 'react';

export function useTenderCalculations(data: EvaluationRow[], firms: Firm[]) {
  return useMemo(() => {
    const categoriesWithTotals = data.map((category) => {
      // Calculate sub-total for each category
      const subTotal = category.__children?.reduce(
        (sum, item) => sum + (item.amount || 0),
        0
      ) || 0;

      return {
        ...category,
        subTotal,
        __children: category.__children,
      };
    });

    // Calculate Grand Total across all categories
    const grandTotal = categoriesWithTotals.reduce(
      (sum, cat) => sum + cat.subTotal,
      0
    );

    return { categoriesWithTotals, grandTotal };
  }, [data, firms]);
}
```

**Implementation Approach**:
1. **Display hierarchy visually** using NestedRows plugin (NO formulas in cells)
2. **Calculate sub-totals in React** using custom hook
3. **Render calculated totals** as read-only cells in Handsontable
4. **Update totals automatically** when data changes via `afterChange` callback

**Alternative Approach** (if visual hierarchy not critical):
- Use **flat table structure** with category grouping via visual styling
- Enable formulas for automatic calculations
- Trade-off: Less clear hierarchy but native formula support

**Recommendation**: Start with hybrid approach (visual hierarchy + React calculations). If performance issues arise with large datasets, consider flattening structure and using Handsontable formulas.

### Performance Considerations

- **Lazy Loading**: For large tender evaluations (100+ line items), enable Handsontable's virtualization
- **Calculation Throttling**: Debounce calculation updates to avoid excessive re-renders
- **Bundle Size**: Handsontable adds ~273 KB to bundle; use selective imports to reduce by 56%
  ```typescript
  // Instead of registerAllModules(), import only needed:
  import { registerPlugin, HyperFormula } from 'handsontable/plugins';
  import { ContextMenu, ManualRowMove, NestedRows } from 'handsontable/plugins';
  ```

### Testing Standards
- **Unit tests** for calculation logic:
  - Test `useTenderCalculations` hook with various data structures
  - Verify sub-total calculations for nested categories
  - Verify grand total calculation across multiple tables
  - Test edge cases: empty categories, single firm, zero values
- **Integration tests** for Handsontable interactions:
  - Add/delete line items via context menu
  - Drag-to-reorder rows within categories
  - Inline editing of descriptions and amounts
  - Nested row expand/collapse functionality
- **Excel compatibility tests**:
  - Copy data from Excel, paste into Handsontable, verify data integrity
  - Copy data from Handsontable, paste into Excel, verify formatting
  - Test with structured pricing tables (categories, sub-items, totals)
- **E2E tests** (Playwright):
  - Complete workflow: Select firms → Populate prices → View calculations → Save
  - Test with 1, 3, and 5 firms side-by-side
  - Test table switching (Table 1 ↔ Table 2)
  - Test persistence across page reloads
- **Performance tests**:
  - Load time with 50+ line items
  - Calculation update latency (should be < 100ms)
  - Memory usage with large datasets

### Project Structure Notes
- Tender evaluation components go in `src/components/tender/` (existing directory)
- Follow existing pattern from FirmsSection for side-by-side firm display
- **Use Handsontable library** for spreadsheet-like tables (NOT custom shadcn/ui extensions)
- Import Handsontable CSS: `import 'handsontable/dist/handsontable.full.css'`
- Configure HyperFormula plugin for automatic calculations

### References
- [Source: docs/epics.md#Story 4.5]
- [Source: docs/PRD.md#FR012_TE1-FR012_TE12]
- [Source: docs/architecture.md#Components]
- [Source: docs/stories/story-3.2.md] - Firms management side-by-side pattern
- [Source: docs/stories/story-1.2.md] - Three-tier data hierarchy

## Dev Agent Record

### Context Reference

- [Story Context XML](story-context-4.5.xml)

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
