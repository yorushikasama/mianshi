import "reflect-metadata";
import { MODULE_METADATA } from "@nestjs/common/constants";
import { describe, expect, it } from "vitest";
import { AiJobModule } from "./ai-job.module";
import { AiTaskExecutorService } from "./ai-task.executor";
import {
  AI_GENERATION_REPOSITORY,
  AI_MODEL_CLIENT,
  AI_TASK_EXECUTOR,
  AI_TRACE_RECORDER,
} from "./ai-job.tokens";
import { LangfuseAiTraceRecorder } from "./langfuse-ai-trace.recorder";
import { OpenAiStructuredOutputClient } from "./openai-structured-output.client";
import { PrismaAiGenerationRepository } from "./prisma-ai-generation.repository";

describe("AiJobModule", () => {
  it("wires AI task executor with persistence and model client adapters", () => {
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AiJobModule) as unknown[];

    expect(providers).toEqual(
      expect.arrayContaining([
        AiTaskExecutorService,
        PrismaAiGenerationRepository,
        LangfuseAiTraceRecorder,
        expect.objectContaining({
          provide: AI_TASK_EXECUTOR,
          useExisting: AiTaskExecutorService,
        }),
        expect.objectContaining({
          provide: AI_GENERATION_REPOSITORY,
          useExisting: PrismaAiGenerationRepository,
        }),
        expect.objectContaining({
          provide: AI_MODEL_CLIENT,
          useFactory: expect.any(Function),
        }),
        expect.objectContaining({
          provide: AI_TRACE_RECORDER,
          useExisting: LangfuseAiTraceRecorder,
        }),
      ]),
    );
    expect(providers).not.toEqual(expect.arrayContaining([OpenAiStructuredOutputClient]));
  });
});
