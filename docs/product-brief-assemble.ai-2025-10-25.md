# Product Brief: assemble.ai

**Date:** 2025-10-25
**Author:** Benny
**Status:** Draft for PM Review

---

## Executive Summary

**The Problem:**

Construction managers at small firms (1-5 people) face a critical productivity crisis: **50% of their time is consumed by manual tender package assembly work** instead of strategic project management. The problem compounds when managing multiple concurrent projects, each requiring tender packages for 20+ consultants and 20+ subcontractors.

The acute pain point is **tender package assembly** taking **days instead of hours**, often rushed under deadline pressure. This leads to a quality problem: **generic, bloated briefs** that include too much irrelevant information copied from previous projects. Key scope-defining details get buried in boilerplate text. **Nobody reads them** because they're too long and generic. Without sharp, focused briefs, consultants and contractors can't be held accountable during delivery—leading to variations, disputes, and cost overruns.

Current tools (shared drives, MS Office, email, even Procore/Aconex) provide storage but **no intelligence**—they don't understand the complex interrelationships between planning, design, procurement, and delivery phases. Every tender package requires manual hunting through files, copy-pasting from previous projects, and tedious assembly in Word.

**The Solution:**

**assemble.ai** is an AI-powered construction project management platform that eliminates manual assembly work by creating a centralized, intelligent knowledge repository that evolves throughout the project lifecycle.

**Core Innovation:**
1. **AI Auto-Population**: Drag-and-drop documents into Plan Card sections → AI extracts relevant information → Auto-populates project fundamentals → User refines
2. **Intelligent Tender Package Generation**: User selects Plan Card sections + document sets → AI generates sharp, project-specific tender packages in hours (not days)
3. **Price Structure Flow**: Staging → Tender → Contract → Cost Tracking—prices flow automatically from Plan Card through to delivery phase with complete traceability
4. **Dual Procurement**: Purpose-built for tendering BOTH consultants (design phase) AND contractors (delivery phase)
5. **Advanced Reporting**: AI generates tender recommendations, project summaries, and variation advice on demand

**Key Differentiators:**
- **Sharp, Focused Briefs**: AI generates project-specific content (not generic bloat) that consultants/contractors actually read
- **Construction-Aware AI**: Understands planning legislation, building codes, design standards, commercial contracts
- **Immutable Audit Trail**: Tender packages locked after release with complete version control and traceability
- **Days → Hours**: What took days manually now takes < 2 hours

**Target Users:**

Project Managers and Construction Managers at:
- Project Management Consultancies
- Contractors (managing design and delivery)
- Firm size: 1-5 person teams managing multiple concurrent projects
- Geography: Country-wide

**Current Pain:** Spending 50% of time on admin/assembly instead of strategic project management.

**Desired Outcome:** Manage 3-5 concurrent projects (up from 2-3), spending 70% time on strategic decisions and 30% on admin (reversed from current 50/50 split).

**MVP Scope:**

**Must-Have Features:**
- Plan Card with AI auto-population from documents
- Procure Consultants Card with tender package generation
- Procure Contractors Card with tender package generation
- Document repository with smart categorization
- Price structure flow (staging → tender → contract → cost tracking)
- Tender submission evaluation (side-by-side comparison)
- Advanced reporting (tender recommendations, project summaries, variation advice)
- Export to PDF, Word, Excel
- Immutable tender packages with audit trail

**Out of Scope (V2):**
- Contract administration (payment claim verification)
- Scheme & Detail cards (design management)
- Variation tracking
- Multi-user collaboration
- Mobile support

**MVP Success Criteria:**
- Create consultant or contractor tender package in **< 2 hours** (vs. days)
- AI-generated briefs are **sharp and project-specific** (not generic bloat)
- Price structure flows correctly through all phases
- Users choose assemble.ai instead of Word/Excel/Dropbox

**Technology Foundation:**

Built on proven stack:
- Frontend: Next.js 15, React 19, Tailwind CSS, Zustand
- Backend: Node.js, Express, PostgreSQL, Prisma
- Storage: AWS S3
- AI: Flexible LLM (OpenAI/Claude), OCR, PDF extraction

Already implemented: Three-tier data architecture, multi-card layout, document management, real-time updates.

**To be built for MVP:** AI integration layer, tender package generation pipeline, price structure flow, export generation.

**The Value Proposition:**

assemble.ai transforms construction managers from **document wranglers into strategic project leaders** by eliminating 50% of manual admin work, generating sharp briefs that enable accountability, and maintaining real-time cost visibility throughout the project lifecycle.

What took days now takes hours. What was generic becomes project-specific. What was scattered becomes centralized and intelligent.

---

## Problem Statement

Construction managers face a critical productivity bottleneck when coordinating complex projects across multiple phases, consultants, and contractors. The core problem manifests most acutely during **tender package assembly**, but its root causes span the entire project lifecycle:

**The Manual Assembly Crisis:**
- **Time Cost**: Assembling tender packages manually takes **days** rather than hours, often under intense deadline pressure leading to rushed, error-prone outputs
- **Dual Procurement Challenge**: Must create tender packages for BOTH consultants (design phase) AND contractors (delivery phase)—doubling the assembly workload
- **Data Fragmentation**: Project information scattered across generic tools (Dropbox, SharePoint, email) never designed for construction workflows
- **Lost Context**: Existing PM tools fail to understand the complex interrelationships between planning, design, procurement, and delivery phases
- **No Intelligence**: Current solutions provide storage but no assembly—every tender package requires manual hunting, copying, and coordination

**Compounding Complexity:**
- **Concurrent Project Overload**: Construction managers juggle multiple projects simultaneously, diluting attention and increasing risk of oversight
- **Dual Stakeholder Coordination**: Multiple consultants AND contractors must be engaged with unified briefs, objectives, and success factors—currently done manually for each
- **Phase Transition Friction**: Information doesn't flow seamlessly from one phase to the next; knowledge gets lost or duplicated
- **Contract Administration Burden**: Payment claims from both consultants and contractors must be manually verified against original contract prices—tedious, error-prone work that compounds as projects progress

**The Opportunity Cost:**
Construction managers spend days on mechanical assembly work instead of strategic oversight, quality control, and stakeholder coordination. Every rushed tender package risks costly mistakes—missed specifications, wrong document versions, incomplete briefs—that cascade into delivery phase problems.

**Cost Control Blindness:**
- **Financial Visibility Gap**: Without centralized cost tracking across phases, budget overruns go undetected until too late
- **Cost-Quality Disconnect**: Decision-making lacks real-time cost implications—design variations, contractor selections, and scope changes occur without immediate financial visibility
- **Manual Cost Analysis**: Evaluating tender submissions (price and non-price factors) requires tedious spreadsheet work prone to errors

**Why Now?**
- **AI Breakthrough**: Generative AI can now:
  - Evaluate planning legislation, building codes, and design standards
  - Generate tender packages automatically for both consultants and contractors
  - Generate design reports and project documentation on demand
  - Analyze tender submissions across price and non-price criteria
  - Create tender recommendation reports synthesizing complex evaluation factors
  - Automate contract administration for both consultants and contractors
  - Verify payment claims against original contract prices and variations
  - Assess design variations and their cost implications
  - Produce project summary reports on demand
- **Scale Demands**: Modern practice requires managing more projects concurrently with tighter timelines
- **Stakeholder Expectations**: Increased project complexity demands more sophisticated coordination across consultants and contractors
- **Cost Pressures**: Tighter margins require real-time cost tracking and control throughout the project lifecycle

The construction industry needs a platform that understands project lifecycles, assembles knowledge intelligently, maintains cost visibility at every phase, and leverages AI to eliminate manual assembly and analysis work.

---

## Proposed Solution

assemble.ai is an **AI-powered construction project management platform** that eliminates manual assembly work by creating a centralized, intelligent knowledge repository that evolves throughout the project lifecycle. The platform transforms how construction managers coordinate projects, procure stakeholders, and maintain cost control.

### Core Solution Architecture

**1. Intelligent Data Capture & Organization**

**Plan Card Foundation:**
- Users input project fundamentals into predefined sections: Details, Objectives, Staging, Stakeholders, Risk
- These attributes are common across all projects, providing consistent structure
- **AI-Powered Auto-Population**: Drag-and-drop documents into Plan sections → AI extracts relevant information → Auto-populates sections → User refines/finalizes
- All Plan Card data becomes instantly retrievable for tender package assembly

**Document Repository with Smart Categorization:**
- Two-tier categorization system for flexible organization
- Users drag-and-drop documents without manual data entry
- Users select disparate document sets and add them to tender packages
- **AI Document Understanding**: Extracts key information, metadata, and relationships automatically

**2. Automated Tender Package Assembly**

**The Elimination of Manual Work:**
- Users quickly select relevant Plan Card sections and document sets
- **AI Generates Coherent Packages**: Takes user selections + headings → Generates fleshed-out scopes, briefs, and tender documents
- Works for BOTH consultant procurement (design phase) AND contractor procurement (delivery phase)
- What took days now takes hours

**Sophisticated Assembly Intelligence:**
- AI synthesizes information from:
  - Current project Plan Card data
  - Selected document sets across phases
  - Prior project documents and patterns
  - Planning legislation, design standards, building codes
  - Commercial contract requirements
- Understands complex policies and regulatory frameworks
- Generates context-aware, project-specific tender content

**3. Seamless Price Structure Flow & Cost Tracking**

**From Staging → Tender → Contract → Delivery:**

```
Plan Card (Staging)
    ↓
Consultant/Contractor Tender Pack (Price Structure)
    ↓
Tender Submissions (Following Structure)
    ↓
Side-by-Side Evaluation
    ↓
Winning Bid = Contract Price
    ↓
Cost Plan (Tracked During Delivery)
```

**Immutable Tender Packages:**
- Once released, tender packages are locked (no edits)
- Tender submissions received and evaluated against original structure
- Multiple submission rounds supported
- Contract prices flow automatically from winning bids into delivery phase cost tracking

**All Consultant/Contractor Card sections auto-populate into tender packages** with complete traceability and version control maintained in sophisticated database architecture.

**4. AI-Powered Contract Administration**

**Automated Payment Claim Verification:**
- Payment claims (consultants and contractors) verified against original contract prices
- Tracks variations and adjustments
- Flags discrepancies automatically
- Eliminates tedious manual spreadsheet verification

**Intelligent Analysis Capabilities:**
- Evaluates design variations and cost implications
- Analyzes tender submissions (price and non-price criteria)
- Generates tender recommendation reports
- Produces project summary reports on demand
- Assesses compliance with standards and regulations

### Key Differentiators

**Why assemble.ai Will Succeed Where Others Fail:**

1. **Lifecycle Intelligence**: Unlike generic tools, understands the complex interrelationships between planning, design, procurement, and delivery phases
2. **Dual Procurement**: Purpose-built for tendering BOTH consultants and contractors with unified workflows
3. **AI That Understands Construction**: Trained on planning legislation, building codes, design standards, and commercial contracts—not generic document assembly
4. **Cost Visibility by Design**: Real-time cost tracking from initial staging through final delivery, with automatic price structure flow
5. **Eliminates Assembly Work**: What takes days manually happens in hours—AI generates coherent tender packages from user selections
6. **Immutable Audit Trail**: Sophisticated database maintains version control, tender package immutability, and complete traceability
7. **Contract Admin Automation**: Payment claim verification happens automatically against contract baselines

**The Compound Effect:**
- **Speed**: Days → Hours for tender assembly
- **Accuracy**: AI-generated packages eliminate version errors and missed specifications
- **Cost Control**: Real-time visibility prevents budget overruns
- **Scale**: Manage more concurrent projects with same attention level
- **Quality**: Spend time on strategic decisions, not mechanical assembly

assemble.ai doesn't just store construction data—it actively assembles knowledge, maintains cost discipline, and leverages AI to eliminate the manual work that bogs down construction managers.

---

## Target Users

### Primary User Segment

**Who They Are:**

- **Job Titles**: Project Managers, Construction Managers
- **Firm Types**:
  - Project Management Consultancies
  - Contractors (managing design and delivery)
- **Firm Size**: 1-5 person teams (small practices managing multiple concurrent projects)
- **Geography**: Country-wide (not restricted to urban centers)

**Current Workflows & Pain Points:**

- **Current Tools**: Shared drives, MS Office suite (Word/Excel), email as primary coordination tool
- **Some Also Use**: Procore, Aconex, Dropbox—but these don't solve the assembly problem
- **Time Allocation**: **Minimum 50% of time spent on assembly/admin work** instead of strategic project management
- **Manual Assembly Process**: Copy-paste from previous projects, hunt through shared drives, compile in Word, distribute via email

**The Scale Challenge:**

- Must prepare and administer **up to 20 consultant tender packages** per project (Architect, Structural, MEP, Landscape, Acoustic, etc.)
- Must prepare and administer **contractor packages with 20+ subcontractors** each
- **Managing multiple projects concurrently** compounds this exponentially
- Each tender package requires: scope definition, brief, objectives, success criteria, pricing structure, contract terms

**The Critical Quality Problem:**

**Generic, bloated briefs** are the silent killer:
- Briefs include too much irrelevant information copied from previous projects
- Key scope-defining details get buried in boilerplate text
- **Nobody reads them** because they're too long and generic
- Lack of sharp, focused briefs means **consultants and contractors can't be held accountable during delivery**
- Vague scopes lead to variations, disputes, and cost overruns

**What They're Trying to Achieve:**

1. **Manage more projects simultaneously** without quality degradation
2. **Free up 50% of their time** currently wasted on admin/assembly work
3. **Reduce admin burden** for:
   - Generating tender packages
   - Creating tender recommendation reports
   - Producing variation advice
   - Writing project summary reports
4. **Create sharp, focused briefs** that define scope clearly and enable accountability
5. **Maintain cost control** across all concurrent projects

**The Adoption Trigger:**

These users will adopt assemble.ai immediately if it:
- Cuts tender package preparation from days to hours
- Generates **focused, project-specific briefs** (not generic bloat)
- Eliminates manual copy-paste assembly work
- Manages the complexity of 20+ consultants/contractors per project
- Frees them to do actual project management instead of document wrangling

**User Success Looks Like:**
- Managing 3-5 concurrent projects effectively (up from 2-3)
- Spending 70% of time on strategic decisions, 30% on admin (reversed from current 50/50)
- Sharp briefs that consultants/contractors actually read and follow
- Real-time cost visibility preventing budget surprises
- Confident accountability during delivery phase

### Secondary User Segment

No secondary user segments identified. The platform is purpose-built for the primary decision-maker managing the entire project lifecycle.

---

## MVP Scope

### Core Features (Must Have)

**Essential Foundation (Already Built):**
- ✅ Three-tier data architecture (Cards → Sections → Items)
- ✅ Multi-card layout system
- ✅ Real-time updates and state management
- ✅ Document repository with two-tier categorization

**Critical MVP Features (To Be Built):**

**1. Plan Card - AI Auto-Population**
- Drag-and-drop documents into Plan Card sections (Details, Objectives, Staging, Stakeholders, Risk)
- AI extracts relevant information from uploaded documents
- AI auto-populates Plan Card sections
- User reviews and refines AI-generated content
- All Plan Card data available for tender package assembly

**2. Procure Consultants Card**
- Consultant selection and management
- Service brief definition
- Price structure creation (flows from Plan Card staging)
- Consultant tender package assembly

**3. Procure Contractors Card**
- Contractor selection and management
- Scope definition
- Price structure creation (flows from Plan Card staging)
- Contractor tender package assembly (including subcontractors)

**4. AI Tender Package Generation**
- User selects relevant Plan Card sections
- User selects document sets from repository
- AI generates coherent, project-specific tender packages
- **Sharp, focused briefs** (not generic bloat)
- Works for BOTH consultant and contractor procurement
- Target: What took days now takes < 2 hours

**5. Price Structure Flow & Cost Tracking**
- Price structure originates from Plan Card staging
- Flows into Consultant tender packages
- Flows into Contractor tender packages
- Winning bid prices become contract baselines
- Cost tracking during delivery phase
- Real-time cost visibility

**6. Tender Submission Evaluation**
- Receive tender submissions following price structure
- Side-by-side comparison of submissions
- Price and non-price criteria evaluation
- Support for multiple submission rounds

**7. Advanced Reporting**
- Tender recommendation reports
- Project summary reports
- Variation advice reports
- AI-generated, context-aware report content

**8. Document Organization**
- Two-tier categorization system
- Tag-based organization
- File metadata management
- Document selection for tender packages
- Version control and traceability

**9. Immutable Tender Packages**
- Once released, tender packages are locked (no edits)
- Complete audit trail
- Version control maintained in database
- Traceability from staging through delivery

**Minimum Viable Feature Set:**
The absolute minimum that replaces Word/Excel/Dropbox:
1. **Plan** - Capture project fundamentals with AI auto-population
2. **Procure Consultants** - Generate consultant tender packages
3. **Procure Contractors** - Generate contractor tender packages
4. **Organize Documents** - Centralized repository with smart categorization
5. **Price Flow → Cost Tracking** - Staging to tender to contract to delivery

### Out of Scope for MVP

**Deferred to Version 2:**

**1. Contract Administration**
- Payment claim verification against contract prices
- Automated payment processing
- Claims tracking and approval workflows
- Contract compliance monitoring

**2. Scheme Card (Schematic Design Management)**
- Schematic design phase management
- Design development tracking
- Design review workflows
- Consultant coordination during scheme phase

**3. Detail Card (Detailed Design Management)**
- Detailed design phase management
- Technical coordination
- Design finalization workflows
- Specification development

**4. Variation Tracking**
- Design variation management
- Cost impact analysis for variations
- Variation approval workflows
- Historical variation tracking

**5. Advanced AI Capabilities**
- Learning from prior project patterns
- Predictive cost modeling
- Risk prediction and mitigation suggestions
- Automated compliance checking (building codes, regulations)

**6. Collaboration Features**
- Multi-user editing
- Real-time collaboration
- Comments and annotations
- Stakeholder portals

**7. Advanced Analytics**
- Project performance dashboards
- Benchmarking across projects
- Predictive analytics
- Cost trend analysis

**Rationale for Deferral:**
MVP focuses on the core value proposition: **eliminating manual tender package assembly work**. Contract administration, design phase management, and variation tracking are important but not essential to validate the core hypothesis. These add significant complexity and can be delivered in v2 once tender package generation proves successful.

### MVP Success Criteria

**MVP is successful when a Project Manager can:**

1. **Fast Tender Package Creation**
   - Create one complete consultant tender package in **< 2 hours** (vs. days manually)
   - Create one complete contractor tender package in **< 2 hours** (vs. days manually)
   - Prepare tender packages for 20+ consultants efficiently
   - Prepare contractor packages with 20+ subcontractors efficiently

2. **Quality Output**
   - AI-generated briefs are **sharp and project-specific** (not generic bloat)
   - Key scope-defining details are clear and prominent
   - Briefs are concise enough that consultants/contractors actually read them
   - Clear accountability criteria for delivery phase

3. **Price Structure Flow**
   - Price structure flows correctly: Plan staging → Tender package → Contract baseline → Cost tracking
   - Real-time cost visibility across all phases
   - Winning bid prices automatically become contract baselines
   - Cost tracking maintains accuracy throughout delivery

4. **Document Organization**
   - All project documents centralized and categorized
   - Easy selection of document sets for tender packages
   - Version control and traceability maintained

5. **User Adoption**
   - PM chooses assemble.ai instead of Word/Excel/Dropbox for next tender package
   - Time freed up enables managing 3-5 concurrent projects (up from 2-3)
   - 70/30 strategic/admin time split (reversed from 50/50)

6. **AI Performance**
   - AI auto-population from documents is accurate enough to require only minor refinements
   - AI-generated tender packages require minimal manual editing
   - Users trust AI-generated content quality

**MVP Validates Core Hypothesis:**
Construction managers will adopt assemble.ai because it eliminates days of manual assembly work, generates sharp focused briefs that enable accountability, and maintains cost visibility throughout the project lifecycle.

---

## Post-MVP Vision

### Phase 2 Features

**Contract Administration:**
- Payment claim verification against contract prices
- Automated payment processing workflows
- Claims tracking and approval
- Contract compliance monitoring

**Design Phase Management:**
- Scheme Card (schematic design management)
- Detail Card (detailed design management)
- Design review workflows
- Technical coordination tools

**Variation Management:**
- Design variation tracking
- Cost impact analysis for variations
- Variation approval workflows
- Historical variation database

**Advanced AI Capabilities:**
- Learning from prior project patterns
- Predictive cost modeling
- Risk prediction and mitigation suggestions
- Automated compliance checking (building codes, regulations)

**Collaboration Features:**
- Multi-user/multi-tenant architecture
- Real-time collaboration
- Comments and annotations
- Stakeholder portals for consultants/contractors

### Long-term Vision (12-24 Months)

**Platform Evolution:**
- Complete lifecycle management from planning through delivery
- Full contract administration automation
- Predictive analytics and benchmarking across projects
- Mobile application for on-site access
- Integration ecosystem (Procore, Aconex, accounting software)

**Market Expansion:**
- Multi-user firms (5-50 people)
- Enterprise clients (50+ people)
- International markets
- Vertical specialization (residential, commercial, infrastructure)

**AI Advancement:**
- Self-learning from user projects
- Industry-wide benchmarking data
- Automated regulatory compliance
- Natural language project querying

### Expansion Opportunities

**Adjacent Markets:**
- Architecture firms (design-focused workflow)
- Engineering consultancies (technical coordination)
- Developers (owner's perspective on project management)
- Facilities management (post-construction lifecycle)

**Feature Extensions:**
- Scheduling and timeline management
- Resource allocation and capacity planning
- Supply chain and procurement optimization
- Quality assurance and defect tracking

**Business Model Evolution:**
- Tiered pricing (solo, team, enterprise)
- Per-project pricing for occasional users
- White-label solutions for large consultancies
- Marketplace for templates and standard documents

---

## Technical Considerations

### Platform Requirements

**Deployment & Access:**
- **Platform**: Web-based application (browser access)
- **Device Support**: Desktop-only for MVP (mobile deferred to v2)
- **Hosting**: Cloud-hosted (AWS or similar)
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)

**Performance Requirements:**
- **AI Document Processing**: Analysis and extraction in **seconds** (not minutes)
- **File Size Limits**: Maximum 15MB per file upload
- **Concurrent Users**: Single-user (1 user) for MVP - multi-tenant architecture deferred to v2
- **Response Time**:
  - Page loads < 2 seconds
  - AI auto-population feedback within 5-10 seconds
  - Tender package generation < 30 seconds

**Data Requirements:**
- **Storage**: Document repository with version control
- **Database**: Sophisticated relational database for maintaining relationships (staging → tender → contract → cost)
- **Immutability**: Tender packages locked after release with complete audit trail
- **Export Formats**: PDF, Word (.docx), Excel (.xlsx)
- **No Integrations**: No integration with existing tools (Procore, Aconex, accounting software) for MVP

### Technology Preferences

**Existing Technology Stack (Already Implemented):**

Reference: See `docs/PriorArchitecture.md` for complete architectural details.

**Frontend:**
- Framework: Next.js 15.5.6 (App Router)
- UI Library: React 19
- Styling: Tailwind CSS 4 (JIT mode)
- State Management: Zustand 5.0.3
- Build Tool: Turbopack (Next.js built-in)
- TypeScript: 5.9 (strict mode)

**Backend:**
- Runtime: Node.js 20+
- Framework: Express.js
- Database: PostgreSQL 15+
- ORM: Prisma 6
- API: RESTful architecture
- File Storage: AWS S3 + local filesystem fallback

**Development Tools:**
- Package Manager: npm
- Linting: ESLint
- Version Control: Git

**New Technology Requirements for MVP (AI Integration):**

**AI/ML Stack:**
- **LLM Provider**: Flexible - OpenAI GPT-4, Anthropic Claude, or alternative (to be determined based on cost/performance)
- **Document Processing**:
  - OCR capability for scanned documents
  - PDF text extraction for digital documents
  - Image processing for diagrams/drawings
- **Vector Database**: TBD - may be needed for document similarity search and retrieval (evaluate necessity during implementation)
- **AI Agent Framework**: TBD - LangChain, LlamaIndex, or custom orchestration (evaluate based on complexity needs)

**AI Capabilities Required:**
1. **Document Analysis**: Extract structured information from unstructured documents
2. **Content Generation**: Generate sharp, focused briefs from user selections
3. **Synthesis**: Combine multiple sources (Plan Card + documents) into coherent packages
4. **Context Awareness**: Understand construction domain (building codes, standards, commercial contracts)
5. **Report Generation**: Create tender recommendations, project summaries, variation advice

### Architecture Considerations

**Existing Architecture (Reference docs/PriorArchitecture.md):**

**Three-Tier Data Model:**
- Cards (Tier 1): Top-level phases (Plan, Scheme, Detail, Procure, Deliver)
- Sections (Tier 2): Categorized groupings within cards
- Items (Tier 3): Individual tasks, deliverables, data points

**State Management:**
- Two-store pattern: Main data store + View state store
- Normalized entities with parent-child relationships
- Real-time synchronization

**Document Management:**
- Two-tier categorization
- Tag-based organization
- File metadata with version tracking
- Virus scanning capability (ClamAV)

**New Architecture Considerations for MVP:**

**1. AI Service Layer:**
- Separate AI service from core application logic
- API-based communication between frontend/backend and AI services
- Modular design allowing LLM provider swapping
- Rate limiting and cost controls for AI API usage

**2. Price Structure Flow Architecture:**
```
Plan Card (Staging)
    ↓ (Database relationship)
Consultant/Contractor Card (Price Structure)
    ↓ (Immutable tender package)
Tender Submissions (Stored separately)
    ↓ (Evaluation & selection)
Contract Baseline (Locked prices)
    ↓ (Cost tracking reference)
Delivery Phase Cost Plan
```

**Data Model Requirements:**
- Maintain referential integrity across price structure flow
- Immutable tender package records (soft-delete only, never hard delete)
- Version tracking for all document revisions
- Audit trail for all price changes and variations

**3. Document Processing Pipeline:**
```
Upload → Virus Scan → Storage (S3) → AI Analysis → Metadata Extraction → User Review → Finalize
```

**4. Tender Package Generation Pipeline:**
```
User Selection (Plan sections + Documents)
    → AI Context Assembly
    → Template Selection
    → Content Generation
    → User Review/Edit
    → Finalize & Lock
    → Export (PDF/Word/Excel)
```

**5. Scalability Considerations:**
- Single-user MVP simplifies architecture (no multi-tenancy complexity)
- Design database schema to support future multi-user expansion
- AI processing may require background job queue for large documents
- Consider caching AI responses for repeated queries

**6. Security & Compliance:**
- Secure file storage with signed URLs
- MIME type validation on uploads
- Virus scanning (already implemented)
- HTTPS for all communications
- Environment-based configuration (no hardcoded secrets)

**7. Export Generation:**
- Template-based PDF generation
- Word document generation (.docx format)
- Excel spreadsheet generation (for pricing structures, cost tracking)
- Maintain formatting consistency across exports

**Technology Decisions Deferred:**
- Vector database selection (evaluate if document similarity search proves necessary)
- AI agent framework (evaluate complexity needs - may not need full framework for MVP)
- Multi-tenant architecture (deferred to v2)
- Real-time collaboration infrastructure (deferred to v2)

---

## Next Steps

**Immediate Actions:**

1. **Technical Planning:**
   - Select LLM provider (OpenAI GPT-4 vs. Anthropic Claude) based on cost/performance testing
   - Evaluate AI agent framework needs (LangChain, LlamaIndex, or custom)
   - Design AI service layer architecture
   - Plan document processing pipeline (OCR + PDF extraction)

2. **MVP Development Priorities:**
   - **Phase 1**: AI auto-population for Plan Card (validate document extraction accuracy)
   - **Phase 2**: Tender package generation pipeline (validate AI content quality)
   - **Phase 3**: Price structure flow and cost tracking (validate data model)
   - **Phase 4**: Export generation (PDF, Word, Excel)
   - **Phase 5**: Tender submission evaluation and reporting

3. **User Validation:**
   - Test AI auto-population with real project documents
   - Validate AI-generated tender packages against manual versions
   - Confirm "sharp, focused briefs" hypothesis with target users
   - Measure time savings (days → hours validation)

**Handoff to Development:**

This Product Brief serves as the foundation for:
- Technical specification development
- AI integration architecture design
- Database schema refinement for price structure flow
- MVP feature prioritization and sprint planning

**Reference Documents:**
- Technical Architecture: `docs/PriorArchitecture.md`
- Existing Features: `docs/PriorFeatures.md`
- This Product Brief: `docs/product-brief-assemble.ai-2025-10-25.md`

---

**Document Status:** Draft for Review
**Last Updated:** 2025-10-25
**Author:** Benny (with Mary, Business Analyst)
