import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  buildAiJobsPath,
  buildApiUrl,
  buildPracticeAttemptsPath,
  buildReviewOverviewPath,
  clearAccessToken,
  createAiJob,
  fetchAiJobs,
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
