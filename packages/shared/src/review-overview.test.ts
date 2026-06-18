import { describe, expect, it } from "vitest";
import { ReviewMistakesSchema, ReviewOverviewSchema, ReviewTodaySchema } from "./review";

describe("ReviewOverviewSchema", () => {
  it("accepts a review dashboard overview with due items and weak categories", () => {
    const overview = ReviewOverviewSchema.parse({
      generatedAt: "2026-06-11T00:00:00.000Z",
      dueTodayCount: 1,
      overdueCount: 1,
      totalAttemptCount: 4,
      averageScore: 72,
      dueItems: [
        {
          questionId: "q_jvm_gc_roots",
          title: "什么是 GC Roots？",
          domainSlug: "java_backend",
          categorySlug: "jvm",
          categoryName: "JVM",
          difficulty: "medium",
          type: "concept",
          lastScore: 62,
          rating: "hard",
          attemptCount: 2,
          dueAt: "2026-06-10T00:00:00.000Z",
          lastReviewedAt: "2026-06-09T00:00:00.000Z",
          status: "overdue",
        },
      ],
      recentAttempts: [
        {
          attemptId: "attempt_1",
          questionId: "q_jvm_gc_roots",
          title: "什么是 GC Roots？",
          categoryName: "JVM",
          score: 62,
          rating: "hard",
          createdAt: "2026-06-09T00:00:00.000Z",
        },
      ],
      weakCategories: [
        {
          categorySlug: "jvm",
          categoryName: "JVM",
          attemptCount: 2,
          averageScore: 62,
          lowestScore: 54,
        },
      ],
    });

    expect(overview.dueItems[0].status).toBe("overdue");
    expect(overview.weakCategories[0].averageScore).toBe(62);
  });

  it("accepts a today review queue response", () => {
    const today = ReviewTodaySchema.parse({
      generatedAt: "2026-06-11T00:00:00.000Z",
      dueTodayCount: 1,
      overdueCount: 1,
      items: [
        {
          questionId: "q_jvm_gc_roots",
          title: "什么是 GC Roots？",
          domainSlug: "java_backend",
          categorySlug: "jvm",
          categoryName: "JVM",
          difficulty: "medium",
          type: "concept",
          lastScore: 62,
          rating: "hard",
          attemptCount: 2,
          dueAt: "2026-06-10T00:00:00.000Z",
          lastReviewedAt: "2026-06-09T00:00:00.000Z",
          status: "overdue",
        },
      ],
    });

    expect(today.items[0].questionId).toBe("q_jvm_gc_roots");
  });

  it("accepts a mistake review response grouped by weak questions", () => {
    const mistakes = ReviewMistakesSchema.parse({
      generatedAt: "2026-06-18T00:00:00.000Z",
      items: [
        {
          questionId: "q_thread_pool_rejection",
          title: "线程池拒绝策略如何选择？",
          categorySlug: "concurrency",
          categoryName: "Java 并发",
          lowestScore: 48,
          latestScore: 58,
          attemptCount: 2,
          lastAttemptAt: "2026-06-17T00:00:00.000Z",
        },
      ],
    });

    expect(mistakes.items[0].lowestScore).toBe(48);
  });
});
