import { describe, expect, it } from "vitest";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("reports API liveness", () => {
    const controller = new HealthController({ $queryRawUnsafe: async () => [{ "?column?": 1 }] } as never);

    expect(controller.getHealth()).toEqual({
      status: "ok",
      service: "ai-interview-prep-api",
    });
  });

  it("reports readiness when the database responds", async () => {
    const prisma = {
      $queryRawUnsafe: async () => [{ "?column?": 1 }],
    };
    const controller = new HealthController(prisma as never);

    await expect(controller.getReady()).resolves.toEqual({
      status: "ok",
      checks: {
        database: "ok",
      },
    });
  });

  it("reports degraded readiness when the database check fails", async () => {
    const prisma = {
      $queryRawUnsafe: async () => {
        throw new Error("database unavailable");
      },
    };
    const controller = new HealthController(prisma as never);

    await expect(controller.getReady()).resolves.toEqual({
      status: "degraded",
      checks: {
        database: "error",
      },
    });
  });
});
