import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LangfuseAiTraceRecorder } from "./langfuse-ai-trace.recorder";

const langfuse = vi.hoisted(() => {
  const trace = vi.fn();
  const shutdownAsync = vi.fn(async () => undefined);
  const Langfuse = vi.fn(function MockLangfuse() {
    return { trace, shutdownAsync };
  });

  return { Langfuse, trace, shutdownAsync };
});

vi.mock("langfuse", () => ({
  Langfuse: langfuse.Langfuse,
}));

describe("LangfuseAiTraceRecorder", () => {
  const originalEnv = {
    LANGFUSE_PUBLIC_KEY: process.env.LANGFUSE_PUBLIC_KEY,
    LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY,
    LANGFUSE_BASE_URL: process.env.LANGFUSE_BASE_URL,
  };

  beforeEach(() => {
    langfuse.Langfuse.mockClear();
    langfuse.trace.mockClear();
    langfuse.shutdownAsync.mockClear();
  });

  afterEach(() => {
    process.env.LANGFUSE_PUBLIC_KEY = originalEnv.LANGFUSE_PUBLIC_KEY;
    process.env.LANGFUSE_SECRET_KEY = originalEnv.LANGFUSE_SECRET_KEY;
    process.env.LANGFUSE_BASE_URL = originalEnv.LANGFUSE_BASE_URL;
  });

  it("does nothing when Langfuse keys are placeholders", () => {
    process.env.LANGFUSE_PUBLIC_KEY = "replace-me";
    process.env.LANGFUSE_SECRET_KEY = "replace-me";

    const recorder = new LangfuseAiTraceRecorder();

    recorder.record({
      jobId: "job_1",
      userId: "user_1",
      type: "generate_answer",
      status: "succeeded",
      model: "gpt-5.5",
      promptVersionId: "prompt_1",
      tokenUsage: 100,
      latencyMs: 25,
    });

    expect(langfuse.Langfuse).not.toHaveBeenCalled();
    expect(langfuse.trace).not.toHaveBeenCalled();
  });

  it("records only AI job trace metadata", () => {
    process.env.LANGFUSE_PUBLIC_KEY = "pk_test";
    process.env.LANGFUSE_SECRET_KEY = "sk_test";
    process.env.LANGFUSE_BASE_URL = "https://langfuse.example";

    const recorder = new LangfuseAiTraceRecorder();

    recorder.record({
      jobId: "job_1",
      userId: "user_1",
      type: "generate_questions",
      status: "succeeded",
      model: "gpt-5.5",
      promptVersionId: "prompt_1",
      tokenUsage: 321,
      latencyMs: 40,
    });

    expect(langfuse.Langfuse).toHaveBeenCalledWith({
      publicKey: "pk_test",
      secretKey: "sk_test",
      baseUrl: "https://langfuse.example",
    });
    expect(langfuse.trace).toHaveBeenCalledWith({
      id: "job_1",
      name: "ai_job.generate_questions",
      userId: "user_1",
      metadata: {
        jobId: "job_1",
        userId: "user_1",
        type: "generate_questions",
        status: "succeeded",
        model: "gpt-5.5",
        promptVersionId: "prompt_1",
        tokenUsage: 321,
        latencyMs: 40,
      },
      tags: ["ai-job", "generate_questions", "succeeded"],
    });
  });
});
