# 阶段 1 调试 Runbook

状态：执行口径  
日期：2026-06-24

## 目标

阶段 1 只验证账号边界：数据库表、注册、登录、session、退出、未登录拦截。

## 正确流程

1. 写 `.env.local`，不要在 `Start-Process` 命令里拼 `$env:`。

```powershell
DATABASE_URL=postgres://postgres:123456@localhost:5432/mianshi
BETTER_AUTH_SECRET=stage1-local-secret-at-least-32-chars
BETTER_AUTH_URL=http://localhost:3021
UPLOAD_DIR=./uploads
```

2. 如果确认要清空本地旧库，先重置 public schema。

```powershell
$env:DATABASE_URL='postgres://postgres:123456@localhost:5432/mianshi'
@'
import pg from 'pg';
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query('drop schema public cascade');
await client.query('create schema public');
await client.end();
console.log('reset public schema');
'@ | node --input-type=module
```

3. 串行跑迁移和数据库检查，不要并行跑。

```powershell
npm run db:migrate
npm run db:auth-check
```

4. 先 build，再用生产 server 做 runtime 检查。

```powershell
npm run build
npm run start -- -p 3021
npm run auth:runtime-check
```

## 不要再走的坑

- 不要在成熟功能上先手写一套。认证、AI Provider、上传、UI 组件这类问题，先查官方文档和本地包导出，再决定是否自建。
- Better Auth 用户名登录不要自己写 `resolve-login`。官方 `username()` / `usernameClient()` 已提供 `/sign-in/username`，前端直接调用 `authClient.signIn.username({ username, password })`。
- 如果官方文档说有能力但运行异常，先读本地 `node_modules` 对应插件的 `index.d.mts` / `index.mjs` 确认 endpoint 和 client 方法名，再写最小 runtime check。
- 不要用 `Start-Process` 拼 `$env:DATABASE_URL=...; npm run dev`，Windows 参数层容易吃掉引号。
- 不要在同一端口反复启动长驻 server。先查端口；已可用就直接验证，已占用且不可用就换端口。命令被中断后先查 `netstat`，不要立刻再跑启动命令。
- 临时换端口验证后，不要把 `.env.local` 长期留在临时端口。`BETTER_AUTH_URL` 必须和当前浏览器访问 origin 一致，否则 Better Auth 会报 `Invalid origin` 并返回 403。
- 不要长时间等服务 ready。最多短轮询 10 秒，失败立刻读 `.next-start-*.log` 和 `.err.log`。
- 如果 `next start` 报 `.next` 没有生产 build，不要继续等端口。先检查 `.next/BUILD_ID`；缺失时重跑 build。仍缺失就用 `next dev` 验证业务 runtime，把生产启动问题单独记录。
- 如果 `next build` 在 `Collecting page data` 报某个已存在页面 `Cannot find module for page`，先删 `.next` 再重跑 build；这是构建缓存污染优先，不要先改页面代码。
- 不要在 `next dev` 正服务同一个项目时跑 `next build` 覆盖 `.next`。如果浏览器出现 `/_next/static/chunks/main-app.js`、`app-pages-internals.js`、`layout.css` 404，先停 dev server，必要时删 `.next`，再重新 `npm run dev`。
- 如果 `next dev` 报 `spawn EPERM`，这是当前沙箱/权限不允许 Next 派生子进程。不要改业务代码；用提权命令启动本地 server，或换到已经可用的端口继续验证。
- 不要在旧 Prisma 表还存在的库上直接混跑新 migration。先确认是否清库。
- 不要并行执行 `db:migrate` 和 `db:auth-check`，检查可能抢在迁移完成前跑。

## 验收命令

```powershell
npx tsc --noEmit
npm run auth:check
npm run db:auth-check
npm run smoke
npm run build
npm run auth:runtime-check
```
