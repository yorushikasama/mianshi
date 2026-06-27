# 面试雷达

第一阶段是单 Next.js 项目，项目入口就在仓库根目录。

## 常用命令

```powershell
npm install
npm run dev
npm run smoke
npm run build
```

Tailwind CSS v4 已通过 `postcss.config.mjs` 和 `src/app/globals.css` 接入。

## 阶段 1：账号与数据库

创建 `.env.local`：

```powershell
DATABASE_URL=postgres://postgres:你的密码@localhost:5432/mianshi
BETTER_AUTH_SECRET=replace-with-a-long-random-string-at-least-32-chars
BETTER_AUTH_URL=http://localhost:3000
```

初始化并检查认证表：

```powershell
npm run db:migrate
npm run db:auth-check
npm run auth:check
```

启动服务后做登录链路检查：

```powershell
npm run build
npm run start -- -p 3021
npm run auth:runtime-check
```

## 目录

```text
src/          Next.js App Router 页面和组件
migrations/   PostgreSQL 建表脚本
uploads/      本地上传文件占位目录
new-api/      可选参考网关，当前主项目不编译它
```
