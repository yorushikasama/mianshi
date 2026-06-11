# AI 面试复习平台基础工程实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建第一阶段可运行基础工程：npm workspaces monorepo、共享领域模型、Java 后端题库种子、Next.js PWA 前端壳、NestJS API 基础和 Prisma schema。

**Architecture:** 使用 `apps/web` 承载 Next.js PWA 前端，`apps/api` 承载 NestJS 后端，`packages/shared` 承载通用领域模型和 schema。第一版数据内容聚焦 Java 后端，但核心模型保持通用，后续可以扩展其他面试方向。

**Tech Stack:** Next.js、React、TypeScript、NestJS、Prisma、PostgreSQL/pgvector、Zod、TanStack Query、GSAP、Vitest、Playwright。

---

## 文件结构

- `package.json`：root workspace scripts 和共享 dev dependencies。
- `apps/web/package.json`：Next.js 前端依赖与脚本。
- `apps/web/src/app/*`：App Router 页面、PWA 壳和主界面。
- `apps/web/public/*`：manifest、service worker、离线页和图标。
- `apps/api/package.json`：NestJS 后端依赖与脚本。
- `apps/api/src/main.ts`：Nest 应用启动入口。
- `apps/api/src/app.module.ts`：根模块。
- `apps/api/src/health/*`：健康检查。
- `apps/api/src/catalog/*`：Java 面试领域、分类、种子题接口。
- `apps/api/prisma/schema.prisma`：数据库 schema 草案。
- `packages/shared/package.json`：共享包配置。
- `packages/shared/src/domain.ts`：通用领域、分类、题目、答案 schema。
- `packages/shared/src/java-backend.ts`：Java 后端第一版知识树和种子题。
- `packages/shared/src/review.ts`：复习评分到 FSRS rating 的轻量映射。
- `packages/shared/src/*.test.ts`：共享领域模型测试。

## Task 1: npm workspaces 基础

**Files:**
- Modify: `package.json`
- Create: `apps/web/package.json`
- Create: `apps/api/package.json`
- Create: `packages/shared/package.json`

- [ ] 重写 root `package.json`，增加 workspaces 和统一脚本。
- [ ] 创建 web/api/shared 三个 workspace 的 `package.json`。
- [ ] 安装依赖。
- [ ] 运行 `npm install` 更新 lockfile。

## Task 2: 共享领域模型，TDD

**Files:**
- Create: `packages/shared/src/domain.test.ts`
- Create: `packages/shared/src/java-backend.test.ts`
- Create: `packages/shared/src/review.test.ts`
- Create: `packages/shared/src/domain.ts`
- Create: `packages/shared/src/java-backend.ts`
- Create: `packages/shared/src/review.ts`
- Create: `packages/shared/src/index.ts`

- [ ] 先写测试，验证领域模型不把 Java 写死进通用 schema。
- [ ] 运行 shared 测试，确认失败。
- [ ] 实现 Zod schema、Java 后端知识树和评分映射。
- [ ] 运行 shared 测试，确认通过。

## Task 3: Next.js PWA 前端壳

**Files:**
- Create: `apps/web/next.config.mjs`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/globals.css`
- Create: `apps/web/src/components/*`
- Create: `apps/web/public/manifest.webmanifest`
- Create: `apps/web/public/sw.js`
- Create: `apps/web/public/offline.html`

- [ ] 创建 App Router 基础文件。
- [ ] 创建 PWA manifest、service worker 和离线页。
- [ ] 首页展示 Java 后端复习定位、今日任务、知识树、AI 任务入口。
- [ ] 使用 GSAP 做克制的首屏入场动画。
- [ ] 使用共享 Java 分类数据，不在 UI 结构里写死模型。

## Task 4: NestJS API 基础

**Files:**
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/health/health.controller.ts`
- Create: `apps/api/src/catalog/catalog.controller.ts`
- Create: `apps/api/src/catalog/catalog.service.ts`

- [ ] 创建 Nest 应用入口和根模块。
- [ ] 添加 `/health`。
- [ ] 添加 `/catalog/domains`、`/catalog/java-backend/categories`、`/catalog/java-backend/questions`。
- [ ] 所有返回数据来自 `packages/shared`。

## Task 5: Prisma schema 草案

**Files:**
- Create: `apps/api/prisma/schema.prisma`

- [ ] 定义 User、Domain、Category、Tag、Question、Answer、PracticeAttempt、ReviewState、SourceDocument、DocumentChunk、AiJob、PromptVersion。
- [ ] Java 内容只作为 Domain/Category 数据，不进入表名。
- [ ] DocumentChunk 预留 pgvector embedding 字段。

## Task 6: 验证

**Commands:**
- `npm run test -w packages/shared`
- `npm run build -w packages/shared`
- `npm run build -w apps/api`
- `npm run build -w apps/web`

- [ ] 运行 shared 测试。
- [ ] 运行 shared build。
- [ ] 运行 API build。
- [ ] 运行 Web build。
- [ ] 将结果记录到 `.planning/interview-prep-research/progress.md`。

