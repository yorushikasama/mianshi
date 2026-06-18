import { z } from "zod";
import { difficultyLevels, questionTypes } from "./domain";

export const fsrsRatingNames = ["again", "hard", "good", "easy"] as const;

export type FsrsRatingName = (typeof fsrsRatingNames)[number];

export const reviewItemStatuses = ["overdue", "due_today"] as const;

export const ReviewDueItemSchema = z.object({
  questionId: z.string().min(1),
  title: z.string().min(1),
  domainSlug: z.string().min(1),
  categorySlug: z.string().min(1),
  categoryName: z.string().min(1),
  difficulty: z.enum(difficultyLevels),
  type: z.enum(questionTypes),
  lastScore: z.number().int().min(0).max(100).optional(),
  rating: z.enum(fsrsRatingNames).optional(),
  attemptCount: z.number().int().nonnegative(),
  dueAt: z.string().datetime(),
  lastReviewedAt: z.string().datetime().optional(),
  status: z.enum(reviewItemStatuses),
});

export const ReviewRecentAttemptSchema = z.object({
  attemptId: z.string().min(1),
  questionId: z.string().min(1),
  title: z.string().min(1),
  categoryName: z.string().min(1),
  score: z.number().int().min(0).max(100),
  rating: z.enum(fsrsRatingNames),
  createdAt: z.string().datetime(),
});

export const ReviewWeakCategorySchema = z.object({
  categorySlug: z.string().min(1),
  categoryName: z.string().min(1),
  attemptCount: z.number().int().positive(),
  averageScore: z.number().int().min(0).max(100),
  lowestScore: z.number().int().min(0).max(100),
});

export const ReviewMistakeItemSchema = z.object({
  questionId: z.string().min(1),
  title: z.string().min(1),
  categorySlug: z.string().min(1),
  categoryName: z.string().min(1),
  lowestScore: z.number().int().min(0).max(100),
  latestScore: z.number().int().min(0).max(100),
  attemptCount: z.number().int().positive(),
  lastAttemptAt: z.string().datetime(),
});

export const ReviewOverviewSchema = z.object({
  generatedAt: z.string().datetime(),
  dueTodayCount: z.number().int().nonnegative(),
  overdueCount: z.number().int().nonnegative(),
  totalAttemptCount: z.number().int().nonnegative(),
  averageScore: z.number().int().min(0).max(100).optional(),
  dueItems: z.array(ReviewDueItemSchema),
  recentAttempts: z.array(ReviewRecentAttemptSchema),
  weakCategories: z.array(ReviewWeakCategorySchema),
});

export const ReviewTodaySchema = z.object({
  generatedAt: z.string().datetime(),
  dueTodayCount: z.number().int().nonnegative(),
  overdueCount: z.number().int().nonnegative(),
  items: z.array(ReviewDueItemSchema),
});

export const ReviewMistakesSchema = z.object({
  generatedAt: z.string().datetime(),
  items: z.array(ReviewMistakeItemSchema),
});

export type ReviewItemStatus = (typeof reviewItemStatuses)[number];
export type ReviewDueItem = z.infer<typeof ReviewDueItemSchema>;
export type ReviewRecentAttempt = z.infer<typeof ReviewRecentAttemptSchema>;
export type ReviewWeakCategory = z.infer<typeof ReviewWeakCategorySchema>;
export type ReviewMistakeItem = z.infer<typeof ReviewMistakeItemSchema>;
export type ReviewOverview = z.infer<typeof ReviewOverviewSchema>;
export type ReviewToday = z.infer<typeof ReviewTodaySchema>;
export type ReviewMistakes = z.infer<typeof ReviewMistakesSchema>;

export interface ScoreToFsrsRatingInput {
  aiScore: number;
  userRating?: FsrsRatingName;
}

export function scoreToFsrsRating(input: ScoreToFsrsRatingInput): FsrsRatingName {
  if (input.userRating) {
    return input.userRating;
  }

  if (input.aiScore < 50) {
    return "again";
  }

  if (input.aiScore < 70) {
    return "hard";
  }

  if (input.aiScore < 85) {
    return "good";
  }

  return "easy";
}
