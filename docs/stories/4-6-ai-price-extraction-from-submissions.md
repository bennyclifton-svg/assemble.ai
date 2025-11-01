# Story 4.6: AI Price Extraction from Submissions

Status: Draft

## Story

As a user,
I want AI to extract pricing from tender submissions,
So that I don't have to manually enter all prices.

## Acceptance Criteria

1. "AI generate fee table from latest Submission" icon (accent color) displayed next to each firm column in Tender Evaluation tables
2. AI reads tender submission PDFs from Documents folder (Documents/[Consultant]/[Firm] Submission XX.PDF)
3. AI extracts pricing data matching the fee structure line items and populates evaluation tables
4. Highlights AI-populated cells with distinct visual indicator (e.g., light blue background)
5. Manual override enabled for all AI-populated values with inline editing
6. Handles multiple submission versions (Submission 1, Submission 2, etc.) - always uses latest by default

## Tasks / Subtasks

- [ ] Add "AI Generate" icon to firm columns (AC: #1)
  - [ ] Add icon button next to each firm header in PriceEvaluationTable component
  - [ ] Use accent color styling for AI action icons (consistent with other AI features)
  - [ ] Display tooltip: "AI generate fee table from latest Submission"
  - [ ] Show loading spinner during AI processing

- [ ] Implement AI extraction service (AC: #2, #3)
  - [ ] Create `src/server/services/priceExtractor.ts` service
  - [ ] Integrate with OpenAI GPT-4 Vision API (via Vercel AI SDK)
  - [ ] Load latest submission PDF from S3/Documents folder based on firm
  - [ ] Extract text and/or use vision model for scanned PDFs
  - [ ] Parse pricing data matching fee structure line item descriptions
  - [ ] Map extracted prices to corresponding evaluation table line items

- [ ] Create AI extraction prompt engineering (AC: #3)
  - [ ] Design system prompt for construction tender pricing extraction
  - [ ] Include fee structure template in prompt context
  - [ ] Handle variations in pricing table formats (Excel tables, PDF tables, free text)
  - [ ] Extract hierarchical pricing (categories, sub-items, totals)
  - [ ] Validate extracted numbers are valid decimals

- [ ] Implement UI feedback and manual override (AC: #4, #5)
  - [ ] Highlight AI-populated cells with background color
  - [ ] Add small AI icon indicator in populated cells
  - [ ] Enable immediate inline editing of AI-populated values
  - [ ] Clear AI indicator when user manually edits value
  - [ ] Show confidence indicator if AI extraction uncertain (optional enhancement)

- [ ] Handle multiple submission versions (AC: #6)
  - [ ] Query Documents folder for all submissions for given firm
  - [ ] Sort by submission number (Submission 1, Submission 2, etc.)
  - [ ] Use latest submission by default
  - [ ] Provide dropdown to select different submission version if needed
  - [ ] Display submission date and version number in UI

- [ ] Server Actions for AI extraction (AC: All)
  - [ ] Create `extractPricesFromSubmission` server action in `src/app/actions/tender.ts`
  - [ ] Accept parameters: firmId, consultantId/contractorId, submissionVersion (optional)
  - [ ] Return extracted pricing data with confidence scores
  - [ ] Handle errors gracefully (PDF not found, AI extraction failure)

- [ ] Testing (AC: All)
  - [ ] Test with real construction tender submission PDFs (various formats)
  - [ ] Test with scanned vs digital PDFs
  - [ ] Test extraction accuracy against known pricing tables
  - [ ] Test handling multiple submission versions
  - [ ] Test manual override functionality
  - [ ] Test error handling (missing submission, AI failure)

## Dev Notes

### Architecture Patterns
- Extend priceExtractor service with AI-powered extraction (builds on Story 2.3 document processing patterns)
- Use Vercel AI SDK with OpenAI GPT-4 Vision for robust extraction from diverse PDF formats
- Implement optimistic UI updates: show loading state → display extracted data → allow manual refinement
- Store AI extraction metadata (extractedAt timestamp, confidence score) for audit trail

### Components to Modify
- `src/components/tender/PriceEvaluationTable.tsx` - **Handsontable-based** component; add AI generate icon per firm column header
- `src/components/tender/FirmColumn.tsx` - Add AI indicator to populated cells (may not be needed if Handsontable custom renderer used)
- `src/server/services/priceExtractor.ts` (new) - Core AI extraction service
- `src/app/actions/tender.ts` - Add extractPricesFromSubmission server action
- `src/lib/ai/prompts.ts` - Add tender pricing extraction system prompts

### Handsontable Integration Notes

**IMPORTANT**: Story 4.5 uses **Handsontable** for PriceEvaluationTable.tsx. This story must integrate with Handsontable's data structure and rendering.

**AI-Populated Cell Highlighting (AC #4)**:
Use Handsontable's custom cell renderer to highlight AI-populated cells:

```typescript
// Custom renderer for AI-populated cells
function aiCellRenderer(instance, td, row, col, prop, value, cellProperties) {
  Handsontable.renderers.NumericRenderer.apply(this, arguments);

  // Get cell metadata to check if AI-populated
  const cellMeta = instance.getCellMeta(row, col);

  if (cellMeta.aiExtracted) {
    td.style.backgroundColor = '#E3F2FD'; // Light blue background
    td.classList.add('ai-populated-cell');

    // Add small AI icon indicator
    const aiIcon = document.createElement('span');
    aiIcon.className = 'ai-icon-indicator';
    aiIcon.innerHTML = '✨'; // Or use a proper icon
    td.appendChild(aiIcon);
  }
}

// Apply renderer to firm columns
columns: firms.map(firm => ({
  data: `firm_${firm.id}`,
  type: 'numeric',
  renderer: aiCellRenderer,
  numericFormat: { pattern: '$0,0.00' }
}))
```

**Populating Handsontable with AI Data (AC #3)**:

```typescript
// After AI extraction, update Handsontable data
async function handleAIExtraction(firmId: string) {
  const { extractedPrices } = await extractPricesFromSubmission(firmId);

  // Get Handsontable instance
  const hotInstance = hotTableRef.current?.hotInstance;

  // Update cells with extracted prices
  extractedPrices.forEach(({ rowIndex, amount, confidence }) => {
    const colIndex = getFirmColumnIndex(firmId);

    // Set cell value
    hotInstance.setDataAtCell(rowIndex, colIndex, amount);

    // Set cell metadata for AI indicator
    hotInstance.setCellMeta(rowIndex, colIndex, 'aiExtracted', true);
    hotInstance.setCellMeta(rowIndex, colIndex, 'confidence', confidence);
  });

  // Trigger re-render
  hotInstance.render();
}
```

**Manual Override (AC #5)**:
Handsontable's inline editing works automatically. Clear AI indicator on manual edit:

```typescript
// afterChange callback
afterChange={(changes, source) => {
  if (source === 'edit') {
    changes?.forEach(([row, col]) => {
      const hotInstance = hotTableRef.current?.hotInstance;
      // Clear AI indicator when user manually edits
      hotInstance.setCellMeta(row, col, 'aiExtracted', false);
      hotInstance.render();
    });
  }
}}
```

**Data Mapping**:
- AI extraction returns flat array: `[{ description, amount, confidence }]`
- Map to Handsontable row indices based on description matching
- Handle hierarchical structure: match category names and nested items
- Store confidence scores in cell metadata (not visible data)

### AI Prompt Strategy

**System Prompt Template:**
```
You are a construction tender pricing extraction specialist.
Extract pricing information from the provided tender submission document.

Fee Structure Template:
{feeStructureLineItems}

Instructions:
1. Locate pricing tables or fee schedules in the document
2. Extract prices for each line item matching the fee structure
3. Identify category totals and sub-totals
4. Handle variations in terminology (e.g., "Architectural Services" may appear as "Design Services")
5. Return prices as decimal numbers only
6. If a price is not found, return null for that item
7. Include confidence score for each extraction (0.0-1.0)

Output Format: JSON
{
  "lineItems": [
    { "description": "...", "amount": 12345.67, "confidence": 0.95 },
    ...
  ]
}
```

### Data Model Extensions
```typescript
// Extend EvaluationLineItem model
model EvaluationLineItem {
  // ... existing fields
  aiExtracted        Boolean  @default(false)  // Flag for AI-populated values
  extractedAt        DateTime?                 // When AI extraction occurred
  extractionConfidence Float?                  // Confidence score (0.0-1.0)
  submissionVersion  Int?                      // Which submission version was used
}
```

### Document Lookup Logic
```typescript
// Find latest submission for firm
async function getLatestSubmission(firmId: string, consultantId: string): Promise<Document> {
  // Query: Documents/[ConsultantName]/[FirmName] Submission *.PDF
  // Sort by submission number descending
  // Return most recent
}
```

### Testing Standards
- Unit tests for priceExtractor service with mock PDF responses
- Integration tests with sample tender submission PDFs
- Test accuracy: >90% correct extraction for structured pricing tables
- Test performance: <10 seconds extraction time per submission (15MB PDF)
- E2E test: Full workflow from click "AI Generate" to populated table

### Project Structure Notes
- AI extraction service follows pattern from Story 2.3 (AI Document Processing)
- Reuse existing S3 document retrieval logic from documentProcessor.ts
- Store AI extraction prompts centrally in `src/lib/ai/prompts.ts` for version control
- Consider caching extracted pricing to avoid re-processing same submission
- **Handsontable Integration**: Price tables use Handsontable library (see Story 4.5)
  - Use Handsontable's `setDataAtCell()` API to populate extracted prices
  - Use `setCellMeta()` to store AI metadata (confidence, extraction timestamp)
  - Use custom cell renderer for visual AI indicators
  - Leverage `afterChange` callback to clear AI indicators on manual edits

### Error Handling
- PDF not found: Display user-friendly message "No submission found for [Firm Name]. Please upload submission first."
- AI extraction failure: "Unable to extract pricing automatically. Please enter prices manually."
- Invalid pricing data: Validate all extracted values are valid decimals before populating
- Timeout handling: 30-second timeout for AI processing with fallback message

### References
- [Source: docs/epics.md#Story 4.6]
- [Source: docs/PRD.md#FR012_TE4, FR012_TE8]
- [Source: docs/architecture.md#AI Services]
- [Source: docs/stories/story-2.3.md] - AI Document Processing pattern
- [Source: docs/stories/story-4.5.md] - Price evaluation table structure

## Dev Agent Record

### Context Reference

- [Story Context XML](story-context-4.6.xml)

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
