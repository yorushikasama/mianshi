import { describe, expect, it } from "vitest";
import {
  JAVA_BACKEND_CATEGORIES,
  JAVA_BACKEND_DOMAIN,
  JAVA_BACKEND_SEED_ANSWERS,
  JAVA_BACKEND_SEED_QUESTIONS,
  getJavaBackendCatalog,
} from "./java-backend";

describe("Java backend first-version catalog", () => {
  it("declares Java backend as the first supported domain", () => {
    expect(JAVA_BACKEND_DOMAIN.slug).toBe("java_backend");
    expect(JAVA_BACKEND_DOMAIN.firstVersionFocus).toBe(true);
  });

  it("covers the expected Java backend interview knowledge tree", () => {
    const categoryNames = JAVA_BACKEND_CATEGORIES.map((category) => category.name);

    expect(categoryNames).toContain("JVM");
    expect(categoryNames).toContain("Spring 与 Spring Boot");
    expect(categoryNames).toContain("Redis");
    expect(categoryNames).toContain("项目经历追问");
    expect(JAVA_BACKEND_CATEGORIES.length).toBeGreaterThanOrEqual(12);
  });

  it("ships seed questions that reference valid Java backend categories", () => {
    const categorySlugs = new Set(JAVA_BACKEND_CATEGORIES.map((category) => category.slug));

    expect(JAVA_BACKEND_SEED_QUESTIONS.length).toBeGreaterThanOrEqual(8);
    expect(JAVA_BACKEND_SEED_QUESTIONS.every((question) => categorySlugs.has(question.categorySlug))).toBe(true);
    expect(JAVA_BACKEND_SEED_QUESTIONS.some((question) => question.type === "project_deep_dive")).toBe(true);
    expect(JAVA_BACKEND_SEED_QUESTIONS.some((question) => question.type === "scenario")).toBe(true);
  });

  it("returns a catalog grouped under the generic domain model", () => {
    const catalog = getJavaBackendCatalog();

    expect(catalog.domain.slug).toBe("java_backend");
    expect(catalog.categories[0].domainSlug).toBe("java_backend");
    expect(catalog.questions[0].domainSlug).toBe("java_backend");
  });

  it("ships standard answers and key points for every seed question", () => {
    const questionIds = new Set(JAVA_BACKEND_SEED_QUESTIONS.map((question) => question.id));
    const answerQuestionIds = new Set(JAVA_BACKEND_SEED_ANSWERS.map((answer) => answer.questionId));

    expect(JAVA_BACKEND_SEED_ANSWERS.length).toBe(JAVA_BACKEND_SEED_QUESTIONS.length);
    expect([...answerQuestionIds].every((questionId) => questionIds.has(questionId))).toBe(true);
    expect(JAVA_BACKEND_SEED_ANSWERS.every((answer) => answer.keyPoints.length >= 3)).toBe(true);
  });
});
