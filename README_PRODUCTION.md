# Production Deployment & Setup Guide - AI English Writing Assessment SaaS Platform

## 1. Overview & Implemented Architecture

The platform is a commercial, multi-tenant AI-Assisted English Writing Assessment SaaS designed for universities, language centers, and training institutions.

> [!IMPORTANT]
> **FROZEN GRADING CORE**: The grading engine (`app/api/grade/route.ts`), system prompt (`writing-grader-v3.2`), rubric (`writing-rubric-v2.0`), model (`gpt-4o-2024-11-20`), temperature (`0`), structured JSON schema, evidence verification, and prompt-injection defense are **completely frozen** and unchanged.

### Key Architectural Highlights:
- **Multi-Tenant Isolation**: Database entity isolation by `organizationId`. Every API route verifies tenant boundaries server-side.
- **Role-Based Access Control (RBAC)**: Supports `SUPER_ADMIN`, `ORG_ADMIN`, `LECTURER`, `REVIEWER`, and `STUDENT`. Enforced at API route level.
- **Asynchronous Queue & Idempotency**: Submissions are safely enqueued to `GradingJob`. SHA-256 grading fingerprint (`SHA256(essayText + task + rubricVersion + promptVersion + model)`) prevents duplicate paid OpenAI calls.
- **Immutability & Grade Preservation**: Original `AIAssessment` versions remain untouched. Lecturer modifications create independent `LecturerReview` and `FinalGrade` entries.
- **Student Grade Release**: Results are visible to students only when `status === 'RELEASED'`.

---

## 2. Prisma Database Models Summary

- **Multi-Tenancy & Auth**: `User`, `Organization`, `OrganizationMember`.
- **Subscriptions & Usage**: `SubscriptionPlan`, `OrganizationSubscription`, `UsageRecord`.
- **Academic Structure**: `Course`, `ClassGroup`, `Student`, `Enrollment`.
- **Assessments & Submissions**: `Assessment`, `Submission`, `SubmissionVersion`.
- **Grading & Reviews**: `GradingJob`, `AIAssessment`, `LecturerReview`, `FinalGrade`.
- **Appeals & Governance**: `Appeal`, `AppealReview`, `AuditLog`, `SystemSetting`.

---

## 3. Application API Routes

- `GET/POST /api/auth/me`: Cookie-based session retrieval, user login, and logout.
- `GET/POST /api/organizations`: Multi-tenant organization creation and listing.
- `GET/POST /api/courses`: Academic course management.
- `GET/POST /api/students`: Student roster management and single additions.
- `POST /api/students/import`: Bulk CSV student import with row-level validation preview.
- `GET/POST /api/assessments`: Writing assessment creation with word limits and scheduling.
- `GET/POST /api/submissions`: Essay submission and submission versioning.
- `POST /api/grade`: Frozen AI grading core handler.
- `POST /api/grade/queue`: Async job enqueuing and fingerprint cache checks.
- `GET /api/grade/status/[jobId]`: Queue worker job status polling.
- `GET/POST /api/reviews`: Lecturer review, score modification, and approval.
- `POST /api/reviews/release`: Result release to student accounts.
- `GET /api/analytics`: Database operational analytics and criteria averages.
- `GET /api/exports`: CSV grade sheet export.
- `GET /api/audit-logs`: Enterprise audit log stream.
- `GET /api/health`: System health and OpenAI service monitoring.

---

## 4. Environment Variables (`.env.local`)

```env
# Database Connection (SQLite during dev, PostgreSQL for production)
DATABASE_URL="file:./dev.db"

# OpenAI Service Configuration
OPENAI_API_KEY="your-openai-api-key-here"
OPENAI_MODEL="gpt-4o-2024-11-20"

# Application Settings
APP_URL="http://localhost:3000"
NODE_ENV="production"
```

---

## 5. Setup & Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Database Migrations / Sync**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

3. **Seed Database**:
   ```bash
   npx tsx prisma/seed.ts
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 6. Production Build & Deployment

1. **Verify TypeScript & Linting**:
   ```bash
   npx tsc --noEmit
   npm run lint
   ```

2. **Build Production Bundle**:
   ```bash
   npm run build
   ```

3. **Start Production Server**:
   ```bash
   npm run start
   ```

---

## 7. Security Checklist

- [x] All OpenAI API calls executed server-side.
- [x] Student essay rendered safely as untrusted data without raw HTML execution.
- [x] Server-side RBAC and Organization Isolation enforced on every API route.
- [x] Development role switcher disabled when `NODE_ENV === "production"`.
- [x] Immutable audit trail recorded for all score modifications and grade releases.
- [x] Graceful API credit exhaustion handling prevents essay submission loss.
