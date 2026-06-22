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

## 目录

```text
src/          Next.js App Router 页面和组件
migrations/   PostgreSQL 建表脚本
uploads/      本地上传文件占位目录
new-api/      可选参考网关，当前主项目不编译它
```
