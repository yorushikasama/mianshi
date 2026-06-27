# 阶段 1 账号与用户边界方案

状态：已完成  
日期：2026-06-23

目标：让系统知道当前用户是谁，并为后续所有业务数据提供 `user_id` 边界。

## 技术选择

- 认证框架：Better Auth。
- 数据库：PostgreSQL。
- 数据库连接：`pg` Pool。
- 路由：Next.js App Router route handler。
- 账号方式：用户名或邮箱 + password。
- 邮件发送：第一版开发环境 mock，不接真实邮件服务。

理由：

- Better Auth 原生支持 email/password、session、password reset、email verification。
- Better Auth username 插件原生支持 `signIn.username`，不需要自建用户名转邮箱接口。
- 后续接 PostgreSQL、验证码、改密码，不需要维护手写会话。
- 不引入 Supabase，不做平台绑定。

## 本阶段范围

- 登录。
- 注册。
- 退出。
- 找回密码请求。
- 邮箱验证码请求。
- 修改密码入口接真实 auth client。
- 工作台页面需要会话。
- 服务端获取当前 session。

## 数据库调整

Better Auth 默认核心表是：

- `user`
- `session`
- `account`
- `verification`

旧的 `users`、`sessions`、`verification_tokens` 不再保留。业务表统一用 `user_id text references "user"(id)` 绑定 Better Auth 用户，避免后续出现两套账号来源。

用户名登录使用 Better Auth username 插件。`"user"` 表保留 `username` 和 `"displayUsername"` 字段，注册时通过 `signUp.email({ email, username, password })` 写入，登录时按输入内容区分：

- 包含 `@`：`authClient.signIn.email({ email, password })`
- 不包含 `@`：`authClient.signIn.username({ username, password })`

不要再新增 `/api/auth/resolve-login` 这类自定义解析接口，官方插件已经覆盖该链路。

## 路由与文件

新增：

- `src/lib/auth.ts`
- `src/lib/auth-client.ts`
- `src/lib/server-session.ts`
- `src/app/api/auth/[...all]/route.ts`
- `scripts/auth-check.mjs`

调整：

- `src/app/(app)/layout.tsx`：服务端校验 session，没有会话跳 `/login`。
- `src/components/auth/animated-login-card.tsx`：登录、注册、找回密码调用 Better Auth client。
- `src/components/workbench/workbench-shell.tsx`：增加退出登录。
- `.env.example`：补 `BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`。
- `migrations/001_initial.sql`：使用 Better Auth 核心表，并让业务表外键指向 `"user"(id)`。

## 验收

- 登录页调用 `authClient.signIn.email` 和 `authClient.signIn.username`。
- 注册页调用 `authClient.signUp.email`。
- 找回密码调用 `authClient.requestPasswordReset`。
- 工作台 layout 调用服务端 session 校验。
- 未登录访问工作台会跳 `/login`。
- `auth-runtime-check` 覆盖注册、登录、session、退出后工作台拦截和用户名登录。
- 构建通过。
- smoke 和 auth-check 通过。

## 暂不做

- 真实邮件服务。
- 管理后台。
- 多设备会话管理页。
- OAuth 第三方登录。
