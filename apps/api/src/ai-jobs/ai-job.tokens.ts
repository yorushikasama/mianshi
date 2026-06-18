import type { AiJob, AiJobType } from "@mianshi/shared";

export const AI_JOB_REPOSITORY = Symbol("AI_JOB_REPOSITORY");
export const AI_JOB_STATE_REPOSITORY = Symbol("AI_JOB_STATE_REPOSITORY");
export const AI_TASK_QUEUE = Symbol("AI_TASK_QUEUE");
export const AI_TASK_EXECUTOR = Symbol("AI_TASK_EXECUTOR");
export const AI_GENERATION_REPOSITORY = Symbol("AI_GENERATION_REPOSITORY");
export const AI_MODEL_CLIENT = Symbol("AI_MODEL_CLIENT");

export interface AiTaskExecutionInput {
  jobId: string;
  userId: string;
  type: AiJobType;
  input: Record<string, unknown>;
}

export interface AiTaskExecutionResult {
  output: Record<string, unknown>;
  model: string;
  promptVersionId?: string | null;
  tokenUsage: number;
}

export interface AiTaskExecutor {
  execute(input: AiTaskExecutionInput): Promise<AiTaskExecutionResult>;
}

export interface AiJobStateRepository {
  findJobById(jobId: string): Promise<Pick<AiJob, "status"> | null>;
  markRunning(jobId: string): Promise<void>;
  markSucceeded(
    jobId: string,
    input: {
      output: Record<string, unknown>;
      model: string;
      promptVersionId?: string | null;
      tokenUsage: number;
      latencyMs: number;
    },
  ): Promise<void>;
  markFailed(
    jobId: string,
    input: {
      error: string;
      retryCount: number;
      latencyMs: number;
    },
  ): Promise<void>;
}
