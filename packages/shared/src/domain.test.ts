import { describe, expect, it } from "vitest";
import {
  AnswerSchema,
  DomainSchema,
  QuestionSchema,
  answerTypes,
  questionTypes,
} from "./domain";

describe("generic interview domain schemas", () => {
  it("keeps Java as data instead of a hardcoded schema type", () => {
    const domain = DomainSchema.parse({
      slug: "java_backend",
      name: "Java 后端",
      description: "第一版默认面试复习方向",
      firstVersionFocus: true,
    });

    expect(domain.slug).toBe("java_backend");
    expect(questionTypes).toContain("project_deep_dive");
    expect(answerTypes).toContain("interview_style");
  });

  it("validates a generic question that happens to belong to the Java backend domain", () => {
    const question = QuestionSchema.parse({
      id: "q_hashmap_resize",
      domainSlug: "java_backend",
      categorySlug: "java-collections",
      type: "concept",
      difficulty: "medium",
      title: "HashMap 扩容机制",
      content: "HashMap 为什么需要扩容？扩容过程中有什么风险？",
      tags: ["HashMap", "集合"],
      sourceType: "seed",
      aiGenerated: false,
    });

    expect(question.categorySlug).toBe("java-collections");
  });

  it("validates answer metadata used for AI output traceability", () => {
    const answer = AnswerSchema.parse({
      id: "a_hashmap_resize_standard",
      questionId: "q_hashmap_resize",
      answerType: "standard",
      status: "draft",
      content: "HashMap 扩容会重新计算桶位置，面试时需要说明触发条件和并发风险。",
      model: "manual-seed",
      promptVersion: "seed-v1",
      tokenUsage: 0,
    });

    expect(answer.promptVersion).toBe("seed-v1");
  });
});
