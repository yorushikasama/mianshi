# 面试雷达

AI 辅助面试复习 Web/PWA 平台。第一版聚焦 Java 后端面试复习，后续扩展为通用技术面试复习平台。

## 当前阶段

已完成第一阶段基础工程：

- npm workspaces monorepo
- `packages/shared` 通用领域模型、Java 后端知识树、种子题和测试
- `apps/web` Next.js PWA 前端壳
- Web 登录/注册入口和 access token 调用链
- `apps/api` NestJS API 基础
- PostgreSQL + Prisma migration + Java 后端种子数据
- Auth 注册、登录、refresh token cookie、Bearer access token
- 受保护的通用题库 CRUD API
- 受保护的练习记录和复习状态 API，按登录用户隔离并持久化到 PostgreSQL
- 受保护的复习 Dashboard overview API，聚合今日待复习、逾期复习、最近练习和薄弱分类
- 受保护的 AI job API，支持异步题目生成、答案生成、练习评分、追问生成、文档 embedding 和 RAG 个性化题目生成
- 受保护的来源文档 API，支持简历、JD、项目笔记、学习笔记入库，并异步切块生成 embedding
- Web 首页已接入登录态 Dashboard，未登录展示演示复习计划，登录后读取个人复习数据
- PWA manifest、service worker、offline fallback

## 技术栈

- Frontend: Next.js, React, TypeScript, Tailwind-style CSS, GSAP, PWA
- Backend: NestJS, TypeScript, Prisma, PostgreSQL, Redis/BullMQ, OpenAI
- Shared: Zod, Vitest, FSRS
- Planned: pgvector vector column migration, Langfuse traces, AI 成本统计面板

## 目录结构

```text
apps/
  api/       NestJS API
  web/       Next.js PWA
packages/
  shared/    通用领域模型、Java 后端知识树、复习评分映射
docs/        项目规范和实施计划
PRODUCT.md   产品定位、用户、品牌人格和 UI 设计原则
```

## 本地运行

安装依赖：

```bash
npm install
```

构建共享包：

```bash
npm run build -w packages/shared
```

准备 PostgreSQL：

```bash
# 安装 PostgreSQL 后，确保本地 5432 端口可用，并创建数据库：
createdb -U postgres mianshi
```

配置环境变量：

```bash
copy .env.example .env
```

默认连接串为：

```text
postgresql://postgres:postgres@localhost:5432/mianshi?schema=public
```

如果本机 `postgres` 用户密码不是 `postgres`，请修改 `.env` 中的 `DATABASE_URL`。

当前本地开发环境使用 Prisma 7 PostgreSQL driver adapter，运行 API 和 seed 前必须配置有效的 `DATABASE_URL`。

同时需要配置 JWT 密钥：

```text
JWT_ACCESS_SECRET="replace-me-with-a-long-random-access-secret"
JWT_REFRESH_SECRET="replace-me-with-a-long-random-refresh-secret"
```

AI 生成和文档 embedding 需要配置 OpenAI：

```text
OPENAI_API_KEY="replace-me"
OPENAI_MODEL="gpt-5.5"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
```

初始化数据库结构和第一版 Java 题库数据：

```bash
npm run db:validate
npm run db:generate
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
npm run db:seed
```

说明：项目长期目标仍是 PostgreSQL + pgvector。当前本地 PostgreSQL 18 环境未安装 pgvector，因此 embedding 字段暂以 JSON 形式保留，后续安装 pgvector 后再通过 Prisma migration 切换为 vector 类型。

启动 API：

```bash
npm run start -w apps/api
```

启动 Web：

```bash
npm run dev -w apps/web -- --port 3000
```

访问：

- Web: `http://localhost:3000`
- Web auth: `http://localhost:3000/auth`
- API health: `http://localhost:3001/health`
- API docs: `http://localhost:3001/docs`
- Java domain: `http://localhost:3001/catalog/domains`

常用 API：

```text
POST /auth/register
POST /auth/login
POST /auth/refresh
GET  /auth/me

GET    /questions
GET    /questions/:questionId
POST   /questions
PATCH  /questions/:questionId
DELETE /questions/:questionId

GET  /practice/attempts
POST /practice/attempts
GET  /practice/review-states/:questionId

GET  /review/overview

POST /ai/jobs
GET  /ai/jobs
GET  /ai/jobs/:jobId

POST /documents
GET  /documents
```

`/questions`、`/practice`、`/review`、`/ai/jobs` 和 `/documents` 接口需要 `Authorization: Bearer <accessToken>`。题库只返回共享种子题和当前用户自己的题目；练习记录、复习状态、Dashboard 聚合、AI 任务和来源文档只返回当前用户的数据。

RAG 个性化题目通过 AI job 创建：

```json
{
  "type": "rag_generate_questions",
  "input": {
    "domainSlug": "java_backend",
    "categorySlug": "redis",
    "focus": "订单系统 Redis 缓存一致性",
    "documentType": "resume",
    "count": 3,
    "topK": 5
  }
}
```

后端会先对查询条件生成 embedding，再只检索当前用户的文档 chunk，把筛选后的片段作为 `ragContext` 传给结构化题目生成 Prompt。

## 验证

```bash
npm run test
npm run db:validate
npm run build
```

数据库相关命令：

```bash
npm run db:validate
npm run db:generate
npm run db:seed
```

在当前环境中，Next.js 构建和 Playwright 截图可能需要允许启动子进程或浏览器。

## 项目规则

项目规则以 [AGENTS.md](AGENTS.md) 为准。
