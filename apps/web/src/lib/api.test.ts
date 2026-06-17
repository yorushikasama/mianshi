import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  buildAiJobsPath,
  buildApiUrl,
  buildPracticeAttemptsPath,
  buildQuestionsPath,
  buildRagQuestionJobInput,
  buildReviewOverviewPath,
  buildSourceDocumentsPath,
  clearAccessToken,
  createAiJob,
  createSourceDocument,
  fetchAiJobs,
  fetchQuestion,
  fetchQuestions,
  fetchSourceDocuments,
  fetchReviewOverview,
  fetchPracticeAttempts,
  getAccessToken,
  setAccessToken,
} from "./api";

const originalFetch = globalThis.fetch;

afterEach(() => {
  clearAccessToken();
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("web API client helpers", () => {
  it("builds API URLs without duplicating slashes", () => {
    expect(buildApiUrl("/catalog/java-backend/questions", "http://localhost:3001/")).toBe(
      "http://localhost:3001/catalog/java-backend/questions",
    );
  });

  it("preserves response status in API errors", () => {
    const error = new ApiError("Request failed", 404);

    expect(error.status).toBe(404);
    expect(error.message).toBe("Request failed");
  });

  it("builds encoded practice history paths for a question", () => {
    expect(buildPracticeAttemptsPath("q/java roots")).toBe("/practice/attempts?questionId=q%2Fjava%20roots");
  });

  it("builds question list paths with filters and pagination", () => {
    expect(
      buildQuestionsPath({
        domainSlug: "java_backend",
        categorySlug: "project deep dive",
        page: 2,
        pageSize: 12,
      }),
    ).toBe("/questions?domainSlug=java_backend&categorySlug=project+deep+dive&page=2&pageSize=12");
  });

  it("builds review overview paths with bounded query params", () => {
    expect(buildReviewOverviewPath({ dueLimit: 6, recentLimit: 4 })).toBe(
      "/review/overview?dueLimit=6&recentLimit=4",
    );
  });

  it("builds AI job list paths with optional status and pagination", () => {
    expect(buildAiJobsPath({ status: "pending", page: 2, pageSize: 10 })).toBe(
      "/ai/jobs?status=pending&page=2&pageSize=10",
    );
  });

  it("builds source document list paths with optional type filters", () => {
    expect(buildSourceDocumentsPath({ documentType: "job_description" })).toBe(
      "/documents?documentType=job_description",
    );
  });

  it("attaches the current access token to protected requests", async () => {
    setAccessToken("access-token");
    const fetchMock = vi.fn(async () => jsonResponse([]));
    globalThis.fetch = fetchMock as never;

    await fetchPracticeAttempts("q_jvm_gc_roots");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/practice/attempts?questionId=q_jvm_gc_roots",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("fetches the protected review overview with the current access token", async () => {
    setAccessToken("access-token");
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        generatedAt: "2026-06-11T00:00:00.000Z",
        dueTodayCount: 0,
        overdueCount: 0,
        totalAttemptCount: 0,
        dueItems: [],
        recentAttempts: [],
        weakCategories: [],
      }),
    );
    globalThis.fetch = fetchMock as never;

    await fetchReviewOverview({ dueLimit: 6, recentLimit: 4 });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/review/overview?dueLimit=6&recentLimit=4",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("fetches protected AI jobs with the current access token", async () => {
    setAccessToken("access-token");
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      }),
    );
    globalThis.fetch = fetchMock as never;

    await fetchAiJobs({ status: "pending" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/ai/jobs?status=pending",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("fetches protected questions with the current access token", async () => {
    setAccessToken("access-token");
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      }),
    );
    globalThis.fetch = fetchMock as never;

    await fetchQuestions({ domainSlug: "java_backend", pageSize: 12 });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/questions?domainSlug=java_backend&pageSize=12",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("fetches a protected question by id with the current access token", async () => {
    setAccessToken("access-token");
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        id: "q_ai_1",
        domainSlug: "java_backend",
        categorySlug: "project-deep-dive",
        type: "project_deep_dive",
        difficulty: "hard",
        title: "项目性能优化追问",
        content: "请结合项目说明一次性能优化。",
        tags: ["项目经历"],
        sourceType: "ai_generated",
        aiGenerated: true,
      }),
    );
    globalThis.fetch = fetchMock as never;

    await fetchQuestion("q_ai/1");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/questions/q_ai%2F1",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("creates protected AI jobs with the current access token", async () => {
    setAccessToken("access-token");
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        id: "job_1",
        userId: "user_1",
        type: "generate_questions",
        status: "pending",
        progress: 0,
        input: { domainSlug: "java_backend" },
        output: null,
        error: null,
        retryCount: 0,
        queueJobId: "job_1",
        model: null,
        promptVersionId: null,
        tokenUsage: 0,
        latencyMs: null,
        inputHash: "hash_1",
        startedAt: null,
        completedAt: null,
        createdAt: "2026-06-12T00:00:00.000Z",
        updatedAt: "2026-06-12T00:00:00.000Z",
      }),
    );
    globalThis.fetch = fetchMock as never;

    await createAiJob({
      type: "generate_questions",
      input: { domainSlug: "java_backend" },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/ai/jobs",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          type: "generate_questions",
          input: { domainSlug: "java_backend" },
        }),
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("creates protected RAG question generation jobs with document filters", async () => {
    setAccessToken("access-token");
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        id: "job_rag_1",
        userId: "user_1",
        type: "rag_generate_questions",
        status: "pending",
        progress: 0,
        input: {
          domainSlug: "java_backend",
          categorySlug: "redis",
          focus: "订单系统缓存一致性",
          documentType: "resume",
          count: 3,
          topK: 5,
        },
        output: null,
        error: null,
        retryCount: 0,
        queueJobId: "job_rag_1",
        model: null,
        promptVersionId: null,
        tokenUsage: 0,
        latencyMs: null,
        inputHash: "hash_rag_1",
        startedAt: null,
        completedAt: null,
        createdAt: "2026-06-12T00:00:00.000Z",
        updatedAt: "2026-06-12T00:00:00.000Z",
      }),
    );
    globalThis.fetch = fetchMock as never;

    await createAiJob({
      type: "rag_generate_questions",
      input: {
        domainSlug: "java_backend",
        categorySlug: "redis",
        focus: "订单系统缓存一致性",
        documentType: "resume",
        count: 3,
        topK: 5,
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/ai/jobs",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          type: "rag_generate_questions",
          input: {
            domainSlug: "java_backend",
            categorySlug: "redis",
            focus: "订单系统缓存一致性",
            documentType: "resume",
            count: 3,
            topK: 5,
          },
        }),
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("builds RAG question generation inputs from form values", () => {
    expect(
      buildRagQuestionJobInput({
        categorySlug: "redis",
        documentType: "resume",
        focus: "  订单系统缓存一致性  ",
        count: "3",
        topK: "5",
      }),
    ).toEqual({
      domainSlug: "java_backend",
      categorySlug: "redis",
      documentType: "resume",
      focus: "订单系统缓存一致性",
      count: 3,
      topK: 5,
    });
  });

  it("fetches protected source documents with the current access token", async () => {
    setAccessToken("access-token");
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        items: [
          {
            id: "doc_1",
            userId: "user_1",
            documentType: "resume",
            title: "Java 后端简历",
            contentPreview: "负责订单链路性能优化",
            fileUrl: null,
            chunkCount: 3,
            createdAt: "2026-06-12T00:00:00.000Z",
          },
        ],
      }),
    );
    globalThis.fetch = fetchMock as never;

    await fetchSourceDocuments({ documentType: "resume" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/documents?documentType=resume",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("creates protected source documents and returns the indexing job", async () => {
    setAccessToken("access-token");
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        document: {
          id: "doc_1",
          userId: "user_1",
          documentType: "job_description",
          title: "高级 Java 后端 JD",
          contentPreview: "需要熟悉 JVM、并发、Spring Boot 和分布式系统",
          fileUrl: null,
          chunkCount: 0,
          createdAt: "2026-06-12T00:00:00.000Z",
        },
        job: {
          id: "job_1",
          userId: "user_1",
          type: "embed_document",
          status: "pending",
          progress: 0,
          input: { sourceDocumentId: "doc_1" },
          output: null,
          error: null,
          retryCount: 0,
          queueJobId: "job_1",
          model: null,
          promptVersionId: null,
          tokenUsage: 0,
          latencyMs: null,
          inputHash: "hash_1",
          startedAt: null,
          completedAt: null,
          createdAt: "2026-06-12T00:00:00.000Z",
          updatedAt: "2026-06-12T00:00:00.000Z",
        },
      }),
    );
    globalThis.fetch = fetchMock as never;

    await createSourceDocument({
      documentType: "job_description",
      title: "高级 Java 后端 JD",
      content: "需要熟悉 JVM、并发、Spring Boot 和分布式系统",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/documents",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          documentType: "job_description",
          title: "高级 Java 后端 JD",
          content: "需要熟悉 JVM、并发、Spring Boot 和分布式系统",
        }),
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("refreshes the session on 401 and retries protected requests with the new token", async () => {
    setAccessToken("expired-token");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: "Unauthorized" }, 401))
      .mockResolvedValueOnce(jsonResponse({ accessToken: "fresh-token", user: { id: "user_1" } }))
      .mockResolvedValueOnce(jsonResponse([]));
    globalThis.fetch = fetchMock as never;

    await fetchPracticeAttempts("q_jvm_gc_roots");

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3001/auth/refresh",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://localhost:3001/practice/attempts?questionId=q_jvm_gc_roots",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer fresh-token",
        }),
      }),
    );
    expect(getAccessToken()).toBe("fresh-token");
  });
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
