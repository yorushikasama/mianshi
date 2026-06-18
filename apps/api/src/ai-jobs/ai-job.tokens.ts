import type { AiJob, AiJobType } from "@mianshi/shared";

export const AI_JOB_REPOSITORY = Symbol("AI_JOB_REPOSITORY");
export const AI_JOB_STATE_REPOSITORY = Symbol("AI_JOB_STATE_REPOSITORY");
export const AI_TASK_QUEUE = Symbol("AI_TASK_QUEUE");
export const AI_TASK_EXECUTOR = Symbol("AI_TASK_EXECUTOR");
export const AI_GENERATION_REPOSITORY = Symbol("AI_GENERATION_REPOSITORY");
export const AI_MODEL_CLIENT = Symbol("AI_MODEL_CLIENT");
export const AI_TRACE_RECORDER = Symbol("AI_TRACE_RECORDER");

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

export type AiTraceRecord =
  | {
      jobId: string;
      userId: string;
      type: AiJobType;
      status: "succeeded";
      model: string;
      promptVersionId?: string | null;
      tokenUsage: number;
      latencyMs: number;
    }
  | {
      jobId: string;
      userId: string;
      type: AiJobType;
      status: "failed";
      error: string;
      retryCount: number;
      latencyMs: number;
    };

export interface AiTraceRecorder {
  record(input: AiTraceRecord): Promise<void> | void;
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
