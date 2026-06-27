import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
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

const client = new pg.Client({ connectionString });
const initialTables = [
  "user",
  "session",
  "account",
  "verification",
  "interview_targets",
  "source_documents",
  "generated_question_sets",
  "questions",
  "answer_versions",
  "practice_attempts",
  "ai_reviews",
  "review_states"
];

try {
  await client.connect();
  await client.query(
    `create table if not exists schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    )`
  );

  for (const file of readdirSync(join(root, "migrations")).filter((name) => name.endsWith(".sql")).sort()) {
    const applied = await client.query("select 1 from schema_migrations where filename = $1", [file]);
    if (applied.rowCount) {
      console.log(`skipped ${file}`);
      continue;
    }

    if (file === "001_initial.sql") {
      const { rows } = await client.query(
        `select count(*)::int as count
         from information_schema.tables
         where table_schema = 'public'
           and table_name = any($1::text[])`,
        [initialTables]
      );
      if (rows[0]?.count === initialTables.length) {
        await client.query("insert into schema_migrations(filename) values($1)", [file]);
        console.log(`adopted ${file}`);
        continue;
      }
    }

    await client.query("begin");
    await client.query(readFileSync(join(root, "migrations", file), "utf8"));
    await client.query("insert into schema_migrations(filename) values($1)", [file]);
    await client.query("commit");
    console.log(`applied ${file}`);
  }
} catch (error) {
  await client.query("rollback").catch(() => {});
  throw error;
} finally {
  await client.end().catch(() => {});
}
