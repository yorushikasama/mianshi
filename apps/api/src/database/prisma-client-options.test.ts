import { describe, expect, it } from "vitest";
import { createPrismaClientOptions, getRequiredDatabaseUrl } from "./prisma-client-options";

describe("Prisma client options", () => {
  it("requires DATABASE_URL before constructing the Prisma adapter", () => {
    expect(() => getRequiredDatabaseUrl({})).toThrow("DATABASE_URL is required");
  });

  it("creates Prisma client options with a PostgreSQL adapter", () => {
    const options = createPrismaClientOptions({
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/mianshi?schema=public",
    });

    expect(options).toHaveProperty("adapter");
  });
});
