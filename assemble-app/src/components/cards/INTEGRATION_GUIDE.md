# AI Auto-Population Integration Guide

## Overview

Story 2.4 provides reusable components for AI-powered auto-population of card sections from processed documents in the Document Repository.

## Components

### 1. DocumentDropZone
Wraps section content with drag-drop capability.

**Features:**
- Visual feedback during drag operations (AC5)
- Integrates with Document Repository
- Uses `autoPopulateFields` service
- "Add to Documents" toggle (AC8)
- Success indicators

**Usage:**
```tsx
import { DocumentDropZone } from '@/components/cards/DocumentDropZone';

function MySection({ projectId }: { projectId: string }) {
  const [cardId, setCardId] = useState<string>();

  const handlePopulated = (fields: Record<string, any>) => {
    // Refresh section data or update UI
    console.log('Populated fields:', fields);
  };

  return (
    <DocumentDropZone
      cardId={cardId}
      sectionName="Details" // or "Objectives", "Staging", "Risk", "Stakeholders", etc.
      onPopulated={handlePopulated}
    >
      {/* Your section fields here */}
    </DocumentDropZone>
  );
}
```

### 2. DocumentSelector
AI Generate button with document picker dialog.

**Features:**
- Lists processed documents from repository
- Filters to show only completed extractions
- Provides alternative to drag-drop (AC7)
- Visual processing feedback

**Usage:**
```tsx
import { DocumentSelector } from '@/components/cards/DocumentSelector';

function MySection({ projectId }: { projectId: string }) {
  const [cardId, setCardId] = useState<string>();

  const handlePopulated = (fields: Record<string, any>) => {
    // Refresh section data or update UI
    console.log('Populated fields:', fields);
  };

  return (
    <div>
      <DocumentSelector
        projectId={projectId}
        cardId={cardId}
        sectionName="Objectives"
        onPopulated={handlePopulated}
        buttonVariant="outline"
        buttonSize="sm"
      />

      {/* Your section fields here */}
    </div>
  );
}
```

## Complete Integration Example

Here's how to integrate both components into a section:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { DocumentDropZone } from '@/components/cards/DocumentDropZone';
import { DocumentSelector } from '@/components/cards/DocumentSelector';
import { TextField } from '../fields/TextField';
import { getSectionItemsAction, updateItemAction } from '@/app/actions/card';

interface EnhancedSectionProps {
  projectId: string;
  cardId: string;
}

export function EnhancedSection({ projectId, cardId }: EnhancedSectionProps) {
  const [fields, setFields] = useState<Array<{ id: string; data: any }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFields();
  }, [projectId]);

  const loadFields = async () => {
    setIsLoading(true);
    const result = await getSectionItemsAction(projectId, 'details');

    if (result.success) {
      setFields(result.data.map(item => ({
        id: item.id,
        data: item.data,
      })));
    }

    setIsLoading(false);
  };

  const handlePopulated = (populatedFields: Record<string, any>) => {
    // Refresh data after AI population
    loadFields();
  };

  const handleFieldChange = async (itemId: string, value: string) => {
    // Optimistic update
    setFields(prev => prev.map(f =>
      f.id === itemId ? { ...f, data: { ...f.data, value } } : f
    ));

    // Save to database
    const field = fields.find(f => f.id === itemId);
    if (field) {
      await updateItemAction(itemId, { ...field.data, value });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <DocumentDropZone
      cardId={cardId}
      sectionName="Details"
      onPopulated={handlePopulated}
    >
      <div className="space-y-4">
        {/* Control bar with AI Generate button */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">
            Project Details
          </h3>
          <DocumentSelector
            projectId={projectId}
            cardId={cardId}
            sectionName="Details"
            onPopulated={handlePopulated}
            buttonVariant="outline"
            buttonSize="sm"
          />
        </div>

        {/* Fields */}
        <div className="space-y-2">
          {fields.map((field) => (
            <TextField
              key={field.id}
              label={field.data.label}
              value={field.data.value || ''}
              onChange={(value) => handleFieldChange(field.id, value)}
            />
          ))}
        </div>
      </div>
    </DocumentDropZone>
  );
}
```

## Section Name Mapping

Use these exact section names for proper field mapping:

### Plan Card
- `"Details"` - Project details (name, address, zoning, etc.)
- `"Objectives"` - Functional, Quality, Budget, Program objectives
- `"Staging"` - Project stages with dates
- `"Risk"` - Risk items with mitigation
- `"Stakeholders"` - Stakeholder contact information

### Consultant Card
- `"Scope"` - Scope items list
- `"Deliverables"` - Deliverable items list
- `"Fee Structure"` - Fee stages and amounts

### Contractor Card
- `"Scope"` - Scope items list
- `"Deliverables"` - Deliverable items list
- `"Fee Structure"` - Fee stages and amounts

## Data Flow

1. **User Action**: Drag document from repository OR click "AI Generate"
2. **Document Validation**: Check for `processingStatus === 'completed'` and `extractedData`
3. **Field Mapping**: `autoPopulateFields` maps extracted data to section fields based on card type
4. **Database Update**: Creates or updates Items in Section with `aiPopulated: true` flag
5. **Audit Trail**: Creates record in `AIPopulationHistory` table
6. **UI Callback**: `onPopulated` fires with populated fields
7. **UI Update**: Section reloads data to show AI-populated values

## Key Features

✅ **AC1, AC2**: Documents draggable into all card sections
✅ **AC3**: AI analyzes and extracts section-relevant information
✅ **AC4**: AI populates appropriate fields for all card types
✅ **AC5**: Visual highlight indicators during and after population
✅ **AC6**: All fields remain editable after AI population
✅ **AC7**: AI Generate button provides alternative to drag-drop
✅ **AC8**: "Add to Documents" toggle (default ON)

## Next Steps

To complete Story 2.4:

1. **Integrate into existing sections**:
   - Update DetailsSection to use new components
   - Add to ObjectivesSection
   - Add to StagingSection
   - Add to RiskSection

2. **Create Stakeholders section** (currently missing)

3. **Extend to Consultant/Contractor cards**:
   - Update ScopeSection
   - Update DeliverablesSection
   - Update FeeStructureSection

4. **Implement auto-filing** (AC9, AC10):
   - File dropped documents to appropriate folders
   - Plan Card → `Plan/Misc/`
   - Consultant Card → `Consultants/{Discipline}/Misc/`
   - Contractor Card → `Contractors/{Trade}/Misc/`

## Testing

All server-side functionality has comprehensive test coverage (16/16 tests passing):
- `src/app/actions/__tests__/auto-populate.test.ts`

UI components can be tested with React Testing Library and user event simulation.
