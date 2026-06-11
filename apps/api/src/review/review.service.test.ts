import { describe, expect, it } from "vitest";
import type { DifficultyLevel, FsrsRatingName, QuestionType } from "@mianshi/shared";
import { ReviewService, type ReviewAttemptRecord, type ReviewRepository, type ReviewStateRecord } from "./review.service";

class FakeReviewRepository implements ReviewRepository {
  readonly reviewStates: ReviewStateRecord[] = [
    createReviewState({
      userId: "user_1",
      questionId: "q_jvm_gc_roots",
      categorySlug: "jvm",
      categoryName: "JVM",
      dueAt: new Date("2026-06-10T08:00:00.000Z"),
      lastReviewedAt: new Date("2026-06-09T08:00:00.000Z"),
      reviewCount: 2,
      lastScore: 62,
      rating: "hard",
    }),
    createReviewState({
      userId: "user_1",
      questionId: "q_thread_pool_rejection",
      categorySlug: "concurrency",
      categoryName: "Java 并发",
      dueAt: new Date("2026-06-11T12:00:00.000Z"),
      lastReviewedAt: new Date("2026-06-08T08:00:00.000Z"),
      reviewCount: 1,
      lastScore: 48,
      rating: "again",
    }),
    createReviewState({
      userId: "user_1",
      questionId: "q_project_latency_optimization",
      categorySlug: "system_design",
      categoryName: "系统设计",
      dueAt: new Date("2026-06-18T08:00:00.000Z"),
      lastReviewedAt: new Date("2026-06-10T08:00:00.000Z"),
      reviewCount: 1,
      lastScore: 92,
      rating: "easy",
    }),
    createReviewState({
      userId: "user_2",
      questionId: "q_other_user",
      categorySlug: "mysql",
      categoryName: "MySQL",
      dueAt: new Date("2026-06-10T08:00:00.000Z"),
      lastReviewedAt: new Date("2026-06-09T08:00:00.000Z"),
      reviewCount: 4,
      lastScore: 30,
      rating: "again",
    }),
  ];

  readonly attempts: ReviewAttemptRecord[] = [
    createAttempt({
      userId: "user_1",
      attemptId: "attempt_new",
      questionId: "q_thread_pool_rejection",
      title: "线程池拒绝策略如何选择？",
      categoryName: "Java 并发",
      categorySlug: "concurrency",
      score: 48,
      rating: "again",
      createdAt: new Date("2026-06-10T08:00:00.000Z"),
    }),
    createAttempt({
      userId: "user_1",
      attemptId: "attempt_old",
      questionId: "q_jvm_gc_roots",
      title: "什么是 GC Roots？",
      categoryName: "JVM",
      categorySlug: "jvm",
      score: 62,
      rating: "hard",
      createdAt: new Date("2026-06-09T08:00:00.000Z"),
    }),
    createAttempt({
      userId: "user_1",
      attemptId: "attempt_good",
      questionId: "q_project_latency_optimization",
      title: "如何做项目性能优化？",
      categoryName: "系统设计",
      categorySlug: "system_design",
      score: 92,
      rating: "easy",
      createdAt: new Date("2026-06-08T08:00:00.000Z"),
    }),
    createAttempt({
      userId: "user_2",
      attemptId: "attempt_other_user",
      questionId: "q_other_user",
      title: "MySQL 索引为什么失效？",
      categoryName: "MySQL",
      categorySlug: "mysql",
      score: 30,
      rating: "again",
      createdAt: new Date("2026-06-10T08:00:00.000Z"),
    }),
  ];

  async listReviewStates(userId: string) {
    return this.reviewStates.filter((state) => state.userId === userId);
  }

  async listRecentAttempts(userId: string, limit: number) {
    return this.attempts
      .filter((attempt) => attempt.userId === userId)
      .toSorted((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, limit);
  }

  async listAttemptsForAnalytics(userId: string) {
    return this.attempts.filter((attempt) => attempt.userId === userId);
  }
}

function createService() {
  return new ReviewService(new FakeReviewRepository());
}

describe("ReviewService", () => {
  it("builds a user isolated overview for due reviews and weak categories", async () => {
    const service = createService();

    const overview = await service.getOverview("user_1", {
      now: new Date("2026-06-11T09:30:00.000Z"),
      dueLimit: 10,
      recentLimit: 5,
    });

    expect(overview.generatedAt).toBe("2026-06-11T09:30:00.000Z");
    expect(overview.overdueCount).toBe(1);
    expect(overview.dueTodayCount).toBe(1);
    expect(overview.totalAttemptCount).toBe(3);
    expect(overview.averageScore).toBe(67);
    expect(overview.dueItems.map((item) => item.questionId)).toEqual([
      "q_jvm_gc_roots",
      "q_thread_pool_rejection",
    ]);
    expect(overview.dueItems.map((item) => item.status)).toEqual(["overdue", "due_today"]);
    expect(overview.recentAttempts.map((attempt) => attempt.attemptId)).toEqual([
      "attempt_new",
      "attempt_old",
      "attempt_good",
    ]);
    expect(overview.weakCategories.map((category) => category.categorySlug)).toEqual(["concurrency", "jvm"]);
  });

  it("does not leak another user's review state or attempts", async () => {
    const service = createService();

    const overview = await service.getOverview("user_2", {
      now: new Date("2026-06-11T09:30:00.000Z"),
    });

    expect(overview.dueItems.map((item) => item.questionId)).toEqual(["q_other_user"]);
    expect(overview.recentAttempts.map((attempt) => attempt.attemptId)).toEqual(["attempt_other_user"]);
    expect(overview.weakCategories.map((category) => category.categorySlug)).toEqual(["mysql"]);
  });
});

function createReviewState(input: {
  userId: string;
  questionId: string;
  categorySlug: string;
  categoryName: string;
  dueAt: Date;
  lastReviewedAt: Date;
  reviewCount: number;
  lastScore: number;
  rating: FsrsRatingName;
}): ReviewStateRecord {
  return {
    ...input,
    title: titleForQuestion(input.questionId),
    domainSlug: "java_backend",
    difficulty: "medium",
    type: "concept",
  };
}

function createAttempt(input: {
  userId: string;
  attemptId: string;
  questionId: string;
  title: string;
  categoryName: string;
  categorySlug: string;
  score: number;
  rating: FsrsRatingName;
  createdAt: Date;
}): ReviewAttemptRecord {
  return {
    ...input,
    domainSlug: "java_backend",
  };
}

function titleForQuestion(questionId: string) {
  const titles: Record<string, string> = {
    q_jvm_gc_roots: "什么是 GC Roots？",
    q_thread_pool_rejection: "线程池拒绝策略如何选择？",
    q_project_latency_optimization: "如何做项目性能优化？",
    q_other_user: "MySQL 索引为什么失效？",
  };
  return titles[questionId] ?? questionId;
}

function assertQuestionType(_type: QuestionType) {}
function assertDifficultyLevel(_level: DifficultyLevel) {}

void assertQuestionType;
void assertDifficultyLevel;
