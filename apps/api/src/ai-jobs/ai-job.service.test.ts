import { afterEach, describe, expect, it } from "vitest";
import type { AiJob, AiJobStatus, AiJobType } from "@mianshi/shared";
import {
  AiJobService,
  type AiJobRepository,
  type AiTaskQueue,
} from "./ai-job.service";
import { AI_JOB_REPOSITORY, AI_TASK_QUEUE } from "./ai-job.tokens";

class FakeAiJobRepository implements AiJobRepository {
  readonly jobs: AiJob[] = [];

  async createJob(input: {
    userId: string;
    type: AiJobType;
    input: Record<string, unknown>;
    inputHash: string;
  }) {
    const now = "2026-06-12T00:00:00.000Z";
    const job: AiJob = {
      id: `job_${this.jobs.length + 1}`,
      userId: input.userId,
      type: input.type,
      status: "pending",
      progress: 0,
      input: input.input,
      output: null,
      error: null,
      retryCount: 0,
      queueJobId: null,
      model: null,
      promptVersionId: null,
      tokenUsage: 0,
      latencyMs: null,
      inputHash: input.inputHash,
      startedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.push(job);
    return job;
  }

  async updateJob(jobId: string, input: Partial<Pick<AiJob, "status" | "queueJobId" | "error">>) {
    const job = this.jobs.find((item) => item.id === jobId);
    if (!job) {
      return null;
    }
    Object.assign(job, input, { updatedAt: "2026-06-12T00:00:01.000Z" });
    return job;
  }

  async findJobById(jobId: string) {
    return this.jobs.find((job) => job.id === jobId) ?? null;
  }

  async listJobs(input: { userId: string; status?: AiJobStatus; page: number; pageSize: number }) {
    const visible = this.jobs.filter((job) => job.userId === input.userId && (!input.status || job.status === input.status));
    const start = (input.page - 1) * input.pageSize;
    return {
      items: visible.slice(start, start + input.pageSize),
      total: visible.length,
    };
  }

  async countJobsCreatedSince(input: { userId: string; since: Date }) {
    void input.since;
    return this.jobs.filter((job) => job.userId === input.userId).length;
  }
}

class FakeAiTaskQueue implements AiTaskQueue {
  readonly enqueuedJobIds: string[] = [];

  constructor(private readonly mode: "success" | "failure" = "success") {}

  async enqueue(job: AiJob) {
    if (this.mode === "failure") {
      throw new Error("Redis unavailable");
    }

    this.enqueuedJobIds.push(job.id);
    return {
      queueJobId: `queue_${job.id}`,
    };
  }
}

function createService(queueMode: "success" | "failure" = "success") {
  const repository = new FakeAiJobRepository();
  const queue = new FakeAiTaskQueue(queueMode);
  const service = new AiJobService(repository, queue);
  return { repository, queue, service };
}

describe("AiJobService", () => {
  const originalDailyLimit = process.env.AI_DAILY_JOB_LIMIT;

  afterEach(() => {
    if (originalDailyLimit === undefined) {
      delete process.env.AI_DAILY_JOB_LIMIT;
    } else {
      process.env.AI_DAILY_JOB_LIMIT = originalDailyLimit;
    }
  });

  it("creates a pending job and enqueues it for async processing", async () => {
    const { queue, service } = createService();

    const job = await service.createJob("user_1", {
      type: "generate_questions",
      input: {
        domainSlug: "java_backend",
        count: 3,
      },
    });

    expect(job.status).toBe("pending");
    expect(job.queueJobId).toBe("queue_job_1");
    expect(job.inputHash).toHaveLength(64);
    expect(queue.enqueuedJobIds).toEqual(["job_1"]);
  });

  it("marks a job failed when the queue adapter cannot enqueue it", async () => {
    const { service } = createService("failure");

    const job = await service.createJob("user_1", {
      type: "generate_answer",
      input: {
        questionId: "q_jvm_gc_roots",
      },
    });

    expect(job.status).toBe("failed");
    expect(job.error).toBe("Redis unavailable");
  });

  it("rejects new jobs after the user reaches the configured daily limit", async () => {
    process.env.AI_DAILY_JOB_LIMIT = "1";
    const { queue, repository, service } = createService();

    await service.createJob("user_1", { type: "generate_questions", input: { count: 2 } });

    await expect(() =>
      service.createJob("user_1", { type: "generate_answer", input: { questionId: "q_1" } }),
    ).rejects.toThrow("Daily AI job limit reached");

    expect(repository.jobs).toHaveLength(1);
    expect(queue.enqueuedJobIds).toEqual(["job_1"]);
  });

  it("lists only the current user's jobs with pagination metadata", async () => {
    const { service } = createService();

    await service.createJob("user_1", { type: "generate_questions", input: { count: 2 } });
    await service.createJob("user_2", { type: "generate_questions", input: { count: 2 } });

    const result = await service.listJobs("user_1", { page: 1, pageSize: 10 });

    expect(result.total).toBe(1);
    expect(result.items[0].userId).toBe("user_1");
  });

  it("does not return another user's job by id", async () => {
    const { service } = createService();
    const job = await service.createJob("user_1", { type: "score_attempt", input: { attemptId: "attempt_1" } });

    await expect(() => service.getJob("user_2", job.id)).rejects.toThrow("AI job not found");
  });

  it("cancels only the current user's pending job", async () => {
    const { repository, service } = createService();
    const job = await service.createJob("user_1", { type: "generate_answer", input: { questionId: "q_1" } });

    const canceled = await service.cancelJob("user_1", job.id);

    expect(canceled.status).toBe("canceled");
    await expect(() => service.cancelJob("user_2", job.id)).rejects.toThrow("AI job not found");

    repository.jobs[0].status = "running";
    await expect(() => service.cancelJob("user_1", job.id)).rejects.toThrow("AI job cannot be canceled");
  });
});

void AI_JOB_REPOSITORY;
void AI_TASK_QUEUE;
