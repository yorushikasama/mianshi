import { defineConfig } from "prisma/config";
import { config as loadEnv } from "dotenv";

loadEnv();

export default defineConfig({
  schema: "apps/api/prisma/schema.prisma",
  migrations: {
    path: "apps/api/prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/mianshi?schema=public",
  },
});
