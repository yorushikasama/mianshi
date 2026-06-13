import { createHash } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { z } from "zod";
import {
  AiJobListResultSchema,
  CreateAiJobInputSchema,
  aiJobStatuses,
  type AiJob,
  type AiJobListResult,
  type AiJobStatus,
  type AiJobType,
} from "@mianshi/shared";
import { AI_JOB_REPOSITORY, AI_TASK_QUEUE } from "./ai-job.tokens";

const AiJobListQuerySchema = z.object({
  status: z.enum(aiJobStatuses).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export interface AiJobRepository {
  createJob(input: {
    userId: string;
    type: AiJobType;
    input: Record<string, unknown>;
    inputHash: string;
  }): Promise<AiJob>;
  updateJob(
    jobId: string,
    input: Partial<Pick<AiJob, "status" | "queueJobId" | "error">>,
  ): Promise<AiJob | null>;
  findJobById(jobId: string): Promise<AiJob | null>;
  listJobs(input: {
    userId: string;
    status?: AiJobStatus;
    page: number;
    pageSize: number;
  }): Promise<{ items: AiJob[]; total: number }>;
}

export interface AiTaskQueue {
  enqueue(job: AiJob): Promise<{ queueJobId: string }>;
}

@Injectable()
export class AiJobService {
  constructor(
    @Inject(AI_JOB_REPOSITORY)
    private readonly aiJobRepository: AiJobRepository,
    @Inject(AI_TASK_QUEUE)
    private readonly aiTaskQueue: AiTaskQueue,
  ) {}

  async createJob(userId: string, input: unknown): Promise<AiJob> {
    const parsedInput = CreateAiJobInputSchema.parse(input);
    const job = await this.aiJobRepository.createJob({
      userId,
      type: parsedInput.type,
      input: parsedInput.input,
      inputHash: hashJobInput(parsedInput.type, parsedInput.input),
    });

    try {
      const enqueued = await this.aiTaskQueue.enqueue(job);
      return (await this.aiJobRepository.updateJob(job.id, {
        queueJobId: enqueued.queueJobId,
        status: "pending",
        error: null,
      })) ?? job;
    } catch (error) {
      return (await this.aiJobRepository.updateJob(job.id, {
        status: "failed",
        error: toErrorMessage(error),
      })) ?? {
        ...job,
        status: "failed",
        error: toErrorMessage(error),
      };
    }
  }

  async listJobs(userId: string, input: unknown): Promise<AiJobListResult> {
    const parsedInput = AiJobListQuerySchema.parse(input ?? {});
    const result = await this.aiJobRepository.listJobs({
      userId,
      status: parsedInput.status,
      page: parsedInput.page,
      pageSize: parsedInput.pageSize,
    });

    return AiJobListResultSchema.parse({
      items: result.items,
      total: result.total,
      page: parsedInput.page,
      pageSize: parsedInput.pageSize,
      totalPages: Math.ceil(result.total / parsedInput.pageSize),
    });
  }

  async getJob(userId: string, jobId: string): Promise<AiJob> {
    const job = await this.aiJobRepository.findJobById(jobId);

    if (!job || job.userId !== userId) {
      throw new Error("AI job not found");
    }

    return job;
  }
}

function hashJobInput(type: AiJobType, input: Record<string, unknown>) {
  return createHash("sha256")
    .update(JSON.stringify({ type, input: sortJsonObject(input) }))
    .digest("hex");
}

function sortJsonObject(input: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(input).sort(([left], [right]) => left.localeCompare(right)));
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "AI job enqueue failed";
}
