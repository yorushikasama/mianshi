import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import { Langfuse } from "langfuse";
import type { AiTraceRecord, AiTraceRecorder } from "./ai-job.tokens";

@Injectable()
export class LangfuseAiTraceRecorder implements AiTraceRecorder, OnModuleDestroy {
  private readonly client = createLangfuseClient();

  record(input: AiTraceRecord) {
    if (!this.client) {
      return;
    }

    this.client.trace({
      id: input.jobId,
      name: `ai_job.${input.type}`,
      userId: input.userId,
      metadata: input,
      tags: ["ai-job", input.type, input.status],
    });
  }

  async onModuleDestroy() {
    await this.client?.shutdownAsync();
  }
}

function createLangfuseClient() {
  const publicKey = readConfiguredEnv("LANGFUSE_PUBLIC_KEY");
  const secretKey = readConfiguredEnv("LANGFUSE_SECRET_KEY");

  if (!publicKey || !secretKey) {
    return undefined;
  }

  return new Langfuse({
    publicKey,
    secretKey,
    baseUrl: readConfiguredEnv("LANGFUSE_BASE_URL"),
  });
}

function readConfiguredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value || value === "replace-me") {
    return undefined;
  }

  return value;
}
