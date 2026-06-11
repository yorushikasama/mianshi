import { Injectable } from "@nestjs/common";
import type { DifficultyLevel, FsrsRatingName, QuestionType } from "@mianshi/shared";
import { PrismaService } from "../database/prisma.service";
import type { ReviewAttemptRecord, ReviewRepository, ReviewStateRecord } from "./review.service";

type ReviewStateWithQuestion = {
  userId: string;
  questionId: string;
  dueAt: Date;
  lastReviewedAt: Date | null;
  reviewCount: number;
  question: {
    title: string;
    difficulty: DifficultyLevel;
    type: QuestionType;
    domain: { slug: string };
    category: { slug: string; name: string };
    practiceAttempts: {
      aiScore: number;
      rating: string;
      createdAt: Date;
    }[];
  };
};

type PracticeAttemptWithQuestion = {
  userId: string;
  id: string;
  questionId: string;
  aiScore: number;
  rating: string;
  createdAt: Date;
  question: {
    title: string;
    domain: { slug: string };
    category: { slug: string; name: string };
  };
};

@Injectable()
export class PrismaReviewRepository implements ReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listReviewStates(userId: string) {
    const states = await this.prisma.reviewState.findMany({
      where: { userId },
      include: {
        question: {
          select: {
            title: true,
            difficulty: true,
            type: true,
            domain: { select: { slug: true } },
            category: { select: { slug: true, name: true } },
            practiceAttempts: {
              where: { userId },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                aiScore: true,
                rating: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: { dueAt: "asc" },
    });

    return states.map(toReviewStateRecord);
  }

  async listRecentAttempts(userId: string, limit: number) {
    const attempts = await this.prisma.practiceAttempt.findMany({
      where: { userId },
      include: attemptQuestionInclude,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return attempts.map(toReviewAttemptRecord);
  }

  async listAttemptsForAnalytics(userId: string) {
    const attempts = await this.prisma.practiceAttempt.findMany({
      where: { userId },
      include: attemptQuestionInclude,
      orderBy: { createdAt: "desc" },
    });

    return attempts.map(toReviewAttemptRecord);
  }
}

const attemptQuestionInclude = {
  question: {
    select: {
      title: true,
      domain: {
        select: {
          slug: true,
        },
      },
      category: {
        select: {
          slug: true,
          name: true,
        },
      },
    },
  },
} as const;

function toReviewStateRecord(state: ReviewStateWithQuestion): ReviewStateRecord {
  const latestAttempt = state.question.practiceAttempts[0];

  return {
    userId: state.userId,
    questionId: state.questionId,
    title: state.question.title,
    domainSlug: state.question.domain.slug,
    categorySlug: state.question.category.slug,
    categoryName: state.question.category.name,
    difficulty: state.question.difficulty,
    type: state.question.type,
    dueAt: state.dueAt,
    lastReviewedAt: state.lastReviewedAt,
    reviewCount: state.reviewCount,
    lastScore: latestAttempt?.aiScore,
    rating: parseRating(latestAttempt?.rating),
  };
}

function toReviewAttemptRecord(attempt: PracticeAttemptWithQuestion): ReviewAttemptRecord {
  return {
    userId: attempt.userId,
    attemptId: attempt.id,
    questionId: attempt.questionId,
    title: attempt.question.title,
    domainSlug: attempt.question.domain.slug,
    categorySlug: attempt.question.category.slug,
    categoryName: attempt.question.category.name,
    score: attempt.aiScore,
    rating: parseRating(attempt.rating) ?? "again",
    createdAt: attempt.createdAt,
  };
}

function parseRating(value?: string): FsrsRatingName | undefined {
  if (value === "again" || value === "hard" || value === "good" || value === "easy") {
    return value;
  }

  return undefined;
}
