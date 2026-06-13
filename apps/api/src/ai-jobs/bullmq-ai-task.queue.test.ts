import { describe, expect, it, vi } from "vitest";
import type { AiJob } from "@mianshi/shared";
import { BullMqAiTaskQueue, getRequiredRedisUrl } from "./bullmq-ai-task.queue";

const job: AiJob = {
  id: "job_1",
  userId: "user_1",
  type: "generate_questions",
  status: "pending",
  progress: 0,
  input: {
    domainSlug: "java_backend",
    count: 3,
  },
  output: null,
  error: null,
  retryCount: 0,
  queueJobId: null,
  model: null,
  promptVersionId: null,
  tokenUsage: 0,
  latencyMs: null,
  inputHash: "hash_1",
  startedAt: null,
  completedAt: null,
  createdAt: "2026-06-12T00:00:00.000Z",
  updatedAt: "2026-06-12T00:00:00.000Z",
};

describe("BullMqAiTaskQueue", () => {
  it("requires REDIS_URL before constructing queue connections", () => {
    expect(() => getRequiredRedisUrl({})).toThrow("REDIS_URL is required");
  });

  it("enqueues AI jobs with retry metadata and the database job id as BullMQ jobId", async () => {
    const queue = {
      add: vi.fn(async () => ({ id: "job_1" })),
    };
    const taskQueue = new BullMqAiTaskQueue(queue as never);

    const result = await taskQueue.enqueue(job);

    expect(queue.add).toHaveBeenCalledWith(
      "generate_questions",
      {
        jobId: "job_1",
        userId: "user_1",
        type: "generate_questions",
        input: {
          domainSlug: "java_backend",
          count: 3,
        },
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        jobId: "job_1",
        removeOnComplete: {
          age: 86400,
          count: 1000,
        },
        removeOnFail: {
          age: 604800,
        },
      },
    );
    expect(result.queueJobId).toBe("job_1");
  });
});
