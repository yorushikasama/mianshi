import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = fileURLToPath(new URL("..", import.meta.url));
const migration = readFileSync(join(root, "migrations", "001_initial.sql"), "utf8");
const incrementalMigration = readFileSync(join(root, "migrations", "002_ai_provider_configs.sql"), "utf8");
const providerLib = readFileSync(join(root, "src/lib/ai-provider-configs.ts"), "utf8");
const page = readFileSync(join(root, "src/app/(app)/settings/ai-provider/page.tsx"), "utf8");

for (const sql of [migration, incrementalMigration]) {
  assert(sql.includes("create table") && sql.includes("ai_provider_configs"), "missing ai_provider_configs table");
  assert(sql.includes("encrypted_api_key"), "missing encrypted api key column");
  assert(sql.includes("active boolean not null default false"), "missing active provider flag");
  assert(sql.includes("idx_ai_provider_configs_one_active"), "missing one-active-provider index");
  assert(sql.includes("where active"), "active provider index should allow multiple inactive configs");
}

for (const file of [
  "src/lib/ai-provider-configs.ts",
  "src/app/api/ai-provider-configs/route.ts",
  "src/app/api/ai-provider-configs/[configId]/activate/route.ts",
  "src/app/api/ai-provider-configs/[configId]/test/route.ts"
]) {
  assert(existsSync(join(root, file)), `missing file: ${file}`);
}

for (const text of [
  "/api/ai-provider-configs",
  "保存不会自动激活",
  "设为激活",
  "测试连接"
]) {
  assert(page.includes(text), `settings page is not wired: ${text}`);
}

for (const text of [
  "encryptApiKey(input.apiKey)",
  "values ($1, $2, $3, $4, $5, $6)",
  "update ai_provider_configs set active = false",
  "set active = true",
  "getActiveAiProviderRuntimeConfig",
  "apiKey: decryptApiKey"
]) {
  assert(providerLib.includes(text), `provider service missing behavior: ${text}`);
}

console.log("ai provider check passed");
