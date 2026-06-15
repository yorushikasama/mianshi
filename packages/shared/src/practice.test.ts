import { describe, expect, it } from "vitest";
import { JAVA_BACKEND_SEED_ANSWERS, JAVA_BACKEND_SEED_QUESTIONS } from "./java-backend";
import {
  PracticeAttemptInputSchema,
  buildPracticeAttemptFromAiScore,
  buildPracticeReviewState,
  evaluatePracticeAttempt,
  scheduleNextPracticeReview,
} from "./practice";

describe("practice evaluation", () => {
  it("normalizes a practice submission before evaluation", () => {
    const input = PracticeAttemptInputSchema.parse({
      questionId: "q_jvm_gc_roots",
      submittedAnswer: "  GC Roots 包括虚拟机栈引用、静态变量引用和常量引用。  ",
      selfRating: "good",
    });

    expect(input.submittedAnswer).toBe("GC Roots 包括虚拟机栈引用、静态变量引用和常量引用。");
  });

  it("scores matched key points and maps the score to an FSRS rating", () => {
    const question = JAVA_BACKEND_SEED_QUESTIONS.find((item) => item.id === "q_jvm_gc_roots");
    const answer = JAVA_BACKEND_SEED_ANSWERS.find((item) => item.questionId === "q_jvm_gc_roots");

    if (!question || !answer) {
      throw new Error("missing JVM seed question or answer");
    }

    const result = evaluatePracticeAttempt({
      question,
      answer,
      submittedAnswer: "GC Roots 是可达性分析的起点，常见来源包括虚拟机栈引用、方法区静态变量、常量引用和 JNI 引用。",
      now: new Date("2026-06-08T00:00:00.000Z"),
    });

    expect(result.questionId).toBe("q_jvm_gc_roots");
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.rating).toBe("easy");
    expect(result.matchedKeyPoints).toContain("可达性分析");
    expect(result.missingKeyPoints).toHaveLength(0);
    expect(result.nextReviewAt).toBe("2026-06-16T00:00:00.000Z");
  });

  it("returns missing points and a lower rating for an incomplete answer", () => {
    const question = JAVA_BACKEND_SEED_QUESTIONS.find((item) => item.id === "q_jvm_gc_roots");
    const answer = JAVA_BACKEND_SEED_ANSWERS.find((item) => item.questionId === "q_jvm_gc_roots");

    if (!question || !answer) {
      throw new Error("missing JVM seed question or answer");
    }

    const result = evaluatePracticeAttempt({
      question,
      answer,
      submittedAnswer: "GC Roots 就是被 JVM 认为还活着的对象。",
      now: new Date("2026-06-08T00:00:00.000Z"),
    });

    expect(result.score).toBeLessThan(70);
    expect(result.rating).toBe("hard");
    expect(result.missingKeyPoints).toContain("可达性分析");
    expect(result.followUpQuestions.length).toBeGreaterThan(0);
  });

  it("builds review state from the latest attempt for a question", () => {
    const question = JAVA_BACKEND_SEED_QUESTIONS.find((item) => item.id === "q_jvm_gc_roots");
    const answer = JAVA_BACKEND_SEED_ANSWERS.find((item) => item.questionId === "q_jvm_gc_roots");

    if (!question || !answer) {
      throw new Error("missing JVM seed question or answer");
    }

    const firstAttempt = evaluatePracticeAttempt({
      question,
      answer,
      submittedAnswer: "GC Roots 是可达性分析的起点。",
      now: new Date("2026-06-08T00:00:00.000Z"),
    });
    const latestAttempt = evaluatePracticeAttempt({
      question,
      answer,
      submittedAnswer: "GC Roots 是可达性分析的起点，包括虚拟机栈引用、静态变量、常量引用和 JNI 引用。",
      now: new Date("2026-06-09T00:00:00.000Z"),
    });

    const reviewState = buildPracticeReviewState(question.id, [firstAttempt, latestAttempt]);

    expect(reviewState.questionId).toBe("q_jvm_gc_roots");
    expect(reviewState.attemptCount).toBe(2);
    expect(reviewState.lastAttemptId).toBe(latestAttempt.id);
    expect(reviewState.lastScore).toBe(latestAttempt.score);
    expect(reviewState.rating).toBe("easy");
    expect(reviewState.lastPracticedAt).toBe("2026-06-09T00:00:00.000Z");
    expect(reviewState.nextReviewAt).toBe("2026-06-17T00:00:00.000Z");
  });

  it("schedules reviews with ts-fsrs memory state instead of fixed day buckets", () => {
    const first = scheduleNextPracticeReview({
      aiScore: 92,
      now: new Date("2026-06-08T00:00:00.000Z"),
    });

    expect(first.rating).toBe("easy");
    expect(first.nextReviewAt).toBe("2026-06-16T00:00:00.000Z");
    expect(first.stability).toBeGreaterThan(8);
    expect(first.difficulty).toBeGreaterThanOrEqual(1);
  });

  it("builds a persisted practice attempt from AI score output", () => {
    const attempt = buildPracticeAttemptFromAiScore({
      questionId: "q_jvm_gc_roots",
      submittedAnswer: "GC Roots 是可达性分析的起点，包括线程栈、静态变量、常量和 JNI 引用。",
      scoreOutput: {
        score: 86,
        feedbackSummary: "回答覆盖主要点，可以补充排查顺序。",
        matchedKeyPoints: ["可达性分析", "GC Roots"],
        missingKeyPoints: ["排查顺序"],
        followUpQuestions: ["如果线上 Full GC 频繁，你先看哪些指标？"],
      },
      now: new Date("2026-06-08T00:00:00.000Z"),
    });

    expect(attempt.rating).toBe("easy");
    expect(attempt.nextReviewAt).toBe("2026-06-16T00:00:00.000Z");
    expect(attempt.feedbackSummary).toBe("回答覆盖主要点，可以补充排查顺序。");
  });
});
