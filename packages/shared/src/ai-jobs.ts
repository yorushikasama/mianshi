import { z } from "zod";

export const aiJobTypes = [
  "generate_questions",
  "generate_answer",
  "score_attempt",
  "generate_followup",
  "embed_document",
  "embed_question",
  "rag_generate_questions",
] as const;

export const aiJobStatuses = ["pending", "running", "succeeded", "failed", "canceled"] as const;

const JsonObjectSchema = z.record(z.string(), z.unknown());

export const CreateAiJobInputSchema = z.object({
  type: z.enum(aiJobTypes),
  input: JsonObjectSchema.default({}),
});

export const AiJobSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  type: z.enum(aiJobTypes),
  status: z.enum(aiJobStatuses),
  progress: z.number().int().min(0).max(100),
  input: JsonObjectSchema,
  output: z.unknown().nullable(),
  error: z.string().nullable(),
  retryCount: z.number().int().nonnegative(),
  queueJobId: z.string().nullable(),
  model: z.string().nullable(),
  promptVersionId: z.string().nullable(),
  tokenUsage: z.number().int().nonnegative(),
  latencyMs: z.number().int().nonnegative().nullable(),
  inputHash: z.string().nullable(),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const AiJobListResultSchema = z.object({
  items: z.array(AiJobSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

export type AiJobType = (typeof aiJobTypes)[number];
export type AiJobStatus = (typeof aiJobStatuses)[number];
export type CreateAiJobInput = z.infer<typeof CreateAiJobInputSchema>;
export type AiJob = z.infer<typeof AiJobSchema>;
export type AiJobListResult = z.infer<typeof AiJobListResultSchema>;
