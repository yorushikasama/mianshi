import { describe, expect, it } from "vitest";
import type { Answer, PracticeAttemptResult, Question } from "@mianshi/shared";
import { CatalogService } from "../catalog/catalog.service";
import { PracticeService, type PracticeAttemptRepository, type PracticeQuestionRepository } from "./practice.service";

interface StoredAttempt {
  userId: string;
  attempt: PracticeAttemptResult;
}

class FakePracticeAttemptRepository implements PracticeAttemptRepository {
  private readonly attempts: StoredAttempt[] = [];

  async saveAttempt(userId: string, attempt: PracticeAttemptResult) {
    this.attempts.push({ userId, attempt });
    return attempt;
  }

  async listAttempts(userId: string, questionId?: string) {
    return this.attempts
      .filter((storedAttempt) => storedAttempt.userId === userId)
      .map((storedAttempt) => storedAttempt.attempt)
      .filter((attempt) => !questionId || attempt.questionId === questionId)
      .toSorted((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  }
}

class FakePracticeQuestionRepository implements PracticeQuestionRepository {
  private readonly records: { userId: string | null; question: Question; answer: Answer | null }[] = [
    {
      userId: "user_1",
      question: {
        id: "q_user_spring_tx",
        domainSlug: "java_backend",
        categorySlug: "spring",
        type: "scenario",
        difficulty: "medium",
        title: "Spring 事务为什么会失效？",
        content: "请解释 Spring 声明式事务失效的常见原因。",
        tags: ["自调用", "非 public 方法", "异常类型"],
        sourceType: "ai_generated",
        aiGenerated: true,
      },
      answer: {
        id: "a_user_spring_tx",
        questionId: "q_user_spring_tx",
        answerType: "standard",
        status: "draft",
        content: "常见原因包括同类自调用绕过代理、方法不是 public、异常被捕获或不是回滚异常、事务传播配置不符合预期。",
        keyPoints: ["自调用", "非 public 方法", "异常类型"],
        model: "test-model",
        promptVersion: "test",
        tokenUsage: 0,
      },
    },
  ];

  async findPracticeQuestion(input: { userId: string; questionId: string }) {
    const record = this.records.find(
      (item) => item.question.id === input.questionId && (item.userId === null || item.userId === input.userId),
    );

    return record ? { question: record.question, answer: record.answer } : null;
  }
}

function createService() {
  return new PracticeService(
    new CatalogService(),
    new FakePracticeAttemptRepository(),
    new FakePracticeQuestionRepository(),
  );
}

describe("PracticeService", () => {
  it("scores a submitted answer and schedules the next review", async () => {
    const service = createService();

    const result = await service.submitAttempt("user_1", {
      questionId: "q_jvm_gc_roots",
      submittedAnswer: "GC Roots 是可达性分析的起点，包括虚拟机栈引用、静态变量、常量引用和 JNI 引用。",
      now: new Date("2026-06-08T00:00:00.000Z"),
    });

    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.rating).toBe("easy");
    expect(result.nextReviewAt).toBe("2026-06-16T00:00:00.000Z");
  });

  it("rejects attempts for unknown questions", async () => {
    const service = createService();

    await expect(() =>
      service.submitAttempt("user_1", {
        questionId: "missing",
        submittedAnswer: "这是一段回答。",
      }),
    ).rejects.toThrow("Question not found");
  });

  it("scores attempts for the current user's persisted questions", async () => {
    const service = createService();

    const result = await service.submitAttempt("user_1", {
      questionId: "q_user_spring_tx",
      submittedAnswer: "Spring 事务失效常见原因包括自调用绕过代理、非 public 方法、异常类型不触发回滚。",
      now: new Date("2026-06-10T00:00:00.000Z"),
    });

    expect(result.questionId).toBe("q_user_spring_tx");
    expect(result.score).toBeGreaterThanOrEqual(85);
  });

  it("does not score another user's persisted questions", async () => {
    const service = createService();

    await expect(() =>
      service.submitAttempt("user_2", {
        questionId: "q_user_spring_tx",
        submittedAnswer: "Spring 事务失效常见原因包括自调用绕过代理、非 public 方法、异常类型不触发回滚。",
      }),
    ).rejects.toThrow("Question not found");
  });

  it("stores submitted attempts and returns the latest practice history first", async () => {
    const service = createService();

    const firstAttempt = await service.submitAttempt("user_1", {
      questionId: "q_jvm_gc_roots",
      submittedAnswer: "GC Roots 是可达性分析的起点。",
      now: new Date("2026-06-08T00:00:00.000Z"),
    });
    const secondAttempt = await service.submitAttempt("user_1", {
      questionId: "q_jvm_gc_roots",
      submittedAnswer: "GC Roots 是可达性分析的起点，包括虚拟机栈引用、静态变量、常量引用和 JNI 引用。",
      now: new Date("2026-06-09T00:00:00.000Z"),
    });

    const history = await service.listAttempts("user_1", "q_jvm_gc_roots");

    expect(history).toHaveLength(2);
    expect(history[0].id).toBe(secondAttempt.id);
    expect(history[1].id).toBe(firstAttempt.id);
  });

  it("does not leak practice history across users", async () => {
    const service = createService();

    await service.submitAttempt("user_1", {
      questionId: "q_jvm_gc_roots",
      submittedAnswer: "GC Roots 是可达性分析的起点。",
      now: new Date("2026-06-08T00:00:00.000Z"),
    });
    const userTwoAttempt = await service.submitAttempt("user_2", {
      questionId: "q_jvm_gc_roots",
      submittedAnswer: "GC Roots 是可达性分析的起点，包括虚拟机栈引用、静态变量、常量引用和 JNI 引用。",
      now: new Date("2026-06-09T00:00:00.000Z"),
    });

    const userOneHistory = await service.listAttempts("user_1", "q_jvm_gc_roots");
    const userTwoHistory = await service.listAttempts("user_2", "q_jvm_gc_roots");

    expect(userOneHistory).toHaveLength(1);
    expect(userTwoHistory).toHaveLength(1);
    expect(userTwoHistory[0].id).toBe(userTwoAttempt.id);
  });

  it("returns review state for a practiced question", async () => {
    const service = createService();

    const attempt = await service.submitAttempt("user_1", {
      questionId: "q_jvm_gc_roots",
      submittedAnswer: "GC Roots 是可达性分析的起点，包括虚拟机栈引用、静态变量、常量引用和 JNI 引用。",
      now: new Date("2026-06-09T00:00:00.000Z"),
    });

    const reviewState = await service.getReviewState("user_1", "q_jvm_gc_roots");

    expect(reviewState.attemptCount).toBe(1);
    expect(reviewState.lastAttemptId).toBe(attempt.id);
    expect(reviewState.lastScore).toBe(attempt.score);
    expect(reviewState.nextReviewAt).toBe(attempt.nextReviewAt);
  });
});
