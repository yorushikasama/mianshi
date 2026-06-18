import type { AiJobStatus } from "@mianshi/shared";

export function canCancelAiJob(job: { status: AiJobStatus }) {
  return job.status === "pending";
}
