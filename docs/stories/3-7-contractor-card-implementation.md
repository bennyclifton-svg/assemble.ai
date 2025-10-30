# Story 3.7: Contractor Card Implementation

Status: Draft

## Story

As a user,
I want Contractor Card with same functionality as Consultant Card,
So that I can manage contractor procurement.

## Acceptance Criteria

43. Contractor Card structure identical to Consultant Card
44. Tabs for each toggled-on contractor trade
45. All sections replicated from Consultant Card
46. Contractor-specific terminology where appropriate
47. Independent data storage from Consultant Card

## Tasks / Subtasks

- [ ] Create Contractor Card component (AC: 43, 44)
  - [ ] Duplicate ConsultantCard structure as ContractorCard.tsx
  - [ ] Subscribe to Plan Card contractor toggle states
  - [ ] Create tabs for each toggled contractor trade
  - [ ] Implement same 10 sections as Consultant Card

- [ ] Replicate all section functionality (AC: 45)
  - [ ] Firms section with column layout
  - [ ] Scope section with AI generation
  - [ ] Deliverables section with AI generation
  - [ ] Fee Structure section
  - [ ] Tender Document section
  - [ ] Tender Release and Submission section
  - [ ] Tender Pack section
  - [ ] RFI and Addendum section (firm-based columns)
  - [ ] Tender Evaluation section
  - [ ] Recommendation Report section

- [ ] Apply contractor-specific terminology (AC: 46)
  - [ ] Use "Trade" instead of "Discipline"
  - [ ] Adjust section labels for contractor context
  - [ ] Update AI prompts for trade-specific generation
  - [ ] Use 20 contractor trades from Plan Card

- [ ] Create independent database schema (AC: 47)
  - [ ] Add ContractorCard model (mirrors ConsultantCard)
  - [ ] Add ContractorSection model with ContractorSectionType enum
  - [ ] Reuse Firm model (supports both consultant and contractor)
  - [ ] Create contractorRouter with same API methods

- [ ] Update document filing paths
  - [ ] Submissions: Documents/[Contractor]/[Trade]/filename.pdf
  - [ ] RFIs: Documents/Contractor/[Firm Name]/filename.pdf
  - [ ] Addendums: Documents/Contractor/[Firm Name]/filename.pdf

- [ ] Testing
  - [ ] Integration test: Toggle contractor → verify card creation
  - [ ] Integration test: Verify parity with Consultant Card features
  - [ ] E2E test: Complete contractor procurement workflow

## Dev Notes

### Implementation Strategy

**Code Reuse:**
- Contractor Card shares most logic with Consultant Card
- Extract shared components into base components
- Use props to differentiate consultant vs contractor behavior
- Share section components where possible

**Key Differences:**
- Data models: ContractorCard vs ConsultantCard
- Terminology: "Trade" vs "Discipline"
- Plan Card source: Contractor List (20 trades) vs Consultant List (36 disciplines)
- Filing paths: `/Contractor/` vs `/Consultant/`

### References

- [Source: docs/tech-spec-epic-3.md#Data Models] - ContractorCard model
- [Source: docs/tech-spec-epic-3.md#Workflows] - Contractor Card Creation Flow
- [Source: docs/epics.md#Epic 3 Story 3.7] - Original acceptance criteria

## Dev Agent Record

### Context Reference

- [Story Context XML](./story-context-3.7.xml)

### Completion Notes List

<!-- Implementation notes -->

### File List

<!-- Files created/modified -->
