import { describe, expect, it, vi } from "vitest";
import { OpenAiStructuredOutputClient, getOpenAiConfigFromEnv } from "./openai-structured-output.client";

const promptVersion = {
  id: "prompt_1",
  name: "generate_questions:java_backend",
  version: "v1",
  template: "system prompt",
  outputSchema: { type: "object" },
};

describe("OpenAiStructuredOutputClient", () => {
  it("requires an API key and accepts a model from environment", () => {
    expect(() => getOpenAiConfigFromEnv({})).toThrow("OPENAI_API_KEY is required");
    expect(
      getOpenAiConfigFromEnv({
        OPENAI_API_KEY: " key ",
        OPENAI_MODEL: " gpt-5.5 ",
        OPENAI_EMBEDDING_MODEL: " text-embedding-3-small ",
      }),
    ).toEqual({
      apiKey: "key",
      model: "gpt-5.5",
      embeddingModel: "text-embedding-3-small",
    });
  });

  it("generates questions with OpenAI structured output parsing", async () => {
    const parse = vi.fn(async () => ({
      model: "gpt-5.5",
      usage: { total_tokens: 321 },
      choices: [
        {
          message: {
            parsed: {
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
          },
        },
      ],
    }));
    const client = new OpenAiStructuredOutputClient(
      { chat: { completions: { parse } } } as never,
      { apiKey: "key", model: "gpt-5.5" },
    );

    const result = await client.generateQuestions({
      input: {
        domainSlug: "java_backend",
        categorySlug: "jvm",
        count: 1,
      },
      promptVersion,
    });

    expect(parse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-5.5",
        response_format: expect.any(Object),
        messages: [
          { role: "system", content: "system prompt" },
          {
            role: "user",
            content: expect.stringContaining("generate_questions"),
          },
        ],
      }),
    );
    expect(result).toEqual({
      output: {
        questions: [
          expect.objectContaining({
            title: "线上 Full GC 频繁时你如何排查？",
          }),
        ],
      },
      model: "gpt-5.5",
      tokenUsage: 321,
    });
  });

  it("throws when the model refuses instead of returning parsed structured output", async () => {
    const parse = vi.fn(async () => ({
      model: "gpt-5.5",
      usage: { total_tokens: 10 },
      choices: [
        {
          message: {
            refusal: "I cannot help with that.",
          },
        },
      ],
    }));
    const client = new OpenAiStructuredOutputClient(
      { chat: { completions: { parse } } } as never,
      { apiKey: "key", model: "gpt-5.5" },
    );

    await expect(
      client.generateQuestions({
        input: {
          domainSlug: "java_backend",
          count: 1,
        },
        promptVersion,
      }),
    ).rejects.toThrow("OpenAI refused structured output");
  });

  it("includes RAG context when generating personalized questions", async () => {
    const parse = vi.fn(async () => ({
      model: "gpt-5.5",
      usage: { total_tokens: 377 },
      choices: [
        {
          message: {
            parsed: {
              questions: [
                {
                  domainSlug: "java_backend",
                  categorySlug: "redis",
                  type: "project_deep_dive",
                  difficulty: "hard",
                  title: "你在订单系统里如何设计 Redis 缓存一致性方案？",
                  content: "请结合简历中的订单链路优化项目说明你的方案。",
                  tags: ["Redis", "项目经历"],
                },
              ],
            },
          },
        },
      ],
    }));
    const client = new OpenAiStructuredOutputClient(
      { chat: { completions: { parse } } } as never,
      { apiKey: "key", model: "gpt-5.5" },
    );

    await client.generateQuestions({
      input: {
        domainSlug: "java_backend",
        categorySlug: "redis",
        count: 1,
        focus: "订单系统 Redis 缓存一致性",
      },
      ragContext: [
        {
          chunkId: "chunk_1",
          documentId: "doc_1",
          documentType: "resume",
          documentTitle: "Java 后端简历",
          chunkIndex: 0,
          content: "订单系统使用 Redis 缓存热点商品和订单摘要。",
          score: 0.91,
        },
      ],
      promptVersion: {
        ...promptVersion,
        name: "rag_generate_questions:java_backend",
      },
    });

    expect(parse).toHaveBeenCalledWith(
      expect.objectContaining({
        response_format: expect.any(Object),
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining("ragContext"),
          }),
        ]),
      }),
    );
    expect(parse.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining("订单系统使用 Redis 缓存热点商品和订单摘要"),
          }),
        ]),
      }),
    );
  });

  it("scores practice attempts with structured output parsing", async () => {
    const parse = vi.fn(async () => ({
      model: "gpt-5.5",
      usage: { total_tokens: 198 },
      choices: [
        {
          message: {
            parsed: {
              score: 86,
              feedbackSummary: "回答覆盖主要点，可以补充线上排查指标。",
              matchedKeyPoints: ["GC Roots", "可达性分析"],
              missingKeyPoints: ["GC 日志"],
              followUpQuestions: ["如果 Full GC 频繁，你会先看哪些指标？"],
            },
          },
        },
      ],
    }));
    const client = new OpenAiStructuredOutputClient(
      { chat: { completions: { parse } } } as never,
      { apiKey: "key", model: "gpt-5.5" },
    );

    const result = await client.scoreAttempt({
      input: {
        questionId: "q_1",
        submittedAnswer: "GC Roots 是可达性分析的起点。",
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
        id: "answer_1",
        answerType: "standard",
        content: "参考答案",
        keyPoints: ["GC Roots", "可达性分析", "GC 日志"],
      },
      promptVersion: {
        ...promptVersion,
        name: "score_attempt:java_backend",
      },
    });

    expect(parse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-5.5",
        response_format: expect.any(Object),
        messages: [
          { role: "system", content: "system prompt" },
          {
            role: "user",
            content: expect.stringContaining("score_attempt"),
          },
        ],
      }),
    );
    expect(parse.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining("GC Roots 是可达性分析的起点。"),
          }),
        ]),
      }),
    );
    expect(result).toEqual({
      output: expect.objectContaining({
        score: 86,
        feedbackSummary: "回答覆盖主要点，可以补充线上排查指标。",
      }),
      model: "gpt-5.5",
      tokenUsage: 198,
    });
  });

  it("generates follow-up questions with OpenAI structured output parsing", async () => {
    const parse = vi.fn(async () => ({
      model: "gpt-5.5",
      usage: { total_tokens: 144 },
      choices: [
        {
          message: {
            parsed: {
              followUpQuestions: [
                "如果 GC 日志显示 promotion failed，你会如何继续定位？",
                "你会如何向面试官说明这次排查的取舍？",
              ],
            },
          },
        },
      ],
    }));
    const client = new OpenAiStructuredOutputClient(
      { chat: { completions: { parse } } } as never,
      { apiKey: "key", model: "gpt-5.5" },
    );

    const result = await client.generateFollowup({
      input: {
        attemptId: "attempt_q_1_1780876800000",
        count: 2,
      },
      context: {
        attempt: {
          id: "attempt_q_1_1780876800000",
          questionId: "q_1",
          submittedAnswer: "GC Roots 是可达性分析的起点。",
          score: 86,
          feedbackSummary: "回答覆盖主要点，可以补充线上排查指标。",
          matchedKeyPoints: ["GC Roots", "可达性分析"],
          missingKeyPoints: ["GC 日志"],
          followUpQuestions: [],
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
          id: "answer_1",
          answerType: "standard",
          content: "参考答案",
          keyPoints: ["GC Roots", "可达性分析", "GC 日志"],
        },
      },
      promptVersion: {
        ...promptVersion,
        name: "generate_followup:java_backend",
      },
    });

    expect(parse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-5.5",
        response_format: expect.any(Object),
        messages: [
          { role: "system", content: "system prompt" },
          {
            role: "user",
            content: expect.stringContaining("generate_followup"),
          },
        ],
      }),
    );
    expect(parse.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining("attempt_q_1_1780876800000"),
          }),
        ]),
      }),
    );
    expect(result).toEqual({
      output: {
        followUpQuestions: [
          "如果 GC 日志显示 promotion failed，你会如何继续定位？",
          "你会如何向面试官说明这次排查的取舍？",
        ],
      },
      model: "gpt-5.5",
      tokenUsage: 144,
    });
  });

  it("embeds RAG document chunks with the configured embedding model", async () => {
    const create = vi.fn(async () => ({
      model: "text-embedding-3-small",
      usage: { total_tokens: 42 },
      data: [
        { embedding: [0.1, 0.2, 0.3] },
        { embedding: [0.4, 0.5, 0.6] },
      ],
    }));
    const client = new OpenAiStructuredOutputClient(
      {
        chat: { completions: { parse: vi.fn() } },
        embeddings: { create },
      } as never,
      {
        apiKey: "key",
        model: "gpt-5.5",
        embeddingModel: "text-embedding-3-small",
      },
    );

    const result = await client.embedTexts({
      texts: ["chunk one", "chunk two"],
    });

    expect(create).toHaveBeenCalledWith({
      model: "text-embedding-3-small",
      input: ["chunk one", "chunk two"],
    });
    expect(result).toEqual({
      embeddings: [
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6],
      ],
      model: "text-embedding-3-small",
      tokenUsage: 42,
    });
  });
});
