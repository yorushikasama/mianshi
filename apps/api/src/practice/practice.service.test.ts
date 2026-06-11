import { describe, expect, it } from "vitest";
import type { PracticeAttemptResult } from "@mianshi/shared";
import { CatalogService } from "../catalog/catalog.service";
import { PracticeService, type PracticeAttemptRepository } from "./practice.service";

class FakePracticeAttemptRepository implements PracticeAttemptRepository {
  private readonly attempts: PracticeAttemptResult[] = [];

  async saveAttempt(attempt: PracticeAttemptResult) {
    this.attempts.push(attempt);
    return attempt;
  }

  async listAttempts(questionId?: string) {
    return this.attempts
      .filter((attempt) => !questionId || attempt.questionId === questionId)
      .toSorted((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  }
}

function createService() {
  return new PracticeService(new CatalogService(), new FakePracticeAttemptRepository());
}

describe("PracticeService", () => {
  it("scores a submitted answer and schedules the next review", async () => {
    const service = createService();

    const result = await service.submitAttempt({
      questionId: "q_jvm_gc_roots",
      submittedAnswer: "GC Roots 是可达性分析的起点，包括虚拟机栈引用、静态变量、常量引用和 JNI 引用。",
      now: new Date("2026-06-08T00:00:00.000Z"),
    });

    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.rating).toBe("easy");
    expect(result.nextReviewAt).toBe("2026-06-18T00:00:00.000Z");
  });

  it("rejects attempts for unknown questions", async () => {
    const service = createService();

    await expect(() =>
      service.submitAttempt({
        questionId: "missing",
        submittedAnswer: "这是一段回答。",
      }),
    ).rejects.toThrow("Question not found");
  });

  it("stores submitted attempts and returns the latest practice history first", async () => {
    const service = createService();

    const firstAttempt = await service.submitAttempt({
      questionId: "q_jvm_gc_roots",
      submittedAnswer: "GC Roots 是可达性分析的起点。",
      now: new Date("2026-06-08T00:00:00.000Z"),
    });
    const secondAttempt = await service.submitAttempt({
      questionId: "q_jvm_gc_roots",
      submittedAnswer: "GC Roots 是可达性分析的起点，包括虚拟机栈引用、静态变量、常量引用和 JNI 引用。",
      now: new Date("2026-06-09T00:00:00.000Z"),
    });

    const history = await service.listAttempts("q_jvm_gc_roots");

    expect(history).toHaveLength(2);
    expect(history[0].id).toBe(secondAttempt.id);
    expect(history[1].id).toBe(firstAttempt.id);
  });

  it("returns review state for a practiced question", async () => {
    const service = createService();

    const attempt = await service.submitAttempt({
      questionId: "q_jvm_gc_roots",
      submittedAnswer: "GC Roots 是可达性分析的起点，包括虚拟机栈引用、静态变量、常量引用和 JNI 引用。",
      now: new Date("2026-06-09T00:00:00.000Z"),
    });

    const reviewState = await service.getReviewState("q_jvm_gc_roots");

    expect(reviewState.attemptCount).toBe(1);
    expect(reviewState.lastAttemptId).toBe(attempt.id);
    expect(reviewState.lastScore).toBe(attempt.score);
    expect(reviewState.nextReviewAt).toBe(attempt.nextReviewAt);
  });
});
