import { describe, expect, it, vi } from "vitest";
import { PrismaAiJobRepository } from "./prisma-ai-job.repository";

const baseRow = {
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
  createdAt: new Date("2026-06-12T00:00:00.000Z"),
  updatedAt: new Date("2026-06-12T00:00:01.000Z"),
};

describe("PrismaAiJobRepository", () => {
  it("creates an AI job with input hash metadata and maps timestamps to API records", async () => {
    const prisma = {
      aiJob: {
        create: vi.fn(async () => baseRow),
      },
    };
    const repository = new PrismaAiJobRepository(prisma as never);

    const job = await repository.createJob({
      userId: "user_1",
      type: "generate_questions",
      input: {
        domainSlug: "java_backend",
        count: 3,
      },
      inputHash: "hash_1",
    });

    expect(prisma.aiJob.create).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        type: "generate_questions",
        input: {
          domainSlug: "java_backend",
          count: 3,
        },
        inputHash: "hash_1",
      },
    });
    expect(job.createdAt).toBe("2026-06-12T00:00:00.000Z");
    expect(job.updatedAt).toBe("2026-06-12T00:00:01.000Z");
  });

  it("lists jobs by user and status with deterministic pagination", async () => {
    const prisma = {
      aiJob: {
        findMany: vi.fn(async () => [baseRow]),
        count: vi.fn(async () => 1),
      },
      $transaction: vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
    };
    const repository = new PrismaAiJobRepository(prisma as never);

    const result = await repository.listJobs({
      userId: "user_1",
      status: "pending",
      page: 2,
      pageSize: 10,
    });

    expect(prisma.aiJob.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        status: "pending",
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: 10,
      take: 10,
    });
    expect(prisma.aiJob.count).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        status: "pending",
      },
    });
    expect(result.total).toBe(1);
    expect(result.items[0]?.id).toBe("job_1");
  });
});
