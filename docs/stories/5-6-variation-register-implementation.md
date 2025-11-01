# Story 5.6: Variation Register Implementation

Status: Draft

## Story

As a user,
I want to track contract variations with forecast and approved amounts,
So that variation impacts automatically update the Cost Summary.

## Acceptance Criteria

1. Variation entry with 6 fields: Date Approved, Description, Category, Amount, Status (Forecast/Approved dropdown), Cost Item (dropdown)
2. Link variation to specific Tier 3 Cost Item via dropdown
3. Drag-drop variation PDF for upload to Documents/Variations/[Firm Name]/
4. AI extraction assists with Date, Description, Amount from PDF
5. Manual override of all AI-extracted values
6. Auto-update Cost Summary Table: "Variations Forecast" or "Variation Approved" based on Status
7. Status badge styling: Orange for Forecast, Green for Approved
8. Filter view by Status (All/Forecast Only/Approved Only)

## Dev Notes

### Use Handsontable

**Decision**: Use **Handsontable** for `VariationRegister.tsx` component for consistent Excel-like UX across all Epic 5 financial tables.

**Benefits**:
- Consistent keyboard navigation with Cost Summary and Invoice Register
- Copy/paste multiple variations from Excel
- Inline editing with dropdown support
- Bundle reuse (~0 KB additional, already loaded from Stories 5.2 and 5.4)
- Native dropdown rendering for Status and Cost Item fields

### Components to Create

- `src/components/cost/VariationRegister.tsx` - **Handsontable-based** 6-column table
- `src/app/actions/variation.ts` - Server actions for variation CRUD
- Custom cell renderers for Status badges (Forecast/Approved)
- Custom dropdown renderer for Cost Item selection

### Handsontable Implementation

```typescript
// src/components/cost/VariationRegister.tsx
'use client';

import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css';

export function VariationRegister({ variations, costItems, onDataChange }: VariationRegisterProps) {
  // Custom renderer for Status badges
  const statusRenderer = (instance, td, row, col, prop, value, cellProperties) => {
    Handsontable.renderers.TextRenderer.apply(this, arguments);

    td.innerHTML = ''; // Clear default rendering
    const badge = document.createElement('span');
    badge.textContent = value;

    if (value === 'Forecast') {
      badge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800';
    } else if (value === 'Approved') {
      badge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800';
    }

    td.appendChild(badge);
  };

  const columns = [
    { data: 'dateApproved', type: 'date', dateFormat: 'DD/MM/YYYY', width: 120 },
    { data: 'description', type: 'text', width: 250 },
    {
      data: 'category',
      type: 'dropdown',
      source: ['Scope Change', 'Design Variation', 'Site Conditions', 'Client Request', 'Other'],
      width: 150
    },
    { data: 'amount', type: 'numeric', numericFormat: { pattern: '$0,0.00' }, width: 130 },
    {
      data: 'status',
      type: 'dropdown',
      source: ['Forecast', 'Approved'],
      renderer: statusRenderer,
      width: 120
    },
    {
      data: 'costItemId',
      type: 'dropdown',
      source: costItems.map(item => item.description),
      width: 250
    },
  ];

  const colHeaders = ['Date Approved', 'Description', 'Category', 'Amount', 'Status', 'Cost Item'];

  return (
    <div className="variation-register-container">
      <HotTable
        data={variations}
        columns={columns}
        colHeaders={colHeaders}
        rowHeaders={true}
        width="100%"
        height="auto"
        licenseKey="non-commercial-and-evaluation"
        contextMenu={true} // Add/delete variations
        copyPaste={true} // Excel compatibility
        afterChange={(changes, source) => {
          if (source !== 'loadData') {
            onDataChange(this.getSourceData());
            // Trigger Cost Summary re-calculation
            updateCostSummaryFromVariations();
          }
        }}
        dropdownMenu={true} // Column filtering
        filters={true} // Enable filtering by Status
      />
    </div>
  );
}
```

### AI Integration

When PDF uploaded:
1. AI extracts: Date Approved, Description, Amount
2. Populate new row in Handsontable with extracted data
3. User selects Category and Cost Item from dropdowns
4. User sets Status: Forecast or Approved
5. User can override any AI-extracted values via inline editing

### Data Flow to Cost Summary

Server action calculates totals per Cost Item based on Status:
```typescript
// src/app/actions/variation.ts
export async function updateCostSummaryFromVariations(costItemId: string) {
  const variations = await db.variation.findMany({
    where: { costItemId },
    orderBy: { dateApproved: 'desc' }
  });

  // Split by status
  const forecast = variations
    .filter(v => v.status === 'Forecast')
    .reduce((sum, v) => sum + v.amount, 0);

  const approved = variations
    .filter(v => v.status === 'Approved')
    .reduce((sum, v) => sum + v.amount, 0);

  // Update Cost Summary columns
  await db.costItem.update({
    where: { id: costItemId },
    data: {
      variationsForecast: forecast,
      variationsApproved: approved
    }
  });
}
```

### Status Badge Rendering

Handsontable custom renderer for Status column (AC #7):
- **Forecast**: Orange badge (`bg-orange-100 text-orange-800`)
- **Approved**: Green badge (`bg-green-100 text-green-800`)
- Renders as Tailwind CSS badge component inline in cell

### Filtering by Status (AC #8)

```typescript
// Enable Handsontable filters plugin
import { registerPlugin } from 'handsontable/plugins';
import { Filters } from 'handsontable/plugins';

registerPlugin(Filters);

// Configure dropdown filter for Status column
<HotTable
  filters={true}
  dropdownMenu={['filter_by_value', 'filter_action_bar']}
  // ... other config
/>
```

Users can:
- Click dropdown menu in "Status" column header
- Select "Filter by value"
- Check/uncheck: All, Forecast, Approved
- Table updates in real-time

### Data Model

```prisma
model Variation {
  id              String      @id @default(cuid())
  costItemId      String
  costItem        CostItem    @relation(fields: [costItemId], references: [id])
  dateApproved    DateTime
  description     String
  category        String      // Scope Change, Design Variation, Site Conditions, Client Request, Other
  amount          Decimal     @db.Decimal(12, 2)
  status          String      // "Forecast" or "Approved"

  // AI extraction metadata
  aiExtracted         Boolean   @default(false)
  extractedAt         DateTime?
  extractionConfidence Float?

  // Document reference
  documentId      String?
  document        Document?   @relation(fields: [documentId], references: [id])

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}
```

### Calculation Impact on Cost Summary

From Story 5.2 Cost Summary Table:

**Updated Columns**:
- **Variations Forecast** = SUM(all variations where status = 'Forecast' for this Cost Item)
- **Variation Approved** = SUM(all variations where status = 'Approved' for this Cost Item)

**Cascading Calculations**:
- **Final Forecast** = Contract + Variations Forecast + Variation Approved
- **Budget Variance** = Budget - Final Forecast

**Real-time Updates**:
When user changes variation status from "Forecast" to "Approved":
1. `afterChange` callback fires in Handsontable
2. `updateCostSummaryFromVariations()` server action recalculates totals
3. Cost Summary Table re-renders with updated values
4. Final Forecast and Budget Variance recalculate automatically

### Excel Compatibility Features

Handsontable provides native support for:
- **Copy from Excel**: Select variation rows in Excel → Paste into Handsontable
- **Paste to Excel**: Select Handsontable rows → Copy → Paste to Excel (preserves formatting)
- **Column sorting**: Click headers to sort by Date, Amount, Status, etc.
- **Context menu**: Right-click for Insert Row Above/Below, Remove Row
- **Keyboard navigation**: Arrow keys, Tab, Enter for Excel-like navigation

### Performance Considerations

- **Lazy rendering**: Handsontable virtualizes rows (renders only visible rows)
- **Filter performance**: Filters plugin optimized for 1000+ rows
- **Calculation throttling**: Debounce `afterChange` updates to avoid excessive server calls
- **Bundle reuse**: Same Handsontable instance from Stories 5.2 and 5.4 (~0 KB additional)

### Testing Standards

- **Unit tests** for calculation logic:
  - Verify Forecast vs Approved totals calculation
  - Test status change updates correct Cost Summary columns
  - Test category dropdown options
  - Test date validation

- **Integration tests** for Handsontable:
  - Add/delete variations via context menu
  - Status dropdown selection updates badge rendering
  - Cost Item dropdown populates from database
  - Filter by status shows correct subset

- **E2E tests**:
  - Complete workflow: Add variation → Select status → View Cost Summary update
  - Test AI extraction from PDF
  - Test manual override of AI-extracted values
  - Test Excel copy/paste compatibility

### References
- [Source: docs/epics.md#Epic 5, Story 5.6]
- [Source: docs/architecture.md#ADR-007] - Handsontable decision
- [Source: docs/stories/5-2-cost-summary-table.md] - Updates this table
- [Source: docs/stories/4-6-ai-price-extraction-from-submissions.md] - Similar AI extraction pattern

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
