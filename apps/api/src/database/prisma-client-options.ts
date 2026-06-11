import { Prisma, type PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type RuntimeEnv = {
  DATABASE_URL?: string;
};

export function getRequiredDatabaseUrl(env: RuntimeEnv = process.env) {
  const databaseUrl = env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to start the API database connection.");
  }

  return databaseUrl;
}

export function createPrismaClientOptions(env: RuntimeEnv = process.env): ConstructorParameters<typeof PrismaClient>[0] {
  const connectionString = getRequiredDatabaseUrl(env);

  return {
    adapter: new PrismaPg({ connectionString }),
  } satisfies Prisma.PrismaClientOptions;
}
