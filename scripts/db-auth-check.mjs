import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import pg from "pg";

const root = fileURLToPath(new URL("..", import.meta.url));
const { loadEnvConfig } = nextEnv;
loadEnvConfig(root);
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required. Add it to .env.local first.");
  process.exit(1);
}

const client = new pg.Client({ connectionString, connectionTimeoutMillis: 5000 });

try {
  await client.connect();

  const { rows } = await client.query(
    `select table_name
     from information_schema.tables
     where table_schema = 'public'
       and table_type = 'BASE TABLE'`
  );
  const tables = new Set(rows.map((row) => row.table_name));

  for (const table of ["user", "session", "account", "verification"]) {
    assert(tables.has(table), `missing Better Auth table: ${table}`);
  }

  for (const table of ["users", "sessions", "verification_tokens"]) {
    assert(!tables.has(table), `legacy auth table should not exist: ${table}`);
  }

  console.log("db auth check passed");
} finally {
  await client.end().catch(() => {});
}
