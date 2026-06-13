import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Queue, type JobsOptions } from "bullmq";
import type { AiJob } from "@mianshi/shared";
import type { AiTaskQueue } from "./ai-job.service";

export const AI_TASK_QUEUE_NAME = "ai-tasks";

type RuntimeEnv = {
  REDIS_URL?: string;
};

@Injectable()
export class BullMqAiTaskQueue implements AiTaskQueue, OnModuleDestroy {
  private readonly ownsQueue: boolean;

  constructor(private readonly queue: Pick<Queue, "add" | "close"> = createAiTaskQueue()) {
    this.ownsQueue = typeof queue.close === "function";
  }

  async enqueue(job: AiJob) {
    const queuedJob = await this.queue.add(
      job.type,
      {
        jobId: job.id,
        userId: job.userId,
        type: job.type,
        input: job.input,
      },
      defaultAiTaskOptions(job.id),
    );

    return {
      queueJobId: String(queuedJob.id ?? job.id),
    };
  }

  async onModuleDestroy() {
    if (this.ownsQueue) {
      await this.queue.close();
    }
  }
}

export function createAiTaskQueue(env: RuntimeEnv = process.env) {
  return new Queue(AI_TASK_QUEUE_NAME, {
    connection: createRedisConnectionOptions(env),
  });
}

export function createRedisConnectionOptions(env: RuntimeEnv = process.env) {
  return {
    url: getRequiredRedisUrl(env),
    maxRetriesPerRequest: null,
  };
}

export function getRequiredRedisUrl(env: RuntimeEnv = process.env) {
  const redisUrl = env.REDIS_URL?.trim();

  if (!redisUrl) {
    throw new Error("REDIS_URL is required to start AI task queue connections.");
  }

  return redisUrl;
}

function defaultAiTaskOptions(jobId: string): JobsOptions {
  return {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    jobId,
    removeOnComplete: {
      age: 24 * 60 * 60,
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 60 * 60,
    },
  };
}
