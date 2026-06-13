export const AI_JOB_REPOSITORY = Symbol("AI_JOB_REPOSITORY");
export const AI_JOB_STATE_REPOSITORY = Symbol("AI_JOB_STATE_REPOSITORY");
export const AI_TASK_QUEUE = Symbol("AI_TASK_QUEUE");

export interface AiJobStateRepository {
  markRunning(jobId: string): Promise<void>;
  markSucceeded(
    jobId: string,
    input: {
      output: Record<string, unknown>;
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
