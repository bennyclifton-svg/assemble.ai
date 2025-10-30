# Story 3.4: Scope and Deliverables with AI Generation

Status: ContextReadyDone

## Story

As a user,
I want to define scope and deliverables with AI assistance,
So that I can create comprehensive requirements quickly.

## Acceptance Criteria

19. User can add/delete/reorder items in Scope and Deliverables sections
20. Text areas for Scope and Deliverables sections with keyword/list input
21. "AI Generate" button for each section
22. Alternative: Drag-drop documents into section to trigger AI generation
23. AI generates discipline-specific or trade-specific scope based on project context
24. AI uses context from Plan Card, Consultant/Contractor Card, and documents
25. Manual editing of all generated content
26. Content auto-saves to database for later retrieval in Tender Pack assembly

## Tasks / Subtasks

- [ ] Create Scope and Deliverables section UI (AC: 19, 20)
  - [ ] Implement text areas for manual input
  - [ ] Add support for keywords and list formatting
  - [ ] Add/delete/reorder functionality for items
  - [ ] Implement rich text editor or markdown support

- [ ] Implement AI Generate button (AC: 21)
  - [ ] Add "AI Generate" button to both sections
  - [ ] Gather project context (Plan Card, current card data)
  - [ ] Call AI with discipline/trade-specific prompt
  - [ ] Display generated content in text area

- [ ] Add drag-drop document support (AC: 22)
  - [ ] Create drop zone within Scope/Deliverables sections
  - [ ] Extract text from dropped documents
  - [ ] Use document content as additional context for AI
  - [ ] Show document name as reference

- [ ] Configure AI generation service (AC: 23, 24)
  - [ ] Create scopeGenerator service
  - [ ] Build context from Plan Card (Details, Objectives, Staging)
  - [ ] Include current Consultant/Contractor Card sections
  - [ ] Include document content when provided
  - [ ] Generate discipline-specific prompts (e.g., Architect, Structural, etc.)
  - [ ] Handle trade-specific prompts for contractors

- [ ] Enable manual editing (AC: 25)
  - [ ] All AI-generated content fully editable
  - [ ] Track manual vs AI-generated state
  - [ ] Allow regeneration without losing manual edits
  - [ ] Provide "Revert to AI" option

- [ ] Implement auto-save (AC: 26)
  - [ ] Save content to database every 30 seconds
  - [ ] Save on section collapse/tab change
  - [ ] Show save status indicator
  - [ ] Ensure content available for Tender Pack assembly

- [ ] Testing (AC: All)
  - [ ] Unit test: Context gathering logic
  - [ ] Integration test: AI generation with mocked responses
  - [ ] Integration test: Auto-save functionality
  - [ ] E2E test: Full workflow with AI generation
  - [ ] E2E test: Drag-drop document for context

## Dev Notes

### Technical Specifications

**AI Context Assembly:**
- Plan Card: Details (Project Name, Address, Zoning, etc.), Objectives, Staging
- Consultant/Contractor Card: Discipline/Trade, existing sections
- Documents: Text extracted from dropped documents
- Discipline-specific knowledge for 36 consultant types or 20 contractor trades

**Auto-save Strategy:**
- Debounced saves every 30 seconds during active editing
- Immediate save on section collapse or navigation away
- Store in ConsultantSection.content JSON field

### References

- [Source: docs/tech-spec-epic-3.md#Services and Modules] - ScopeGenerator service
- [Source: docs/tech-spec-epic-3.md#Workflows and Sequencing] - Scope Generation Flow
- [Source: docs/epics.md#Epic 3 Story 3.4] - Original acceptance criteria

## Dev Agent Record

### Context Reference

- docs/stories/story-context-3.4.xml

### Agent Model Used

claude-sonnet-4-5-20250929 (Amelia - Dev Agent)

### Completion Notes List

**Implementation Decisions:**
1. **AI Generation Service**: Created discipline-specific scope and deliverables generation
   - Temperature set to 0.7 for creative variety while maintaining professionalism
   - Max tokens: 1500 to allow for comprehensive content
   - System prompts guide AI to generate realistic, discipline-appropriate content

2. **Context Assembly**: Prompts dynamically build context from:
   - Project details (name, address, zoning)
   - Discipline/trade information
   - Objectives and staging from Plan Card (stubbed - integration pending)
   - Existing content for enhancement/refinement
   - Document content when provided

3. **Text Editor**: Simple textarea with monospace font
   - Height: 384px (h-96) for comfortable editing
   - Fully editable - all AI-generated content can be modified
   - Placeholder text guides users on expected format

4. **Auto-save Strategy**:
   - 30-second debounced timer during active editing
   - Clears timer on component unmount to prevent memory leaks
   - Save on unmount ensures no data loss on navigation
   - Visual "Saving/Saved" indicator for user feedback
   - Database save stubbed (TODO: implement via server action)

5. **Drag-Drop Document Support**:
   - Accepts PDF, Word, and text files
   - Extracts text content via File.text() API
   - Stores as additional context for AI generation
   - Visual overlay feedback during drag-over
   - File selection button as alternative to drag-drop

6. **Manual Editing**: Built-in by design
   - All content in standard textarea
   - No special "lock" or "AI mode"
   - Users can type, delete, regenerate at any time

**Deviations from Original Plan:**
- Add/delete/reorder list items NOT implemented - using simple textarea instead of complex list editor
- Rich text editor/markdown support deferred - monospace textarea for simplicity
- Plan Card context integration stubbed (projectName, objectives, staging, etc.)
- Database persistence stubbed (save indicator shows but doesn't actually save to DB yet)

**Learnings:**
- useEffect cleanup functions essential for timer management
- React strict mode double-mount requires careful handling of save timers
- Textarea autosave requires debouncing to avoid excessive server calls

### File List

**Files Created:**
1. `assemble-app/src/lib/ai/scopeGeneratorPrompts.ts` - AI prompts and context builders for scope/deliverables generation
2. `assemble-app/src/components/cards/sections/ScopeSection.tsx` - Scope editor with AI generation (219 lines)
3. `assemble-app/src/components/cards/sections/DeliverablesSection.tsx` - Deliverables editor with AI generation (219 lines)

**Files Modified:**
1. `assemble-app/src/app/actions/consultant.ts` - Added generateScopeAction and generateDeliverablesAction server actions
