# Story 5.1: Cost Planning Card Structure

Status: Draft

## Story

As a user,
I want a Cost Planning Card with all sections,
So that I can manage project finances comprehensively.

## Acceptance Criteria

1. Cost Planning Card with 6 sections: Preliminary Cost Plan, Cost Summary, Invoice Register, Variation Register, Value Management, Provisional Sums
2. Sections are collapsible/expandable with chevron icons
3. Two-tier hierarchy visible: Tier 2 (Cost Groups) and Tier 3 (Cost Items)
4. Default Tier 2 sections: Developer Costs, Consultants, Construction, Contingency
5. Database schema supports hierarchical structure

## Dev Notes

### Architecture Patterns

- Follow **Card → Section → Item** three-tier hierarchy established in Story 1.2 and Story 1.4 (Plan Card)
- Use Zustand store pattern for Cost Planning state management (similar to `workspaceStore`)
- Server Components for initial data fetching, Client Components for interactive sections
- Consistent collapsible section UI pattern from existing cards
- Database schema uses self-referential relationships for Tier 2 → Tier 3 hierarchy

### Components to Create

- `src/components/cards/CostPlanningCard.tsx` - Main card container (Server Component)
- `src/components/cards/sections/PreliminaryCostPlanSection.tsx` - Section 1
- `src/components/cards/sections/CostSummarySection.tsx` - Section 2 (hosts Handsontable from Story 5.2)
- `src/components/cards/sections/InvoiceRegisterSection.tsx` - Section 3 (hosts Handsontable from Story 5.4)
- `src/components/cards/sections/VariationRegisterSection.tsx` - Section 4 (hosts Handsontable from Story 5.6)
- `src/components/cards/sections/ValueManagementSection.tsx` - Section 5
- `src/components/cards/sections/ProvisionalSumsSection.tsx` - Section 6
- `src/stores/costPlanningStore.ts` - Zustand store for Cost Planning state
- `src/app/actions/costPlanning.ts` - Server actions for CRUD operations

### Database Schema

```prisma
// Tier 1: Cost Planning Card
model CostPlanningCard {
  id            String      @id @default(cuid())
  projectId     String      @unique
  project       Project     @relation(fields: [projectId], references: [id])

  // Sections
  costGroups    CostGroup[] // Tier 2

  // Meta
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  createdBy     String?

  @@index([projectId])
}

// Tier 2: Cost Groups (Developer Costs, Consultants, Construction, Contingency)
model CostGroup {
  id                String      @id @default(cuid())
  costPlanningId    String
  costPlanning      CostPlanningCard @relation(fields: [costPlanningId], references: [id], onDelete: Cascade)

  name              String      // "Developer Costs", "Consultants", "Construction", "Contingency"
  description       String?
  isDefault         Boolean     @default(false) // True for 4 default sections
  costItems         CostItem[]  // Tier 3
  sortOrder         Int
  isCollapsed       Boolean     @default(false) // UI state

  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  @@index([costPlanningId])
}

// Tier 3: Cost Items (individual line items)
model CostItem {
  id                    String      @id @default(cuid())
  costGroupId           String
  costGroup             CostGroup   @relation(fields: [costGroupId], references: [id], onDelete: Cascade)

  costCode              String      @unique // e.g., "CONS-001", "DEV-002"
  description           String

  // Editable columns (from Cost Summary Table)
  budget                Decimal     @db.Decimal(12, 2) @default(0)
  contract              Decimal     @db.Decimal(12, 2) @default(0)
  variationsForecast    Decimal     @db.Decimal(12, 2) @default(0)
  variationsApproved    Decimal     @db.Decimal(12, 2) @default(0)

  // Calculated fields (updated by Invoice/Variation Registers)
  claimedToDate         Decimal     @db.Decimal(12, 2) @default(0)
  claimedThisMonth      Decimal     @db.Decimal(12, 2) @default(0)

  // Relations
  invoices              Invoice[]
  variations            Variation[]

  sortOrder             Int
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt

  @@index([costGroupId])
  @@index([costCode])
}

// Invoice model (for Story 5.4)
model Invoice {
  id                    String      @id @default(cuid())
  costItemId            String
  costItem              CostItem    @relation(fields: [costItemId], references: [id], onDelete: Cascade)

  date                  DateTime
  invoiceNumber         String
  amount                Decimal     @db.Decimal(12, 2)
  isPaid                Boolean     @default(false)

  // AI extraction metadata
  aiExtracted           Boolean     @default(false)
  extractedAt           DateTime?
  extractionConfidence  Float?

  // Document reference
  documentId            String?
  document              Document?   @relation(fields: [documentId], references: [id])

  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt

  @@index([costItemId])
  @@index([date])
}

// Variation model (for Story 5.6)
model Variation {
  id                    String      @id @default(cuid())
  costItemId            String
  costItem              CostItem    @relation(fields: [costItemId], references: [id], onDelete: Cascade)

  dateApproved          DateTime
  description           String
  category              String      // "Scope Change", "Design Variation", "Site Conditions", "Client Request", "Other"
  amount                Decimal     @db.Decimal(12, 2)
  status                String      // "Forecast" or "Approved"

  // AI extraction metadata
  aiExtracted           Boolean     @default(false)
  extractedAt           DateTime?
  extractionConfidence  Float?

  // Document reference
  documentId            String?
  document              Document?   @relation(fields: [documentId], references: [id])

  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt

  @@index([costItemId])
  @@index([status])
}
```

### Implementation - CostPlanningCard Component

```typescript
// src/components/cards/CostPlanningCard.tsx
import { Suspense } from 'react';
import { db } from '@/lib/db';
import { PreliminaryCostPlanSection } from './sections/PreliminaryCostPlanSection';
import { CostSummarySection } from './sections/CostSummarySection';
import { InvoiceRegisterSection } from './sections/InvoiceRegisterSection';
import { VariationRegisterSection } from './sections/VariationRegisterSection';
import { ValueManagementSection } from './sections/ValueManagementSection';
import { ProvisionalSumsSection } from './sections/ProvisionalSumsSection';

interface CostPlanningCardProps {
  projectId: string;
}

export async function CostPlanningCard({ projectId }: CostPlanningCardProps) {
  // Fetch Cost Planning data with full hierarchy
  const costPlanning = await db.costPlanningCard.findUnique({
    where: { projectId },
    include: {
      costGroups: {
        include: {
          costItems: {
            include: {
              invoices: { orderBy: { date: 'desc' } },
              variations: { orderBy: { dateApproved: 'desc' } },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  // Initialize with defaults if not exists
  if (!costPlanning) {
    const newCostPlanning = await initializeCostPlanning(projectId);
    return <CostPlanningCard projectId={projectId} />;
  }

  return (
    <div className="cost-planning-card h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Cost Planning</h1>

        {/* Section 1: Preliminary Cost Plan */}
        <Suspense fallback={<SectionSkeleton />}>
          <PreliminaryCostPlanSection costPlanningId={costPlanning.id} />
        </Suspense>

        {/* Section 2: Cost Summary Table (Handsontable - Story 5.2) */}
        <Suspense fallback={<SectionSkeleton />}>
          <CostSummarySection
            costGroups={costPlanning.costGroups}
            costPlanningId={costPlanning.id}
          />
        </Suspense>

        {/* Section 3: Invoice Register (Handsontable - Story 5.4) */}
        <Suspense fallback={<SectionSkeleton />}>
          <InvoiceRegisterSection
            costGroups={costPlanning.costGroups}
            costPlanningId={costPlanning.id}
          />
        </Suspense>

        {/* Section 4: Variation Register (Handsontable - Story 5.6) */}
        <Suspense fallback={<SectionSkeleton />}>
          <VariationRegisterSection
            costGroups={costPlanning.costGroups}
            costPlanningId={costPlanning.id}
          />
        </Suspense>

        {/* Section 5: Value Management */}
        <Suspense fallback={<SectionSkeleton />}>
          <ValueManagementSection costPlanningId={costPlanning.id} />
        </Suspense>

        {/* Section 6: Provisional Sums */}
        <Suspense fallback={<SectionSkeleton />}>
          <ProvisionalSumsSection costPlanningId={costPlanning.id} />
        </Suspense>
      </div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-12 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="h-64 bg-gray-100 rounded"></div>
    </div>
  );
}
```

### Default Data Initialization

```typescript
// src/app/actions/costPlanning.ts
'use server';

import { db } from '@/lib/db';

export async function initializeCostPlanning(projectId: string) {
  const costPlanning = await db.costPlanningCard.create({
    data: {
      projectId,
      costGroups: {
        create: [
          {
            name: 'Developer Costs',
            description: 'Internal project costs and fees',
            isDefault: true,
            sortOrder: 1,
            costItems: {
              create: [
                { costCode: 'DEV-001', description: 'Development Management Fee', sortOrder: 1 },
                { costCode: 'DEV-002', description: 'Legal Fees', sortOrder: 2 },
                { costCode: 'DEV-003', description: 'Finance Costs', sortOrder: 3 },
              ],
            },
          },
          {
            name: 'Consultants',
            description: 'Professional consultant fees',
            isDefault: true,
            sortOrder: 2,
            costItems: {
              create: [
                { costCode: 'CONS-001', description: 'Architectural Services', sortOrder: 1 },
                { costCode: 'CONS-002', description: 'Structural Engineering', sortOrder: 2 },
                { costCode: 'CONS-003', description: 'MEP Engineering', sortOrder: 3 },
                { costCode: 'CONS-004', description: 'Town Planning', sortOrder: 4 },
              ],
            },
          },
          {
            name: 'Construction',
            description: 'Construction and trade costs',
            isDefault: true,
            sortOrder: 3,
            costItems: {
              create: [
                { costCode: 'CNST-001', description: 'Demolition', sortOrder: 1 },
                { costCode: 'CNST-002', description: 'Excavation & Earthworks', sortOrder: 2 },
                { costCode: 'CNST-003', description: 'Concrete & Formwork', sortOrder: 3 },
                { costCode: 'CNST-004', description: 'Structural Steel', sortOrder: 4 },
                { costCode: 'CNST-005', description: 'External Works', sortOrder: 5 },
              ],
            },
          },
          {
            name: 'Contingency',
            description: 'Project contingency allowance',
            isDefault: true,
            sortOrder: 4,
            costItems: {
              create: [
                { costCode: 'CONT-001', description: 'Design Contingency (5%)', sortOrder: 1 },
                { costCode: 'CONT-002', description: 'Construction Contingency (10%)', sortOrder: 2 },
              ],
            },
          },
        ],
      },
    },
    include: {
      costGroups: {
        include: { costItems: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  return costPlanning;
}
```

### Collapsible Section Pattern

```typescript
// src/components/cards/sections/CostSummarySection.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { CostSummaryTable } from '@/components/cost/CostSummaryTable';
import type { CostGroup } from '@prisma/client';

interface CostSummarySectionProps {
  costGroups: CostGroup[];
  costPlanningId: string;
}

export function CostSummarySection({ costGroups, costPlanningId }: CostSummarySectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <section className="border rounded-lg p-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h2 className="text-xl font-semibold flex items-center gap-2">
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
          Cost Summary
        </h2>
      </div>

      {!isCollapsed && (
        <div className="mt-4">
          {/* Handsontable component from Story 5.2 */}
          <CostSummaryTable costGroups={costGroups} costPlanningId={costPlanningId} />
        </div>
      )}
    </section>
  );
}
```

### Zustand Store

```typescript
// src/stores/costPlanningStore.ts
import { create } from 'zustand';
import type { CostGroup, CostItem } from '@prisma/client';

interface CostPlanningState {
  costGroups: CostGroup[];
  selectedCostItem: CostItem | null;
  setCostGroups: (groups: CostGroup[]) => void;
  setSelectedCostItem: (item: CostItem | null) => void;
  updateCostItem: (itemId: string, updates: Partial<CostItem>) => void;
}

export const useCostPlanningStore = create<CostPlanningState>((set) => ({
  costGroups: [],
  selectedCostItem: null,
  setCostGroups: (groups) => set({ costGroups: groups }),
  setSelectedCostItem: (item) => set({ selectedCostItem: item }),
  updateCostItem: (itemId, updates) =>
    set((state) => ({
      costGroups: state.costGroups.map((group) => ({
        ...group,
        costItems: group.costItems.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        ),
      })),
    })),
}));
```

### Navigation Integration

Add Cost Planning Card to side navigation (extends Story 1.3):

```typescript
// src/components/workspace/NavigationSidebar.tsx
const cards = [
  { id: 'plan', name: 'Plan', icon: FileText },
  { id: 'consultant', name: 'Consultant', icon: Users },
  { id: 'contractor', name: 'Contractor', icon: HardHat },
  { id: 'procure', name: 'Procure', icon: ShoppingCart },
  { id: 'cost-planning', name: 'Cost Planning', icon: DollarSign }, // NEW
  { id: 'scheme-design', name: 'Scheme Design', icon: Pencil },
  { id: 'detail-design', name: 'Detail Design', icon: Ruler },
  { id: 'documents', name: 'Documents', icon: FolderOpen },
];
```

### Testing Standards

- **Database tests**:
  - Test Cost Planning initialization creates 4 default Tier 2 sections
  - Test cascading deletes (CostGroup → CostItem → Invoice/Variation)
  - Test unique constraint on `costCode`
  - Test foreign key integrity

- **Component tests**:
  - Test all 6 sections render correctly
  - Test collapsible/expandable functionality for each section
  - Test section state persistence across re-renders
  - Test hierarchical data display (Tier 2 → Tier 3)

- **Integration tests**:
  - Test Cost Planning Card creation from side navigation
  - Test data fetching and display of Tier 2/Tier 3 hierarchy
  - Test Suspense boundaries and loading states
  - Test error handling (no cost planning exists)

- **E2E tests**:
  - Complete workflow: Open Cost Planning Card → View all sections → Collapse/expand sections
  - Test with empty project (initialization)
  - Test with existing cost planning data
  - Test navigation between Cost Planning and other cards

### Performance Considerations

- **Data Fetching**: Single query fetches entire hierarchy (CostGroups + CostItems + Invoices + Variations) to avoid N+1 problem
- **Lazy Loading**: Use Suspense boundaries for each section to improve initial render time
- **Client/Server Split**: Card container is Server Component, sections with interactivity are Client Components
- **Bundle Size**: Handsontable loaded once for all three tables (Cost Summary, Invoice Register, Variation Register)

### References
- [Source: docs/epics.md#Epic 5, Story 5.1]
- [Source: docs/PRD.md#FR013_CP] - Cost Planning functional requirements
- [Source: docs/architecture.md#ADR-007] - Handsontable decision for Epic 5 tables
- [Source: docs/stories/1-2-core-database-schema.md] - Three-tier data hierarchy pattern
- [Source: docs/stories/1-4-plan-card-structure.md] - Card/Section UI pattern

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
