import { describe, expect, it } from "vitest";
import { AiJobSchema, CreateAiJobInputSchema } from "./ai-jobs";

describe("AI job schemas", () => {
  it("validates a structured AI job creation request", () => {
    const input = CreateAiJobInputSchema.parse({
      type: "generate_questions",
      input: {
        domainSlug: "java_backend",
        categorySlug: "jvm",
        count: 5,
      },
    });

    expect(input.type).toBe("generate_questions");
    expect(input.input.domainSlug).toBe("java_backend");
  });

  it("validates an observable AI job response", () => {
    const job = AiJobSchema.parse({
      id: "job_1",
      userId: "user_1",
      type: "score_attempt",
      status: "pending",
      progress: 0,
      input: {
        attemptId: "attempt_1",
      },
      output: null,
      error: null,
      retryCount: 0,
      queueJobId: "bullmq_1",
      model: "gpt-4.1-mini",
      promptVersionId: "prompt_1",
      tokenUsage: 0,
      latencyMs: null,
      inputHash: "hash_1",
      startedAt: null,
      completedAt: null,
      createdAt: "2026-06-12T00:00:00.000Z",
      updatedAt: "2026-06-12T00:00:00.000Z",
    });

    expect(job.status).toBe("pending");
    expect(job.queueJobId).toBe("bullmq_1");
  });
});
