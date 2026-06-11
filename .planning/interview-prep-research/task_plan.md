# AI Interview Prep Project Research Plan

## Goal
Research and shape a resume-worthy AI interview preparation project: architecture, AI workflows, storage model, open-source libraries, and technical risks.

## Phases

| Phase | Status | Notes |
| --- | --- | --- |
| 1. Define target scope | complete | User wants a resume-worthy engineering project, not only a personal utility. |
| 2. Research AI/RAG knowledge | complete | Cover generation, structured output, embeddings, retrieval, evaluation, cost. |
| 3. Research full-stack architecture | complete | Compare Next.js monolith vs frontend + NestJS backend. |
| 4. Research open-source libraries | complete | Frontend, backend, DB, AI SDK, queues, auth, testing, observability. |
| 5. Research comparable projects | complete | Look for open-source interview prep, flashcard, AI tutor, RAG apps. |
| 6. Synthesize recommendation | complete | Produce stack, modules, MVP roadmap, resume highlights. |

## Decisions So Far
- Treat the project as a portfolio-grade system.
- Favor a stack that demonstrates backend engineering, async jobs, database design, and AI integration.
- Recommended architecture: Next.js frontend + NestJS backend + PostgreSQL/pgvector + Redis/BullMQ + OpenAI + Langfuse.
- Use ts-fsrs for spaced repetition rather than inventing a scheduler from scratch.
- Use structured AI output and backend validation for all AI-generated questions, answers, scoring, and feedback.

## Errors Encountered

| Error | Attempt | Resolution |
| --- | --- | --- |
