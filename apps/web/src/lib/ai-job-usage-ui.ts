import type { AiJob, AiJobUsageSummary } from "@mianshi/shared";

export function formatAiJobUsageSummary(summary: AiJobUsageSummary) {
  return {
    totalJobs: String(summary.totalJobs),
    successRate: `${summary.totalJobs ? Math.round((summary.succeededJobs / summary.totalJobs) * 100) : 0}%`,
    totalTokenUsage: formatTokens(summary.totalTokenUsage),
    averageLatency: summary.averageLatencyMs === null ? "--" : `${summary.averageLatencyMs} ms`,
    estimatedCost: `$${formatCost(summary.estimatedCostUsd)}`,
  };
}

export function formatAiJobFailureSummary(job: AiJob) {
  return {
    type: jobTypeLabels[job.type],
    error: job.error ?? "任务失败",
    retryCount: `${job.retryCount} 次重试`,
  };
}

const jobTypeLabels: Record<AiJob["type"], string> = {
  generate_questions: "生成题目",
  generate_answer: "生成答案",
  score_attempt: "练习评分",
  generate_followup: "生成追问",
  embed_document: "文档索引",
  embed_question: "题目索引",
  rag_generate_questions: "RAG 生成题目",
};

function formatTokens(tokens: number) {
  if (tokens < 1000) {
    return String(tokens);
  }

  return `${(tokens / 1000).toFixed(1)}k`;
}

function formatCost(cost: number) {
  if (cost === 0) {
    return "0";
  }

  return cost < 0.01 ? cost.toFixed(6) : cost.toFixed(4);
}
