import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { AiJob, AiJobStatus, AiJobType } from "@mianshi/shared";
import { PrismaService } from "../database/prisma.service";
import type { AiJobRepository } from "./ai-job.service";
import type { AiJobStateRepository } from "./ai-job.tokens";

type PrismaAiJobRow = {
  id: string;
  userId: string;
  type: AiJobType;
  status: AiJobStatus;
  progress: number;
  input: unknown;
  output: unknown | null;
  error: string | null;
  retryCount: number;
  queueJobId: string | null;
  model: string | null;
  promptVersionId: string | null;
  tokenUsage: number;
  latencyMs: number | null;
  inputHash: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaAiJobRepository implements AiJobRepository, AiJobStateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createJob(input: {
    userId: string;
    type: AiJobType;
    input: Record<string, unknown>;
    inputHash: string;
  }) {
    const job = await this.prisma.aiJob.create({
      data: {
        userId: input.userId,
        type: input.type,
        input: toPrismaJson(input.input),
        inputHash: input.inputHash,
      },
    });

    return toAiJob(job as PrismaAiJobRow);
  }

  async updateJob(jobId: string, input: Partial<Pick<AiJob, "status" | "queueJobId" | "error">>) {
    const job = await this.prisma.aiJob.update({
      where: { id: jobId },
      data: input,
    });

    return toAiJob(job as PrismaAiJobRow);
  }

  async findJobById(jobId: string) {
    const job = await this.prisma.aiJob.findUnique({
      where: { id: jobId },
    });

    return job ? toAiJob(job as PrismaAiJobRow) : null;
  }

  async listJobs(input: { userId: string; status?: AiJobStatus; page: number; pageSize: number }) {
    const where = {
      userId: input.userId,
      ...(input.status ? { status: input.status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.aiJob.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      this.prisma.aiJob.count({ where }),
    ]);

    return {
      items: items.map((job) => toAiJob(job as PrismaAiJobRow)),
      total,
    };
  }

  async countJobsCreatedSince(input: { userId: string; since: Date }) {
    return this.prisma.aiJob.count({
      where: {
        userId: input.userId,
        createdAt: {
          gte: input.since,
        },
      },
    });
  }

  async markRunning(jobId: string) {
    await this.prisma.aiJob.update({
      where: { id: jobId },
      data: {
        status: "running",
        progress: 10,
        startedAt: new Date(),
        error: null,
      },
    });
  }

  async markSucceeded(
    jobId: string,
    input: {
      output: Record<string, unknown>;
      model: string;
      promptVersionId?: string | null;
      tokenUsage: number;
      latencyMs: number;
    },
  ) {
    await this.prisma.aiJob.update({
      where: { id: jobId },
      data: {
        status: "succeeded",
        progress: 100,
        output: toPrismaJson(input.output),
        error: null,
        model: input.model,
        promptVersionId: input.promptVersionId ?? null,
        tokenUsage: input.tokenUsage,
        latencyMs: input.latencyMs,
        completedAt: new Date(),
      },
    });
  }

  async markFailed(jobId: string, input: { error: string; retryCount: number; latencyMs: number }) {
    await this.prisma.aiJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        error: input.error,
        retryCount: input.retryCount,
        latencyMs: input.latencyMs,
        completedAt: new Date(),
      },
    });
  }
}

function toAiJob(job: PrismaAiJobRow): AiJob {
  return {
    id: job.id,
    userId: job.userId,
    type: job.type,
    status: job.status,
    progress: job.progress,
    input: asJsonObject(job.input),
    output: job.output,
    error: job.error,
    retryCount: job.retryCount,
    queueJobId: job.queueJobId,
    model: job.model,
    promptVersionId: job.promptVersionId,
    tokenUsage: job.tokenUsage,
    latencyMs: job.latencyMs,
    inputHash: job.inputHash,
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

function asJsonObject(input: unknown): Record<string, unknown> {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }

  return {};
}

function toPrismaJson(input: Record<string, unknown>): Prisma.InputJsonValue {
  return input as Prisma.InputJsonValue;
}
