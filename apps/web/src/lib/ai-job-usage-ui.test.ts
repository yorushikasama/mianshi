import { describe, expect, it } from "vitest";
import { formatAiJobFailureSummary, formatAiJobUsageSummary } from "./ai-job-usage-ui";

describe("formatAiJobUsageSummary", () => {
  it("formats token, latency, and estimated cost for the dashboard", () => {
    expect(
      formatAiJobUsageSummary({
        generatedAt: "2026-06-18T00:00:00.000Z",
        totalJobs: 2,
        succeededJobs: 1,
        failedJobs: 1,
        totalTokenUsage: 1250,
        averageLatencyMs: 150,
        estimatedCostUsd: 0.0125,
      }),
    ).toEqual({
      totalJobs: "2",
      successRate: "50%",
      totalTokenUsage: "1.3k",
      averageLatency: "150 ms",
      estimatedCost: "$0.0125",
    });
  });

  it("handles empty usage without fake latency", () => {
    expect(
      formatAiJobUsageSummary({
        generatedAt: "2026-06-18T00:00:00.000Z",
        totalJobs: 0,
        succeededJobs: 0,
        failedJobs: 0,
        totalTokenUsage: 0,
        averageLatencyMs: null,
        estimatedCostUsd: 0,
      }),
    ).toMatchObject({
      successRate: "0%",
      averageLatency: "--",
      estimatedCost: "$0",
    });
  });

  it("formats failed job metadata without exposing job input", () => {
    expect(
      formatAiJobFailureSummary({
        id: "job_1",
        userId: "user_1",
        type: "rag_generate_questions",
        status: "failed",
        progress: 60,
        input: { resume: "sensitive resume text" },
        output: null,
        error: "Embedding failed",
        retryCount: 2,
        queueJobId: "queue_1",
        model: null,
        promptVersionId: null,
        tokenUsage: 0,
        latencyMs: null,
        inputHash: "hash_1",
        startedAt: null,
        completedAt: "2026-06-18T00:00:00.000Z",
        createdAt: "2026-06-18T00:00:00.000Z",
        updatedAt: "2026-06-18T00:01:00.000Z",
      }),
    ).toEqual({
      type: "RAG 生成题目",
      error: "Embedding failed",
      retryCount: "2 次重试",
    });
  });
});
