import { describe, expect, it } from "vitest";
import { canCancelAiJob } from "../lib/ai-job-ui";

describe("DocumentWorkbench", () => {
  it("only allows pending AI jobs to be canceled from the task list", () => {
    expect(canCancelAiJob({ status: "pending" })).toBe(true);
    expect(canCancelAiJob({ status: "running" })).toBe(false);
    expect(canCancelAiJob({ status: "succeeded" })).toBe(false);
    expect(canCancelAiJob({ status: "failed" })).toBe(false);
    expect(canCancelAiJob({ status: "canceled" })).toBe(false);
  });
});
