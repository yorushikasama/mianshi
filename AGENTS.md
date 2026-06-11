# AGENTS.md

回答的时候要叫我主人。

## 项目身份

本项目是一个 AI 辅助面试复习 Web/PWA 平台。

第一版必须聚焦 Java 后端面试复习。架构、数据模型和页面设计必须保留扩展能力，后续可以演进为通用技术面试复习平台。

不要把本项目做成简单的 AI 聊天套壳。本项目必须是一个真实的学习系统，包含题库、AI 生成、练习记录、复习调度、RAG、数据分析和持久化数据。

## 产品范围

### 第一版范围

第一版面向 Java 后端面试复习。

主要 Java 分类：

- Java 语言基础
- JVM
- Java 集合
- Java 并发
- Spring 与 Spring Boot
- MyBatis / JPA 基础
- MySQL
- Redis
- 消息队列
- 分布式系统
- 系统设计
- 项目经历追问
- 工程师行为面试题

### 后续范围

后续需要支持其他面试方向，例如前端、全栈、Go、Python、算法、系统设计、AI 工程、产品/行为面试等。

因此必须遵守：

- 不要把 Java 写死在表名里。
- 不要把 Java 写死在核心领域模型里。
- Java 可以作为第一版默认领域、默认分类、默认 Prompt 上下文和种子数据。
- domain、category、tag、question_type、source_type 等概念必须保持通用。

## 平台要求

这是一个通过浏览器访问的 Web 项目。

项目必须支持 PWA。

PWA 最低要求：

- 提供有效的 Web App Manifest。
- 提供可安装应用的元信息。
- 提供应用图标。
- 提供 Service Worker。
- 缓存静态应用外壳资源。
- 提供离线兜底页面。
- 优雅处理弱网状态。
- 默认不要缓存敏感用户数据。
- 如果后续支持离线练习，必须谨慎存储本地数据，并提供明确的同步策略。

第一版可以先实现基础 PWA 可安装能力，再逐步增加高级离线能力。

## 推荐架构

除非有明确且已记录的理由，否则使用以下架构：

```text
Next.js 前端
  -> NestJS 后端 API
  -> PostgreSQL
  -> pgvector
  -> Redis + BullMQ
  -> OpenAI API
  -> Langfuse
```

### 前端

推荐技术栈：

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod
- GSAP
- Playwright

前端职责：

- PWA 应用外壳和路由
- 登录注册页面
- Dashboard
- Java 面试题库
- AI 生成流程
- 练习答题流程
- 复习计划
- 错题复习
- 文档上传
- 学习数据分析
- AI 任务进度展示
- 有节制的动效和页面过渡

### 后端

推荐技术栈：

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- pgvector
- Redis
- BullMQ
- OpenAI Node SDK
- Langfuse
- Swagger/OpenAPI

后端职责：

- 鉴权
- 题库 API
- 答案 API
- 练习记录 API
- 复习调度
- AI 任务编排
- RAG 索引和检索
- Prompt 版本管理
- AI 使用量和成本统计
- 结构化日志
- 统一错误处理

## 领域规则

核心实体必须保持通用：

- user
- domain
- category
- tag
- question
- answer
- practice_attempt
- review_state
- source_document
- document_chunk
- ai_job
- prompt_version

第一版 Java 内容应建模为：

```text
domain = "java_backend"
category = "JVM" | "Spring Boot" | "Concurrency" | ...
```

题目类型必须保持通用：

- concept
- scenario
- project_deep_dive
- system_design
- coding
- behavioral

答案类型必须保持通用：

- standard
- short
- interview_style
- deep

## AI 规则

AI 不能直接访问数据库。

后端负责：

- 选择上下文
- 检索 RAG 文档
- 构造 Prompt
- 调用 AI API
- 校验 AI 输出
- 保存 AI 结果

所有 AI 生成的结构化数据，在写入数据库前必须校验。

以下场景必须使用结构化输出：

- 题目生成
- 答案生成
- 练习评分
- 追问生成
- 缺失知识点提取
- RAG 个性化题目生成

每一条入库的 AI 输出都应记录：

- model
- prompt_version
- token_usage
- latency_ms
- input hash 或 job id
- created_at

不要用重新生成的 AI 内容直接覆盖用户编辑过的答案。应该创建新版本，或将生成结果标记为 draft。

## RAG 规则

RAG 是个性化面试复习的重要能力。

支持的来源文档：

- 简历
- 岗位 JD
- 项目笔记
- 学习笔记

RAG 流程：

```text
上传文档
-> 解析文本
-> 文档切块
-> 生成 embedding
-> 存储 chunk 和 embedding 到 pgvector
-> 生成题目或评分时检索相关 chunk
-> 将筛选后的上下文传给模型
```

规则：

- 保留原始来源引用。
- 保存 chunk metadata。
- 不要把完整长文档直接塞进 Prompt。
- 不要暴露其他用户的文档。
- 所有检索必须按 user_id 隔离。

## 异步任务规则

长耗时 AI 或文档任务必须使用 BullMQ worker。

以下任务必须走异步队列：

- generate_questions
- generate_answer
- score_attempt
- generate_followup
- embed_document
- embed_question
- rag_generate_questions

任务应尽量满足：

- 可幂等
- 可重试
- 可观测
- 必要时可取消

不要在请求处理函数中直接执行长耗时 AI 生成或文档索引。

## 复习算法规则

间隔复习使用 FSRS。

第一版不要自研复习调度算法。

每次练习后，根据以下信息更新复习状态：

- AI 评分
- 用户自评，如果有
- 上一次复习状态
- last_reviewed_at

应用必须支持：

- 今日待复习
- 逾期复习
- 薄弱分类
- 复习历史

## UI 与动效规则

UI 应现代、精致，但复习效率优先。

适合使用 GSAP 的地方：

- 首页 Hero 动效
- 页面过渡
- AI 生成进度
- 题目卡片切换
- 答案展开
- 评分结果展示
- 复习时间轴
- 知识图谱交互

不要在以下地方过度使用动画：

- 答案输入框
- 表单
- 长列表
- 校验错误提示
- 高频学习操作按钮

练习页面必须安静、可读、快速。

首页和知识图谱可以更有表现力。

## PWA 体验规则

PWA 应让应用像一个真正的复习工具，而不只是普通网页。

最低 PWA 行为：

- 可安装
- 有品牌图标
- 移动端布局稳定
- 离线兜底页
- 静态资源缓存

后续 PWA 行为：

- 离线复习队列
- 本地草稿答案
- 同步状态提示
- 支持时使用后台同步

未经明确产品决策，不要静默缓存敏感简历或面试内容。

## API 规则

优先使用 REST API。

通用规则：

- 每个请求体都必须校验。
- 错误响应格式必须统一。
- 列表接口必须支持分页。
- 请求需要 request id。
- 不要泄露堆栈信息。
- 生成 OpenAPI 文档。

错误格式示例：

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request payload",
  "details": [],
  "requestId": "req_xxx"
}
```

## 数据库规则

使用 PostgreSQL 和 Prisma migrations。

规则：

- Schema 变更必须通过 migration。
- 不要手动修改生产数据库结构。
- 常用筛选字段需要索引。
- embedding 使用 pgvector。
- Java 内容是数据，不是 schema。
- 所有用户归属数据表必须包含 user_id，或有清晰的归属路径。

## 安全规则

- 不要在前端暴露 AI API key。
- 不要提交 secrets。
- 配置必须来自环境变量。
- 启动时必须校验必要环境变量。
- refresh token 使用 httpOnly cookie。
- 密码必须安全哈希。
- 日志中不要记录密码、token、完整简历或敏感回答。
- 强制用户级数据隔离。
- 生产环境 CORS 必须使用明确白名单。

## 可观测性规则

项目必须具备足够的可观测性，方便在面试中讲清楚。

需要追踪：

- API request id
- 后端结构化日志
- AI model
- AI latency
- AI token usage
- AI cost estimate
- AI failure reason
- BullMQ job status
- prompt_version

使用 Langfuse 或同类工具记录 AI trace。

## 测试规则

后端测试：

- service 单元测试
- repository 集成测试
- API e2e 测试
- AI 输出 schema 测试
- BullMQ worker 测试

前端测试：

- 组件 smoke test
- 表单校验测试
- 练习流程测试
- PWA 可安装性检查
- Playwright E2E 测试

AI 测试：

- 生成题目 schema 校验
- 生成答案 schema 校验
- 评分结果 schema 校验
- RAG 检索相关性检查

没有运行相关验证前，不要声称功能完成。

## 开发阶段

### 阶段一：基础系统

- Next.js 应用
- NestJS API
- PostgreSQL + Prisma
- Auth
- Java domain 种子数据
- Question CRUD
- 基础 PWA manifest 和 service worker

### 阶段二：AI 生成

- OpenAI SDK
- Prompt 版本
- 结构化输出
- AI jobs
- BullMQ workers
- Java 面试题生成
- 答案生成

### 阶段三：练习闭环

- 练习页面
- 用户提交回答
- AI 评分
- 追问生成
- 错题列表
- FSRS 复习调度

### 阶段四：RAG

- 上传简历 / JD / 项目笔记
- 解析和切块文档
- embeddings
- pgvector 检索
- 个性化 Java 面试题生成

### 阶段五：分析与可观测性

- Dashboard
- 薄弱点分析
- AI 成本统计
- Langfuse traces
- 任务失败面板

### 阶段六：作品化

- GSAP 动效
- 知识图谱
- 移动端和 PWA 打磨
- README
- 演示数据
- 部署文档

## 文档规则

以下文件需要保持更新：

- AGENTS.md
- README.md
- docs/project-spec.md
- docs/api.md，如果 API 文档不能自动生成
- .env.example

当项目决策变化时，优先更新 AGENTS.md，因为它是后续编码代理遵守的规则来源。
