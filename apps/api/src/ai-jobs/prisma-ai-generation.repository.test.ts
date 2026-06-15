import { describe, expect, it, vi } from "vitest";
import { PrismaAiGenerationRepository } from "./prisma-ai-generation.repository";

describe("PrismaAiGenerationRepository", () => {
  it("upserts prompt versions by name and version", async () => {
    const prisma = {
      promptVersion: {
        upsert: vi.fn(async () => ({
          id: "prompt_1",
          name: "generate_questions:java_backend",
          version: "v1",
          template: "template",
          outputSchema: { type: "object" },
        })),
      },
    };
    const repository = new PrismaAiGenerationRepository(prisma as never);

    const promptVersion = await repository.upsertPromptVersion({
      name: "generate_questions:java_backend",
      version: "v1",
      template: "template",
      outputSchema: { type: "object" },
    });

    expect(prisma.promptVersion.upsert).toHaveBeenCalledWith({
      where: {
        name_version: {
          name: "generate_questions:java_backend",
          version: "v1",
        },
      },
      update: {
        template: "template",
        outputSchema: { type: "object" },
      },
      create: {
        name: "generate_questions:java_backend",
        version: "v1",
        template: "template",
        outputSchema: { type: "object" },
      },
    });
    expect(promptVersion.id).toBe("prompt_1");
  });

  it("creates AI generated questions as user-owned records with prompt metadata", async () => {
    const tx = {
      domain: {
        findUniqueOrThrow: vi.fn(async () => ({ id: "domain_1", slug: "java_backend" })),
      },
      category: {
        findUniqueOrThrow: vi.fn(async () => ({ id: "category_1", slug: "jvm" })),
      },
      question: {
        create: vi.fn(async () => ({
          id: "q_ai_1",
          userId: "user_1",
          domain: { slug: "java_backend" },
          category: { slug: "jvm" },
          type: "scenario",
          difficulty: "medium",
          title: "线上 Full GC 频繁时你如何排查？",
          content: "请结合 JVM 指标、日志和业务流量说明你的排查路径。",
          tags: [{ tag: { name: "JVM" } }, { tag: { name: "GC" } }],
          sourceType: "ai_generated",
          aiGenerated: true,
          createdAt: new Date("2026-06-15T00:00:00.000Z"),
          updatedAt: new Date("2026-06-15T00:00:00.000Z"),
        })),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
    };
    const repository = new PrismaAiGenerationRepository(prisma as never);

    const questions = await repository.createGeneratedQuestions({
      userId: "user_1",
      questions: [
        {
          domainSlug: "java_backend",
          categorySlug: "jvm",
          type: "scenario",
          difficulty: "medium",
          title: "线上 Full GC 频繁时你如何排查？",
          content: "请结合 JVM 指标、日志和业务流量说明你的排查路径。",
          tags: ["JVM", "GC"],
        },
      ],
      model: "gpt-5.5",
      promptVersionId: "prompt_1",
      tokenUsage: 321,
    });

    expect(tx.question.create).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        domainId: "domain_1",
        categoryId: "category_1",
        title: "线上 Full GC 频繁时你如何排查？",
        content: "请结合 JVM 指标、日志和业务流量说明你的排查路径。",
        type: "scenario",
        difficulty: "medium",
        sourceType: "ai_generated",
        aiGenerated: true,
        model: "gpt-5.5",
        promptVersionId: "prompt_1",
        tags: {
          create: [
            {
              tag: {
                connectOrCreate: {
                  where: { name: "JVM" },
                  create: { name: "JVM" },
                },
              },
            },
            {
              tag: {
                connectOrCreate: {
                  where: { name: "GC" },
                  create: { name: "GC" },
                },
              },
            },
          ],
        },
      },
      include: expect.any(Object),
    });
    expect(questions).toEqual([
      expect.objectContaining({
        id: "q_ai_1",
        sourceType: "ai_generated",
        aiGenerated: true,
      }),
    ]);
  });

  it("loads only questions visible to the current user for answer generation", async () => {
    const prisma = {
      question: {
        findFirst: vi.fn(async () => ({
          id: "q_1",
          userId: null,
          domain: { slug: "java_backend" },
          category: { slug: "jvm" },
          type: "scenario",
          difficulty: "medium",
          title: "线上 Full GC 频繁时你如何排查？",
          content: "请结合 JVM 指标、日志和业务流量说明你的排查路径。",
          tags: [{ tag: { name: "JVM" } }],
        })),
      },
    };
    const repository = new PrismaAiGenerationRepository(prisma as never);

    const question = await repository.findQuestionContext({
      userId: "user_1",
      questionId: "q_1",
    });

    expect(prisma.question.findFirst).toHaveBeenCalledWith({
      where: {
        id: "q_1",
        OR: [{ userId: null }, { userId: "user_1" }],
      },
      include: expect.any(Object),
    });
    expect(question?.domainSlug).toBe("java_backend");
  });

  it("creates AI generated answers as drafts with prompt metadata", async () => {
    const prisma = {
      answer: {
        create: vi.fn(async () => ({
          id: "answer_1",
          questionId: "q_1",
          answerType: "standard",
          status: "draft",
          content: "标准答案",
          keyPoints: ["要点"],
          model: "gpt-5.5",
          promptVersionId: "prompt_1",
          tokenUsage: 222,
        })),
      },
    };
    const repository = new PrismaAiGenerationRepository(prisma as never);

    const answer = await repository.createDraftAnswer({
      questionId: "q_1",
      answer: {
        answerType: "standard",
        content: "标准答案",
        keyPoints: ["要点"],
      },
      model: "gpt-5.5",
      promptVersionId: "prompt_1",
      tokenUsage: 222,
    });

    expect(prisma.answer.create).toHaveBeenCalledWith({
      data: {
        questionId: "q_1",
        answerType: "standard",
        status: "draft",
        content: "标准答案",
        keyPoints: ["要点"],
        model: "gpt-5.5",
        promptVersionId: "prompt_1",
        tokenUsage: 222,
      },
    });
    expect(answer.status).toBe("draft");
  });

  it("loads scoring context with visible question, latest answer, and user review memory", async () => {
    const prisma = {
      question: {
        findFirst: vi.fn(async () => ({
          id: "q_1",
          userId: "user_1",
          domain: { slug: "java_backend" },
          category: { slug: "jvm" },
          type: "scenario",
          difficulty: "medium",
          title: "线上 Full GC 频繁时你如何排查？",
          content: "请结合 JVM 指标、日志和业务流量说明你的排查路径。",
          tags: [{ tag: { name: "JVM" } }],
          answers: [
            {
              id: "answer_1",
              answerType: "standard",
              content: "参考答案",
              keyPoints: ["GC Roots", "GC 日志"],
            },
          ],
          reviewStates: [
            {
              stability: 2.3,
              difficulty: 4.2,
              lastReviewedAt: new Date("2026-06-07T00:00:00.000Z"),
            },
          ],
        })),
      },
    };
    const repository = new PrismaAiGenerationRepository(prisma as never);

    const context = await repository.findScoringContext({
      userId: "user_1",
      questionId: "q_1",
    });

    expect(prisma.question.findFirst).toHaveBeenCalledWith({
      where: {
        id: "q_1",
        OR: [{ userId: null }, { userId: "user_1" }],
      },
      include: expect.objectContaining({
        answers: expect.objectContaining({
          take: 1,
        }),
        reviewStates: {
          where: { userId: "user_1" },
          take: 1,
        },
      }),
    });
    expect(context).toEqual({
      question: expect.objectContaining({ id: "q_1", domainSlug: "java_backend" }),
      answer: {
        id: "answer_1",
        answerType: "standard",
        content: "参考答案",
        keyPoints: ["GC Roots", "GC 日志"],
      },
      reviewState: {
        stability: 2.3,
        difficulty: 4.2,
        lastReviewedAt: new Date("2026-06-07T00:00:00.000Z"),
      },
    });
  });

  it("creates scored practice attempts and updates FSRS review memory", async () => {
    const tx = {
      practiceAttempt: {
        create: vi.fn(async () => undefined),
      },
      reviewState: {
        upsert: vi.fn(async () => undefined),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
    };
    const repository = new PrismaAiGenerationRepository(prisma as never);

    const attempt = {
      id: "attempt_q_1_1780876800000",
      questionId: "q_1",
      submittedAnswer: "GC Roots 是可达性分析的起点。",
      score: 86,
      rating: "easy",
      feedbackSummary: "回答不错。",
      matchedKeyPoints: ["GC Roots"],
      missingKeyPoints: ["GC 日志"],
      followUpQuestions: ["如果 Full GC 频繁，你会先看什么？"],
      nextReviewAt: "2026-06-16T00:00:00.000Z",
      createdAt: "2026-06-08T00:00:00.000Z",
    } as const;

    const savedAttempt = await repository.createScoredPracticeAttempt({
      userId: "user_1",
      attempt,
      reviewSchedule: {
        rating: "easy",
        stability: 8.2956,
        difficulty: 1,
        nextReviewAt: "2026-06-16T00:00:00.000Z",
      },
    });

    expect(tx.practiceAttempt.create).toHaveBeenCalledWith({
      data: {
        id: "attempt_q_1_1780876800000",
        userId: "user_1",
        questionId: "q_1",
        userAnswer: "GC Roots 是可达性分析的起点。",
        aiScore: 86,
        rating: "easy",
        aiFeedback: "回答不错。",
        matchedPoints: ["GC Roots"],
        missingPoints: ["GC 日志"],
        followupQuestions: ["如果 Full GC 频繁，你会先看什么？"],
        nextReviewAt: new Date("2026-06-16T00:00:00.000Z"),
        createdAt: new Date("2026-06-08T00:00:00.000Z"),
      },
    });
    expect(tx.reviewState.upsert).toHaveBeenCalledWith({
      where: {
        userId_questionId: {
          userId: "user_1",
          questionId: "q_1",
        },
      },
      create: {
        userId: "user_1",
        questionId: "q_1",
        stability: 8.2956,
        difficulty: 1,
        dueAt: new Date("2026-06-16T00:00:00.000Z"),
        lastReviewedAt: new Date("2026-06-08T00:00:00.000Z"),
        reviewCount: 1,
      },
      update: {
        stability: 8.2956,
        difficulty: 1,
        dueAt: new Date("2026-06-16T00:00:00.000Z"),
        lastReviewedAt: new Date("2026-06-08T00:00:00.000Z"),
        reviewCount: {
          increment: 1,
        },
      },
    });
    expect(savedAttempt).toBe(attempt);
  });
});
