# Server Question Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show persisted server questions, including AI/RAG generated questions, in the web catalog and let the practice page open them.

**Architecture:** Keep the existing REST API and typed fetch wrapper. The home page remains the catalog entry, but a small client component loads `/questions?domainSlug=java_backend` when authenticated and falls back to seed questions when not authenticated.

**Tech Stack:** Next.js, React, TypeScript, NestJS, Prisma, Vitest.

---

### Task 1: Web API Client

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Test: `apps/web/src/lib/api.test.ts`

- [ ] Add `buildQuestionsPath` for `domainSlug`, `categorySlug`, `page`, and `pageSize`.
- [ ] Add `fetchQuestions` using the existing authenticated request helper.
- [ ] Add tests proving the path builder encodes filters and the request attaches bearer auth.

### Task 2: Home Catalog Component

**Files:**
- Create: `apps/web/src/components/question-catalog.tsx`
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/globals.css`

- [ ] Move the visible catalog question list into a client component.
- [ ] Load server questions only for authenticated users.
- [ ] Fall back to seed questions for guests or request failures.
- [ ] Keep category tree display as-is.

### Task 3: Practice Page Server Question Loading

**Files:**
- Modify: `apps/web/src/components/practice-workbench.tsx`

- [ ] Try `/questions/:questionId` for authenticated users.
- [ ] Fall back to seed catalog question/answer for seed questions.
- [ ] If no answer exists for a generated question, show an inline message and disable scoring until an answer is generated.

### Task 4: Verification

- [ ] Run `npm run test`.
- [ ] Run `npm run db:validate`.
- [ ] Run `npm run build`.
- [ ] Browser-check `/` and `/practice/q_jvm_gc_roots` on desktop/mobile.
- [ ] Commit and push only relevant files.
