import { z } from "zod";
import type { Answer, Question } from "./domain";
import { fsrsRatingNames, scoreToFsrsRating } from "./review";

const dayMs = 24 * 60 * 60 * 1000;

const nextReviewDaysByRating = {
  again: 1,
  hard: 2,
  good: 5,
  easy: 10,
} satisfies Record<(typeof fsrsRatingNames)[number], number>;

export const PracticeAttemptInputSchema = z.object({
  questionId: z.string().min(1),
  submittedAnswer: z.string().trim().min(4).max(4000),
  selfRating: z.enum(fsrsRatingNames).optional(),
});

export const PracticeAttemptResultSchema = z.object({
  id: z.string().min(1),
  questionId: z.string().min(1),
  submittedAnswer: z.string().min(1),
  score: z.number().int().min(0).max(100),
  rating: z.enum(fsrsRatingNames),
  feedbackSummary: z.string().min(1),
  matchedKeyPoints: z.array(z.string()),
  missingKeyPoints: z.array(z.string()),
  followUpQuestions: z.array(z.string()),
  nextReviewAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export const PracticeReviewStateSchema = z.object({
  questionId: z.string().min(1),
  attemptCount: z.number().int().nonnegative(),
  lastAttemptId: z.string().min(1).optional(),
  lastScore: z.number().int().min(0).max(100).optional(),
  rating: z.enum(fsrsRatingNames).optional(),
  lastPracticedAt: z.string().datetime().optional(),
  nextReviewAt: z.string().datetime().optional(),
});

export type PracticeAttemptInput = z.infer<typeof PracticeAttemptInputSchema>;
export type PracticeAttemptResult = z.infer<typeof PracticeAttemptResultSchema>;
export type PracticeReviewState = z.infer<typeof PracticeReviewStateSchema>;

export interface EvaluatePracticeAttemptInput {
  question: Question;
  answer: Answer;
  submittedAnswer: string;
  selfRating?: PracticeAttemptInput["selfRating"];
  now?: Date;
}

export function evaluatePracticeAttempt(input: EvaluatePracticeAttemptInput): PracticeAttemptResult {
  const now = input.now ?? new Date();
  const submittedAnswer = input.submittedAnswer.trim();
  const keyPoints = input.answer.keyPoints.length > 0 ? input.answer.keyPoints : input.question.tags;
  const normalizedAnswer = normalize(submittedAnswer);
  const matchedKeyPoints = keyPoints.filter((point) => normalizedAnswer.includes(normalize(point)));
  const missingKeyPoints = keyPoints.filter((point) => !matchedKeyPoints.includes(point));
  const coverage = keyPoints.length === 0 ? 0 : matchedKeyPoints.length / keyPoints.length;
  const score = scoreSubmission(coverage, submittedAnswer);
  const rating = scoreToFsrsRating({ aiScore: score, userRating: input.selfRating });
  const nextReviewAt = new Date(now.getTime() + nextReviewDaysByRating[rating] * dayMs).toISOString();

  return PracticeAttemptResultSchema.parse({
    id: `attempt_${input.question.id}_${now.getTime()}`,
    questionId: input.question.id,
    submittedAnswer,
    score,
    rating,
    feedbackSummary: buildFeedbackSummary(matchedKeyPoints.length, keyPoints.length, rating),
    matchedKeyPoints,
    missingKeyPoints,
    followUpQuestions: missingKeyPoints.slice(0, 3).map((point) => `请补充「${point}」在这道题里的作用和面试表达。`),
    nextReviewAt,
    createdAt: now.toISOString(),
  });
}

export function buildPracticeReviewState(
  questionId: string,
  attempts: PracticeAttemptResult[],
): PracticeReviewState {
  const attemptsForQuestion = attempts
    .filter((attempt) => attempt.questionId === questionId)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  const latestAttempt = attemptsForQuestion[0];

  return PracticeReviewStateSchema.parse({
    questionId,
    attemptCount: attemptsForQuestion.length,
    lastAttemptId: latestAttempt?.id,
    lastScore: latestAttempt?.score,
    rating: latestAttempt?.rating,
    lastPracticedAt: latestAttempt?.createdAt,
    nextReviewAt: latestAttempt?.nextReviewAt,
  });
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function scoreSubmission(coverage: number, submittedAnswer: string) {
  if (submittedAnswer.length < 12) {
    return Math.min(45, Math.round(20 + coverage * 50));
  }

  return Math.max(0, Math.min(100, Math.round(50 + coverage * 50)));
}

function buildFeedbackSummary(matchedCount: number, totalCount: number, rating: PracticeAttemptResult["rating"]) {
  if (totalCount === 0) {
    return "本题暂无关键点评分规则，已根据回答完整度生成复习评级。";
  }

  return `覆盖 ${matchedCount}/${totalCount} 个关键点，当前复习评级为 ${rating}。`;
}
