import { describe, expect, it } from "vitest";
import {
  GenerateAnswerOutputSchema,
  GenerateFollowupOutputSchema,
  GenerateQuestionsOutputSchema,
  ScoreAttemptOutputSchema,
} from "./ai-generation";

describe("AI generation structured output schemas", () => {
  it("accepts structured generated interview questions without hard-coding Java in the schema", () => {
    const output = GenerateQuestionsOutputSchema.parse({
      questions: [
        {
          domainSlug: "java_backend",
          categorySlug: "jvm",
          type: "scenario",
          difficulty: "medium",
          title: "如何排查频繁 Full GC？",
          content: "请从监控指标、堆内对象、GC 日志和修复策略说明排查思路。",
          tags: ["JVM", "GC", "排查"],
        },
      ],
    });

    expect(output.questions[0]?.domainSlug).toBe("java_backend");
    expect(output.questions[0]?.type).toBe("scenario");
  });

  it("rejects generated answers without concrete key points", () => {
    expect(() =>
      GenerateAnswerOutputSchema.parse({
        answerType: "standard",
        content: "需要结合 HashMap 的定位和扩容过程说明。",
        keyPoints: [],
      }),
    ).toThrow();
  });

  it("accepts structured practice scoring without letting AI choose the FSRS rating", () => {
    const output = ScoreAttemptOutputSchema.parse({
      score: 82,
      feedbackSummary: "回答覆盖了核心概念，但还缺少线上排查顺序。",
      matchedKeyPoints: ["可达性分析", "GC Roots"],
      missingKeyPoints: ["GC 日志", "对象分配热点"],
      followUpQuestions: ["如果 GC 日志里出现 promotion failed，你会怎么继续分析？"],
    });

    expect(output.score).toBe(82);
    expect(output).not.toHaveProperty("rating");
  });

  it("rejects practice scoring outside the normalized score range", () => {
    expect(() =>
      ScoreAttemptOutputSchema.parse({
        score: 120,
        feedbackSummary: "分数越界。",
        matchedKeyPoints: [],
        missingKeyPoints: [],
        followUpQuestions: [],
      }),
    ).toThrow();
  });

  it("accepts structured follow-up generation as a separate AI task output", () => {
    const output = GenerateFollowupOutputSchema.parse({
      followUpQuestions: [
        "如果 GC 日志显示 promotion failed，你会如何判断是内存泄漏还是瞬时流量？",
        "你会如何把这个排查过程讲成一次线上问题复盘？",
      ],
    });

    expect(output.followUpQuestions).toHaveLength(2);
  });

  it("rejects follow-up generation without concrete questions", () => {
    expect(() =>
      GenerateFollowupOutputSchema.parse({
        followUpQuestions: [],
      }),
    ).toThrow();
  });
});
