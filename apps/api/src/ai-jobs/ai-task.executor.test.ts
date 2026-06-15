import { describe, expect, it, vi } from "vitest";
import { AiTaskExecutorService } from "./ai-task.executor";

describe("AiTaskExecutorService", () => {
  it("generates questions through structured output and persists AI trace metadata", async () => {
    const repository = createRepository();
    const modelClient = createModelClient({
      questionsOutput: {
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
      },
      tokenUsage: 321,
    });
    const executor = new AiTaskExecutorService(repository as never, modelClient as never);

    const result = await executor.execute({
      jobId: "job_1",
      userId: "user_1",
      type: "generate_questions",
      input: {
        domainSlug: "java_backend",
        categorySlug: "jvm",
        count: 1,
      },
    });

    expect(repository.upsertPromptVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "generate_questions:java_backend",
        version: "v1",
        outputSchema: expect.objectContaining({ type: "object" }),
      }),
    );
    expect(modelClient.generateQuestions).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          domainSlug: "java_backend",
          categorySlug: "jvm",
          count: 1,
        },
        promptVersion: expect.objectContaining({ id: "prompt_1" }),
      }),
    );
    expect(repository.createGeneratedQuestions).toHaveBeenCalledWith({
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
    expect(result).toEqual({
      output: {
        questions: [
          expect.objectContaining({
            id: "q_ai_1",
            sourceType: "ai_generated",
            aiGenerated: true,
          }),
        ],
      },
      model: "gpt-5.5",
      promptVersionId: "prompt_1",
      tokenUsage: 321,
    });
  });

  it("generates a draft answer for a visible question without overwriting existing answers", async () => {
    const repository = createRepository();
    const modelClient = createModelClient({
      answerOutput: {
        answerType: "interview_style",
        content: "我会先判断是否是流量峰值，再看 GC 日志、堆使用趋势和对象分配热点。",
        keyPoints: ["确认流量和发布变更", "分析 GC 日志", "定位对象分配热点"],
      },
      tokenUsage: 222,
    });
    const executor = new AiTaskExecutorService(repository as never, modelClient as never);

    const result = await executor.execute({
      jobId: "job_2",
      userId: "user_1",
      type: "generate_answer",
      input: {
        questionId: "q_1",
        answerType: "interview_style",
      },
    });

    expect(repository.findQuestionContext).toHaveBeenCalledWith({
      userId: "user_1",
      questionId: "q_1",
    });
    expect(repository.createDraftAnswer).toHaveBeenCalledWith({
      questionId: "q_1",
      answer: {
        answerType: "interview_style",
        content: "我会先判断是否是流量峰值，再看 GC 日志、堆使用趋势和对象分配热点。",
        keyPoints: ["确认流量和发布变更", "分析 GC 日志", "定位对象分配热点"],
      },
      model: "gpt-5.5",
      promptVersionId: "prompt_1",
      tokenUsage: 222,
    });
    expect(result.output).toEqual({
      answer: expect.objectContaining({
        id: "answer_1",
        status: "draft",
      }),
    });
  });

  it("scores a practice attempt with structured output and persists FSRS review state", async () => {
    const repository = createRepository();
    const modelClient = createModelClient({
      scoreOutput: {
        score: 86,
        feedbackSummary: "回答覆盖了 GC Roots 的核心定义，可以补充线上排查指标。",
        matchedKeyPoints: ["GC Roots", "可达性分析"],
        missingKeyPoints: ["GC 日志"],
        followUpQuestions: ["如果 Full GC 频繁，你会先看哪些 JVM 指标？"],
      },
      tokenUsage: 198,
    });
    const executor = new AiTaskExecutorService(repository as never, modelClient as never);

    const result = await executor.execute({
      jobId: "job_4",
      userId: "user_1",
      type: "score_attempt",
      input: {
        questionId: "q_1",
        submittedAnswer: "GC Roots 是可达性分析的起点，包括线程栈、静态变量、常量和 JNI 引用。",
        now: "2026-06-08T00:00:00.000Z",
      },
    });

    expect(repository.findScoringContext).toHaveBeenCalledWith({
      userId: "user_1",
      questionId: "q_1",
    });
    expect(modelClient.scoreAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          questionId: "q_1",
          submittedAnswer: "GC Roots 是可达性分析的起点，包括线程栈、静态变量、常量和 JNI 引用。",
          now: new Date("2026-06-08T00:00:00.000Z"),
        },
        question: expect.objectContaining({ id: "q_1" }),
        answer: expect.objectContaining({ keyPoints: ["GC Roots", "可达性分析", "GC 日志"] }),
      }),
    );
    expect(repository.createScoredPracticeAttempt).toHaveBeenCalledWith({
      userId: "user_1",
      attempt: expect.objectContaining({
        questionId: "q_1",
        score: 86,
        rating: "easy",
        nextReviewAt: "2026-06-16T00:00:00.000Z",
      }),
      reviewSchedule: expect.objectContaining({
        rating: "easy",
        nextReviewAt: "2026-06-16T00:00:00.000Z",
        stability: expect.any(Number),
        difficulty: expect.any(Number),
      }),
    });
    expect(result).toEqual({
      output: {
        attempt: expect.objectContaining({
          id: "attempt_q_1_1780876800000",
          score: 86,
          rating: "easy",
        }),
        reviewSchedule: expect.objectContaining({
          rating: "easy",
        }),
      },
      model: "gpt-5.5",
      promptVersionId: "prompt_1",
      tokenUsage: 198,
    });
  });

  it("rejects invalid structured answer output before writing it to storage", async () => {
    const repository = createRepository();
    const modelClient = createModelClient({
      answerOutput: {
        answerType: "standard",
        content: "缺少要点数组的无效答案。",
        keyPoints: [],
      },
    });
    const executor = new AiTaskExecutorService(repository as never, modelClient as never);

    await expect(
      executor.execute({
        jobId: "job_3",
        userId: "user_1",
        type: "generate_answer",
        input: {
          questionId: "q_1",
        },
      }),
    ).rejects.toThrow();

    expect(repository.createDraftAnswer).not.toHaveBeenCalled();
  });

  it("rejects invalid structured score output before saving the practice attempt", async () => {
    const repository = createRepository();
    const modelClient = createModelClient({
      scoreOutput: {
        score: 101,
        feedbackSummary: "分数越界。",
        matchedKeyPoints: [],
        missingKeyPoints: [],
        followUpQuestions: [],
      },
    });
    const executor = new AiTaskExecutorService(repository as never, modelClient as never);

    await expect(
      executor.execute({
        jobId: "job_5",
        userId: "user_1",
        type: "score_attempt",
        input: {
          questionId: "q_1",
          submittedAnswer: "GC Roots 是可达性分析的起点。",
        },
      }),
    ).rejects.toThrow();

    expect(repository.createScoredPracticeAttempt).not.toHaveBeenCalled();
  });
});

function createRepository() {
  return {
    upsertPromptVersion: vi.fn(async (input) => ({
      id: "prompt_1",
      ...input,
    })),
    createGeneratedQuestions: vi.fn(async (input) =>
      input.questions.map((question: Record<string, unknown>, index: number) => ({
        id: `q_ai_${index + 1}`,
        userId: input.userId,
        ...question,
        sourceType: "ai_generated",
        aiGenerated: true,
      })),
    ),
    findQuestionContext: vi.fn(async () => ({
      id: "q_1",
      userId: null,
      domainSlug: "java_backend",
      categorySlug: "jvm",
      type: "scenario",
      difficulty: "medium",
      title: "线上 Full GC 频繁时你如何排查？",
      content: "请结合 JVM 指标、日志和业务流量说明你的排查路径。",
      tags: ["JVM", "GC"],
    })),
    createDraftAnswer: vi.fn(async (input) => ({
      id: "answer_1",
      questionId: input.questionId,
      answerType: input.answer.answerType,
      status: "draft",
      content: input.answer.content,
      keyPoints: input.answer.keyPoints,
      model: input.model,
      promptVersionId: input.promptVersionId,
      tokenUsage: input.tokenUsage,
    })),
    findScoringContext: vi.fn(async () => ({
      question: {
        id: "q_1",
        userId: null,
        domainSlug: "java_backend",
        categorySlug: "jvm",
        type: "scenario",
        difficulty: "medium",
        title: "线上 Full GC 频繁时你如何排查？",
        content: "请结合 JVM 指标、日志和业务流量说明你的排查路径。",
        tags: ["JVM", "GC"],
      },
      answer: {
        id: "answer_seed_1",
        answerType: "standard",
        content: "GC Roots 是可达性分析的起点，排查时要结合 GC 日志和对象分配热点。",
        keyPoints: ["GC Roots", "可达性分析", "GC 日志"],
      },
      reviewState: null,
    })),
    createScoredPracticeAttempt: vi.fn(async (input) => input.attempt),
  };
}

function createModelClient(input: {
  questionsOutput?: unknown;
  answerOutput?: unknown;
  scoreOutput?: unknown;
  tokenUsage?: number;
}) {
  return {
    generateQuestions: vi.fn(async () => ({
      output: input.questionsOutput,
      model: "gpt-5.5",
      tokenUsage: input.tokenUsage ?? 100,
    })),
    generateAnswer: vi.fn(async () => ({
      output: input.answerOutput,
      model: "gpt-5.5",
      tokenUsage: input.tokenUsage ?? 100,
    })),
    scoreAttempt: vi.fn(async () => ({
      output: input.scoreOutput,
      model: "gpt-5.5",
      tokenUsage: input.tokenUsage ?? 100,
    })),
  };
}
