import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = fileURLToPath(new URL("..", import.meta.url));

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const files = walk(join(root, "src"))
  .filter((file) => /\.(tsx|ts|css)$/.test(file))
  .map((file) => [file, readFileSync(file, "utf8")]);
const corpus = files.map(([, text]) => text).join("\n");
const migration = readFileSync(join(root, "migrations", "001_initial.sql"), "utf8");

for (const text of [
  "登录",
  "注册",
  "找回密码",
  "Dashboard",
  "AI 生成",
  "题库",
  "练习",
  "资料",
  "设置",
  "LiteLLM",
  "训练搭档",
  "题目详情",
  "资料解析摘要",
  "练习结果",
  "个人资料设置",
  "邮箱验证码",
  "修改登录密码",
  "LiteLLM 接入配置",
  "AI 自动判定题型",
  "选择题",
  "正确答案",
  "按题练习",
  "单选答案",
  "答案解析",
  "生成中",
  "生成完成",
  "批量确认入库",
  "编辑候选题",
  "已入库",
  "最近入库",
  "上传队列",
  "解析中",
  "解析失败",
  "可生成题目方向",
  "来自资料",
  "全部题型",
  "批量操作",
  "单题编辑",
  "批量归档",
  "批量恢复",
  "批量删除",
  "没有符合条件的题目",
  "请先输入你的回答",
  "请先选择一个答案",
  "回答正确",
  "回答错误",
  "查看 AI 反馈",
  "下一题",
  "回题库",
  "标记掌握",
  "加入错题",
  "下次复习",
  "最近练习",
  "复习压力",
  "出题链路",
  "最近新增候选题",
  "生成完成",
  "头像预览",
  "保存成功",
  "保存失败",
  "邮箱验证码已确认",
  "密码不一致",
  "连接成功"
]) {
  assert(corpus.includes(text), `missing required text: ${text}`);
}

for (const tailwindText of [
  "@import \"tailwindcss\"",
  "@tailwindcss/postcss",
  "AnimatedLoadingSkeleton",
  "max-w-4xl rounded-xl bg-white p-6"
]) {
  assert(corpus.includes(tailwindText) || readFileSync(join(root, "package.json"), "utf8").includes(tailwindText), `missing Tailwind migration text: ${tailwindText}`);
}

for (const routeFile of [
  "src/app/(app)/questions/[questionId]/page.tsx",
  "src/app/(app)/materials/[materialId]/page.tsx",
  "src/app/(app)/practice/result/page.tsx",
  "src/app/(app)/practice/[questionId]/page.tsx",
  "src/app/(app)/practice/[questionId]/result/page.tsx",
  "src/app/(app)/settings/profile/page.tsx",
  "src/app/(app)/settings/email/page.tsx",
  "src/app/(app)/settings/password/page.tsx",
  "src/app/(app)/settings/ai-provider/page.tsx"
]) {
  assert(existsSync(join(root, routeFile)), `missing route file: ${routeFile}`);
}

for (const banned of ["支付", "充值", "套餐", "localhost:3000"]) {
  assert(!corpus.includes(banned), `banned text found: ${banned}`);
}

for (const table of [
  "users",
  "sessions",
  "interview_targets",
  "source_documents",
  "questions",
  "practice_attempts",
  "ai_reviews",
  "review_states"
]) {
  assert(migration.includes(`create table ${table}`), `missing table: ${table}`);
}

console.log("smoke check passed");
