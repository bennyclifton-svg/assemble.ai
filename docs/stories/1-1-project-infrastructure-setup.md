# Story 1.1: Project Infrastructure Setup

Status: Draft

## Story

As a developer,
I want to set up the initial project infrastructure with Next.js 15, PostgreSQL, Prisma, AWS S3, and authentication,
so that we have a solid foundation for building the multi-card workspace system.

## Acceptance Criteria

1. **AC-1.1**: Next.js 15 project initialized with TypeScript strict mode, App Router, and Tailwind CSS 4
2. **AC-1.2**: PostgreSQL database connected via Prisma 6.0.1 with initial migration applied
3. **AC-1.3**: AWS S3 bucket configured with IAM credentials and signed URL generation working
4. **AC-1.4**: Clerk authentication integrated with sign-in/sign-up pages and middleware protection
5. **AC-1.5**: Environment configuration established with .env.local for secrets
6. **AC-1.6**: Git repository initialized with proper .gitignore (excluding .env files)
7. **AC-1.7**: Project runs locally at http://localhost:3000 with no errors
8. **AC-1.8**: Basic folder structure matches architecture specification

## Tasks / Subtasks

- [ ] Task 1: Initialize Next.js project (AC: 1.1, 1.7)
  - [ ] Clone starter template: `git clone --depth=1 https://github.com/ixartz/Next-js-Boilerplate.git assemble-ai`
  - [ ] Install dependencies: `npm install`
  - [ ] Verify TypeScript strict mode in tsconfig.json
  - [ ] Verify Tailwind CSS 4 configuration
  - [ ] Test local development server

- [ ] Task 2: Setup PostgreSQL and Prisma (AC: 1.2)
  - [ ] Install Prisma dependencies if not included: `npm install @prisma/client@6.0.1 prisma@6.0.1`
  - [ ] Configure DATABASE_URL in .env.local
  - [ ] Create initial Prisma schema with Project model
  - [ ] Run `npx prisma migrate dev --name init`
  - [ ] Verify database connection with Prisma Studio

- [ ] Task 3: Configure AWS S3 (AC: 1.3)
  - [ ] Install AWS SDK: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
  - [ ] Add AWS credentials to .env.local (AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME)
  - [ ] Create S3 service module at src/server/services/s3.ts
  - [ ] Implement signed URL generation function
  - [ ] Test file upload/download with signed URLs

- [ ] Task 4: Setup Clerk authentication (AC: 1.4, 1.8)
  - [ ] Create Clerk application at clerk.com
  - [ ] Add Clerk keys to .env.local (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY)
  - [ ] Configure middleware.ts for route protection
  - [ ] Create sign-in and sign-up pages at app/(auth)/sign-in/[[...sign-in]]/page.tsx
  - [ ] Test authentication flow

- [ ] Task 5: Environment and Git setup (AC: 1.5, 1.6)
  - [ ] Create .env.example with all required variables (without values)
  - [ ] Ensure .env.local is in .gitignore
  - [ ] Initialize git repository if not already done
  - [ ] Create initial commit

- [ ] Task 6: Verify folder structure (AC: 1.8)
  - [ ] Create required directories per architecture:
    - src/app/(dashboard)/projects/
    - src/components/cards/
    - src/components/workspace/
    - src/server/api/routers/
    - src/server/services/
    - src/stores/
    - src/types/
  - [ ] Add index files or READMEs to establish structure

- [ ] Task 7: Testing setup verification (AC: 1.7)
  - [ ] Run `npm run type-check` to verify TypeScript
  - [ ] Run `npm run lint` to verify ESLint
  - [ ] Create smoke test for homepage render
  - [ ] Document setup instructions in README.md

## Dev Notes

### Architecture Alignment
- Using Next.js 15.0.0 with App Router as specified in architecture.md
- Prisma 6.0.1 for ORM per Decision Summary
- Implementing three-tier data architecture foundation
- Following PascalCase for components, camelCase for utilities naming convention

### Key Implementation Details
1. **Starter Template**: The ixartz Next.js Boilerplate provides most infrastructure pre-configured
2. **Database**: Use PostgreSQL 16.0 locally or Supabase/Neon for cloud
3. **File Structure**: Must match architecture.md project structure exactly
4. **Authentication**: Clerk handles all auth flows, no custom implementation needed
5. **Environment Variables**: Never commit secrets, use .env.example for documentation

### Testing Standards
- Smoke test for basic functionality
- No unit tests required for this story (infrastructure only)
- Manual verification of all acceptance criteria

### Project Structure Notes

Expected structure after completion:
```
assemble-ai/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── sign-in/[[...sign-in]]/page.tsx
│   │   ├── (dashboard)/
│   │   │   └── projects/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── cards/
│   │   └── workspace/
│   ├── server/
│   │   ├── api/
│   │   │   └── routers/
│   │   └── services/
│   │       └── s3.ts
│   ├── stores/
│   ├── types/
│   └── middleware.ts
├── prisma/
│   └── schema.prisma
├── .env.local
├── .env.example
└── package.json
```

### References

- [Source: docs/architecture.md#Project Initialization] - Starter template command
- [Source: docs/architecture.md#Decision Summary] - Technology versions
- [Source: docs/architecture.md#Project Structure] - Folder organization
- [Source: docs/tech-spec-epic-1.md#Dependencies and Integrations] - Package versions
- [Source: docs/tech-spec-epic-1.md#Acceptance Criteria] - AC-1.1 through AC-1.6
- [Source: docs/PRD.md#Non-Functional Requirements] - Security requirements NFR011-014

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- Will be filled by implementing agent -->

### Debug Log References

### Completion Notes List

### File List