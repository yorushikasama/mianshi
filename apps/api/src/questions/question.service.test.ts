import { describe, expect, it } from "vitest";
import type { DifficultyLevel, Question, QuestionType, SourceType } from "@mianshi/shared";
import { QuestionService, type QuestionRepository, type QuestionRecord } from "./question.service";

class FakeQuestionRepository implements QuestionRepository {
  readonly questions: QuestionRecord[] = [
    createQuestionRecord({
      id: "q_seed_jvm",
      userId: null,
      domainSlug: "java_backend",
      categorySlug: "jvm",
      title: "什么是 GC Roots？",
      sourceType: "seed",
    }),
    createQuestionRecord({
      id: "q_user_owned",
      userId: "user_1",
      domainSlug: "java_backend",
      categorySlug: "spring_boot",
      title: "Spring Boot 自动配置如何工作？",
      sourceType: "manual",
    }),
    createQuestionRecord({
      id: "q_other_user",
      userId: "user_2",
      domainSlug: "java_backend",
      categorySlug: "mysql",
      title: "MySQL 索引失效有哪些场景？",
      sourceType: "manual",
    }),
  ];

  async listQuestions(input: { userId: string; domainSlug?: string; categorySlug?: string; page: number; pageSize: number }) {
    const visible = this.questions.filter((question) => {
      const visibleToUser = question.userId === null || question.userId === input.userId;
      const matchesDomain = !input.domainSlug || question.domainSlug === input.domainSlug;
      const matchesCategory = !input.categorySlug || question.categorySlug === input.categorySlug;
      return visibleToUser && matchesDomain && matchesCategory;
    });
    const start = (input.page - 1) * input.pageSize;
    return {
      items: visible.slice(start, start + input.pageSize),
      total: visible.length,
    };
  }

  async findQuestionById(questionId: string) {
    return this.questions.find((question) => question.id === questionId) ?? null;
  }

  async createQuestion(input: Omit<QuestionRecord, "id" | "createdAt" | "updatedAt">) {
    const question = {
      ...input,
      id: `q_created_${this.questions.length + 1}`,
      createdAt: new Date("2026-06-11T00:00:00.000Z"),
      updatedAt: new Date("2026-06-11T00:00:00.000Z"),
    };
    this.questions.push(question);
    return question;
  }

  async updateQuestion(questionId: string, input: Partial<Pick<QuestionRecord, "title" | "content" | "difficulty" | "type">>) {
    const question = await this.findQuestionById(questionId);
    if (!question) {
      return null;
    }
    Object.assign(question, input, { updatedAt: new Date("2026-06-12T00:00:00.000Z") });
    return question;
  }

  async deleteQuestion(questionId: string) {
    const index = this.questions.findIndex((question) => question.id === questionId);
    if (index === -1) {
      return false;
    }
    this.questions.splice(index, 1);
    return true;
  }
}

function createQuestionRecord(input: {
  id: string;
  userId: string | null;
  domainSlug: string;
  categorySlug: string;
  title: string;
  sourceType: SourceType;
}): QuestionRecord {
  return {
    id: input.id,
    userId: input.userId,
    domainSlug: input.domainSlug,
    categorySlug: input.categorySlug,
    type: "concept",
    difficulty: "medium",
    title: input.title,
    content: `${input.title} 的题目内容`,
    tags: ["Java"],
    sourceType: input.sourceType,
    aiGenerated: false,
    createdAt: new Date("2026-06-11T00:00:00.000Z"),
    updatedAt: new Date("2026-06-11T00:00:00.000Z"),
  };
}

function createService() {
  const repository = new FakeQuestionRepository();
  const service = new QuestionService(repository);
  return { repository, service };
}

describe("QuestionService", () => {
  it("lists seed questions and the current user's questions with pagination metadata", async () => {
    const { service } = createService();

    const result = await service.listQuestions("user_1", {
      domainSlug: "java_backend",
      page: 1,
      pageSize: 10,
    });

    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.items.map((question) => question.id)).toEqual(["q_seed_jvm", "q_user_owned"]);
  });

  it("creates a manual question owned by the current user", async () => {
    const { service } = createService();

    const question = await service.createQuestion("user_1", {
      domainSlug: "java_backend",
      categorySlug: "concurrency",
      type: "scenario",
      difficulty: "hard",
      title: "线程池参数如何设置？",
      content: "请结合生产场景说明线程池核心参数的设置思路。",
      tags: ["Java 并发", "线程池"],
    });

    expect(question.userId).toBe("user_1");
    expect(question.sourceType).toBe("manual");
    expect(question.aiGenerated).toBe(false);
    expect(question.tags).toEqual(["Java 并发", "线程池"]);
  });

  it("updates only questions owned by the current user", async () => {
    const { service } = createService();

    const updated = await service.updateQuestion("user_1", "q_user_owned", {
      title: "Spring Boot 条件装配如何工作？",
    });

    expect(updated.title).toBe("Spring Boot 条件装配如何工作？");
    await expect(() => service.updateQuestion("user_1", "q_seed_jvm", { title: "改种子题" })).rejects.toThrow(
      "Question is not editable",
    );
    await expect(() => service.updateQuestion("user_1", "q_other_user", { title: "改别人题" })).rejects.toThrow(
      "Question not found",
    );
  });

  it("deletes only questions owned by the current user", async () => {
    const { repository, service } = createService();

    await service.deleteQuestion("user_1", "q_user_owned");

    expect(repository.questions.some((question) => question.id === "q_user_owned")).toBe(false);
    await expect(() => service.deleteQuestion("user_1", "q_seed_jvm")).rejects.toThrow("Question is not editable");
  });
});

function assertQuestionType(_type: QuestionType) {}
function assertDifficulty(_difficulty: DifficultyLevel) {}
function assertQuestion(_question: Question) {}

void assertQuestionType;
void assertDifficulty;
void assertQuestion;
