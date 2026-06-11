# Progress Log

## 2026-06-07
- User clarified that the project should be resume-worthy and demonstrate engineering capability.
- Created planning files for structured research.
- Researched initial AI/RAG and full-stack framework sources: OpenAI, LangChain, Next.js, NestJS, Prisma.
- Researched pgvector, Supabase vector docs, BullMQ, Auth.js, TanStack Query, ts-fsrs, and Langfuse.
- Researched comparable projects: Tech Interview Handbook, Coding Interview University, System Design Primer, flashcard apps, AI interviewer repos, RAG/tutor examples, Vercel AI SDK, OpenAI Node SDK, Zod.
- Synthesized recommendation: portfolio-grade stack with separate frontend/backend, async AI pipeline, vector search, FSRS review scheduling, and LLM observability.
- Created formal project specification at docs/project-spec.md.
- Created root AGENTS.md as the project rule file. Resolved scope: version 1 focuses on Java backend interviews, later expands to generic technical interviews, and PWA support is required.
- Converted AGENTS.md to Chinese while preserving all project rules.
- Implemented Phase 1 foundation: npm workspaces, shared Java backend catalog schemas/tests, Next.js PWA shell, NestJS API health/catalog endpoints, Prisma schema, and .env.example.
- Verification: `npm run test` passed with API 2 test files / 3 tests and shared 3 test files / 12 tests. `npx prisma validate --schema apps/api/prisma/schema.prisma` passed. `npm run build` passed for api, web, and shared.
- Started local API on port 3001 and Web on port 3000. Smoke checks passed for `/health`, `/catalog/domains`, `/`, `/manifest.webmanifest`, and `/sw.js`. Captured desktop and mobile screenshots at `.planning/web-home.png` and `.planning/web-home-mobile.png`.
- Added README.md with current phase, run commands, verification commands, and project structure.

## 2026-06-08
- Used the frontend UI skill direction to polish the Web/PWA homepage into a stronger interview-prep workbench: clearer hero positioning, Java backend knowledge map asset, GSAP radar motion, AI workflow cards, customer-reason cards, daily review plan, and practice CTA.
- Tightened the mobile hero layout: desktop keeps the full knowledge-map preview and diagnosis panel, while mobile keeps the radar motion, hides the large diagram preview, and exposes the learning overview cards within the first viewport.
- Verification: `npm run test` passed with API 2 test files / 3 tests and shared 3 test files / 12 tests. `npm run build -w apps/web` passed after rerunning with elevated permissions because the Windows sandbox blocked `.next` file replacement with EPERM.
- Updated Playwright screenshots at `.planning/web-home.png` and `.planning/web-home-mobile.png` after the UI polish.

## 2026-06-11
- Connected the API runtime to local PostgreSQL through Prisma 7's PostgreSQL driver adapter.
- Added a regression test for required `DATABASE_URL` and Prisma adapter option creation.
- Ran Prisma validation, client generation, migration deployment, and Java backend seed data initialization against the local `mianshi` database.
- Persisted practice attempts and review state through the Prisma repository. Current anonymous practice user is `seed-user` until Auth is implemented.
- Documented the local pgvector gap: embedding fields are temporarily JSON in this environment and should be migrated to vector after pgvector is installed.
- Prepared the project for GitHub management by tightening `.gitignore` for build outputs, logs, screenshots, and local secrets.
- Added Auth service/controller foundations: normalized email registration, scrypt password hashing, login, HMAC access tokens, refresh tokens in httpOnly cookies, and `/auth/me`.
- Added protected generic Questions API foundations: paginated listing, per-user visibility, manual question creation, owner-only update/delete, Prisma repository mapping across domain/category/tag, and service/controller tests.
- Updated seed behavior so Java backend seed questions are shared records (`user_id = null`) while user-created questions remain private to their owner.
- Protected Practice APIs with Bearer auth and removed the temporary `seed-user` write path. Practice attempts and review states now read/write with the authenticated `user_id`, and tests cover cross-user history isolation.
- Added Web authentication integration: `/auth` login/register page, in-memory access token handling, httpOnly refresh-cookie session restore, protected API retry on 401, and practice page login gating for personal history/submission.
