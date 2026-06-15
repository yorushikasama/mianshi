import { z } from "zod";
import { answerTypes, difficultyLevels, questionTypes } from "./domain";

const GeneratedQuestionSchema = z.object({
  domainSlug: z.string().trim().min(1),
  categorySlug: z.string().trim().min(1),
  type: z.enum(questionTypes),
  difficulty: z.enum(difficultyLevels),
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(6000),
  tags: z.array(z.string().trim().min(1).max(40)).min(1).max(12),
});

export const GenerateQuestionsOutputSchema = z.object({
  questions: z.array(GeneratedQuestionSchema).min(1).max(20),
});

export const GenerateAnswerOutputSchema = z.object({
  answerType: z.enum(answerTypes),
  content: z.string().trim().min(1).max(12000),
  keyPoints: z.array(z.string().trim().min(1).max(400)).min(1).max(30),
});

export const ScoreAttemptOutputSchema = z.object({
  score: z.number().int().min(0).max(100),
  feedbackSummary: z.string().trim().min(1).max(2000),
  matchedKeyPoints: z.array(z.string().trim().min(1).max(400)).max(30),
  missingKeyPoints: z.array(z.string().trim().min(1).max(400)).max(30),
  followUpQuestions: z.array(z.string().trim().min(1).max(500)).max(8),
});

export const GenerateFollowupOutputSchema = z.object({
  followUpQuestions: z.array(z.string().trim().min(1).max(500)).min(1).max(8),
});

export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;
export type GenerateQuestionsOutput = z.infer<typeof GenerateQuestionsOutputSchema>;
export type GenerateAnswerOutput = z.infer<typeof GenerateAnswerOutputSchema>;
export type ScoreAttemptOutput = z.infer<typeof ScoreAttemptOutputSchema>;
export type GenerateFollowupOutput = z.infer<typeof GenerateFollowupOutputSchema>;
