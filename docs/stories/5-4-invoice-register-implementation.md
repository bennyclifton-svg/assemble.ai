# Story 5.4: Invoice Register Implementation

Status: Draft

## Story

As a user,
I want to enter and track invoices against cost items,
So that claimed amounts automatically update in the Cost Summary.

## Acceptance Criteria

1. Invoice entry with 5 fields: Date, Invoice Number, Amount, Cost Item (dropdown), Paid (checkbox)
2. Link invoice to specific Tier 3 Cost Item via dropdown
3. Drag-drop invoice PDF for upload to Documents/Invoices/[Firm Name]/
4. AI extraction assists with Date, Invoice Number, Amount from PDF
5. Manual override of all AI-extracted values
6. Auto-update Cost Summary Table: "Claimed to Date" and "Claimed this Month"

## Dev Notes

### Use Handsontable

**Decision**: Use **Handsontable** for `InvoiceRegister.tsx` component for consistent Excel-like UX across all Epic 5 financial tables.

**Benefits**:
- Consistent keyboard navigation with Cost Summary Table
- Copy/paste multiple invoices from Excel
- Inline editing for quick data entry
- Bundle reuse (~0 KB additional, already loaded from Story 5.2)

### Components to Create

- `src/components/cost/InvoiceRegister.tsx` - **Handsontable-based** 5-column table
- `src/app/actions/invoice.ts` - Server actions for invoice CRUD
- Custom cell renderers for dropdown (Cost Item) and checkbox (Paid status)

### Handsontable Implementation

```typescript
// src/components/cost/InvoiceRegister.tsx
'use client';

import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css';

export function InvoiceRegister({ invoices, costItems, onDataChange }: InvoiceRegisterProps) {
  const columns = [
    { data: 'date', type: 'date', dateFormat: 'DD/MM/YYYY', width: 120 },
    { data: 'invoiceNumber', type: 'text', width: 150 },
    { data: 'amount', type: 'numeric', numericFormat: { pattern: '$0,0.00' }, width: 130 },
    {
      data: 'costItemId',
      type: 'dropdown',
      source: costItems.map(item => item.description),
      width: 250
    },
    {
      data: 'isPaid',
      type: 'checkbox',
      className: 'htCenter',
      width: 80
    },
  ];

  const colHeaders = ['Date', 'Invoice Number', 'Amount', 'Cost Item', 'Paid?'];

  return (
    <div className="invoice-register-container">
      <HotTable
        data={invoices}
        columns={columns}
        colHeaders={colHeaders}
        rowHeaders={true}
        width="100%"
        height="auto"
        licenseKey="non-commercial-and-evaluation"
        contextMenu={true} // Add/delete invoices
        copyPaste={true} // Excel compatibility
        afterChange={(changes, source) => {
          if (source !== 'loadData') {
            onDataChange(this.getSourceData());
            // Trigger Cost Summary re-calculation
            updateCostSummary();
          }
        }}
      />
    </div>
  );
}
```

### AI Integration

When PDF uploaded:
1. AI extracts: Date, Invoice Number, Amount
2. Populate new row in Handsontable with extracted data
3. User selects Cost Item from dropdown
4. User can override any AI-extracted values via inline editing

### Data Flow to Cost Summary

Server action calculates totals per Cost Item:
```typescript
// src/app/actions/invoice.ts
export async function updateCostSummaryFromInvoices(costItemId: string) {
  const invoices = await db.invoice.findMany({
    where: { costItemId },
    orderBy: { date: 'desc' }
  });

  const claimedToDate = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const thisMonth = invoices
    .filter(inv => isCurrentMonth(inv.date))
    .reduce((sum, inv) => sum + inv.amount, 0);

  await db.costItem.update({
    where: { id: costItemId },
    data: { claimedToDate, claimedThisMonth: thisMonth }
  });
}
```

### References
- [Source: docs/epics.md#Epic 5, Story 5.4]
- [Source: docs/architecture.md#Epic 5 Handsontable]
- [Source: docs/stories/5-2-cost-summary-table.md] - Updates this table
