# Phase One Next.js Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build the first usable Next.js UI for the interview-prep product with anime-style login, authenticated workbench screens, PostgreSQL schema, and smoke checks.

**Architecture:** Create a clean root-level Next.js app. Use mock data for UI behavior, SQL migrations for the future PostgreSQL model, and a tiny Node smoke checker instead of a test framework.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS, PostgreSQL SQL migrations.

---

### Task 1: Scaffold Clean Web App

**Files:**
- Create: `package.json`
- Create: `next.config.mjs`
- Create: `tsconfig.json`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

- [x] Create a minimal Next.js app at the repository root.
- [x] Add global tokens matching the anime learning workbench style.
- [x] Make `/` redirect to `/login`.

### Task 2: Anime Auth Pages

**Files:**
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/register/page.tsx`
- Create: `src/app/(auth)/forgot-password/page.tsx`
- Create: `src/components/auth/animated-login-card.tsx`

- [x] Add login, register, and forgot-password pages.
- [x] Use an animatedlogin-inspired left character panel and right form.
- [x] Keep it CSS-only and accessible.

### Task 3: Workbench Shell And Pages

**Files:**
- Create: `src/app/(app)/layout.tsx`
- Create: `src/app/(app)/dashboard/page.tsx`
- Create: `src/app/(app)/generate/page.tsx`
- Create: `src/app/(app)/questions/page.tsx`
- Create: `src/app/(app)/practice/page.tsx`
- Create: `src/app/(app)/materials/page.tsx`
- Create: `src/app/(app)/settings/page.tsx`
- Create: `src/components/workbench/workbench-shell.tsx`
- Create: `src/lib/mock-data.ts`

- [x] Add left navigation and mobile-friendly workbench layout.
- [x] Add dashboard, AI generation, question bank, practice, materials, and settings pages.
- [x] Use mock data only.
- [x] Keep AI access as unconnected status, no fixed address or real key persistence.

### Task 4: PostgreSQL Schema And Env Docs

**Files:**
- Create: `migrations/001_initial.sql`
- Create: `.env.example`
- Create: `uploads/.gitkeep`

- [x] Add the minimal PostgreSQL schema.
- [x] Add `DATABASE_URL`, auth secret, upload directory, and optional LiteLLM env placeholders.
- [x] Keep file binaries out of the database.

### Task 5: Smoke Verification

**Files:**
- Create: `scripts/smoke-check.mjs`

- [x] Check required pages and copy exist.
- [x] Check banned product text does not exist: 支付, 充值, 套餐.
- [x] Check AI gateway localhost is not hardcoded.
- [x] Run `npm run smoke` and `npm run build`.
