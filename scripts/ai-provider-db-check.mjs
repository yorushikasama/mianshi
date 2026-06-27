import assert from "node:assert/strict";
import nextEnv from "@next/env";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = fileURLToPath(new URL("..", import.meta.url));
nextEnv.loadEnvConfig(root);

const connectionString = process.env.DATABASE_URL;
assert(connectionString, "DATABASE_URL is required");

const client = new pg.Client({ connectionString, connectionTimeoutMillis: 5000 });
const userId = `ai_provider_check_${Date.now()}`;

try {
  await client.connect();
  await client.query("begin");
  await client.query(
    `insert into "user" (id, name, email, "emailVerified")
     values ($1, 'AI Provider Check', $2, true)`,
    [userId, `${userId}@example.test`]
  );
  const inserted = await client.query(
    `insert into ai_provider_configs (user_id, name, provider_format, base_url, model, encrypted_api_key)
     values
       ($1, 'Provider A', 'openai-compatible', 'https://example.test/v1', 'model-a', 'encrypted-a'),
       ($1, 'Provider B', 'openai-compatible', 'https://example.test/v1', 'model-b', 'encrypted-b')
     returning active`,
    [userId]
  );
  assert.equal(inserted.rowCount, 2, "should insert multiple providers");
  assert(inserted.rows.every((row) => row.active === false), "saved providers should not auto-activate");

  await client.query("update ai_provider_configs set active = true where user_id = $1 and name = 'Provider A'", [userId]);
  await client.query("update ai_provider_configs set active = false where user_id = $1", [userId]);
  await client.query("update ai_provider_configs set active = true where user_id = $1 and name = 'Provider B'", [userId]);
  const active = await client.query("select name, model from ai_provider_configs where user_id = $1 and active", [userId]);
  assert.equal(active.rowCount, 1, "should have one active provider");
  assert.equal(active.rows[0].name, "Provider B", "active provider should switch explicitly");

  await client.query("rollback");
  console.log("ai provider db check passed");
} catch (error) {
  await client.query("rollback").catch(() => {});
  throw error;
} finally {
  await client.end().catch(() => {});
}
