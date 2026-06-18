# AI 面试复习平台项目规范

## 1. 项目定位

本项目是一个可以写进简历、展示工程能力的 AI 面试复习 Web/PWA 平台。第一版聚焦 Java 后端面试复习，后续扩展为通用技术面试复习平台。它不是简单的 AI 聊天页面，而是围绕面试复习构建完整闭环：

- AI 生成面试题
- AI 生成多版本答案
- 主动练习答题
- AI 评分、反馈和追问
- 错题本与复习计划
- FSRS 间隔复习
- 基于简历、岗位 JD、项目文档的 RAG 个性化题库
- AI 任务、成本、Prompt 和效果观测

项目重点展示前后端工程、数据库建模、异步任务、AI 工程、向量检索、学习算法、系统设计和部署能力。

## 2. 目标用户

### 2.1 第一目标用户

正在准备技术面试的开发者，尤其是 Java 后端、全栈、前端、算法、系统设计方向的候选人。

### 2.2 使用场景

- 按技术方向批量生成面试题
- 根据简历和项目经历生成个性化追问题
- 查看标准答案、简洁答案、面试口语答案
- 隐藏答案后进行主动回忆练习
- 提交自己的回答，由 AI 评分并指出遗漏点
- 自动生成追问，模拟真实面试
- 根据掌握程度安排下次复习
- 统计薄弱知识点和复习进度

## 3. 产品原则

- 先复习效率，后视觉炫技。
- AI 只做生成、评分和辅助分析，权威数据必须落库。
- 所有 AI 输出必须经过结构化校验后才能入库。
- 所有长耗时 AI 操作必须走异步任务。
- 题目、答案、Prompt、模型版本、生成时间都要可追踪。
- 刷题练习页面要克制、快速、低干扰。
- 首页、知识图谱、AI 生成过程可以使用更强的视觉和动效。

## 4. 系统架构

推荐架构：

```text
Next.js 前端
  -> NestJS 后端 API
  -> PostgreSQL
  -> pgvector
  -> Redis + BullMQ
  -> OpenAI API
  -> Langfuse
```

### 4.1 前端

技术栈：

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod
- GSAP
- Vercel AI SDK，可选

职责：

- 登录、注册、用户状态
- 题库管理页面
- AI 生成题目页面
- 练习答题页面
- 错题本页面
- 复习计划页面
- 学习统计页面
- 文档上传页面
- AI 任务进度展示
- 流式输出展示
- 适度动效和页面过渡

### 4.2 后端

技术栈：

- NestJS
- Prisma
- PostgreSQL
- pgvector
- Redis
- BullMQ
- OpenAI Node SDK
- Zod 或 class-validator
- Swagger/OpenAPI
- JWT + refresh token
- Langfuse

职责：

- 鉴权与用户管理
- 题库、答案、标签、分类管理
- AI 任务创建、执行、重试和状态查询
- RAG 文档切块、embedding、向量检索
- 练习记录和评分记录管理
- FSRS 复习调度
- Prompt 版本管理
- AI 成本、耗时、失败日志统计
- API 输入校验和错误处理

### 4.3 数据库

主数据库使用 PostgreSQL。向量检索优先使用 pgvector，避免早期引入独立向量数据库增加复杂度。

### 4.4 异步任务

Redis + BullMQ 负责以下任务：

- 批量生成题目
- 批量生成答案
- 生成 embedding
- 文档切块和索引
- AI 评分
- RAG 评估任务
- 失败重试和死信记录

## 5. 核心模块

### 5.1 Auth 模块

功能：

- 用户注册
- 用户登录
- JWT access token
- refresh token
- 退出登录
- 当前用户信息

要求：

- refresh token 使用 httpOnly cookie
- 密码使用安全哈希算法
- 后端接口默认需要鉴权
- 管理端能力预留角色字段

### 5.2 Question 模块

功能：

- 创建题目
- 编辑题目
- 删除题目
- 查询题目列表
- 按分类、标签、难度、掌握度筛选
- AI 生成题目
- 题目去重

题目类型：

- 八股概念题
- 场景题
- 项目追问题
- 系统设计题
- 算法题
- 行为面试题

### 5.3 Answer 模块

功能：

- 为题目生成答案
- 查询当前用户可见题目的最新答案
- 保存多个答案版本
- 支持标准答案、简洁答案、面试口语答案、深入答案
- 记录生成模型和 Prompt 版本
- 支持重新生成

要求：

- 答案必须关联题目
- AI 生成答案不能直接覆盖人工修改答案
- 答案状态至少包含 draft、reviewed、approved

### 5.4 Practice 模块

功能：

- 随机练习
- 按分类练习
- 按错题练习
- 按复习计划练习
- 用户提交回答
- AI 评分
- AI 反馈
- AI 追问

评分维度：

- 准确性
- 完整性
- 表达清晰度
- 面试可用性
- 遗漏风险点

### 5.5 Review 模块

功能：

- 记录掌握程度
- 计算下次复习时间
- 展示今日待复习
- 展示逾期复习
- 展示长期趋势

实现：

- 使用 ts-fsrs 实现 FSRS 间隔复习算法
- 每次练习后，根据评分和用户自评更新复习状态

### 5.6 RAG 模块

功能：

- 上传简历
- 上传岗位 JD
- 上传项目文档
- 上传学习笔记
- 文档切块
- 生成 embedding
- 存入 pgvector
- 根据问题语义检索相关片段
- 让 AI 基于检索内容生成个性化题目和答案

当前实现：

- `embed_document` AI job 会读取当前用户的来源文档，切块后生成 embedding，并替换该文档的 chunk。
- `rag_generate_questions` AI job 会根据 domain、category、difficulty、focus 生成查询 embedding。
- 后端只从当前用户的 `document_chunks` 中检索相关片段，可按 `documentType` 过滤。
- 检索结果作为 `ragContext` 传给结构化题目生成 Prompt，AI 不直接访问数据库。
- 生成题目按当前用户入库，并在 job output 中返回引用来源 chunk。

原则：

- AI 不直接访问数据库
- 后端负责检索和拼接上下文
- Prompt 中只放必要片段
- 检索结果需要记录来源

### 5.7 AI Job 模块

功能：

- 创建 AI 任务
- 查询任务状态
- 任务进度更新
- 任务失败重试
- 任务取消
- 任务结果入库

任务类型：

- generate_questions
- generate_answer
- score_attempt
- generate_followup
- embed_document
- embed_question
- rag_generate_questions

状态：

- pending
- running
- succeeded
- failed
- canceled

### 5.8 Analytics 模块

功能：

- 题目总数
- 已练习题目数
- 错题数量
- 今日待复习数量
- 分类掌握度
- 高频薄弱点
- AI 生成成本
- AI 请求耗时

## 6. AI 工作流

### 6.1 题目生成

```text
用户输入目标方向、岗位、技术栈或简历片段
-> 后端创建 AI Job
-> BullMQ worker 执行
-> 调用 OpenAI Structured Outputs
-> 返回结构化题目 JSON
-> Zod 校验
-> 题目去重
-> 写入 questions
-> 生成 embedding
-> 写入 question_embeddings
```

### 6.2 答案生成

```text
用户选择题目
-> 后端读取题目、标签、难度
-> 调用 AI 生成多版本答案
-> 结构化校验
-> 写入 answers
-> 记录 model、prompt_version、token_usage
```

### 6.3 练习评分

```text
用户提交回答
-> 后端读取标准答案和必要上下文
-> AI 输出评分、反馈、遗漏点、追问
-> 结构化校验
-> 写入 practice_attempts
-> 更新 FSRS 复习状态
```

### 6.4 RAG 个性化题库

```text
用户上传简历 / JD / 项目文档
-> 文档解析
-> 文档切块
-> 生成 embedding
-> 存入 pgvector
-> 创建 rag_generate_questions AI job
-> 后端生成查询 embedding
-> 按 user_id 检索相关 chunk
-> AI 基于筛选片段生成个性化面试题
-> Zod 校验后写入 questions
```

## 7. 数据模型草案

### 7.1 users

- id
- email
- password_hash
- display_name
- role
- created_at
- updated_at

### 7.2 questions

- id
- user_id
- title
- content
- category
- difficulty
- question_type
- source_type
- ai_generated
- prompt_version
- model
- created_at
- updated_at

### 7.3 answers

- id
- question_id
- answer_type
- content
- status
- model
- prompt_version
- token_usage
- created_at
- updated_at

### 7.4 tags

- id
- name
- color

### 7.5 question_tags

- question_id
- tag_id

### 7.6 practice_attempts

- id
- user_id
- question_id
- user_answer
- ai_score
- ai_feedback
- missing_points
- followup_questions
- created_at

### 7.7 review_states

- id
- user_id
- question_id
- stability
- difficulty
- due_at
- last_reviewed_at
- review_count
- created_at
- updated_at

### 7.8 source_documents

- id
- user_id
- document_type
- title
- content
- file_url
- created_at

### 7.9 document_chunks

- id
- document_id
- chunk_index
- content
- metadata
- embedding
- created_at

### 7.10 ai_jobs

- id
- user_id
- type
- status
- progress
- input
- output
- error
- retry_count
- created_at
- updated_at

### 7.11 prompt_versions

- id
- name
- version
- template
- output_schema
- created_at

## 8. API 规范

### 8.1 基础原则

- REST API 优先
- 所有输入必须校验
- 所有错误返回统一格式
- 所有列表接口支持分页
- 所有需要用户身份的接口必须鉴权
- API 文档使用 Swagger/OpenAPI 生成

### 8.2 示例接口

```text
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
GET    /me

GET    /questions
POST   /questions
GET    /questions/:id
GET    /questions/:id/answer
PATCH  /questions/:id
DELETE /questions/:id

POST   /questions/generate
POST   /questions/:id/answers/generate

POST   /practice/attempts
GET    /practice/attempts
GET    /review/today

POST   /documents
GET    /documents

POST   /ai/jobs
GET    /ai/jobs
GET    /ai/jobs/:id
POST   /ai/jobs/:id/cancel
```

RAG 个性化题目生成使用 `POST /ai/jobs`：

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

### 8.3 错误格式

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request payload",
  "details": [],
  "requestId": "req_xxx"
}
```

## 9. UI 与动效规范

### 9.1 整体风格

项目可以借鉴沉浸式创意网站的氛围，但主产品必须保持清晰、可用、高效率。

推荐风格：

- 深色主题为主
- 高对比文字
- 克制的发光边界
- 数据仪表盘式布局
- 知识图谱和首页可更具视觉冲击
- 刷题页面保持安静、专注

### 9.2 GSAP 使用边界

适合使用 GSAP 的地方：

- 首页首屏入场动画
- AI 生成步骤进度
- 题目卡片切换
- 答案展开
- 评分结果进入
- 复习时间轴
- 知识图谱节点动效
- 页面过渡

不适合过度动效的地方：

- 表单输入
- 长列表滚动
- 正在答题的文本区域
- 高频操作按钮
- 错误提示

### 9.3 页面结构

核心页面：

- 登录页
- Dashboard
- 题库页
- 题目详情页
- AI 生成页
- 练习页
- 错题本
- 今日复习
- 文档上传
- 学习统计
- 设置页

## 10. 非功能需求

### 10.1 性能

- 首页首屏加载要快
- 题库列表需要分页
- AI 任务不能阻塞请求线程
- embedding 批处理需要限流
- 大文档上传和解析必须异步

### 10.2 安全

- 不在前端暴露 AI API key
- 不在日志中记录密码、token、完整简历等敏感信息
- PWA Service Worker 只缓存静态应用壳和公开静态资源，不缓存 API、授权请求、简历、JD、练习回答或 AI 生成的用户数据
- 上传文件大小需要限制
- 所有用户数据按 user_id 隔离
- 生产环境 CORS 必须配置白名单

### 10.3 成本控制

- AI 生成结果必须缓存入库
- 支持记录 token_usage
- 支持 Prompt 版本管理
- 支持失败重试上限
- 支持限制单用户每日 AI 任务数量

### 10.4 可观测性

- 每个请求带 request_id
- 后端结构化日志
- AI 调用记录模型、耗时、token、错误
- Langfuse 记录 Prompt trace
- BullMQ 任务失败需要可查看

## 11. 测试规范

### 11.1 后端测试

- service 单元测试
- repository 集成测试
- API e2e 测试
- AI 输出 schema 校验测试
- BullMQ worker 测试

### 11.2 前端测试

- 核心组件测试
- 表单校验测试
- 页面 smoke test
- Playwright e2e 测试

### 11.3 AI 测试

- 固定输入生成题目结构测试
- 答案 JSON schema 测试
- 评分输出稳定性测试
- RAG 检索结果相关性测试

## 12. 开发阶段

### 阶段一：基础 Web 系统

- 前端项目初始化
- 后端项目初始化
- PostgreSQL + Prisma
- 登录注册
- 题库 CRUD
- 分类和标签

### 阶段二：AI 生成

- OpenAI SDK 接入
- Structured Outputs
- AI Job 模块
- BullMQ worker
- 题目生成
- 答案生成

### 阶段三：练习闭环

- 练习页面
- 用户提交回答
- AI 评分
- AI 追问
- 错题本
- FSRS 复习计划

### 阶段四：RAG 个性化

- 文档上传
- 文档切块
- embedding
- pgvector 检索
- 基于简历和 JD 生成个性化题目

### 阶段五：工程强化

- Langfuse 接入
- AI 成本统计
- Prompt 版本管理
- 测试补全
- Docker Compose
- 部署文档

### 阶段六：视觉与作品化

- GSAP 动效
- Dashboard 数据可视化
- 知识图谱
- 项目演示数据
- 简历描述和 README

## 13. 简历亮点描述

可用于简历的描述：

> 设计并实现 AI 面试复习平台，支持基于岗位 JD、简历和项目文档的面试题生成、答案生成、AI 评分、追问和间隔复习。后端采用 NestJS + PostgreSQL + pgvector + Redis/BullMQ，实现异步 AI 任务调度、结构化输出校验、向量检索、失败重试和 Prompt 版本管理；前端采用 Next.js + TanStack Query 构建题库、练习、复习计划和学习分析页面，并使用 GSAP 提升关键页面动效体验。

## 14. 未决问题

- 第一版是否优先面向 Java 后端面试，还是做成通用技术面试平台？
- 是否需要支持公开题库共享？
- 是否需要管理员审核 AI 生成内容？
- 是否需要语音模拟面试？
