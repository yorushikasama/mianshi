import { afterEach, describe, expect, it, vi } from "vitest";
import { AiJobWorker } from "./ai-job.worker";

describe("AiJobWorker", () => {
  const originalCostRate = process.env.AI_COST_USD_PER_1K_TOKENS;

  afterEach(() => {
    if (originalCostRate === undefined) {
      delete process.env.AI_COST_USD_PER_1K_TOKENS;
    } else {
      process.env.AI_COST_USD_PER_1K_TOKENS = originalCostRate;
    }
  });

  it("executes a dequeued job and records observable success metadata", async () => {
    const repository = {
      findJobById: vi.fn(async () => ({ status: "pending" })),
      markRunning: vi.fn(async () => undefined),
      markSucceeded: vi.fn(async () => undefined),
      markFailed: vi.fn(async () => undefined),
    };
    const executor = {
      execute: vi.fn(async () => ({
        output: {
          questions: [{ id: "q_ai_1" }],
        },
        model: "gpt-5.5",
        promptVersionId: "prompt_1",
        tokenUsage: 321,
      })),
    };
    const worker = new AiJobWorker(repository as never, executor as never);

    await worker.process({
      data: {
        jobId: "job_1",
        userId: "user_1",
        type: "generate_questions",
        input: {
          domainSlug: "java_backend",
          count: 1,
        },
      },
      attemptsMade: 0,
    } as never);

    expect(repository.markRunning).toHaveBeenCalledWith("job_1");
    expect(executor.execute).toHaveBeenCalledWith({
      jobId: "job_1",
      userId: "user_1",
      type: "generate_questions",
      input: {
        domainSlug: "java_backend",
        count: 1,
      },
    });
    expect(repository.markSucceeded).toHaveBeenCalledWith("job_1", {
      output: {
        questions: [{ id: "q_ai_1" }],
      },
      model: "gpt-5.5",
      promptVersionId: "prompt_1",
      tokenUsage: 321,
      latencyMs: expect.any(Number),
    });
    expect(repository.markFailed).not.toHaveBeenCalled();
  });

  it("adds a configured AI cost estimate to successful job output", async () => {
    process.env.AI_COST_USD_PER_1K_TOKENS = "0.01";

    const repository = {
      findJobById: vi.fn(async () => ({ status: "pending" })),
      markRunning: vi.fn(async () => undefined),
      markSucceeded: vi.fn(async () => undefined),
      markFailed: vi.fn(async () => undefined),
    };
    const executor = {
      execute: vi.fn(async () => ({
        output: {
          answerId: "answer_1",
        },
        model: "gpt-5.5",
        promptVersionId: "prompt_1",
        tokenUsage: 1500,
      })),
    };
    const worker = new AiJobWorker(repository as never, executor as never);

    await worker.process({
      data: {
        jobId: "job_1",
        userId: "user_1",
        type: "generate_answer",
        input: {
          questionId: "q_1",
        },
      },
      attemptsMade: 0,
    } as never);

    expect(repository.markSucceeded).toHaveBeenCalledWith("job_1", {
      output: {
        answerId: "answer_1",
        aiCostEstimate: {
          amountUsd: 0.015,
          rateUsdPer1kTokens: 0.01,
          tokenUsage: 1500,
        },
      },
      model: "gpt-5.5",
      promptVersionId: "prompt_1",
      tokenUsage: 1500,
      latencyMs: expect.any(Number),
    });
  });

  it("marks a job failed with retry count when processing throws", async () => {
    const repository = {
      findJobById: vi.fn(async () => ({ status: "pending" })),
      markRunning: vi.fn(async () => {
        throw new Error("database unavailable");
      }),
      markSucceeded: vi.fn(async () => undefined),
      markFailed: vi.fn(async () => undefined),
    };
    const executor = {
      execute: vi.fn(async () => ({
        output: {},
        model: "gpt-5.5",
        promptVersionId: "prompt_1",
        tokenUsage: 0,
      })),
    };
    const worker = new AiJobWorker(repository as never, executor as never);

    await expect(
      worker.process({
        data: {
          jobId: "job_1",
          userId: "user_1",
          type: "generate_answer",
          input: {
            questionId: "q_1",
          },
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

  it("skips canceled jobs before execution", async () => {
    const repository = {
      findJobById: vi.fn(async () => ({ status: "canceled" })),
      markRunning: vi.fn(async () => undefined),
      markSucceeded: vi.fn(async () => undefined),
      markFailed: vi.fn(async () => undefined),
    };
    const executor = {
      execute: vi.fn(async () => ({
        output: {},
        model: "gpt-5.5",
        promptVersionId: "prompt_1",
        tokenUsage: 0,
      })),
    };
    const worker = new AiJobWorker(repository as never, executor as never);

    await worker.process({
      data: {
        jobId: "job_1",
        userId: "user_1",
        type: "generate_answer",
        input: {
          questionId: "q_1",
        },
      },
      attemptsMade: 0,
    } as never);

    expect(repository.markRunning).not.toHaveBeenCalled();
    expect(executor.execute).not.toHaveBeenCalled();
    expect(repository.markSucceeded).not.toHaveBeenCalled();
    expect(repository.markFailed).not.toHaveBeenCalled();
  });
});
