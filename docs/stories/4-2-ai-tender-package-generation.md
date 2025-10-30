# Story 4.2: AI Tender Package Generation

Status: Ready

## Story

As a construction manager,
I want AI to generate comprehensive tender packages,
So that I get professional, project-specific documents quickly without manual assembly.

## Acceptance Criteria

1. AI compiles selected components into coherent package
2. Generates sharp, focused content (not generic templates)
3. Package includes all selected sections with appropriate formatting
4. Document schedule created (not actual document copies)
5. Generation completes in < 30 seconds
6. Progress indicator during generation

## Tasks / Subtasks

- [ ] Task 1: Implement AI tender generation service (AC: #1, #2, #3, #4)
  - [ ] Subtask 1.1: Create tenderGenerator service in `/src/server/services/tenderGenerator.ts`
  - [ ] Subtask 1.2: Implement data aggregation from Plan Card, Consultant/Contractor Card, and Documents
  - [ ] Subtask 1.3: Design system prompts for sharp, project-specific content generation
  - [ ] Subtask 1.4: Integrate OpenAI GPT-4 via Vercel AI SDK for content generation
  - [ ] Subtask 1.5: Implement document schedule generation (list format, not file copies)
  - [ ] Subtask 1.6: Structure generated package with appropriate sections and formatting
- [ ] Task 2: Create server action for tender generation (AC: #5, #6)
  - [ ] Subtask 2.1: Create server action in `/src/app/actions/tender.ts`
  - [ ] Subtask 2.2: Implement streaming response for progress updates
  - [ ] Subtask 2.3: Add timeout handling and error recovery for AI calls
  - [ ] Subtask 2.4: Optimize to complete generation in < 30 seconds
- [ ] Task 3: Build progress indicator UI (AC: #6)
  - [ ] Subtask 3.1: Create TenderGenerationProgress component
  - [ ] Subtask 3.2: Display real-time status (e.g., "Compiling scope...", "Generating deliverables...")
  - [ ] Subtask 3.3: Show progress bar or spinner during generation
  - [ ] Subtask 3.4: Handle generation errors with user-friendly messages
- [ ] Task 4: Store generated tender package (AC: #1, #3, #4)
  - [ ] Subtask 4.1: Extend Prisma schema with TenderPackage model
  - [ ] Subtask 4.2: Save generated content to database
  - [ ] Subtask 4.3: Store document schedule as structured data
  - [ ] Subtask 4.4: Link tender package to source Consultant/Contractor Card
- [ ] Task 5: Write tests for AI generation (AC: All)
  - [ ] Subtask 5.1: Unit tests for tender generator service with mocked AI responses
  - [ ] Subtask 5.2: Integration tests for data aggregation
  - [ ] Subtask 5.3: Performance tests to verify < 30 second generation
  - [ ] Subtask 5.4: E2E test for complete generation workflow

## Dev Notes

### Architecture Constraints

- Use Vercel AI SDK with OpenAI GPT-4 for document generation (as specified in architecture.md)
- Implement streaming responses for real-time progress updates
- Follow Server Actions pattern for generation trigger
- Ensure generation logic is independent and testable (service layer pattern)
- Maintain audit trail for all AI-generated content

### AI Prompt Engineering

System prompt must emphasize:
- Sharp, project-specific content focused on user's Plan Card context
- Avoid generic template language
- Extract and synthesize relevant details from selected sections
- Professional construction industry tone and terminology
- Clear scope definition suitable for accountability during delivery

Example prompt structure:
```
You are an expert construction project manager preparing a tender package for [discipline].
Project context: [Plan Card details]
Scope requirements: [Consultant Card scope section]
Deliverables: [Consultant Card deliverables]
Fee structure: [Consultant Card fee structure]

Generate a sharp, focused tender brief that clearly defines scope and deliverables...
```

### Document Schedule Format

Document schedule should be structured as:
```typescript
interface DocumentSchedule {
  categoryName: string;
  documents: {
    id: string;
    name: string;
    path: string;  // Reference only, not file copy
    version?: string;
    relevantSections?: string[];
  }[];
}
```

### Database Schema Extension

```prisma
model TenderPackage {
  id                    String   @id @default(cuid())
  consultantCardId      String?  // FK to ConsultantCard
  contractorCardId      String?  // FK to ContractorCard
  configId              String   // FK to TenderPackageConfig
  generatedContent      Json     // Structured sections
  documentSchedule      Json     // Array of DocumentSchedule
  status                String   @default("draft") // draft, locked
  generatedAt           DateTime @default(now())
  generatedBy           String   // User ID
  aiModel               String   // e.g., "gpt-4-turbo"
  generationTimeMs      Int      // Performance tracking
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### Source Tree Components

Files to create/modify:
- `/src/server/services/tenderGenerator.ts` (new)
- `/src/app/actions/tender.ts` (new)
- `/src/lib/ai/prompts.ts` (modify - add tender generation prompts)
- `/src/components/tender/TenderGenerationProgress.tsx` (new)
- `/src/components/tender/GeneratedTenderView.tsx` (new)
- `/prisma/schema.prisma` (modify)
- `/src/types/tender.ts` (new - type definitions)

### Project Structure Notes

- AI services aligned with `/src/lib/ai/` and `/src/server/services/` structure
- Generated content stored as JSON for flexibility
- Document schedule uses references (paths) not actual file copies
- Status field enables immutability enforcement in Story 4.4

### Performance Considerations

- Target: < 30 seconds total generation time
- Use GPT-4 Turbo (faster than GPT-4)
- Optimize prompt length by extracting only relevant data
- Consider parallel AI calls if generating multiple independent sections
- Implement client-side timeout with graceful degradation

### Testing Standards

- Mock OpenAI responses for unit tests to ensure deterministic behavior
- Test with various project sizes to validate < 30s requirement
- Verify document schedule contains references only, not file data
- Test error handling for AI failures, timeouts, network issues

### References

- [Source: docs/epics.md#Story 4.2] - Acceptance criteria and story definition
- [Source: docs/PRD.md#FR016-FR020] - Tender package generation requirements
- [Source: docs/PRD.md#NFR002] - Performance requirement: < 30 seconds
- [Source: docs/architecture.md#AI Services] - OpenAI GPT-4 Turbo, Vercel AI SDK
- [Source: docs/architecture.md#Novel Pattern Designs] - Data flow patterns
- [Source: docs/PRD.md#User Journey 1 Step 4-5] - Tender generation user flow

## Dev Agent Record

### Context Reference

- docs/stories/story-context-4.2.xml

### Agent Model Used

claude-sonnet-4-5-20250929

### Debug Log References

### Completion Notes List

### File List
