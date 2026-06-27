# 面试雷达技术架构决策

状态：待审查  
日期：2026-06-20

## 1. 当前结论

推荐技术路线：

```text
Next.js App Router
  -> Server Components / Server Actions / Route Handlers
  -> Better Auth
  -> PostgreSQL
  -> 本地文件存储起步
  -> 后续接 LiteLLM Proxy
```

数据库就用 PostgreSQL。不要 Supabase 托管，不把核心能力绑到付费平台上。

## 2. 为什么选 PostgreSQL

选 PostgreSQL：

- 免费，可本地跑，也可后续自托管。
- 标准 SQL，简历、题库、练习、反馈这些关系型数据都合适。
- 后续需要 RAG 时可以加 `pgvector`。
- 不依赖托管平台的 Auth、Storage、RLS。
- 真要部署，便宜 VPS + Docker Compose 就够第一版。

代价：

- 登录、文件存储、权限校验要自己做一点。
- 备份和部署要自己管。

这点复杂度可以接受。别为了省几张表把项目绑到托管平台。

## 3. Next.js 工程范围

第一版直接用 Next.js，不再走 Vite 静态 mock。

第一阶段用单 Next.js 项目，目录放在仓库根目录：

```text
src/
  app/
    (auth)/
      login/
      register/
      forgot-password/
    (app)/
      dashboard/
      generate/
      questions/
      practice/
      materials/
      settings/
    api/
  components/
  lib/
migrations/
uploads/
```

先不拆 NestJS。后端业务先放 Next.js 内，等它真的变大再拆服务。

## 4. 数据访问选择

推荐先用 `postgres` 或 `pg` 这类轻量驱动，加 SQL migration。

暂时不用 Prisma：

- 这个阶段表不多。
- SQL 更直观。
- 少一个生成器和抽象层。

如果后面 CRUD 明显变多，再补 Drizzle 或 Prisma。现在不急。

## 5. 数据库最小模型

第一版先建这些表：

| 表 | 用途 |
| --- | --- |
| "user" | 用户账号 |
| "account" | 登录账号凭证 |
| "session" | 登录会话 |
| "verification" | 找回密码、邮箱验证 |
| interview_targets | 面试目标、方向、岗位、级别、时间 |
| source_documents | 简历、JD、项目笔记、复习资料的元数据 |
| generated_question_sets | 一次 AI 生成候选题的批次 |
| questions | 用户确认后的个人题库 |
| answer_versions | 参考答案、口语答案、深入答案 |
| practice_attempts | 用户每次练习回答 |
| ai_reviews | AI 对一次回答的反馈 |
| review_states | 掌握度、错题、下次复习时间 |

所有用户私有业务表都带 `user_id`。第一版用服务端查询强制按 `user_id` 过滤，不做跨用户共享。

## 6. 文件存储

第一版为了省钱：

- 开发环境文件存 `uploads/`。
- 数据库只存文件元数据和相对路径。
- 生产部署时可以换成本机挂载目录、S3 兼容存储或 MinIO。

不要把 PDF、简历、JD 二进制直接塞进 PostgreSQL。数据库存路径和状态就够。

## 7. Auth 和权限

第一版页面包含：

- 登录
- 注册
- 找回密码
- 退出登录

认证使用 Better Auth + PostgreSQL，不手写账号密码会话。它负责 email/password、session、找回密码和邮箱验证的基础链路。

权限规则：

- 服务端查询必须带当前 `user_id`。
- 用户只能访问自己的资料、题库、练习和反馈。
- 上传文件路径按用户隔离。
- 管理员能力不做。

## 8. AI 接入边界

推荐后端接 LiteLLM Proxy，把 OpenAI、Anthropic、Gemini、OpenAI-compatible 网关等供应商统一成一套服务端调用入口。产品侧不把用户心智绑定到 new-api，也不固定 `http://localhost:3000`。

第一版设置页只显示：

- AI Provider 配置入口
- 未配置状态
- 供应商格式、Base URL、API Key、默认模型这些字段的纯前端原型
- 简短说明：用户使用自己的 API Key，面试雷达不内置平台额度体系

后续接入时再补：

- 用户 AI 配置表
- API Key 服务端加密保存
- LiteLLM provider 映射
- 连接测试接口
- 调用失败、额度不足、模型不存在等错误提示

new-api 可以作为 OpenAI-compatible 网关的一种可选部署方式，不作为第一推荐架构，也不需要和面试雷达共享账号登录。

## 9. 还需要补的决策

开工前只补这些：

1. 数据隐私边界：简历、JD、项目笔记怎么存、怎么删、是否允许导出。
2. SQL schema：把上面的最小表落成 migration。
3. Auth 方案：Better Auth，不手写账号密码会话。
4. 文件存储边界：本地目录起步，生产再换 S3/MinIO。
5. AI 任务边界：第一版同步请求，队列以后再加。
6. 环境变量：`DATABASE_URL`、`BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`、上传目录、后续 `LITELLM_PROXY_URL` 和 `AI_CONFIG_ENCRYPTION_KEY`。

## 10. 验收标准

- Next.js 能跑起来。
- PostgreSQL 能通过 migration 建表。
- 登录/注册/找回密码页面存在。
- 工作台页面需要登录后进入。
- 业务表按 `user_id` 隔离。
- 资料文件不进数据库，只存路径。
- 设置页不固定 new-api 地址；只展示 BYOK 配置原型，不在前端真实保存 API Key。
- 页面不出现平台计费入口。

## 11. 待主人审查的问题

1. 是否确认 PostgreSQL 作为第一版数据库？
2. 是否确认 Next.js 内先承载前后端，不单独拆 NestJS？
3. 邮件验证码第一版是否继续只做开发环境 mock，生产前再接真实邮件服务？
