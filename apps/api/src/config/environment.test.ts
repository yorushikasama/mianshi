import { describe, expect, it } from "vitest";
import { validateApiEnvironment } from "./environment";

describe("validateApiEnvironment", () => {
  it("requires API secrets and service URLs before startup", () => {
    expect(() => validateApiEnvironment({})).toThrow("DATABASE_URL is required");
  });

  it("requires an explicit CORS origin in production", () => {
    expect(() =>
      validateApiEnvironment({
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/mianshi?schema=public",
        JWT_ACCESS_SECRET: "access-secret",
        JWT_REFRESH_SECRET: "refresh-secret",
        REDIS_URL: "redis://localhost:6379",
        OPENAI_API_KEY: "test-key",
        NODE_ENV: "production",
      }),
    ).toThrow("WEB_ORIGIN is required");
  });

  it("returns normalized startup config", () => {
    expect(
      validateApiEnvironment({
        DATABASE_URL: " postgresql://postgres:postgres@localhost:5432/mianshi?schema=public ",
        JWT_ACCESS_SECRET: " access-secret ",
        JWT_REFRESH_SECRET: " refresh-secret ",
        REDIS_URL: " redis://localhost:6379 ",
        OPENAI_API_KEY: " test-key ",
        WEB_ORIGIN: " http://localhost:3000 ",
        PORT: "3005",
      }),
    ).toEqual({
      webOrigin: "http://localhost:3000",
      port: 3005,
    });
  });
});
