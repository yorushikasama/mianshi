import { describe, expect, it, vi } from "vitest";
import { AiJobWorker } from "./ai-job.worker";

describe("AiJobWorker", () => {
  it("marks a dequeued job as failed when no executor is registered yet", async () => {
    const repository = {
      markRunning: vi.fn(async () => undefined),
      markSucceeded: vi.fn(async () => undefined),
      markFailed: vi.fn(async () => undefined),
    };
    const worker = new AiJobWorker(repository as never);

    await expect(
      worker.process({
        data: {
          jobId: "job_1",
          type: "generate_questions",
        },
        attemptsMade: 0,
      } as never),
    ).rejects.toThrow("AI executor is not implemented yet for generate_questions");

    expect(repository.markRunning).toHaveBeenCalledWith("job_1");
    expect(repository.markFailed).toHaveBeenCalledWith("job_1", {
      error: "AI executor is not implemented yet for generate_questions",
      retryCount: 0,
      latencyMs: expect.any(Number),
    });
    expect(repository.markSucceeded).not.toHaveBeenCalled();
  });

  it("marks a job failed with retry count when processing throws", async () => {
    const repository = {
      markRunning: vi.fn(async () => {
        throw new Error("database unavailable");
      }),
      markSucceeded: vi.fn(async () => undefined),
      markFailed: vi.fn(async () => undefined),
    };
    const worker = new AiJobWorker(repository as never);

    await expect(
      worker.process({
        data: {
          jobId: "job_1",
          type: "generate_answer",
        },
        attemptsMade: 2,
      } as never),
    ).rejects.toThrow("database unavailable");

    expect(repository.markFailed).toHaveBeenCalledWith("job_1", {
      error: "database unavailable",
      retryCount: 2,
      latencyMs: expect.any(Number),
    });
  });
});
