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

  it("generates follow-up questions from a user-owned scored attempt", async () => {
    const repository = createRepository();
    const modelClient = createModelClient({
      followupOutput: {
        followUpQuestions: [
          "如果 GC 日志显示 promotion failed，你会如何继续定位？",
          "你会如何向面试官说明这次排查的取舍？",
        ],
      },
      tokenUsage: 144,
    });
    const executor = new AiTaskExecutorService(repository as never, modelClient as never);

    const result = await executor.execute({
      jobId: "job_6",
      userId: "user_1",
      type: "generate_followup",
      input: {
        attemptId: "attempt_q_1_1780876800000",
        count: 2,
      },
    });

    expect(repository.findFollowupContext).toHaveBeenCalledWith({
      userId: "user_1",
      attemptId: "attempt_q_1_1780876800000",
    });
    expect(repository.upsertPromptVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "generate_followup:java_backend",
        version: "v1",
        outputSchema: expect.objectContaining({ type: "object" }),
      }),
    );
    expect(modelClient.generateFollowup).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          attemptId: "attempt_q_1_1780876800000",
          count: 2,
        },
        context: expect.objectContaining({
          attempt: expect.objectContaining({
            id: "attempt_q_1_1780876800000",
            missingKeyPoints: ["GC 日志"],
          }),
          question: expect.objectContaining({ id: "q_1" }),
          answer: expect.objectContaining({ id: "answer_seed_1" }),
        }),
        promptVersion: expect.objectContaining({ id: "prompt_1" }),
      }),
    );
    expect(repository.updatePracticeAttemptFollowups).toHaveBeenCalledWith({
      userId: "user_1",
      attemptId: "attempt_q_1_1780876800000",
      followUpQuestions: [
        "如果 GC 日志显示 promotion failed，你会如何继续定位？",
        "你会如何向面试官说明这次排查的取舍？",
      ],
    });
    expect(result).toEqual({
      output: {
        attemptId: "attempt_q_1_1780876800000",
        followUpQuestions: [
          "如果 GC 日志显示 promotion failed，你会如何继续定位？",
          "你会如何向面试官说明这次排查的取舍？",
        ],
      },
      model: "gpt-5.5",
      promptVersionId: "prompt_1",
      tokenUsage: 144,
    });
  });

  it("embeds a source document by chunking text and replacing user-isolated chunks", async () => {
    const repository = createRepository();
    const modelClient = createModelClient({
      embeddings: [
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6],
        [0.7, 0.8, 0.9],
        [1, 1.1, 1.2],
      ],
      tokenUsage: 88,
    });
    const executor = new AiTaskExecutorService(repository as never, modelClient as never);

    const result = await executor.execute({
      jobId: "job_8",
      userId: "user_1",
      type: "embed_document",
      input: {
        documentId: "doc_1",
        maxChunkChars: 12,
        overlapChars: 4,
      },
    });

    expect(repository.findSourceDocumentForEmbedding).toHaveBeenCalledWith({
      userId: "user_1",
      documentId: "doc_1",
    });
    expect(modelClient.embedTexts).toHaveBeenCalledWith({
      texts: ["0123456789ab", "89abcdefghij", "ghijklmnopqr", "opqrstuvwxyz"],
    });
    expect(repository.replaceDocumentChunks).toHaveBeenCalledWith({
      userId: "user_1",
      documentId: "doc_1",
      chunks: [
        expect.objectContaining({
          chunkIndex: 0,
          content: "0123456789ab",
          embedding: [0.1, 0.2, 0.3],
        }),
        expect.objectContaining({
          chunkIndex: 1,
          content: "89abcdefghij",
          embedding: [0.4, 0.5, 0.6],
        }),
        expect.objectContaining({
          chunkIndex: 2,
          content: "ghijklmnopqr",
          embedding: [0.7, 0.8, 0.9],
        }),
        expect.objectContaining({
          chunkIndex: 3,
          content: "opqrstuvwxyz",
          embedding: [1, 1.1, 1.2],
        }),
      ],
    });
    expect(result).toEqual({
      output: {
        documentId: "doc_1",
        chunkCount: 4,
      },
      model: "text-embedding-3-small",
      tokenUsage: 88,
    });
  });

  it("generates personalized questions from user-isolated RAG chunks", async () => {
    const repository = createRepository();
    const modelClient = createModelClient({
      embeddings: [[0.21, 0.34, 0.55]],
      questionsOutput: {
        questions: [
          {
            domainSlug: "java_backend",
            categorySlug: "redis",
            type: "project_deep_dive",
            difficulty: "hard",
            title: "你在订单系统里如何设计 Redis 缓存一致性方案？",
            content: "请结合简历中的订单链路优化项目，说明缓存更新策略、降级方案和一致性取舍。",
            tags: ["Redis", "项目经历", "缓存一致性"],
          },
        ],
      },
      tokenUsage: 377,
    });
    const executor = new AiTaskExecutorService(repository as never, modelClient as never);

    const result = await executor.execute({
      jobId: "job_9",
      userId: "user_1",
      type: "rag_generate_questions",
      input: {
        domainSlug: "java_backend",
        categorySlug: "redis",
        count: 1,
        focus: "订单系统 Redis 缓存一致性",
        documentType: "resume",
        topK: 2,
      },
    });

    expect(modelClient.embedTexts).toHaveBeenCalledWith({
      texts: ["java_backend redis 订单系统 Redis 缓存一致性"],
    });
    expect(repository.findRelevantDocumentChunks).toHaveBeenCalledWith({
      userId: "user_1",
      queryEmbedding: [0.21, 0.34, 0.55],
      documentType: "resume",
      topK: 2,
    });
    expect(repository.upsertPromptVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "rag_generate_questions:java_backend",
        version: "v1",
        outputSchema: expect.objectContaining({ type: "object" }),
      }),
    );
    expect(modelClient.generateQuestions).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          domainSlug: "java_backend",
          categorySlug: "redis",
          count: 1,
          focus: "订单系统 Redis 缓存一致性",
          documentType: "resume",
          topK: 2,
        },
        ragContext: [
          expect.objectContaining({
            documentId: "doc_1",
            documentType: "resume",
            documentTitle: "Java 后端简历",
            content: "订单系统使用 Redis 缓存热点商品和订单摘要，曾处理缓存击穿和一致性问题。",
          }),
        ],
        promptVersion: expect.objectContaining({ id: "prompt_1" }),
      }),
    );
    expect(repository.createGeneratedQuestions).toHaveBeenCalledWith({
      userId: "user_1",
      questions: [
        {
          domainSlug: "java_backend",
          categorySlug: "redis",
          type: "project_deep_dive",
          difficulty: "hard",
          title: "你在订单系统里如何设计 Redis 缓存一致性方案？",
          content: "请结合简历中的订单链路优化项目，说明缓存更新策略、降级方案和一致性取舍。",
          tags: ["Redis", "项目经历", "缓存一致性"],
        },
      ],
      model: "gpt-5.5",
      promptVersionId: "prompt_1",
      tokenUsage: 754,
    });
    expect(result).toEqual({
      output: {
        questions: [
          expect.objectContaining({
            id: "q_ai_1",
            sourceType: "ai_generated",
          }),
        ],
        sources: [
          {
            chunkId: "chunk_1",
            documentId: "doc_1",
            documentType: "resume",
            documentTitle: "Java 后端简历",
            chunkIndex: 0,
            score: 0.91,
          },
        ],
      },
      model: "gpt-5.5",
      promptVersionId: "prompt_1",
      tokenUsage: 754,
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

  it("rejects invalid structured follow-up output before updating the attempt", async () => {
    const repository = createRepository();
    const modelClient = createModelClient({
      followupOutput: {
        followUpQuestions: [],
      },
    });
    const executor = new AiTaskExecutorService(repository as never, modelClient as never);

    await expect(
      executor.execute({
        jobId: "job_7",
        userId: "user_1",
        type: "generate_followup",
        input: {
          attemptId: "attempt_q_1_1780876800000",
        },
      }),
    ).rejects.toThrow();

    expect(repository.updatePracticeAttemptFollowups).not.toHaveBeenCalled();
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
    findFollowupContext: vi.fn(async () => ({
      attempt: {
        id: "attempt_q_1_1780876800000",
        questionId: "q_1",
        submittedAnswer: "GC Roots 是可达性分析的起点。",
        score: 86,
        feedbackSummary: "回答不错。",
        matchedKeyPoints: ["GC Roots"],
        missingKeyPoints: ["GC 日志"],
        followUpQuestions: ["如果 Full GC 频繁，你会先看什么？"],
        createdAt: "2026-06-08T00:00:00.000Z",
      },
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
    })),
    updatePracticeAttemptFollowups: vi.fn(async (input) => input.followUpQuestions),
    findSourceDocumentForEmbedding: vi.fn(async () => ({
      id: "doc_1",
      userId: "user_1",
      documentType: "resume",
      title: "Java 后端简历",
      content: "0123456789abcdefghijklmnopqrstuvwxyz",
    })),
    replaceDocumentChunks: vi.fn(async (input) =>
      input.chunks.map((chunk: Record<string, unknown>, index: number) => ({
        id: `chunk_${index + 1}`,
        documentId: input.documentId,
        ...chunk,
      })),
    ),
    findRelevantDocumentChunks: vi.fn(async () => [
      {
        id: "chunk_1",
        documentId: "doc_1",
        documentType: "resume",
        documentTitle: "Java 后端简历",
        chunkIndex: 0,
        content: "订单系统使用 Redis 缓存热点商品和订单摘要，曾处理缓存击穿和一致性问题。",
        metadata: {
          documentId: "doc_1",
          chunkIndex: 0,
          startChar: 0,
          endChar: 36,
        },
        score: 0.91,
      },
    ]),
  };
}

function createModelClient(input: {
  questionsOutput?: unknown;
  answerOutput?: unknown;
  scoreOutput?: unknown;
  followupOutput?: unknown;
  embeddings?: number[][];
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
    generateFollowup: vi.fn(async () => ({
      output: input.followupOutput,
      model: "gpt-5.5",
      tokenUsage: input.tokenUsage ?? 100,
    })),
    embedTexts: vi.fn(async () => ({
      embeddings: input.embeddings ?? [],
      model: "text-embedding-3-small",
      tokenUsage: input.tokenUsage ?? 100,
    })),
  };
}
