import { describe, expect, it } from "vitest";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("reports API liveness", () => {
    const controller = new HealthController();

    expect(controller.getHealth()).toEqual({
      status: "ok",
      service: "ai-interview-prep-api",
    });
  });
});
