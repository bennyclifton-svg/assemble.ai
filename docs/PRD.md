# assemble.ai Product Requirements Document (PRD)

**Author:** Benny
**Date:** 2025-10-25
**Project Level:** 3
**Target Scale:** 15-40 stories

---

## Goals and Background Context

### Goals

1. **Eliminate Manual Assembly Work** - Reduce tender package preparation from days to < 2 hours through AI-powered automation
2. **Generate Sharp, Project-Specific Briefs** - AI creates focused, context-aware tender packages that consultants/contractors actually read (eliminating generic bloat)
3. **Maintain Cost Visibility** - Real-time cost tracking from staging through delivery with automatic price structure flow
4. **Enable Concurrent Project Management** - Allow PMs to manage 3-5 projects simultaneously (up from 2-3) by freeing 50% of admin time
5. **Ensure Accountability Through Clarity** - Sharp briefs with clear scope definition enable holding stakeholders accountable during delivery

### Background Context

Construction managers at small firms (1-5 people) face a critical productivity crisis where 50% of their time is consumed by manual tender package assembly instead of strategic project management. The problem is acute: assembling tender packages takes days under deadline pressure, resulting in generic, bloated briefs that nobody reads. Without sharp, focused briefs, consultants and contractors cannot be held accountable during delivery—leading to variations, disputes, and cost overruns.

Current tools (shared drives, MS Office, Procore, Aconex) provide storage but lack intelligence. They don't understand the complex interrelationships between planning, design, procurement, and delivery phases. Every tender package requires manual hunting through files and copy-pasting from previous projects. The scale challenge compounds when managing multiple concurrent projects, each requiring tender packages for 20+ consultants and 20+ subcontractors.

**Why Now:** Generative AI enables capabilities previously impossible—understanding construction domain knowledge (planning legislation, building codes, design standards), synthesizing disparate documents into coherent packages, and maintaining cost visibility throughout the project lifecycle. The convergence of AI technology and urgent market need creates the opportunity for assemble.ai to transform construction project management.

---

## Requirements

### Functional Requirements

**Plan Card & AI Auto-Population:**
- FR001: System shall allow users to create Plan Card with predefined sections and default values:
  - **Details** (Project Name, Address, Legal Address, Zoning, Jurisdiction, Lot Area, Number of Stories, Building Class)
  - **Objectives** (Functional, Quality, Budget, Program)
  - **Staging** (Stage 1 Initiation, Stage 2 Scheme Design, Stage 3 Detail Design, Stage 4 Procurement, Stage 5 Delivery)
  - **Risk** (Risk 1, Risk 2, Risk 3)
  - **Stakeholders** (Person 1, Person 2, Person 3)
  - **Consultant List** (36 disciplines: Access, Acoustic, Arborist, Architect, ASP3, BASIX, Building Code Advice, Bushfire, Building Certifier, Civil, Cost Planning, Ecology, Electrical, ESD, Facade, Fire Engineering, Fire Services, Flood, Geotech, Hazmat, Hydraulic, Interior Designer, Landscape, Mechanical, NBN, Passive Fire, Roof Access, Site Investigation, Stormwater, Structural, Survey, Traffic, Waste Management, Wastewater, Waterproofing)
  - **Contractor List** (20 trades: Concrete Finisher, Bricklayer, Carpenter, Steel Fixer, Roofer, Plumber, Electrician, HVAC Technician, Insulation Installer, Drywaller, Plasterer, Tiler, Flooring Installer, Painter, Glazier, Cabinetmaker, Mason, Welder, Scaffolder, Landscaper)
- FR002: System shall accept drag-and-drop document uploads into Plan Card sections
- FR003: System shall extract relevant information from uploaded documents using AI (OCR for scanned docs, text extraction for digital PDFs)
- FR004: System shall auto-populate Plan Card sections with AI-extracted information
- FR005: System shall allow users to review and manually refine AI-populated content

**Document Repository:**
- FR006: System shall provide centralized document repository with two-tier categorization
- FR007: System shall support file uploads up to 15MB and accept bulk drag-and-drop files into categories
- FR008: System shall maintain document metadata (revision, tags, version history)
- FR009: System shall allow users to select disparate document sets for tender packages
- FR010: System shall support multi-select functionality using Shift+click (range selection) and Ctrl+click (individual selection) for bulk actions on all items

**Consultant & Contractor Cards:**
- FR011: System shall provide Consultant Card for managing consultant information and briefs with predefined sections (Firms, Scope, Deliverables, Fee Structure, Tender Document, Tender Release and Submission, Tender Pack, Tender RFI and Addendum, Tender Evaluation, Tender Recommendation Report)
- FR011a: System shall provide Tender RFI and Addendum section in Consultant Card with two tables: RFI table (RFI No, Detail, Date Received, Response, Response Date) and Addendum table (Addendum No, Detail (which may include additional document), Date Released)
- FR012: System shall provide Contractor Card for managing contractor information and scopes with predefined sections (Firms, Scope, Deliverables, Fee Structure, Tender Document, Tender Release and Submission, Tender Pack, Tender RFI and Addendum, Tender Evaluation, Tender Recommendation Report)
- FR012_RFI: System shall provide Tender RFI and Addendum section in Contractor Card with two tables: RFI table (RFI No, Detail, Date Received, Response, Response Date) and Addendum table (Addendum No, Detail (which may include additional document), Date Released)

**Tender Evaluation - Price:**
- FR012_TE1: System shall provide Tender Evaluation/Price section with tables for each firm displayed side-by-side
- FR012_TE2: System shall provide Table 1 - Original with 'Retrieve from Procure/Tender Schedules Price' icon next to Tender Evaluation section that populates table attributes when clicked
- FR012_TE3: System shall allow users to add and delete items in Table 1 - Original
- FR012_TE4: System shall provide 'AI generate fee table from latest Submission' icon next to each firm in Table 1 that auto-populates fees by reviewing the firm's tender submission
- FR012_TE5: System shall add sub-headings for all items in Table 1 and calculate sub-totals
- FR012_TE6: System shall provide Table 2 - Adds and Subs with 3 default items
- FR012_TE7: System shall allow users to add and delete items in Table 2 - Adds and Subs
- FR012_TE8: System shall provide 'AI generate fee table from latest Submission' icon next to each firm in Table 2 that auto-populates fees based on attributes
- FR012_TE9: System shall add sub-headings for all items in Table 2 and calculate sub-totals
- FR012_TE10: System shall allow users to add/delete tables, rename tables, collapse/expand tables, and grab and move tables (each table introduces new sub-total for inclusion in Grand Total)
- FR012_TE11: System shall calculate and display Grand Total
- FR012_TE12: System shall provide icon next to each item in each table that moves the item from Table 1 to Table 2 (or vice versa depending on current location)

**Tender Evaluation - Non Price:**
- FR012_TE_NP1: System shall provide Tender Evaluation/Non-Price section with default criteria: Relevant Experience, Methodology/Approach, Team Qualifications, References/Past Performance, Program/Timeline, Resource Allocation
- FR012_TE_NP2: System shall provide 'Retrieve' icon (in accent color) next to each criterion
- FR012_TE_NP3: System shall retrieve content from latest submission and append to criterion's content when 'Retrieve' icon is clicked
- FR012a: System shall display Firms section with 3 default firms arranged side-by-side in columns
- FR012b: System shall allow users to add new firms (adds new column) and delete firms (removes column)
- FR012c: System shall allow users to grab and move firm columns left or right to customize order
- FR012d: System shall provide default firm attributes for each firm: Entity, ABN, Address, Contact, Email, Mobile, Short Listed (toggle on/off to indicate if they will receive Tender invitation)
- FR013: System shall maintain Consultant List in Plan Card for tracking multiple firms per discipline. System shall allow addition or subtraction of multiple firms per discipline located in the Consultant Card. System shall allow drag-and-drop to auto-populate firm details
- FR014: System shall maintain Contractor List in Plan Card for tracking multiple firms per trade. System shall allow addition or subtraction of multiple firms per trade located in the Contractor Card. System shall allow drag-and-drop to auto-populate firm details
- FR015: System shall support multi-select functionality using Shift+click (range selection) and Ctrl+click (individual selection) for bulk actions on all items in all Cards (i.e. consultant or contractors list)

**Scheme Design Card:**
- FR015aj: System shall provide Scheme Design Card with predefined sections: Design Intent, Regulatory Compliance, Materials & Finishes, Revisions & Feedback, Design Report
- FR015ak: System shall provide Design Intent section with Guidelines (choose none, dynamic, fixed) and Reference Design
- FR015al: System shall provide Regulatory Compliance section with tabs for each Authority retrieved from Authorities Card displayed side-by-side in a row
- FR015am: System shall allow users to add, delete, rename tabs in Regulatory Compliance section and update Authorities Card accordingly
- FR015an: System shall provide Regulatory Checklist Table within each Authority tab with columns: Column 1 (applicable regulations and instruments e.g., planning policy, Construction Codes, Design Standards), Column 2 (Key parameters from instrument), Column 3 (AI Compliance check performed)
- FR015ao: System shall provide Materials & Finishes section with table containing: Column 1 (List of elements within a building grouped in high-level material groups, scheduled in logical structure/sequence e.g., external cladding, roof sheeting), Column 2 (Description of material & finish)
- FR015ap: System shall provide 'Generate Default List' icon next to Materials & Finishes section header
- FR015aq: System shall provide AI assist to generate materials list from uploaded specification with option to add file to Documents
- FR015ar: System shall provide Revisions & Feedback section with table scheduling each revision submitted, submission date, review comments, and review comments date
- FR015as: System shall provide Design Report section with 'Generate Content for Report' icon
- FR015at: System shall allow users to select specific Cards, Sections, and Items to be included in Design Report (e.g., Summary/Objectives, Scheme/Design Intent, Cost Planning/Budget)
- FR015au: System shall use AI to assemble all content from selected sources into single, formatted report template for on-screen preview

**Detail Design Card:**
- FR015av: System shall provide Detail Design Card with same structure and functionality as Scheme Design Card (replicate sections: Design Intent, Regulatory Compliance, Materials & Finishes, Revisions & Feedback, Design Report)

**Cost Planning Card:**
- FR015k: System shall provide Cost Planning Card with predefined sections: Preliminary Cost Plan, Cost Summary, Invoice Register, Variation Register, Value Management, Provisional Sums
- FR015l: System shall implement two-tiered financial data hierarchy: Tier 2 (Cost Group/Section - major fixed categories for grouping costs) and Tier 3 (Cost Item/Line Item - fundamental unit identified by unique Cost Code)
- FR015m: System shall provide default Tier 2 sections: Developer Costs, Consultants, Construction, Contingency
- FR015n: System shall allow users to add, delete, rename Tier 2 sections
- FR015o: System shall provide global collapse, expand, selection options for Tier 2 sections
- FR015p: System shall allow users to grab and drag Tier 2 sections to re-order
- FR015q: System shall provide 'Retrieve Contract Sum' button next to each Tier 2 section header that retrieves selected items from Consultant/Tender Evaluation/Price and generates Tier 3 Line Items (appended to bottom of existing items)
- FR015r: System shall allow users to add, delete, rename Tier 3 Cost Items
- FR015s: System shall provide global collapse, expand, selection options for Tier 3 items
- FR015t: System shall allow users to grab and drag Tier 3 items to re-order
- FR015u: System shall provide Cost Summary section displaying calculated status of every Tier 3 Cost Item with automatic Sub-Totals (Tier 2 sums) and Grand Total (Card sum) across all numerical attributes
- FR015v: System shall track Contingency cost as a dedicated Tier 2 Section
- FR015w: System shall track the following primary financial attributes for every Tier 3 Cost Item (displayed in order): Budget, Contract, Variations Forecast, Variation Approved, Final Forecast (Contract + Variations Forecast + Variation Approved - auto-calculated), Budget Variance (Budget - Final Forecast - auto-calculated), Claimed to Date, Claimed this Month, Remaining to be Invoiced (auto-calculated)
- FR015x: System shall provide Invoice Register section for logging individual invoices against Tier 3 Cost Items with attributes: Date, Invoice Number, Amount, Status (e.g., Paid?)
- FR015y: System shall push sum of current month invoice amounts to Claimed this Month column in Cost Summary
- FR015z: System shall push running total of invoice amounts to Claimed to Date column in Cost Summary
- FR015aa: System shall allow drag-and-drop of invoice with AI assist to auto-populate attributes with manual override
- FR015ab: System shall file invoices in Documents/Invoices/Firm
- FR015ac: System shall provide Variation Register section for logging authorized or requested changes with attributes: Date Approved, Description, Category, Amount Approved, related Tier 3 Cost Item
- FR015ad: System shall push running sum of Amount Approved to Variations Approved column in Cost Summary
- FR015ae: System shall automatically update Final Forecast and Budget Variance when variations are approved
- FR015af: System shall provide Value Management section (to be further developed)
- FR015ag: System shall provide Provisional Sums section (to be further developed)
- FR015ah: System shall link Variations Forecast and Variation Approved to Variation Register
- FR015ai: System shall link Claimed to Date, Claimed this Month, and Remaining to be Invoiced to Invoice Register

**Procure Card:**
- FR015a: System shall provide Procure Card with predefined sections: Procurement Strategy, Tender Conditions, Tender Schedules Price, Tender Schedules Non-Price, PPR & Preliminaries, Insurance, Contract
- FR015b: System shall provide Procurement Strategy section
- FR015c: System shall provide Tender Conditions section
- FR015d: System shall provide Tender Schedules Price section with subsections: Table 1 Price (with icon to generate default list), Table 2 Value Management, Table 3 Provisional Sums
- FR015e: System shall provide Tender Schedules Non-Price section with default headings: Methodology, Team, Program, Key Exclusions, Insurance
- FR015f: System shall provide PPR & Preliminaries section with 3 default items
- FR015g: System shall provide Insurance section with default items: Contractor's Contract Works, Public Liability, Products Liability and Workcover
- FR015h: System shall provide Contract section with Form of Contract
- FR015i: System shall provide Contract Annexures subsection with tabs displayed side-by-side: Key Contract Provisions, Warranty, Deeds
- FR015j: System shall provide Key Contract Provisions tab with default items: Contractor's Security, Security by Principal, Insurance, Date for Commencement, Period for Practical Completion, Liquidated Damages, Delay Costs, Variations Margin, Bonus Payments, Defects Liability Period, Payment for unfixed and off-site materials, Interest on overdue payments, Timeframe for Progress Claims, Timeframe for Certification, Time for payment, Superintendent

**Tender Package Generation:**
- FR016: System shall generate consultant tender packages for multiple firms for a given discipline (Consultant List) from user-selected Plan Card sections, Consultant Card sections, and document schedules from the Documents Card
- FR017: System shall generate contractor tender packages for multiple firms for a given trade (Contractor List) from user-selected Plan Card sections, Contractor Card sections, and document schedules from the Documents Card
- FR018: System shall use AI to create sharp, project-specific tender content (not generic templates)
- FR019: System shall complete tender package generation in < 30 seconds
- FR020: System shall allow users to review and edit AI-generated tender packages before finalization

**Price Structure & Cost Tracking:**
- FR021: System shall create price structures originating from Plan Card staging
- FR022: System shall flow price structures into consultant tender packages
- FR023: System shall flow price structures into contractor tender packages
- FR024: System shall convert winning bid prices into contract baselines automatically
- FR025: System shall track costs during delivery phase against contract baselines
- FR026: System shall provide real-time cost visibility across all project phases

**Tender Submission Management:**
- FR027: System shall receive and store tender submissions following defined price structure
- FR028: System shall provide side-by-side comparison of tender submissions
- FR029: System shall evaluate submissions across price and non-price criteria
- FR030: System shall support multiple submission rounds per tender

**Reporting:**
- FR031: System shall generate tender recommendation reports using AI
- FR032: System shall generate project summary reports using AI
- FR033: System shall generate variation advice reports using AI

**Export & Immutability:**
- FR034: System shall export tender packages to PDF format
- FR035: System shall export tender packages to Word (.docx) format
- FR036: System shall export price structures to Excel (.xlsx) format
- FR037: System shall lock tender packages after release (immutable, no edits allowed)
- FR038: System shall maintain complete audit trail with version control

### Non-Functional Requirements

**Performance:**
- NFR001: System shall complete AI document processing and extraction in < 10 seconds for files up to 15MB
- NFR002: System shall generate tender packages in < 30 seconds
- NFR003: System shall load pages in < 2 seconds under normal network conditions
- NFR004: System shall provide AI-generated content feedback within 5-10 seconds

**Usability:**
- NFR005: System shall support modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
- NFR006: System shall provide desktop-only interface (mobile support deferred to v2)
- NFR007: System shall maintain consistent UI/UX patterns across all Cards and sections

**Reliability:**
- NFR008: System shall maintain data integrity with complete audit trail for all changes
- NFR009: System shall ensure immutability of tender packages once released (soft-delete only, no hard deletes)
- NFR010: System shall maintain referential integrity across price structure flow (Plan → Tender → Contract → Cost tracking)

**Security:**
- NFR011: System shall use HTTPS for all communications
- NFR012: System shall validate file MIME types on upload
- NFR013: System shall use signed URLs for secure file storage access
- NFR014: System shall store sensitive configuration in environment variables (no hardcoded secrets)

**Scalability:**
- NFR015: System shall support single-user operation for MVP (multi-tenant architecture deferred to v2)
- NFR016: System shall design database schema to support future multi-user expansion

---

## User Journeys

### Journey 1: Creating a Consultant Tender Package (Architect)

**Actors:** Construction Manager (Primary User)

**Preconditions:**
- Project created in system
- Plan Card populated with project fundamentals

**Main Flow:**

1. **Set Up Project Context**
   - User opens Plan Card
   - User drags and drops project documents into Details, Objectives, Staging, Risk sections
   - AI auto-populates Plan Card sections with extracted information
   - User reviews and refines AI-populated content, and may add or subtract items from any given section, and drop additional documents, repeating and finessing the process
   - User is presented with full default list of consultants (or contractors), and selects those that are applicable to this project (e.g. Architect, Structural Engineer, Town Planner, Cost Planner), and toggles them on. Once toggled on, this Consultant (or discipline) is added to the Consultant Cards as a new tab. Same for Contractor Card
   - In addition to toggle on/off, each consultant and contractor has 4 other status icons: 1. Brief, 2. Tender, 3. Rec., 4. Award, that are all defaulted to off (or ghosted). User will toggle each icon on progressively as the project evolves, once milestones are achieved: 1. Brief has been prepared, 2. Tender has been received, 3. Recommendation made, 4. Contract Awarded

2. **Create Consultant Card Entry**
   - User opens Consultant Card (or Contractor Card), and is presented with all consultants that have been toggled on (e.g. Architect, Structural Engineer, Town Planner, Cost Planner) in tabs
   - User selects one of the tabs, e.g. Architect
   - System displays default sections (Firms, Scope, Deliverables, Fee Structure, etc.)
   - User adds 3 architectural firms to Firms section (side-by-side columns)
   - User drags firm contact details to auto-populate Entity, ABN, Address, Contact, Email, Mobile, or enters the information manually
   - User toggles "Short Listed" on for firms receiving tender invitation

3. **Define Scope and Deliverables**
   - User populates Scope section with architectural requirements by adding text manually, or by clicking 'AI Generate' and AI generates a scope, or user may drag drop a document and AI auto-populates, using the text as prompt, key words
   - User defines Deliverables (concept drawings, DA documentation, etc.) by adding text manually, or by clicking 'AI Generate' and AI generates deliverables, or user may drag drop a document and AI auto-populates, using the text as prompt, key words
   - User populates Fee Structure by either clicking 'Retrieve from Cost Planning' or then editing this schedule or building a Fee Structure table from scratch

4. **Assemble Tender Package**
   - User navigates to Consultant Card/Tender Pack section
   - User selects relevant Plan Card sections (Objectives, Staging, Stakeholders)
   - User selects Consultant Card sections (Scope, Deliverables, Fee Structure)
   - User selects document sets from Documents Card
   - User selects Consultant Card Release and Submission (dates)
   - User clicks "Generate Tender Package" (AI icon)
   - System generates sharp, project-specific tender package in < 30 seconds
   - User reviews AI-generated content. Note: documents do not need to be retrieved, just a document schedule is to be created

5. **Finalize and Release**
   - User makes minor edits to tender package
   - User clicks "Finalize Tender Pack"
   - System locks tender package (immutable)
   - User exports to PDF and Word formats
   - User sends tender invitation to 3 short-listed firms via email, and drag/drops a copy of the final tender pack as PDF into Documents/Architect/Tender Pack.PDF

6. **Manage RFIs and Addendums**
   - Firms submit RFIs during tender period
   - User drag drops RFI into Consultant/RFI Addendum section. RFI No & Title and Date is logged in table. Copy of RFI is uploaded to Documents/Architect/RFI01.PDF. No AI review of the RFI
   - User creates a response, drag/drops Response to Consultant/RFI Addendum section, item is logged and copy of RFI response is uploaded to Documents/Architect/RFI 01 Response.PDF
   - User issues Addendum if scope clarification needed. User drag/drops Addendum to Consultant/RFI Addendum section, item is logged and copy of Addendum is uploaded to Documents/Architect/Addendum 01.PDF
   - System maintains audit trail

7. **Receive and Evaluate Submissions**
   - Firms submit tender responses via email
   - User uploads submissions to Firm 1/Tender Release and Submission section and the submission date is recorded, and icon highlighted. Submission is uploaded to Documents/Architect/Firm 1 Submission 01.PDF. User repeats for Firm 2 and Firm 3. Date can be manually overridden. Additional submissions may be received, and submission 2 is then created in list
   - User navigates to Tender Evaluation/Price section
   - System displays 3 firms side-by-side in tables (for any firms that were toggled as 'short listed' in the Consultant/Card section)
   - Fee Structure is aligned with Fee Structure from prior section
   - User clicks "AI generate fee table from latest Submission" for firm 1, and repeats for firm 2 and firm 3 etc.
   - AI auto-populates pricing from tender submissions (which have been saved to Documents/Architect)
   - User reviews and compares pricing across Table 1 (Original) and Table 2 (Adds & Subs)
   - System calculates sub-totals and Grand Total
   - User may add new line items to Table 1 and/or Table 2 with name, and enter sums. User may click to move any item from Table 1 to Table 2 and vice versa. User may delete a line item. Recalculate totals

8. **Non-Price Evaluation**
   - User navigates to Tender Evaluation/Non-Price section
   - For each criterion (Relevant Experience, Methodology, Team Qualifications, etc.):
     - User clicks "Retrieve" icon (accent color)
     - AI extracts relevant content from tender submissions
     - User reviews and scores each criterion

9. **Generate Recommendation Report**
   - User navigates to Tender Recommendation Report section
   - User clicks "Generate Report" icon
   - AI synthesizes price and non-price evaluation data
   - System generates recommendation report with preferred firm
   - User reviews, edits if needed, exports to PDF

10. **Award Contract**
    - User selects winning firm
    - System flows winning bid price to Cost Planning Card as contract baseline
    - Contract price appears in Cost Planning/Cost Summary under "Contract" column
    - System maintains traceability from tender to contract to cost tracking

**Postconditions:**
- Consultant tender package created, evaluated, and awarded
- Contract price established in Cost Planning Card
- Complete audit trail maintained
- Tender documents locked and archived

### Journey 2: Managing Project Costs Through Delivery

**Actors:** Construction Manager (Primary User)

**Preconditions:**
- Multiple consultants and contractors awarded
- Contracts established in Cost Planning Card
- Project in delivery phase

**Main Flow:**

1. **Review Cost Summary**
   - User navigates to Cost Planning Card/Cost Summary section
   - System displays all Tier 3 Cost Items with financial attributes in columns
   - User views Budget, Contract, Variations, Final Forecast, and Budget Variance
   - System shows Sub-Totals for each Tier 2 section (Developer Costs, Consultants, Construction, Contingency)
   - Grand Total displayed at bottom

2. **Process Monthly Invoice**
   - Contractor submits invoice via email
   - User navigates to Cost Planning/Invoice Register
   - User drag-drops invoice PDF into system
   - AI assists to auto-populate: Date, Invoice Number, Amount
   - User manually verifies/overrides AI-populated data
   - User selects relevant Tier 3 Cost Item (e.g., "Carpentry Works")
   - System files invoice in Documents/Invoices/[Firm Name]
   - System updates "Claimed this Month" in Cost Summary
   - System updates "Claimed to Date" running total
   - System recalculates "Remaining to be Invoiced"

3. **Manage Variation**
   - Contractor requests variation for additional scope
   - User navigates to Cost Planning/Variation Register
   - User creates new variation entry with: Date, Description, Category, Amount, Related Tier 3 Cost Item
   - User marks status as "Forecast" initially
   - System updates "Variations Forecast" column in Cost Summary
   - Once approved, user changes status to "Approved"
   - System moves amount from "Variations Forecast" to "Variations Approved"
   - System automatically recalculates Final Forecast and Budget Variance

4. **Monitor Budget Health**
   - User reviews Budget Variance column (Budget - Final Forecast)
   - Negative values highlighted in red indicating overrun
   - User checks Contingency section to see available buffer
   - User can drill down into any Tier 3 item to see invoice/variation history

5. **Generate Cost Report**
   - User clicks "Generate Cost Report" icon
   - System compiles current cost status across all items
   - AI generates executive summary highlighting: Total committed, Total claimed, Budget variance, Key risks
   - User exports report to PDF for stakeholder distribution

**Postconditions:**
- All invoices processed and tracked
- Variations documented with approval trail
- Real-time cost visibility maintained
- Stakeholders informed of cost status

---

## UX Design Principles

1. **Speed Over Beauty** - Prioritize functional efficiency and rapid task completion over visual polish. Construction managers need to process 20+ tender packages quickly

2. **Information Density** - Display maximum relevant information on screen without requiring navigation. Side-by-side firm comparisons, tables with multiple columns, all visible at once

3. **Drag-and-Drop Everything** - Documents, firms, invoices, RFIs—everything should be draggable for quick data entry and auto-population via AI

4. **Progressive Disclosure with Persistence** - Start with default values/structures that can be progressively refined. Maintain user edits and customizations throughout the workflow

5. **Visual Status Tracking** - Use clear visual indicators (toggles, icons, color coding) to show project progress at a glance (Brief/Tender/Rec/Award status, Short-listed firms, Budget variance)

---

## User Interface Design Goals

### Platform & Core Interface

- **Platform**: Desktop web application (1920x1080 minimum resolution)
- **Layout**: Multi-card system with tabs, side-by-side columns for firm comparisons
- **Navigation**:
  - Intuitive side navigation bar with all Cards listed (Plan, Consultant, Contractor, Procure, Cost Planning, etc.)
  - Ability to display 2-3 cards side-by-side (e.g., Plan + Consultant + Documents or Plan + Contractor + Documents)
  - Tabbed sections within each card
  - Collapsible/expandable chevrons throughout interface for managing section visibility and information density

### Key Interaction Patterns

- **Multi-Select**: Shift+click for range selection, Ctrl+click for individual selection across all lists
- **Bulk Actions**: Apply actions to multiple selected items simultaneously
- **Collapsible Sections**: Global collapse/expand controls for managing information density
- **Grab and Move**: Drag to reorder firms, tables, sections maintaining data relationships

### Critical UI Components

- **Tables**: Primary data display method with sortable columns, inline editing, auto-calculated totals
- **Side-by-Side Columns**: Firm comparisons (up to 3-5 firms visible simultaneously)
- **Toggle Controls**: Binary on/off states for short-listing, status tracking
- **Icon Actions**: Contextual actions via icons (AI Generate, Retrieve, Move Item, Generate Report)
- **Status Indicators**: Visual progress tracking (4-stage icons: Brief/Tender/Rec/Award)

### AI Integration Points

- **Generate Icons**: Clearly marked AI generation points with accent color
- **Auto-Population Feedback**: Show AI is working (spinner) then highlight populated fields
- **Manual Override**: All AI-generated content editable with clear indication of AI vs manual content

### Data Entry Optimization

- **Default Values**: Pre-populated with industry-standard lists (36 consultants, 20 contractors, etc.)
- **Drag-Drop Zones**: Clear visual indication of drop zones with hover states
- **Quick Entry**: Tab through fields, Enter to confirm, Escape to cancel
- **Inline Editing**: Click to edit any table cell or field without modal dialogs

---

## Epic List

### Epic 1: Foundation & Core Data Architecture
**Goal:** Establish project infrastructure, database schema, and core Card system with Plan Card functionality
**Estimated Stories:** 8-10 stories

### Epic 2: Document Management & AI Processing
**Goal:** Implement document repository, drag-and-drop upload, AI extraction, and auto-population capabilities
**Estimated Stories:** 6-8 stories

### Epic 3: Consultant & Contractor Management
**Goal:** Build Consultant/Contractor Cards with firms, scope, deliverables, and tender workflow sections
**Estimated Stories:** 8-10 stories

### Epic 4: Tender Package Generation & Evaluation
**Goal:** Implement AI-powered tender package assembly, RFI/Addendum handling, and price/non-price evaluation
**Estimated Stories:** 10-12 stories

### Epic 5: Cost Planning & Financial Tracking
**Goal:** Create Cost Planning Card with two-tier hierarchy, invoice register, variation tracking, and real-time cost visibility
**Estimated Stories:** 8-10 stories

> **Note:** Detailed epic breakdown with full story specifications is available in [epics.md](./epics.md)

---

## Out of Scope

### Deferred to Version 2

**Contract Administration:**
- Automated payment claim verification against contract prices
- Payment approval workflows
- Retention tracking and release
- Defects liability period management

**Design Management (Scheme & Detail Cards):**
- While defined in FRs, full implementation of Scheme Design and Detail Design Cards deferred
- Design review workflows
- Drawing revision control
- BIM model integration

**Advanced Collaboration:**
- Multi-user/multi-tenant architecture
- Real-time collaborative editing
- Comments and annotations on documents
- Stakeholder portals for consultants/contractors to submit directly

**Mobile & Offline:**
- Mobile application (iOS/Android)
- Offline mode with sync
- On-site data capture
- Photo integration with GPS tagging

**Integrations:**
- Procore integration
- Aconex integration
- Accounting software (Xero, QuickBooks)
- Microsoft Project/Primavera
- Email automation (sending tender invites directly from system)

**Advanced Analytics:**
- Predictive cost modeling
- Risk scoring algorithms
- Performance benchmarking across projects
- Industry benchmark comparisons
- Custom report builder

**Advanced AI Features:**
- Learning from historical project patterns
- Automated compliance checking against building codes
- Natural language querying of project data
- Predictive delay analysis

### Explicitly Not Included

**Geographic Scope:**
- International currency support (AUD only for MVP)
- Multi-language support (English only)
- Jurisdiction-specific contract templates (Australian standard forms only)

**Project Types:**
- Residential projects under $1M
- Civil infrastructure projects
- Mining and resources projects

**Technical Scope:**
- Native mobile apps
- On-premise deployment option
- Custom API for third-party developers
- White-label solutions
