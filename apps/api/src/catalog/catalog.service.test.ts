import { describe, expect, it } from "vitest";
import { CatalogService } from "./catalog.service";

describe("CatalogService", () => {
  it("returns Java backend as the first supported domain", () => {
    const service = new CatalogService();

    const domains = service.getDomains();

    expect(domains).toHaveLength(1);
    expect(domains[0].slug).toBe("java_backend");
    expect(domains[0].firstVersionFocus).toBe(true);
  });

  it("returns Java backend categories and seed questions", () => {
    const service = new CatalogService();

    const catalog = service.getJavaBackendCatalog();

    expect(catalog.categories.length).toBeGreaterThanOrEqual(12);
    expect(catalog.questions.length).toBeGreaterThanOrEqual(8);
    expect(catalog.answers.length).toBe(catalog.questions.length);
    expect(catalog.questions.some((question) => question.type === "project_deep_dive")).toBe(true);
  });

  it("finds a seed question and its standard answer by question id", () => {
    const service = new CatalogService();

    const question = service.getJavaBackendQuestion("q_jvm_gc_roots");
    const answer = service.getJavaBackendAnswerForQuestion("q_jvm_gc_roots");

    expect(question?.title).toBe("什么是 GC Roots？");
    expect(answer?.keyPoints).toContain("可达性分析");
  });
});
