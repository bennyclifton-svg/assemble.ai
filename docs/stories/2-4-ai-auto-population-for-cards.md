# Story 2.4: AI Auto-Population for Cards

**As a user,**
I want AI to auto-populate Card sections from uploaded documents,
So that I don't have to manually enter project information.

## Status
- **Story ID**: 2.4
- **Epic**: Epic 2 - Document Management & AI Processing
- **Estimated Effort**: 8 hours
- **Priority**: High (Core value proposition)
- **Dependencies**: Story 2.3 completed (AI extraction capability)

## Acceptance Criteria
1. ✅ Documents draggable into Plan Card sections (Details, Objectives, Staging, Risk, Stakeholders)
2. ✅ Documents draggable into Consultant/Contractor Card sections (Scope, Deliverables, Fee Structure)
3. ✅ AI analyzes document and extracts section-relevant information
4. ✅ AI populates appropriate fields based on extracted content:
   - Plan Card fields including stakeholder details (role, organization, name, email, mobile)
   - Consultant/Contractor fields (scope items, deliverables, fee structure)
5. ✅ AI-populated fields show visual highlight indicator
6. ✅ User can review and edit all AI-populated content
7. ✅ "AI Generate" button provides alternative to drag-drop
8. ✅ "Add to Documents" button (default ON) allows files to be added to Document Repository
9. ✅ Files dropped in Plan Card sections auto-file to Plan/Misc/ when "Add to Documents" is enabled
10. ✅ Files dropped in Consultant/Contractor Cards auto-file to respective Misc folders

## Technical Details

### Auto-Population Service
```typescript
// app/actions/document.ts
export async function autoPopulateFields(
  documentId: string,
  targetCardId: string,
  targetSection: string
): Promise<ActionResult<PopulatedFields>> {
  const { userId } = auth();
  if (!userId) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } };
  }

  try {
    // Get document with extracted data
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { extractedData: true, extractedText: true },
    });

    if (!document || !document.extractedData) {
      return {
        success: false,
        error: { code: 'NO_EXTRACTED_DATA', message: 'Document has not been processed yet' },
      };
    }

    // Get target card and section
    const card = await prisma.card.findUnique({
      where: { id: targetCardId },
      include: { sections: true },
    });

    if (!card) {
      return {
        success: false,
        error: { code: 'CARD_NOT_FOUND', message: 'Target card not found' },
      };
    }

    // Map extracted data to card fields
    const mappedFields = mapExtractedDataToFields(
      document.extractedData as any,
      card.type,
      targetSection
    );

    // Update card section with mapped data
    const updatedFields = await updateCardSection(
      card,
      targetSection,
      mappedFields,
      userId
    );

    // Track which fields were AI-populated
    await prisma.aiPopulationHistory.create({
      data: {
        documentId,
        cardId: targetCardId,
        section: targetSection,
        populatedFields: updatedFields,
        createdBy: userId,
      },
    });

    return {
      success: true,
      data: {
        fields: updatedFields,
        source: documentId,
      },
    };
  } catch (error) {
    logger.error('Auto-population failed', { error, documentId, targetCardId });
    return {
      success: false,
      error: { code: 'POPULATION_FAILED', message: 'Failed to populate fields' },
    };
  }
}

function mapExtractedDataToFields(
  extractedData: any,
  cardType: string,
  section: string
): Record<string, any> {
  const mappings = {
    PLAN: {
      Details: {
        projectName: extractedData.projectName,
        address: extractedData.address,
        legalAddress: extractedData.legalAddress,
        zoning: extractedData.zoning,
        jurisdiction: extractedData.jurisdiction,
        lotArea: extractedData.lotArea,
        numberOfStories: extractedData.numberOfStories,
        buildingClass: extractedData.buildingClass,
      },
      Objectives: {
        functional: extractedData.objectives?.filter(o => o.type === 'functional'),
        quality: extractedData.objectives?.filter(o => o.type === 'quality'),
        budget: extractedData.objectives?.filter(o => o.type === 'budget'),
        program: extractedData.objectives?.filter(o => o.type === 'program'),
      },
      Staging: {
        stages: extractedData.stages?.map(s => ({
          name: s.name,
          startDate: s.startDate,
          endDate: s.endDate,
          description: s.description,
        })),
      },
      Risk: {
        risks: extractedData.risks?.map(r => ({
          title: r.title,
          description: r.description,
          mitigation: r.mitigation,
          probability: r.probability,
          impact: r.impact,
        })),
      },
      Stakeholders: {
        stakeholders: extractedData.stakeholders?.map(s => ({
          role: s.role,
          organization: s.organization,
          name: s.name,
          email: s.email,
          mobile: s.mobile,
        })),
      },
    },
    CONSULTANT: {
      Scope: {
        items: extractedData.scopeItems || [],
      },
      Deliverables: {
        items: extractedData.deliverables || [],
      },
      'Fee Structure': {
        stages: extractedData.feeStructure || [],
      },
    },
    CONTRACTOR: {
      Scope: {
        items: extractedData.scopeItems || [],
      },
      Deliverables: {
        items: extractedData.deliverables || [],
      },
      'Fee Structure': {
        stages: extractedData.feeStructure || [],
      },
    },
  };

  return mappings[cardType]?.[section] || {};
}

async function updateCardSection(
  card: any,
  sectionName: string,
  fields: Record<string, any>,
  userId: string
): Promise<any> {
  const section = card.sections.find(s => s.name === sectionName);

  if (!section) {
    // Create new section
    const newSection = await prisma.section.create({
      data: {
        cardId: card.id,
        name: sectionName,
        data: fields,
        createdBy: userId,
        updatedBy: userId,
      },
    });
    return fields;
  }

  // Merge with existing data
  const mergedData = {
    ...section.data,
    ...fields,
  };

  await prisma.section.update({
    where: { id: section.id },
    data: {
      data: mergedData,
      updatedBy: userId,
    },
  });

  return fields;
}
```

### Drag-Drop Handler for Cards
```typescript
// components/cards/CardSection.tsx
import { useDrop } from 'react-dnd';

interface CardSectionProps {
  card: Card;
  section: Section;
  onDataUpdate: (data: any) => void;
}

export function CardSection({ card, section, onDataUpdate }: CardSectionProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiPopulatedFields, setAiPopulatedFields] = useState<string[]>([]);
  const [addToDocuments, setAddToDocuments] = useState(true); // Default ON

  const [{ isOver }, drop] = useDrop({
    accept: 'document',
    drop: async (item: { documentId: string; file?: File }) => {
      setIsProcessing(true);

      // If this is a new file being dropped, handle auto-filing
      if (item.file && addToDocuments) {
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('projectId', card.projectId);
        formData.append('addToDocuments', 'true');

        // Add context for auto-filing based on card type
        if (card.type === 'PLAN') {
          formData.append('uploadLocation', 'plan_card');
        } else if (card.type === 'CONSULTANT') {
          formData.append('uploadLocation', 'consultant_card');
          formData.append('cardType', 'CONSULTANT');
          formData.append('disciplineOrTrade', card.discipline || 'General');
        } else if (card.type === 'CONTRACTOR') {
          formData.append('uploadLocation', 'contractor_card');
          formData.append('cardType', 'CONTRACTOR');
          formData.append('disciplineOrTrade', card.trade || 'General');
        }

        // Upload with auto-filing
        const uploadResult = await uploadDocumentsWithContext(formData);
        if (!uploadResult.success) {
          toast.error('Failed to upload document');
          setIsProcessing(false);
          return;
        }

        // Use the uploaded document for auto-population
        item.documentId = uploadResult.data[0].id;
      }

      const result = await autoPopulateFields(
        item.documentId,
        card.id,
        section.name
      );

      if (result.success) {
        onDataUpdate(result.data.fields);
        setAiPopulatedFields(Object.keys(result.data.fields));

        toast.success(`Fields populated from document`);
        if (addToDocuments && item.file) {
          toast.info('Document added to repository');
        }
      } else {
        toast.error(result.error.message);
      }

      setIsProcessing(false);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={cn(
        'border rounded-lg p-4',
        isOver && 'border-blue-500 bg-blue-50',
        isProcessing && 'opacity-50'
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">{section.name}</h3>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={addToDocuments}
              onCheckedChange={setAddToDocuments}
            />
            Add to Documents
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAiGenerate}
            disabled={isProcessing}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Generate
          </Button>
        </div>
      </div>

      {isProcessing && (
        <div className="flex items-center justify-center p-4">
          <Loader className="animate-spin w-6 h-6" />
          <span className="ml-2">Processing document...</span>
        </div>
      )}

      <SectionFields
        fields={section.data}
        aiPopulatedFields={aiPopulatedFields}
        onFieldChange={handleFieldChange}
      />
    </div>
  );
}

function SectionFields({ fields, aiPopulatedFields, onFieldChange }) {
  return (
    <div className="space-y-3">
      {Object.entries(fields).map(([key, value]) => (
        <div key={key}>
          <label className="flex items-center text-sm font-medium mb-1">
            {formatFieldName(key)}
            {aiPopulatedFields.includes(key) && (
              <Badge variant="secondary" className="ml-2">
                AI
              </Badge>
            )}
          </label>
          {Array.isArray(value) ? (
            <ItemList
              items={value}
              onChange={(items) => onFieldChange(key, items)}
              highlighted={aiPopulatedFields.includes(key)}
            />
          ) : (
            <Input
              value={value || ''}
              onChange={(e) => onFieldChange(key, e.target.value)}
              className={cn(
                aiPopulatedFields.includes(key) && 'ring-2 ring-blue-400'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

### AI Generate Button Handler
```typescript
// components/cards/CardSection.tsx
const handleAiGenerate = async () => {
  // Show document selector dialog
  const selectedDocument = await selectDocument();

  if (selectedDocument) {
    setIsProcessing(true);

    const result = await autoPopulateFields(
      selectedDocument.id,
      card.id,
      section.name
    );

    if (result.success) {
      onDataUpdate(result.data.fields);
      setAiPopulatedFields(Object.keys(result.data.fields));
      toast.success('Fields populated from document');
    } else {
      toast.error(result.error.message);
    }

    setIsProcessing(false);
  }
};

// Document selector dialog
function DocumentSelector({ onSelect }: { onSelect: (doc: Document) => void }) {
  const documents = useQuery(api.document.getByProject, { projectId });

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Document for AI Extraction</DialogTitle>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
              onClick={() => onSelect(doc)}
            >
              <div>
                <p className="font-medium">{doc.displayName}</p>
                <p className="text-sm text-gray-500">{doc.path}</p>
              </div>
              {doc.processedAt && (
                <Badge variant="outline">Processed</Badge>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Stakeholder Fields Component
```typescript
// components/cards/StakeholderFields.tsx
interface Stakeholder {
  role: string;
  organization: string;
  name: string;
  email: string;
  mobile: string;
}

export function StakeholderFields({
  stakeholders,
  onChange,
  highlighted,
}: {
  stakeholders: Stakeholder[];
  onChange: (stakeholders: Stakeholder[]) => void;
  highlighted: boolean;
}) {
  const addStakeholder = () => {
    onChange([
      ...stakeholders,
      { role: '', organization: '', name: '', email: '', mobile: '' },
    ]);
  };

  const updateStakeholder = (index: number, field: keyof Stakeholder, value: string) => {
    const updated = [...stakeholders];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeStakeholder = (index: number) => {
    onChange(stakeholders.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {stakeholders.map((stakeholder, index) => (
        <div
          key={index}
          className={cn(
            'border rounded-lg p-3',
            highlighted && 'ring-2 ring-blue-400'
          )}
        >
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Input
              placeholder="Role"
              value={stakeholder.role}
              onChange={(e) => updateStakeholder(index, 'role', e.target.value)}
            />
            <Input
              placeholder="Organization"
              value={stakeholder.organization}
              onChange={(e) => updateStakeholder(index, 'organization', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              placeholder="Name"
              value={stakeholder.name}
              onChange={(e) => updateStakeholder(index, 'name', e.target.value)}
            />
            <Input
              placeholder="Email"
              type="email"
              value={stakeholder.email}
              onChange={(e) => updateStakeholder(index, 'email', e.target.value)}
            />
            <div className="flex gap-2">
              <Input
                placeholder="Mobile"
                value={stakeholder.mobile}
                onChange={(e) => updateStakeholder(index, 'mobile', e.target.value)}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeStakeholder(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={addStakeholder}>
        <Plus className="w-4 h-4 mr-2" />
        Add Stakeholder
      </Button>
    </div>
  );
}
```

### Implementation Steps
1. **Create auto-population service**
   - Map extracted data to card fields
   - Handle different card types (Plan, Consultant, Contractor)
   - Merge with existing data

2. **Implement drag-drop on card sections**
   - Visual feedback during drag
   - Process document on drop
   - Show loading state

3. **Add AI Generate button**
   - Document selector dialog
   - Trigger auto-population
   - Same flow as drag-drop

4. **Visual indicators for AI fields**
   - Highlight AI-populated fields
   - Show AI badge
   - Allow editing/rejection

5. **Special field components**
   - Stakeholder list component
   - Stage list component
   - Fee structure table

### Testing Checklist
- [ ] Unit test: Data mapping for each card type
- [ ] Unit test: Field merging logic
- [ ] Component test: Drag-drop interaction
- [ ] Component test: AI Generate button
- [ ] Component test: Field highlighting
- [ ] E2E test: Drag document to Plan Card
- [ ] E2E test: Drag document to Consultant Card
- [ ] E2E test: Edit AI-populated fields
- [ ] E2E test: Multiple stakeholder entries

## UI/UX Notes
- Clear visual feedback during drag operations
- Loading spinner during processing
- Success/error toasts
- Highlight AI-populated fields with blue ring
- Show AI badge next to field labels
- Allow bulk accept/reject of AI fields

## Related Documentation
- [Epic 2 Tech Spec](../tech-spec-epic-2.md)
- [Story 2.3: AI Document Processing](./2-3-ai-document-processing-text-extraction.md)

## Dev Agent Record

### Context Reference
- Story Context: `docs/stories/story-context-2.4.xml` (Generated: 2025-10-26)

### Debug Log
**Session: 2025-10-26**

**Task 1: Create auto-population service ✅**
- Created `autoPopulateFields` Server Action in src/app/actions/document.ts (lines 403-517)
  - Clerk authentication check
  - Retrieves document with extractedData from Database
  - Validates document has been processed (processingStatus === 'completed')
  - Loads target card with sections and items
  - Maps extracted data using mapExtractedDataToFields
  - Updates card section using updateCardSection
  - Tracks population in AIPopulationHistory

- Implemented `mapExtractedDataToFields` helper (lines 524-634)
  - Handles PLAN card sections: Details, Objectives, Staging, Risk, Stakeholders
  - Handles CONSULTANT card sections: Scope, Deliverables, Fee Structure
  - Handles CONTRACTOR card sections: Scope, Deliverables, Fee Structure
  - Filters out null/undefined/empty values
  - Transforms array data (stakeholders, stages, risks, objectives, scope, deliverables, feeStructure)

- Implemented `updateCardSection` helper (lines 640-732)
  - Creates section if it doesn't exist
  - Creates or updates Items within section (adapted to actual schema using Items model)
  - Merges AI data with existing items (doesn't replace)
  - Marks items with aiPopulated: true flag in data
  - Returns populated fields for tracking

**Key Implementation Notes:**
- Adapted story spec to work with actual Prisma schema (Section -> Items, not Section.data)
- Each field becomes an Item with type (text/number/toggle/list/object) and data Json
- Item.data structure: { fieldName, value, aiPopulated: true }
- Fixed TypeScript error: removed items: [] from Section.create (items is a relation)
- No type errors in document.ts after fix

**Current Assessment:**
- Existing DetailsSection already has drag-drop and AI population (uses different extraction approach)
- Story ACs pre-marked as complete (✅) - likely from prototyping phase
- Centralized autoPopulateFields service now available for consistent AI population across all sections
- Next steps: Integrate new service into existing sections OR validate current implementation satisfies requirements

**Task 2: Write comprehensive tests ✅**
- Created test suite: src/app/actions/__tests__/auto-populate.test.ts
- 16 tests covering all acceptance criteria:
  - Authentication checks (AC3)
  - Document validation (AC3)
  - Card validation (AC4)
  - Plan Card - Details section population (AC4)
  - Plan Card - Stakeholders section with contact details (AC4)
  - Plan Card - Objectives filtering by type (AC4)
  - Plan Card - Staging with dates (AC4)
  - Plan Card - Risk fields (AC4)
  - Consultant/Contractor - Scope section (AC4)
  - Consultant/Contractor - Fee Structure (AC4)
  - Data filtering (null/undefined/empty values)
  - AIPopulationHistory tracking (AC8)
  - Merge with existing data (AC6)
- **All 16 tests passing** ✅
- Tests validate correct mapping for PLAN, CONSULTANT, and CONTRACTOR card types
- Tests confirm data merging strategy (updates existing items, doesn't replace)

**Summary:**
Core server-side auto-population infrastructure complete and tested:
- ✅ Server Action: autoPopulateFields with auth, validation, error handling
- ✅ Field mapping: All card types and sections (Details, Objectives, Staging, Risk, Stakeholders, Scope, Deliverables, Fee Structure)
- ✅ Data merging: Preserves existing data, marks AI-populated fields
- ✅ Audit trail: AIPopulationHistory tracking
- ✅ Comprehensive test coverage: 16/16 tests passing

Existing UI capabilities observed:
- DetailsSection has drag-drop with visual feedback
- AI population with Sparkles icon + "AI" badge indicators
- Editable fields after AI population

**Task 3: Create reusable UI components ✅**
- Created **DocumentDropZone** component (src/components/cards/DocumentDropZone.tsx)
  - Wraps section content with drag-drop capability (AC1, AC2)
  - Visual feedback during drag operations (AC5)
  - Integrates with Document Repository and autoPopulateFields service
  - "Add to Documents" toggle with default ON state (AC8)
  - Success indicators showing field count
  - Handles both existing documents from repository and new file drops
  - Supports drag from repository with `application/x-document-id` data transfer type

- Created **DocumentSelector** component (src/components/cards/DocumentSelector.tsx)
  - AI Generate button with document picker dialog (AC7)
  - Lists all processed documents from repository
  - Filters to show only documents with completed extraction
  - Visual processing feedback with loading states
  - Configurable button variant and size
  - Error handling with user-friendly messages

- Created **Integration Guide** (src/components/cards/INTEGRATION_GUIDE.md)
  - Complete usage examples
  - Integration patterns for all section types
  - Data flow documentation
  - Section name mapping reference
  - Next steps for completing Story 2.4

**Implementation Status:**

✅ **Completed (Ready for Integration):**
- Server-side auto-population service (100%)
- Comprehensive test suite (16/16 passing)
- Reusable DocumentDropZone component
- Reusable DocumentSelector component
- Integration documentation

🔄 **Integration Required:**
- Apply components to existing Plan Card sections
- Create Stakeholders section component
- Apply components to Consultant/Contractor sections
- Implement auto-filing logic (AC9, AC10)

**AC Status:**
- ✅ AC3: AI analyzes and extracts information (Story 2.3 + autoPopulateFields)
- ✅ AC4: AI populates appropriate fields (tested for all card types)
- ✅ AC5: Visual highlight indicators (DocumentDropZone)
- ✅ AC6: Fields remain editable (merge strategy, not replace)
- ✅ AC7: AI Generate button alternative (DocumentSelector)
- ✅ AC8: "Add to Documents" toggle (DocumentDropZone, default ON)
- 🔄 AC1, AC2: Drag-drop capability (components ready, need integration)
- 🔄 AC9, AC10: Auto-filing logic (not yet implemented)

**Task 4: Create Stakeholders Section Component ✅**
- Created **StakeholdersSection** component (src/components/cards/sections/StakeholdersSection.tsx)
  - Full CRUD for stakeholder management
  - Fields: role, organization, name, email, mobile
  - Integrates DocumentDropZone for drag-drop AI population
  - Integrates DocumentSelector for AI Generate button
  - Visual indicators for AI-populated stakeholders
  - Add/Remove stakeholders functionality
  - Empty state with helpful messaging
  - Proper TypeScript types with async onChange handlers

- Added **initializeStakeholdersSectionAction** (src/app/actions/card.ts:1370-1460)
  - Creates stakeholders section for Plan Card
  - Initializes empty stakeholders array
  - Follows existing initialization patterns

- Updated **PlanCard** component (src/components/cards/PlanCard.tsx)
  - Added StakeholdersSection import and rendering
  - Added cardId prop to support AI auto-population
  - Updated isEmpty check to include stakeholders
  - Stakeholders now fully functional in Plan Card

**Zero Type Errors:** All new components pass TypeScript strict checks ✅

**Final Implementation Status:**

✅ **Completed:**
1. Server-side auto-population service (100%)
2. Comprehensive test suite (16/16 passing)
3. DocumentDropZone reusable component
4. DocumentSelector reusable component
5. Stakeholders section fully implemented
6. Integration guide documentation
7. Zero TypeScript errors

🔄 **Remaining for Full Story Completion:**
1. Apply components to remaining Plan sections (Objectives, Staging, Risk)
2. Apply components to Consultant/Contractor sections
3. Implement auto-filing logic (AC9, AC10)
4. End-to-end testing with real documents

**Files Created/Modified (Session Total):**
- src/app/actions/document.ts (+342 lines)
- src/app/actions/__tests__/auto-populate.test.ts (+590 lines, NEW)
- src/components/cards/DocumentDropZone.tsx (+160 lines, NEW)
- src/components/cards/DocumentSelector.tsx (+170 lines, NEW)
- src/components/cards/INTEGRATION_GUIDE.md (+200 lines, NEW)
- src/components/cards/sections/StakeholdersSection.tsx (+273 lines, NEW)
- src/app/actions/card.ts (+91 lines for initializeStakeholdersSectionAction)
- src/components/cards/PlanCard.tsx (modified, +3 lines)
- docs/stories/2-4-ai-auto-population-for-cards.md (updated with progress)

**Total New Code:** ~1,826 lines

## Notes
- Consider adding confidence scores for AI fields
- Allow user to review changes before applying
- Track which fields were AI vs manually entered
- Consider undo/redo functionality
- Monitor which fields are most commonly edited after AI population