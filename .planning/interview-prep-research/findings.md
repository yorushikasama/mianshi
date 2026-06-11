# Research Findings

## Scope
The project is an AI-assisted interview preparation platform. It should generate interview questions and answers, support active recall practice, track review progress, and optionally use RAG over user-provided materials such as resume text, project notes, and job descriptions.

## Open Questions
- Whether to prioritize Java/backend interview prep content first or make the system domain-agnostic from day one.

## AI/RAG Findings
- RAG should be implemented as a backend-controlled retrieval pipeline: index source documents, split content, embed chunks, retrieve relevant chunks, then pass only selected context to the model.
- LangChain documents a modular RAG pipeline: loaders, text splitters, embeddings, vector stores, retrievers, then generation. This is useful as a conceptual model even if the app does not use LangChain directly.
- OpenAI Structured Outputs / JSON schema support is important for AI-generated questions, answers, scoring rubrics, and feedback because generated data must be validated before database insertion.
- OpenAI embeddings are relevant for semantic search over questions, answers, resume snippets, project notes, and job descriptions.

## Full-Stack Findings
- Next.js App Router supports Server Components, Suspense, Server Functions, and file-system routing. Good for the frontend and possibly a small full-stack MVP.
- For resume value, a separate NestJS backend is stronger because it demonstrates modules, controllers, providers, validation, queues, OpenAPI, and testable service boundaries.
- Prisma Migrate is appropriate for PostgreSQL schema migrations and a polished engineering workflow.

## Storage, Queue, Auth, Learning Findings
- pgvector allows vector similarity search inside PostgreSQL and supports exact/approximate nearest neighbor search, distance operators, and HNSW/IVFFlat indexes. It is a strong fit because questions, answers, attempts, and embeddings can live in one relational system.
- Supabase uses pgvector for vector columns and semantic search; it is useful for managed Postgres/Auth/Storage if we want simpler deployment.
- BullMQ is a Redis-backed queue library for Node.js. It fits long-running AI jobs: question generation, answer generation, embedding creation, document parsing, and retryable evaluation jobs.
- Auth.js/NextAuth is open source and integrates with Next.js; for a separate NestJS backend, auth can still be handled via sessions/JWT, but the boundary must be designed carefully.
- TanStack Query is a good fit for frontend server state: question lists, job status polling, practice attempts, optimistic updates, pagination, and cache invalidation.
- ts-fsrs is a TypeScript implementation of FSRS and is directly applicable for spaced repetition scheduling after each practice attempt.
- Langfuse is an open-source LLM observability platform. It can track prompts, latency, cost, traces, and evaluation scores, which is valuable for a resume-grade AI project.

## Comparable Project Findings
- Tech Interview Handbook is a popular open-source coding interview preparation resource. It is content-heavy and useful as a reference for taxonomy: algorithms, behavioral questions, resume guidance, and interview process.
- Coding Interview University is a multi-month CS/interview study plan. It reinforces that a good prep product needs structured paths, not only random questions.
- System Design Primer combines system design explanations, interview questions, and Anki flashcards. This supports adding spaced repetition and system-design answer templates.
- Quizfreely, Memcode, Rekall, Lektr, Anki, and similar projects show recurring study-app primitives: decks, cards, progress, review scheduling, imports, analytics, and low-distraction practice mode.
- AI interviewer GitHub topics show many mock interview projects focus on voice, resume analysis, and real-time feedback. A differentiator for this project should be knowledge management and review retention, not only voice chat.
- DeepTutor and NextRag-like projects show patterns for AI tutor/RAG apps: knowledge base ingestion, document chunking, vector search, persistent learning context, and chat/tool workflows.

## Frontend and AI UI Findings
- Vercel AI SDK is a TypeScript toolkit for building AI-powered apps and agents across React, Next.js, Vue, Svelte, Node.js, etc. It provides AI SDK Core for text/structured objects/tool calls and AI SDK UI for chat/generative UI.
- TanStack Query should handle server state, polling AI job status, query invalidation after mutations, optimistic updates, pagination, and retries.
- Zod is a TypeScript-first schema validation library and fits request validation plus AI output validation.
- OpenAI's official TypeScript/JavaScript SDK supports streaming via Server-Sent Events and works in Node.js 20+.
