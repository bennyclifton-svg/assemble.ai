# assemble.ai

AI-powered tender package generation and management for construction projects.

## Story 1.1: Project Infrastructure Setup - COMPLETED ✅

This project has been set up with the following infrastructure per Story 1.1 requirements:

### ✅ Acceptance Criteria Met

- **AC-1.1**: Next.js 15 with TypeScript strict mode, App Router, and Tailwind CSS 4
- **AC-1.2**: PostgreSQL database configured via Prisma 6.0.1 with initial schema
- **AC-1.3**: AWS S3 service module created with signed URL generation
- **AC-1.4**: Clerk authentication integrated with sign-in/sign-up pages and middleware
- **AC-1.5**: Environment configuration with .env.local and .env.example
- **AC-1.6**: Git repository initialized with proper .gitignore
- **AC-1.7**: Project structure ready to run at http://localhost:3000
- **AC-1.8**: Folder structure matches architecture specification

### Tech Stack

- **Framework**: Next.js 15.5.6 with App Router
- **Language**: TypeScript 5.x with strict mode
- **Styling**: Tailwind CSS 4.x
- **Database**: PostgreSQL with Prisma 6.0.1 ORM
- **Authentication**: Clerk
- **File Storage**: AWS S3 (via AWS SDK v3)
- **State Management**: Zustand 5.0.8
- **Validation**: Zod 3.x
- **Logging**: Pino 9.0.0

## Setup Instructions

### Prerequisites

- Node.js 20.9.0 or later
- PostgreSQL 16.0 (local or cloud)
- AWS account with S3 bucket
- Clerk account

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
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

3. **Setup database**:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Database Schema

The initial schema includes the three-tier data architecture:

- **Project**: Top-level project container
- **Card**: Eight card types (PLAN, CONSULTANT, CONTRACTOR, PROCURE, COST_PLANNING, SCHEME_DESIGN, DETAIL_DESIGN, DOCUMENTS)
- **Section**: Organized sections within each card
- **Item**: Individual data items with flexible JSON storage

All models include soft delete support (`deletedAt`) and audit fields.

## Authentication

- Sign-in page: `/sign-in`
- Sign-up page: `/sign-up`
- Protected routes: `/projects/*`
- Middleware automatically redirects unauthenticated users

## Next Steps

Story 1.1 establishes the foundation. Upcoming stories will implement:
- Story 1.2: Core Database Schema enhancements
- Story 1.3: Side Navigation Bar
- Story 1.4: Plan Card Structure

---

**Implementation Date**: 2025-10-25
**Story**: 1.1 - Project Infrastructure Setup
**Status**: ✅ Complete
