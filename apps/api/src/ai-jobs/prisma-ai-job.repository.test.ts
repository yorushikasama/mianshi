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

  it("counts jobs created by a user since a timestamp", async () => {
    const prisma = {
      aiJob: {
        count: vi.fn(async () => 3),
      },
    };
    const repository = new PrismaAiJobRepository(prisma as never);
    const since = new Date("2026-06-18T00:00:00.000Z");

    const count = await repository.countJobsCreatedSince({
      userId: "user_1",
      since,
    });

    expect(prisma.aiJob.count).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        createdAt: {
          gte: since,
        },
      },
    });
    expect(count).toBe(3);
  });

  it("marks jobs succeeded with structured output and AI trace metadata", async () => {
    const prisma = {
      aiJob: {
        update: vi.fn(async () => undefined),
      },
    };
    const repository = new PrismaAiJobRepository(prisma as never);

    await repository.markSucceeded("job_1", {
      output: {
        questions: [{ id: "q_ai_1" }],
      },
      model: "gpt-5.5",
      promptVersionId: "prompt_1",
      tokenUsage: 321,
      latencyMs: 456,
    });

    expect(prisma.aiJob.update).toHaveBeenCalledWith({
      where: { id: "job_1" },
      data: {
        status: "succeeded",
        progress: 100,
        output: {
          questions: [{ id: "q_ai_1" }],
        },
        error: null,
        model: "gpt-5.5",
        promptVersionId: "prompt_1",
        tokenUsage: 321,
        latencyMs: 456,
        completedAt: expect.any(Date),
      },
    });
  });

  it("marks embedding jobs succeeded without requiring prompt version metadata", async () => {
    const prisma = {
      aiJob: {
        update: vi.fn(async () => undefined),
      },
    };
    const repository = new PrismaAiJobRepository(prisma as never);

    await repository.markSucceeded(
      "job_embed_1",
      {
        output: {
          documentId: "doc_1",
          chunkCount: 4,
        },
        model: "text-embedding-3-small",
        tokenUsage: 88,
        latencyMs: 123,
      } as never,
    );

    expect(prisma.aiJob.update).toHaveBeenCalledWith({
      where: { id: "job_embed_1" },
      data: {
        status: "succeeded",
        progress: 100,
        output: {
          documentId: "doc_1",
          chunkCount: 4,
        },
        error: null,
        model: "text-embedding-3-small",
        promptVersionId: null,
        tokenUsage: 88,
        latencyMs: 123,
        completedAt: expect.any(Date),
      },
    });
  });
});
