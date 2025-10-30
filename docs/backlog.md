# Project Backlog

## Review Follow-ups and Technical Debt

| Date | Story | Epic | Type | Severity | Owner | Status | Notes |
|------|-------|------|------|----------|-------|--------|-------|
| 2025-10-28 | 2.2 | 2 | Bug | HIGH | Amelia | **Done** | ✅ Add S3 credentials validation with fail-fast behavior (`s3.ts:11-26`) |
| 2025-10-28 | 2.2 | 2 | Bug | HIGH | Amelia | **Done** | ✅ Wrap S3 operations in try-catch with error logging (`s3.ts:52-168`) |
| 2025-10-28 | 2.2 | 2 | TechDebt | HIGH | Amelia | **Done** | ✅ Integrate Pino logger for all S3 operations (`s3.ts`) - Created `lib/logger.ts` |
| 2025-10-28 | 2.2 | 2 | TechDebt | MEDIUM | TBD | Open | Configure jsdom for component tests (`vitest.config.ts`) |
| 2025-10-28 | 2.2 | 2 | Bug | MEDIUM | SM | Open | Resolve maxFiles inconsistency (10 vs 20) with SM |
| 2025-10-28 | 2.2 | 2 | Enhancement | LOW | TBD | Open | Add retry logic for S3 uploads (Epic 2 backlog) |
| 2025-10-28 | 2.2 | 2 | Enhancement | LOW | TBD | Open | Implement multipart upload for files >5MB (Epic 2 backlog) |
| 2025-10-28 | 2.2 | 2 | Enhancement | MEDIUM | TBD | Open | Add virus scanning integration (ClamAV or AWS GuardDuty) |
| 2025-10-28 | 2.2 | 2 | Enhancement | MEDIUM | TBD | Open | Implement rate limiting middleware |
| 2025-10-28 | 2.2 | 2 | Enhancement | LOW | TBD | Open | Add E2E tests for drag-drop workflow |
| 2025-10-28 | 2.2 | 2 | Enhancement | LOW | TBD | Open | Add integration tests with real S3 (staging environment) |

---

## Notes

- Items marked HIGH severity should be addressed before production deployment
- BLOCKING items must be fixed before story 2.2 can be marked done
- SM = Scrum Master ownership required for decision
- TBD = To Be Determined during sprint planning
