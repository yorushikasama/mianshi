import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Worker, type Job } from "bullmq";
import type { AiJobType } from "@mianshi/shared";
import { AI_TASK_QUEUE_NAME, createRedisConnectionOptions } from "./bullmq-ai-task.queue";
import { AI_JOB_STATE_REPOSITORY, type AiJobStateRepository } from "./ai-job.tokens";

type AiTaskPayload = {
  jobId: string;
  type: AiJobType;
};

@Injectable()
export class AiJobWorker implements OnModuleInit, OnModuleDestroy {
  private worker?: Worker<AiTaskPayload>;

  constructor(
    @Inject(AI_JOB_STATE_REPOSITORY)
    private readonly repository: AiJobStateRepository,
  ) {}

  onModuleInit() {
    this.worker = new Worker<AiTaskPayload>(AI_TASK_QUEUE_NAME, (job) => this.process(job), {
      connection: createRedisConnectionOptions(),
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }

  async process(job: Pick<Job<AiTaskPayload>, "data" | "attemptsMade">) {
    const startedAt = Date.now();

    try {
      await this.repository.markRunning(job.data.jobId);
      throw new Error(`AI executor is not implemented yet for ${job.data.type}`);
    } catch (error) {
      await this.repository.markFailed(job.data.jobId, {
        error: toErrorMessage(error),
        retryCount: job.attemptsMade,
        latencyMs: elapsedMs(startedAt),
      });
      throw error;
    }
  }
}

function elapsedMs(startedAt: number) {
  return Math.max(0, Date.now() - startedAt);
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "AI job worker failed";
}
