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
      }),
    ).toEqual({
      apiKey: "key",
      model: "gpt-5.5",
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
});
