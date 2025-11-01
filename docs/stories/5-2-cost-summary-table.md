# Story 5.2: Cost Summary Table

Status: Draft

## Story

As a user,
I want a comprehensive cost summary table displaying all cost items with calculations,
So that I can track budget, contracts, variations, and invoices in one place.

## Acceptance Criteria

1. Display all Tier 3 Cost Items in table format with hierarchical structure (Tier 2 groups → Tier 3 items)
2. 9 columns: Budget, Contract, Variations Forecast, Variation Approved, Final Forecast, Budget Variance, Claimed to Date, Claimed this Month, Remaining to be Invoiced
3. Auto-calculate Final Forecast = Contract + Variations Forecast + Variation Approved
4. Auto-calculate Budget Variance = Budget - Final Forecast
5. Auto-calculate Remaining to be Invoiced = Contract - Claimed to Date
6. Sub-totals for each Tier 2 section (Developer Costs, Consultants, Construction, Contingency)
7. Grand Total at bottom row
8. Inline editing for editable columns (Budget, Contract, Variations Forecast, Variation Approved)
9. Read-only styling for calculated columns
10. Highlight negative Budget Variance in red

## Dev Notes

### CRITICAL: Use Handsontable

**Decision**: Use **Handsontable** for `CostSummaryTable.tsx` component

The Cost Summary Table requires advanced spreadsheet functionality identical to Epic 4 tender evaluation tables:
- **Hierarchical Structure** (AC #1): Tier 2 groups with nested Tier 3 items (NestedRows plugin)
- **Formula Calculations** (AC #3, #4, #5): 3 auto-calculated columns (HyperFormula engine)
- **Excel-like Editing** (AC #8): Inline editing with keyboard navigation
- **Conditional Formatting** (AC #10): Red highlighting for budget overruns

**Installation**:
```bash
npm install handsontable @handsontable/react
```

**Licensing**: Non-commercial/development license (free). See architecture.md ADR-007 for production path.

### Architecture Patterns

- Follow Epic 4 Handsontable pattern from Story 4.5
- Use **hybrid calculation approach**: NestedRows for visual hierarchy + React hook for calculations
- Zustand store manages cost data; Handsontable syncs via `afterChange` callback
- Real-time updates from Invoice Register (Story 5.4) and Variation Register (Story 5.6)

### Components to Create

- `src/components/cost/CostSummaryTable.tsx` - **Handsontable-based** 9-column spreadsheet
- `src/components/cost/useCostCalculations.ts` - Custom hook for all calculations
- `src/components/cost/useCostSummaryConfig.ts` - Handsontable configuration hook
- `src/components/cards/sections/CostSummarySection.tsx` - Container section
- `src/app/actions/costPlanning.ts` - Server actions for CRUD operations

### Handsontable Implementation

```typescript
// src/components/cost/CostSummaryTable.tsx
'use client';

import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.css';
import { useCostCalculations } from './useCostCalculations';

export function CostSummaryTable({ costItems, onDataChange }: CostSummaryTableProps) {
  // Hybrid approach: calculations in React, hierarchy in Handsontable
  const { itemsWithCalculations, grandTotal } = useCostCalculations(costItems);

  const columns = [
    { data: 'description', type: 'text', width: 250, readOnly: true },
    { data: 'budget', type: 'numeric', numericFormat: { pattern: '$0,0.00' }, width: 120 },
    { data: 'contract', type: 'numeric', numericFormat: { pattern: '$0,0.00' }, width: 120 },
    { data: 'variationsForecast', type: 'numeric', numericFormat: { pattern: '$0,0.00' }, width: 140 },
    { data: 'variationApproved', type: 'numeric', numericFormat: { pattern: '$0,0.00' }, width: 140 },
    { data: 'finalForecast', type: 'numeric', numericFormat: { pattern: '$0,0.00' }, width: 140, readOnly: true, className: 'htDimmed bg-gray-50' }, // Calculated
    { data: 'budgetVariance', type: 'numeric', numericFormat: { pattern: '$0,0.00' }, width: 140, readOnly: true, className: 'htDimmed bg-gray-50' }, // Calculated
    { data: 'claimedToDate', type: 'numeric', numericFormat: { pattern: '$0,0.00' }, width: 140, readOnly: true }, // From Invoice Register
    { data: 'claimedThisMonth', type: 'numeric', numericFormat: { pattern: '$0,0.00' }, width: 140, readOnly: true }, // From Invoice Register
    { data: 'remainingToBeInvoiced', type: 'numeric', numericFormat: { pattern: '$0,0.00' }, width: 180, readOnly: true, className: 'htDimmed bg-gray-50' }, // Calculated
  ];

  const colHeaders = [
    'Cost Item',
    'Budget',
    'Contract',
    'Variations Forecast',
    'Variation Approved',
    'Final Forecast ✓', // Calculated
    'Budget Variance ✓', // Calculated
    'Claimed to Date',
    'Claimed this Month',
    'Remaining to be Invoiced ✓', // Calculated
  ];

  return (
    <div className="cost-summary-container">
      <HotTable
        data={itemsWithCalculations}
        columns={columns}
        colHeaders={colHeaders}
        rowHeaders={true}
        width="100%"
        height="auto"
        licenseKey="non-commercial-and-evaluation"
        nestedRows={true} // Tier 2 → Tier 3 hierarchy
        contextMenu={true} // Add/delete cost items
        manualRowMove={true} // Drag to reorder
        afterChange={(changes, source) => {
          if (source !== 'loadData') {
            onDataChange(this.getSourceData());
          }
        }}
        copyPaste={true} // Excel compatibility
        cells={(row, col, prop) => {
          // Conditional formatting for Budget Variance (AC #10)
          if (prop === 'budgetVariance') {
            const value = this.instance.getDataAtRowProp(row, 'budgetVariance');
            return {
              className: value < 0 ? 'text-red-600 font-bold bg-red-50' : '',
            };
          }
          return {};
        }}
      />
      <div className="mt-4 text-right font-bold text-lg">
        Grand Total: ${grandTotal.finalForecast.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
      </div>
    </div>
  );
}
```

### Calculation Hook

```typescript
// src/components/cost/useCostCalculations.ts
import { useMemo } from 'react';

export function useCostCalculations(costItems: CostItem[]) {
  return useMemo(() => {
    const itemsWithCalculations = costItems.map((tier2Group) => {
      // Calculate Tier 3 items
      const tier3Calculated = tier2Group.__children?.map((item) => ({
        ...item,
        finalForecast: item.contract + item.variationsForecast + item.variationApproved, // AC #3
        budgetVariance: item.budget - (item.contract + item.variationsForecast + item.variationApproved), // AC #4
        remainingToBeInvoiced: item.contract - item.claimedToDate, // AC #5
      })) || [];

      // Calculate Tier 2 sub-totals (AC #6)
      const tier2SubTotal = {
        budget: tier3Calculated.reduce((sum, item) => sum + item.budget, 0),
        contract: tier3Calculated.reduce((sum, item) => sum + item.contract, 0),
        variationsForecast: tier3Calculated.reduce((sum, item) => sum + item.variationsForecast, 0),
        variationApproved: tier3Calculated.reduce((sum, item) => sum + item.variationApproved, 0),
        finalForecast: tier3Calculated.reduce((sum, item) => sum + item.finalForecast, 0),
        budgetVariance: tier3Calculated.reduce((sum, item) => sum + item.budgetVariance, 0),
        claimedToDate: tier3Calculated.reduce((sum, item) => sum + item.claimedToDate, 0),
        claimedThisMonth: tier3Calculated.reduce((sum, item) => sum + item.claimedThisMonth, 0),
        remainingToBeInvoiced: tier3Calculated.reduce((sum, item) => sum + item.remainingToBeInvoiced, 0),
      };

      return {
        ...tier2Group,
        ...tier2SubTotal,
        __children: tier3Calculated,
      };
    });

    // Calculate Grand Total (AC #7)
    const grandTotal = {
      budget: itemsWithCalculations.reduce((sum, group) => sum + group.budget, 0),
      contract: itemsWithCalculations.reduce((sum, group) => sum + group.contract, 0),
      variationsForecast: itemsWithCalculations.reduce((sum, group) => sum + group.variationsForecast, 0),
      variationApproved: itemsWithCalculations.reduce((sum, group) => sum + group.variationApproved, 0),
      finalForecast: itemsWithCalculations.reduce((sum, group) => sum + group.finalForecast, 0),
      budgetVariance: itemsWithCalculations.reduce((sum, group) => sum + group.budgetVariance, 0),
      claimedToDate: itemsWithCalculations.reduce((sum, group) => sum + group.claimedToDate, 0),
      claimedThisMonth: itemsWithCalculations.reduce((sum, group) => sum + group.claimedThisMonth, 0),
      remainingToBeInvoiced: itemsWithCalculations.reduce((sum, group) => sum + group.remainingToBeInvoiced, 0),
    };

    return { itemsWithCalculations, grandTotal };
  }, [costItems]);
}
```

### Data Model

```prisma
model CostPlanningCard {
  id            String      @id @default(cuid())
  projectId     String
  project       Project     @relation(fields: [projectId], references: [id])
  costGroups    CostGroup[] // Tier 2
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model CostGroup {
  id                String      @id @default(cuid())
  costPlanningId    String
  costPlanning      CostPlanningCard @relation(fields: [costPlanningId], references: [id])
  name              String      // "Developer Costs", "Consultants", "Construction", "Contingency"
  costItems         CostItem[]  // Tier 3
  sortOrder         Int
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}

model CostItem {
  id                    String      @id @default(cuid())
  costGroupId           String
  costGroup             CostGroup   @relation(fields: [costGroupId], references: [id])
  costCode              String      @unique
  description           String

  // Editable columns
  budget                Decimal     @db.Decimal(12, 2) @default(0)
  contract              Decimal     @db.Decimal(12, 2) @default(0)
  variationsForecast    Decimal     @db.Decimal(12, 2) @default(0)
  variationsApproved    Decimal     @db.Decimal(12, 2) @default(0)

  // Calculated from other sections
  claimedToDate         Decimal     @db.Decimal(12, 2) @default(0)
  claimedThisMonth      Decimal     @db.Decimal(12, 2) @default(0)

  invoices              Invoice[]
  variations            Variation[]
  sortOrder             Int
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
}
```

### References
- [Source: docs/epics.md#Epic 5, Story 5.2]
- [Source: docs/architecture.md#ADR-007] - Handsontable decision
- [Source: docs/stories/4-5-tender-evaluation-price-setup.md] - Similar Handsontable pattern
