# Assemble.AI Monorepo

AI-powered tender package generation and management for construction projects.

## Repository Structure

```
assemble.ai/
├── assemble-app/          # Main Next.js application (RUN DEV SERVER FROM HERE)
│   ├── src/               # Application source code
│   ├── prisma/            # Database schema and migrations
│   ├── public/            # Static assets
│   ├── package.json       # Application dependencies
│   └── ...                # Application configuration files
│
├── bmad/                  # BMad workflow system
│   └── bmm/               # BMad Modular Manager
│       ├── agents/        # Agent configurations
│       └── workflows/     # Workflow definitions
│
├── docs/                  # Project documentation
│   ├── stories/           # User stories and requirements
│   ├── sprints/           # Sprint planning and tracking
│   └── ...                # Other documentation
│
├── .claude/               # Claude Code configuration
└── README.md              # This file
```

## Running the Application

**CRITICAL**: Always run the development server from the `assemble-app/` directory, NOT from the root.

```bash
# Navigate to the application directory
cd assemble-app

# Install dependencies (if needed)
npm install

# Run the development server
npm run dev
```

The application will be available at `http://localhost:3001`.

## Technology Stack

- **Framework**: Next.js 15.5.6 with App Router and Turbopack
- **Language**: TypeScript 5.x with strict mode
- **Styling**: Tailwind CSS 4.x
- **Database**: PostgreSQL with Prisma 6.0.1 ORM
- **Authentication**: Clerk
- **File Storage**: AWS S3 (via AWS SDK v3)
- **State Management**: Zustand 5.0.8
- **Form Management**: React Hook Form with Zod validation
- **Drag & Drop**: DnD Kit
- **Logging**: Pino 9.0.0

## Setup Instructions

### Prerequisites

- Node.js 20.9.0 or later
- PostgreSQL 16.0 (local or cloud)
- AWS account with S3 bucket
- Clerk account

### Installation

1. **Navigate to the application directory**:
   ```bash
   cd assemble-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```

   Required variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key
   - `CLERK_SECRET_KEY`: Clerk secret key
   - `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`: AWS credentials
   - `S3_BUCKET_NAME`: S3 bucket name

4. **Setup database**:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   # OR for demo environments without migration tracking:
   npx prisma db push
   ```

5. **Run development server**:
   ```bash
   npm run dev
   ```

6. **Access the application**:
   Open [http://localhost:3001](http://localhost:3001) in your browser

### Available Scripts

From the `assemble-app/` directory:

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npx prisma studio` - Open Prisma Studio to view/edit database

## Database Schema

The schema uses a three-tier data architecture:

- **Project**: Top-level project container
- **Card**: Eight card types (PLAN, CONSULTANT, CONTRACTOR, PROCURE, COST_PLANNING, SCHEME_DESIGN, DETAIL_DESIGN, DOCUMENTS)
- **Section**: Organized sections within each card
- **Item**: Individual data items with flexible JSON storage

All models include soft delete support (`deletedAt`) and audit fields (`createdBy`, `updatedBy`).

## Authentication

- Sign-in page: `/sign-in`
- Sign-up page: `/sign-up`
- Protected routes: `/projects/*`
- Middleware automatically redirects unauthenticated users

## Documentation

- **User Stories**: Located in `docs/stories/` with Epic-Story numbering (e.g., Story 4-1)
- **Sprint Plans**: Located in `docs/sprints/`
- **Workflow Documentation**: Located in `bmad/bmm/`

## Development Workflow

This project uses the BMad Modular Manager (BMM) workflow system for structured development:

- Stories are defined in `docs/stories/` following the Epic-Story format
- Development is tracked through sprints in `docs/sprints/`
- Agent-based development workflow via Claude Code

## Version Control

- **Repository**: Git with GitHub
- **Main Branch**: `master`
- **Structure**: Monorepo containing application code, documentation, and workflow configuration

**Important**: Only the `assemble-app/` directory contains the application code. The root directory contains monorepo infrastructure, documentation, and configuration only.

## Project Status

### Completed Stories

- ✅ Story 1.1: Project Infrastructure Setup
- ✅ Story 1.2: Core Database Schema
- ✅ Story 1.3: Side Navigation Bar
- ✅ Story 1.4: Plan Card Structure
- ✅ Story 1.5: Consultant/Contractor Cards
- ✅ Story 1.6: Server Actions and Drag-Drop Setup
- ✅ Story 2.1: Documents Card - Tender Documents Section
- ✅ Story 4.1: Tender Package Assembly Interface (Ready for Review)

### Current Sprint

See `docs/sprints/` for current sprint plan and active stories.

## Last Updated

November 1, 2025 - Monorepo cleanup and structure documentation
