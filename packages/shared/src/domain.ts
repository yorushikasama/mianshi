import { z } from "zod";

export const questionTypes = [
  "concept",
  "scenario",
  "project_deep_dive",
  "system_design",
  "coding",
  "behavioral",
] as const;

export const answerTypes = ["standard", "short", "interview_style", "deep"] as const;

export const difficultyLevels = ["easy", "medium", "hard"] as const;

export const sourceTypes = ["seed", "manual", "ai_generated", "resume", "job_description", "project_note"] as const;

export const answerStatuses = ["draft", "reviewed", "approved"] as const;

export const DomainSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  firstVersionFocus: z.boolean().default(false),
});

export const CategorySchema = z.object({
  slug: z.string().min(1),
  domainSlug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  order: z.number().int().nonnegative(),
});

export const QuestionSchema = z.object({
  id: z.string().min(1),
  domainSlug: z.string().min(1),
  categorySlug: z.string().min(1),
  type: z.enum(questionTypes),
  difficulty: z.enum(difficultyLevels),
  title: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
  sourceType: z.enum(sourceTypes),
  aiGenerated: z.boolean(),
});

export const AnswerSchema = z.object({
  id: z.string().min(1),
  questionId: z.string().min(1),
  answerType: z.enum(answerTypes),
  status: z.enum(answerStatuses),
  content: z.string().min(1),
  keyPoints: z.array(z.string().min(1)).default([]),
  model: z.string().min(1),
  promptVersion: z.string().min(1),
  tokenUsage: z.number().int().nonnegative(),
});

export type Domain = z.infer<typeof DomainSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type Answer = z.infer<typeof AnswerSchema>;
export type QuestionType = (typeof questionTypes)[number];
export type AnswerType = (typeof answerTypes)[number];
export type DifficultyLevel = (typeof difficultyLevels)[number];
export type SourceType = (typeof sourceTypes)[number];
export type AnswerStatus = (typeof answerStatuses)[number];
