import { Inject, Injectable } from "@nestjs/common";
import { z } from "zod";
import { ReviewOverviewSchema, ReviewTodaySchema } from "@mianshi/shared";
import type { DifficultyLevel, FsrsRatingName, QuestionType, ReviewOverview, ReviewToday } from "@mianshi/shared";

const ReviewOverviewInputSchema = z.object({
  now: z.date().optional(),
  dueLimit: z.coerce.number().int().min(1).max(50).default(8),
  recentLimit: z.coerce.number().int().min(1).max(20).default(5),
});

const ReviewTodayInputSchema = z.object({
  now: z.date().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(8),
});

export interface ReviewStateRecord {
  userId: string;
  questionId: string;
  title: string;
  domainSlug: string;
  categorySlug: string;
  categoryName: string;
  difficulty: DifficultyLevel;
  type: QuestionType;
  dueAt: Date;
  lastReviewedAt: Date | null;
  reviewCount: number;
  lastScore?: number;
  rating?: FsrsRatingName;
}

export interface ReviewAttemptRecord {
  userId: string;
  attemptId: string;
  questionId: string;
  title: string;
  domainSlug: string;
  categorySlug: string;
  categoryName: string;
  score: number;
  rating: FsrsRatingName;
  createdAt: Date;
}

export interface ReviewRepository {
  listReviewStates(userId: string): Promise<ReviewStateRecord[]>;
  listRecentAttempts(userId: string, limit: number): Promise<ReviewAttemptRecord[]>;
  listAttemptsForAnalytics(userId: string): Promise<ReviewAttemptRecord[]>;
}

export const REVIEW_REPOSITORY = Symbol("REVIEW_REPOSITORY");

@Injectable()
export class ReviewService {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: ReviewRepository,
  ) {}

  async getOverview(userId: string, input: unknown = {}): Promise<ReviewOverview> {
    const parsedInput = ReviewOverviewInputSchema.parse(input ?? {});
    const now = parsedInput.now ?? new Date();
    const todayEnd = endOfUtcDay(now);
    const [reviewStates, recentAttempts, analyticsAttempts] = await Promise.all([
      this.reviewRepository.listReviewStates(userId),
      this.reviewRepository.listRecentAttempts(userId, parsedInput.recentLimit),
      this.reviewRepository.listAttemptsForAnalytics(userId),
    ]);

    const dueStates = reviewStates
      .filter((state) => state.dueAt.getTime() <= todayEnd.getTime())
      .sort((left, right) => left.dueAt.getTime() - right.dueAt.getTime());
    const overdueCount = dueStates.filter((state) => state.dueAt.getTime() < startOfUtcDay(now).getTime()).length;
    const dueTodayCount = dueStates.length - overdueCount;
    const totalScore = analyticsAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const averageScore =
      analyticsAttempts.length > 0 ? Math.round(totalScore / analyticsAttempts.length) : undefined;

    return ReviewOverviewSchema.parse({
      generatedAt: now.toISOString(),
      dueTodayCount,
      overdueCount,
      totalAttemptCount: analyticsAttempts.length,
      averageScore,
      dueItems: dueStates.slice(0, parsedInput.dueLimit).map((state) => ({
        questionId: state.questionId,
        title: state.title,
        domainSlug: state.domainSlug,
        categorySlug: state.categorySlug,
        categoryName: state.categoryName,
        difficulty: state.difficulty,
        type: state.type,
        lastScore: state.lastScore,
        rating: state.rating,
        attemptCount: state.reviewCount,
        dueAt: state.dueAt.toISOString(),
        lastReviewedAt: state.lastReviewedAt?.toISOString(),
        status: state.dueAt.getTime() < startOfUtcDay(now).getTime() ? "overdue" : "due_today",
      })),
      recentAttempts: recentAttempts.map((attempt) => ({
        attemptId: attempt.attemptId,
        questionId: attempt.questionId,
        title: attempt.title,
        categoryName: attempt.categoryName,
        score: attempt.score,
        rating: attempt.rating,
        createdAt: attempt.createdAt.toISOString(),
      })),
      weakCategories: buildWeakCategories(analyticsAttempts),
    });
  }

  async getToday(userId: string, input: unknown = {}): Promise<ReviewToday> {
    const parsedInput = ReviewTodayInputSchema.parse(input ?? {});
    const overview = await this.getOverview(userId, {
      now: parsedInput.now,
      dueLimit: parsedInput.limit,
      recentLimit: 1,
    });

    return ReviewTodaySchema.parse({
      generatedAt: overview.generatedAt,
      dueTodayCount: overview.dueTodayCount,
      overdueCount: overview.overdueCount,
      items: overview.dueItems,
    });
  }
}

function buildWeakCategories(attempts: ReviewAttemptRecord[]) {
  const byCategory = new Map<
    string,
    {
      categorySlug: string;
      categoryName: string;
      scores: number[];
    }
  >();

  for (const attempt of attempts) {
    const existing = byCategory.get(attempt.categorySlug);
    if (existing) {
      existing.scores.push(attempt.score);
      continue;
    }

    byCategory.set(attempt.categorySlug, {
      categorySlug: attempt.categorySlug,
      categoryName: attempt.categoryName,
      scores: [attempt.score],
    });
  }

  return Array.from(byCategory.values())
    .map((category) => {
      const total = category.scores.reduce((sum, score) => sum + score, 0);
      return {
        categorySlug: category.categorySlug,
        categoryName: category.categoryName,
        attemptCount: category.scores.length,
        averageScore: Math.round(total / category.scores.length),
        lowestScore: Math.min(...category.scores),
      };
    })
    .filter((category) => category.averageScore < 75 || category.lowestScore < 60)
    .sort((left, right) => left.averageScore - right.averageScore || right.attemptCount - left.attemptCount)
    .slice(0, 5);
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}
