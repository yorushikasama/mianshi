import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

const targetModule = await import("../src/lib/interview-targets.ts");
const input = targetModule.parseInterviewTargetInput({
  role: "  Java 后端工程师 ",
  level: " 高级 ",
  stack: " Spring Boot、MySQL, Redis ",
  interviewDate: "2026-07-08"
});

assert.deepEqual(input, {
  role: "Java 后端工程师",
  level: "高级",
  stack: ["Spring Boot", "MySQL", "Redis"],
  interviewDate: "2026-07-08"
});
assert.equal(targetModule.getDefaultInterviewTarget().role, "前端工程师");
assert.throws(() => targetModule.parseInterviewTargetInput({ role: "", level: "", stack: "" }), /请填写/);

for (const routeFile of [
  "src/app/api/interview-target/route.ts",
  "src/app/(app)/dashboard/page.tsx",
  "src/app/(app)/generate/page.tsx",
  "src/app/(app)/generate/generate-workbench.tsx"
]) {
  assert(existsSync(join(root, routeFile)), `missing file: ${routeFile}`);
}

const corpus = [
  readFileSync(join(root, "src/app/(app)/dashboard/page.tsx"), "utf8"),
  readFileSync(join(root, "src/app/(app)/generate/page.tsx"), "utf8"),
  readFileSync(join(root, "src/app/(app)/generate/generate-workbench.tsx"), "utf8"),
  readFileSync(join(root, "migrations/003_interview_targets_current.sql"), "utf8")
].join("\n");

for (const text of [
  "getCurrentInterviewTarget",
  "updateInterviewTarget",
  "interviewTarget",
  "面试时间",
  "idx_interview_targets_one_current"
]) {
  assert(corpus.includes(text), `missing target integration text: ${text}`);
}

console.log("target check passed");
