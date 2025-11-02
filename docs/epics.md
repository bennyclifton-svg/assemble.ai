# assemble.ai - Epic Breakdown

**Author:** Benny
**Date:** 2025-10-25
**Project Level:** 3
**Target Scale:** 40-50 stories

---

## Overview

This document provides the detailed epic breakdown for assemble.ai, expanding on the high-level epic list in the [PRD](./PRD.md).

Each epic includes:

- Expanded goal and value proposition
- Complete story breakdown with user stories
- Acceptance criteria for each story
- Story sequencing and dependencies

**Epic Sequencing Principles:**

- Epic 1 establishes foundational infrastructure and initial functionality
- Subsequent epics build progressively, each delivering significant end-to-end value
- Stories within epics are vertically sliced and sequentially ordered
- No forward dependencies - each story builds only on previous work

---

## Epic 1: Foundation & Core Data Architecture

### Expanded Goal
Establish the technical foundation and core data architecture for assemble.ai. This epic delivers the basic project infrastructure, database schema for the multi-tiered Card system, and a fully functional Plan Card with default values. This provides the foundation for all subsequent features.

### Story Breakdown

**Story 1.1: Project Infrastructure Setup**

As a developer,
I want to set up the initial project infrastructure,
So that we have a solid foundation for development.

**Acceptance Criteria:**
1. Next.js 15 project initialized with TypeScript
2. PostgreSQL database configured with Prisma ORM
3. AWS S3 bucket configured for file storage
4. Basic authentication system in place (single user)
5. Environment configuration established
6. Git repository with CI/CD pipeline configured

**Prerequisites:** None (first story)

---

**Story 1.2: Core Database Schema**

As a developer,
I want to implement the three-tier data architecture,
So that we can support Cards → Sections → Items hierarchy.

**Acceptance Criteria:**
1. Database schema supports Cards (Tier 1) with unique identifiers
2. Sections (Tier 2) linked to Cards with proper foreign keys
3. Items (Tier 3) linked to Sections with proper foreign keys
4. Referential integrity maintained across all relationships
5. Soft-delete capability implemented (no hard deletes)
6. Audit trail fields (created_at, updated_at, created_by) on all tables

**Prerequisites:** Story 1.1 completed

---

**Story 1.3: Side Navigation Bar**

As a user,
I want a side navigation bar with all available Cards,
So that I can easily navigate between different project areas.

**Acceptance Criteria:**
1. Side navigation displays all Cards: Plan, Consultant, Contractor, Procure, Cost Planning, Scheme Design, Detail Design, Documents
2. Cards can be opened individually or in combinations (2-3 side-by-side)
3. Active cards highlighted in navigation
4. Responsive to 1920x1080 resolution minimum
5. Collapsible navigation to maximize screen space

**Prerequisites:** Story 1.2 completed

---

**Story 1.4: Plan Card Structure**

As a user,
I want to create and view a Plan Card with predefined sections,
So that I can capture core project information.

**Acceptance Criteria:**
1. Plan Card displays with 7 main sections: Details, Objectives, Staging, Risk, Stakeholders, Consultant List, Contractor List
2. Each section has collapsible/expandable chevron
3. Sections can be collapsed/expanded individually
4. Card state persists between sessions
5. Database properly stores all Plan Card data

**Prerequisites:** Story 1.3 completed

---

**Story 1.5: Plan Card Default Values - Details & Objectives**

As a user,
I want default fields in Details and Objectives sections,
So that I have a consistent structure for project data.

**Acceptance Criteria:**
1. Details section has 8 default fields: Project Name, Address, Legal Address, Zoning, Jurisdiction, Lot Area, Number of Stories, Building Class
2. Objectives section has 4 fields: Functional, Quality, Budget, Program
3. All fields are editable inline
4. Changes save automatically to database
5. Tab navigation between fields works

**Prerequisites:** Story 1.4 completed

---

**Story 1.6: Plan Card Default Values - Staging & Risk**

As a user,
I want default staging phases and risk items,
So that I can track project phases and risks.

**Acceptance Criteria:**
1. Staging section has 5 default stages: Stage 1 Initiation, Stage 2 Scheme Design, Stage 3 Detail Design, Stage 4 Procurement, Stage 5 Delivery
2. Risk section has 3 default risk placeholder items
3. Users can add/delete/edit stage and risk items
4. Items can be reordered via drag-and-drop
5. Changes persist to database

**Prerequisites:** Story 1.5 completed

---

**Story 1.7: Consultant List with Status Tracking**

As a user,
I want a comprehensive consultant list with status tracking,
So that I can manage all consultant disciplines and their procurement status.

**Acceptance Criteria:**
1. Display all 36 default consultant disciplines
2. Toggle on/off for each discipline (determines if needed for project)
3. 4 status icons per discipline: Brief, Tender, Rec., Award (all default to off/ghosted)
4. When consultant toggled on, creates tab in Consultant Card
5. Status changes persist to database
6. Visual indication of current status (icons change color when activated)

**Prerequisites:** Story 1.6 completed

---

**Story 1.8: Contractor List with Status Tracking**

As a user,
I want a comprehensive contractor list with status tracking,
So that I can manage all contractor trades and their procurement status.

**Acceptance Criteria:**
1. Display all 20 default contractor trades
2. Toggle on/off for each trade (determines if needed for project)
3. 4 status icons per trade: Brief, Tender, Rec., Award (all default to off/ghosted)
4. When contractor toggled on, creates tab in Contractor Card
5. Status changes persist to database
6. Visual indication of current status (icons change color when activated)

**Prerequisites:** Story 1.7 completed

---

## Epic 2: Document Management & AI Processing

### Expanded Goal
Implement the document repository system with two-tier categorization, drag-and-drop file uploads, and AI-powered document processing. This epic enables users to upload project documents and have AI automatically extract and populate relevant information into Cards, dramatically reducing manual data entry.

### Story Breakdown

**Story 2.1: Document Repository Structure**

As a user,
I want a structured document repository,
So that I can organize all project documents systematically.

**Acceptance Criteria:**
1. Two-tier categorization system implemented
2. Default folder structure created (Documents/[Consultant Name]/, Documents/Invoices/[Firm Name]/, etc.)
3. Documents Card displays folder hierarchy
4. Navigate through folders with breadcrumb trail
5. Database tracks document metadata (name, path, size, upload date, tags)

**Prerequisites:** Epic 1 completed

---

**Story 2.2: Drag-and-Drop File Upload**

As a user,
I want to drag and drop files into the system,
So that I can quickly upload documents.

**Acceptance Criteria:**
1. Drag-and-drop zones clearly indicated with visual feedback
2. Support bulk file uploads (multiple files simultaneously)
3. File size limit of 15MB enforced with user feedback
4. Progress indicator during upload
5. Files uploaded to AWS S3 with signed URLs
6. MIME type validation for security

**Prerequisites:** Story 2.1 completed

---

**Story 2.3: AI Document Processing - Text Extraction**

As a developer,
I want to integrate AI for document processing,
So that we can extract text from uploaded documents.

**Acceptance Criteria:**
1. Integration with LLM API (OpenAI/Claude)
2. PDF text extraction for digital PDFs
3. OCR capability for scanned documents
4. Processing completes within 10 seconds for 15MB files
5. Extracted text stored in database for searching
6. Error handling for failed extractions

**Prerequisites:** Story 2.2 completed

---

**Story 2.4: AI Auto-Population for Plan Card**

As a user,
I want AI to auto-populate Plan Card sections from uploaded documents,
So that I don't have to manually enter project information.

**Acceptance Criteria:**
1. Drag documents into Plan Card sections (Details, Objectives, Staging, Risk)
2. AI analyzes document and extracts relevant information
3. AI populates appropriate fields based on content
4. Highlighted indication of AI-populated fields
5. User can review and edit AI-populated content
6. "AI Generate" button as alternative to drag-drop

**Prerequisites:** Story 2.3 completed

---

**Story 2.5: Document Selection for Tender Packages**

As a user,
I want to select document sets for inclusion in tender packages,
So that I can specify which documents contractors should reference.

**Acceptance Criteria:**
1. Multi-select documents using Shift+click and Ctrl+click
2. Create document schedules (lists without actual files)
3. Tag documents for easy filtering
4. Selected documents associated with specific tender packages
5. Document selections persist and can be reused

**Prerequisites:** Story 2.4 completed

---

**Story 2.6: Document Filing Automation**

As a user,
I want documents to be automatically filed when uploaded in context,
So that my document repository stays organized.

**Acceptance Criteria:**
1. RFIs uploaded in Consultant Card auto-file to Documents/[Consultant]/RFI01.PDF
2. Invoices auto-file to Documents/Invoices/[Firm Name]/
3. Tender submissions auto-file to Documents/[Consultant]/[Firm Name] Submission 01.PDF
4. Automatic naming convention applied
5. User can manually override filing location if needed

**Prerequisites:** Story 2.5 completed

---

## Epic 3: Consultant & Contractor Management

### Expanded Goal
Build comprehensive Consultant and Contractor Cards with all sections needed for procurement management. This includes firms management, scope definition, deliverables tracking, and the complete tender workflow. This epic enables users to manage the entire consultant and contractor procurement process from initial brief through to contract award.

### Story Breakdown

**Story 3.1: Consultant Card Structure**

As a user,
I want Consultant Card with all predefined sections,
So that I can manage consultant procurement comprehensively.

**Acceptance Criteria:**
1. Consultant Card displays tabs for each toggled-on consultant from Plan Card
2. Each tab contains sections: Firms, Scope, Deliverables, Fee Structure, Tender Document, Tender Release and Submission, Tender Pack, Tender RFI and Addendum, Tender Evaluation, Tender Recommendation Report
3. Sections are collapsible/expandable with chevrons
4. Tab navigation between consultants
5. State persists between sessions

**Prerequisites:** Epic 2 completed

---

**Story 3.2: Firms Management - Layout and Controls**

As a user,
I want to manage multiple firms per consultant discipline,
So that I can track all potential suppliers.

**Acceptance Criteria:**
1. Display 3 default firm columns side-by-side
2. Add new firm (adds column) up to reasonable limit
3. Delete firm (removes column) with confirmation
4. Drag to reorder firm columns
5. Each firm has fields: Entity, ABN, Address, Contact, Email, Mobile, Short Listed toggle
6. Data persists to database

**Prerequisites:** Story 3.1 completed

---

**Story 3.3: Drag-and-Drop Firm Details**

As a user,
I want to drag and drop firm information to auto-populate,
So that I can quickly set up firm details.

**Acceptance Criteria:**
1. Drag contact vCard or text with firm details
2. AI parses and extracts: Entity name, ABN, Address, Contact, Email, Mobile
3. Auto-populates appropriate fields
4. Manual override available for all fields
5. Validation for email format and ABN format

**Prerequisites:** Story 3.2 completed

---

**Story 3.4: Scope and Deliverables with AI Generation**

As a user,
I want to define scope and deliverables with AI assistance,
So that I can create comprehensive requirements quickly.

**Acceptance Criteria:**
1. Text areas for Scope and Deliverables sections
2. "AI Generate" button for each section
3. AI generates discipline-specific scope based on project context
4. Drag-drop documents to use as prompts for AI generation
5. Manual editing of all generated content
6. Content saves automatically

**Prerequisites:** Story 3.3 completed

---

**Story 3.5: Fee Structure Management**

As a user,
I want to manage fee structures for tender packages,
So that suppliers can provide structured pricing.

**Acceptance Criteria:**
1. "Retrieve from Cost Planning" button pulls existing structure
2. Manual creation of fee structure tables
3. Add/delete line items
4. Hierarchical structure support (categories and items)
5. Fee structure flows to tender package generation

**Prerequisites:** Story 3.4 completed

---

**Story 3.6: RFI and Addendum Management** ✅ IMPLEMENTED

As a user,
I want to manage RFIs and addendums during tender period,
So that I can handle clarifications systematically.

**Status:** Complete (implemented October 2025)

**Acceptance Criteria:**
1. Column-based layout (1 column per firm, side-by-side)
2. RFI table per firm: RFI No, Detail, Date Received, Document
3. Addendum table per firm: Addendum No, Detail, Date Released, Document
4. Toggle states: Ghosted (anticipated/pre-prepared) vs Green (received/released)
5. Drag-drop document upload with auto-filing
6. Selective addendum issuance per firm
7. Add/delete/reorder RFI and Addendum items per firm
8. Double-click title editing

**Implementation Notes:** Extended in Story 3.9 with Release and Submission tracking

**Prerequisites:** Story 3.5 completed

---

**Story 3.7: Contractor Card Implementation**

As a user,
I want Contractor Card with same functionality as Consultant Card,
So that I can manage contractor procurement.

**Acceptance Criteria:**
1. Contractor Card structure identical to Consultant Card
2. Tabs for each toggled-on contractor trade
3. All sections replicated from Consultant Card
4. Contractor-specific terminology where appropriate
5. Independent data storage from Consultant Card

**Prerequisites:** Story 3.6 completed

---

**Story 3.8: Tender Release and Submission Tracking** ⚠️ NOT USED - See Story 3.9

**Status:** Consolidated into Story 3.9

> This story has been merged with Story 3.6 (RFI and Addendum Management) to create a unified "Release, RFI, Addendum, Submission" section. All requirements from this story are preserved in Story 3.9.

**Prerequisites:** N/A (see Story 3.9)

---

**Story 3.9: Release, RFI, Addendum, Submission Management** (NEW - Consolidation)

As a user,
I want to manage tender release, RFIs, addendums, and submissions in a unified section,
So that I can track the complete tender communication lifecycle per firm in one place.

**Background:** Consolidates Story 3.6 (RFI/Addendum - implemented) with new Release and Submission tracking features (originally planned for Story 3.8).

**Acceptance Criteria:**

*From Story 3.6 (Already Implemented):*
1. Column-based RFI/Addendum layout with toggle states
2. Document drag-drop and auto-filing
3. Add/delete/reorder per firm
4. Title editing

*New Requirements (This Story):*
5. Release section per firm: Release Date, Tender Package upload
6. Tender packages auto-file to Documents/[Consultant|Contractor]/[Firm Name]/TenderPackage-[date].pdf
7. Submission section per firm: Submission Date, Submission upload zone
8. Submissions auto-file to Documents/[Consultant|Contractor]/[discipline or trade]/filename.pdf
9. Support multiple submissions per firm (Submission 1, 2, 3...)
10. Visual indicators for release/submission uploaded
11. Section renamed to "Release, RFI, Addendum, Submission"
12. Section positioned after "Tender Pack" in Consultant Card
13. Fee Structure section moved to after Deliverables

**Final Section Order:** (1) Firms → (2) Scope → (3) Deliverables → (4) Fee Structure → (5) Tender Pack → (6) Release/RFI/Addendum/Submission → (7) Tender Evaluation → (8) Recommendation Report

**Prerequisites:** Story 3.6 completed (RFI/Addendum base), Story 3.7 completed (for Contractor Card replication)

---

## Epic 4: Tender Package Generation & Evaluation

### Expanded Goal
Implement the AI-powered tender package assembly system and comprehensive evaluation tools. This epic delivers the core value proposition: transforming days of manual assembly into hours of automated generation, plus systematic evaluation of submissions to support decision-making.

### Story Breakdown

**Story 4.1: Tender Package Assembly Interface**

As a user,
I want to select components for tender package assembly,
So that I can specify exactly what to include.

**Acceptance Criteria:**
1. Interface for selecting Plan Card sections (checkbox selection)
2. Interface for selecting Consultant/Contractor Card sections
3. Interface for selecting document schedules from Documents Card
4. Selected items highlighted visually
5. "Generate Tender Package" button prominently displayed
6. Preview of selected components before generation

**Prerequisites:** Epic 3 completed

---

**Story 4.2: AI Tender Package Generation**

As a user,
I want AI to generate comprehensive tender packages,
So that I get professional, project-specific documents quickly.

**Acceptance Criteria:**
1. AI compiles selected components into coherent package
2. Generates sharp, focused content (not generic templates)
3. Package includes all selected sections with appropriate formatting
4. Document schedule created (not actual document copies)
5. Generation completes in < 30 seconds
6. Progress indicator during generation

**Prerequisites:** Story 4.1 completed

---

**Story 4.3: Tender Package Review and Edit**

As a user,
I want to review and edit generated tender packages,
So that I can ensure accuracy before release.

**Acceptance Criteria:**
1. Generated package displayed for review
2. In-line editing capabilities for all sections
3. Track changes/revision marking
4. Save draft versions before finalizing
5. Preview in final format (PDF layout)

**Prerequisites:** Story 4.2 completed

---

**Story 4.4: Tender Package Finalization and Lock**

As a user,
I want to finalize and lock tender packages,
So that released packages cannot be altered.

**Acceptance Criteria:**
1. "Finalize Tender Pack" action with confirmation
2. Package becomes immutable (no edits allowed)
3. Locked status clearly indicated
4. Export to PDF and Word formats
5. Automatic filing to Documents/[Consultant]/Tender Pack.PDF
6. Audit trail of finalization (who, when)

**Prerequisites:** Story 4.3 completed

---

**Story 4.5: Tender Evaluation - Price Setup**

As a user,
I want price evaluation tables for comparing submissions,
So that I can analyze pricing systematically.

**Acceptance Criteria:**
1. Display firms side-by-side (those marked as short-listed)
2. Table 1 - Original with fee structure from tender package
3. Table 2 - Adds and Subs with 3 default items
4. Add/delete line items in both tables
5. Sub-total calculations for each table
6. Grand total calculation across tables

**Prerequisites:** Story 4.4 completed

---

**Story 4.6: AI Price Extraction from Submissions**

As a user,
I want AI to extract pricing from tender submissions,
So that I don't have to manually enter all prices.

**Acceptance Criteria:**
1. "AI generate fee table from latest Submission" button per firm
2. AI reads tender submission PDFs from Documents folder
3. Extracts and populates pricing in evaluation tables
4. Highlights AI-populated cells
5. Manual override for all values
6. Handles multiple submission versions

**Prerequisites:** Story 4.5 completed

---

**Story 4.7: Price Evaluation - Advanced Features**

As a user,
I want advanced price evaluation features,
So that I can perform detailed analysis.

**Acceptance Criteria:**
1. Move items between Table 1 and Table 2 with single click
2. Add/delete/rename additional tables beyond default 2
3. Collapse/expand tables for space management
4. Drag to reorder tables
5. Each new table adds to grand total calculation
6. Export evaluation to Excel

**Prerequisites:** Story 4.6 completed

---

**Story 4.8: Non-Price Evaluation**

As a user,
I want to evaluate non-price criteria systematically,
So that I can make balanced decisions.

**Acceptance Criteria:**
1. Default criteria: Relevant Experience, Methodology/Approach, Team Qualifications, References/Past Performance, Program/Timeline, Resource Allocation
2. "Retrieve" icon (accent color) for each criterion
3. AI extracts relevant content from submissions
4. Scoring interface for each criterion per firm
5. Weighted scoring calculation
6. Side-by-side comparison view

**Prerequisites:** Story 4.7 completed

---

**Story 4.9: Tender Recommendation Report Generation**

As a user,
I want AI to generate tender recommendation reports,
So that I can document and communicate decisions.

**Acceptance Criteria:**
1. "Generate Report" button in Recommendation Report section
2. AI synthesizes price evaluation data
3. AI synthesizes non-price evaluation scores
4. Generates executive summary with recommendation
5. Includes comparison tables and rationale
6. Export to PDF format
7. Template-based formatting for consistency

**Prerequisites:** Story 4.8 completed

---

**Story 4.10: Contract Award and Price Flow**

As a user,
I want to award contracts and flow prices to cost planning,
So that contract values become budget baselines.

**Acceptance Criteria:**
1. "Award Contract" action for winning firm
2. Winning bid prices flow to Cost Planning Card
3. Appear in Cost Summary under "Contract" column
4. Link maintained between tender evaluation and cost planning
5. Award status updated in Plan Card (Award icon activated)
6. Notification/confirmation of successful award

**Prerequisites:** Story 4.9 completed

---

## Epic 5: Cost Planning & Financial Tracking

### Expanded Goal
Create the comprehensive Cost Planning Card that serves as the financial control center for projects. This epic implements the two-tier cost hierarchy, invoice processing, variation management, and real-time cost visibility that enables proactive financial management throughout the project lifecycle.

### Story Breakdown

**Story 5.1: Cost Planning Card Structure**

As a user,
I want a Cost Planning Card with all sections,
So that I can manage project finances comprehensively.

**Acceptance Criteria:**
1. Cost Planning Card with 6 sections: Preliminary Cost Plan, Cost Summary, Invoice Register, Variation Register, Value Management, Provisional Sums
2. Sections are collapsible/expandable
3. Two-tier hierarchy visible: Tier 2 (Cost Groups) and Tier 3 (Cost Items)
4. Default Tier 2 sections: Developer Costs, Consultants, Construction, Contingency
5. Database schema supports hierarchical structure

**Prerequisites:** Epic 4 completed

---

**Story 5.2: Cost Summary Table**

As a user,
I want a comprehensive cost summary table,
So that I can see financial status at a glance.

**Acceptance Criteria:**
1. Display all Tier 3 Cost Items in table format
2. Columns (in order): Budget, Contract, Variations Forecast, Variation Approved, Final Forecast, Budget Variance, Claimed to Date, Claimed this Month, Remaining to be Invoiced
3. Auto-calculate: Final Forecast (Contract + Variations), Budget Variance (Budget - Final Forecast), Remaining to be Invoiced
4. Sub-totals for each Tier 2 section
5. Grand total at bottom
6. Contingency tracked as dedicated Tier 2 section

**Prerequisites:** Story 5.1 completed

---

**Story 5.3: Tier 2 and Tier 3 Management**

As a user,
I want to manage cost groups and items flexibly,
So that I can structure costs for my project.

**Acceptance Criteria:**
1. Add/delete/rename Tier 2 sections
2. Drag to reorder Tier 2 sections
3. "Retrieve Contract Sum" button pulls from Consultant/Tender Evaluation
4. Add/delete/rename Tier 3 items
5. Drag to reorder Tier 3 items within sections
6. Unique Cost Code for each Tier 3 item

**Prerequisites:** Story 5.2 completed

---

**Story 5.4: Invoice Register Implementation**

As a user,
I want to log and track all invoices,
So that I can monitor cash flow.

**Acceptance Criteria:**
1. Invoice entry form: Date, Invoice Number, Amount, Status (Paid?)
2. Link invoice to specific Tier 3 Cost Item
3. Drag-drop invoice PDF for upload
4. AI assists to extract invoice details
5. Manual override of AI-extracted data
6. Auto-filing to Documents/Invoices/[Firm Name]/

**Prerequisites:** Story 5.3 completed

---

**Story 5.5: Invoice Data Flow to Cost Summary**

As a user,
I want invoice data to automatically update cost summary,
So that I have real-time financial visibility.

**Acceptance Criteria:**
1. Sum of current month invoices updates "Claimed this Month"
2. Running total updates "Claimed to Date"
3. "Remaining to be Invoiced" auto-calculates (Contract - Claimed to Date)
4. Updates happen immediately upon invoice entry
5. Historical invoice data viewable per Cost Item

**Prerequisites:** Story 5.4 completed

---

**Story 5.6: Variation Register**

As a user,
I want to track all variations systematically,
So that I can manage scope changes and costs.

**Acceptance Criteria:**
1. Variation entry: Date Approved, Description, Category, Amount, Tier 3 Cost Item
2. Status field: Forecast vs Approved
3. Link variations to specific Cost Items
4. Running sum calculation per Cost Item
5. Variation history viewable per item
6. Export variation register to Excel

**Prerequisites:** Story 5.5 completed

---

**Story 5.7: Variation Data Flow**

As a user,
I want variation data to flow to cost summary,
So that forecasts reflect approved changes.

**Acceptance Criteria:**
1. Forecast variations update "Variations Forecast" column
2. Approved variations update "Variations Approved" column
3. Final Forecast auto-recalculates when variations change
4. Budget Variance updates accordingly
5. Visual highlighting when variance exceeds threshold

**Prerequisites:** Story 5.6 completed

---

**Story 5.8: Cost Reporting**

As a user,
I want to generate cost reports,
So that I can communicate financial status to stakeholders.

**Acceptance Criteria:**
1. "Generate Cost Report" button
2. AI compiles data from all cost sections
3. Executive summary with key metrics: Total Budget, Total Committed, Total Claimed, Variance
4. Detailed breakdown by Tier 2 sections
5. Trend analysis (if historical data exists)
6. Export to PDF with professional formatting
7. Schedule monthly report generation

**Prerequisites:** Story 5.7 completed

---

## Story Guidelines Reference

**Story Format:**

```
**Story [EPIC.N]: [Story Title]**

As a [user type],
I want [goal/desire],
So that [benefit/value].

**Acceptance Criteria:**
1. [Specific testable criterion]
2. [Another specific criterion]
3. [etc.]

**Prerequisites:** [Dependencies on previous stories, if any]
```

**Story Requirements:**

- **Vertical slices** - Complete, testable functionality delivery
- **Sequential ordering** - Logical progression within epic
- **No forward dependencies** - Only depend on previous work
- **AI-agent sized** - Completable in 2-4 hour focused session
- **Value-focused** - Integrate technical enablers into value-delivering stories

---

## Summary

**Total Stories:** 48 stories across 5 epics

**Story Distribution:**
- Epic 1 (Foundation): 8 stories
- Epic 2 (Documents & AI): 6 stories
- Epic 3 (Consultant/Contractor): 8 stories
- Epic 4 (Tender Generation): 10 stories
- Epic 5 (Cost Planning): 8 stories
- **Additional Stories for Polish/Testing:** ~8 stories (buffer)

**Estimated Effort:** At 2-4 hours per story for AI-assisted development, approximately 100-200 hours total development effort for MVP.

---

**For implementation:** Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown.