import { describe, expect, it } from "vitest";
import { GenerateAnswerOutputSchema, GenerateQuestionsOutputSchema } from "./ai-generation";

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
});
