import { Injectable } from "@nestjs/common";
import type { PracticeAttemptResult } from "@mianshi/shared";
import { PrismaService } from "../database/prisma.service";
import type { PracticeAttemptRepository } from "./practice.service";

const anonymousUserId = "seed-user";

@Injectable()
export class PrismaPracticeAttemptRepository implements PracticeAttemptRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveAttempt(attempt: PracticeAttemptResult) {
    await this.prisma.practiceAttempt.create({
      data: {
        id: attempt.id,
        userId: anonymousUserId,
        questionId: attempt.questionId,
        userAnswer: attempt.submittedAnswer,
        aiScore: attempt.score,
        rating: attempt.rating,
        aiFeedback: attempt.feedbackSummary,
        matchedPoints: attempt.matchedKeyPoints,
        missingPoints: attempt.missingKeyPoints,
        followupQuestions: attempt.followUpQuestions,
        nextReviewAt: new Date(attempt.nextReviewAt),
        createdAt: new Date(attempt.createdAt),
      },
    });

    await this.prisma.reviewState.upsert({
      where: {
        userId_questionId: {
          userId: anonymousUserId,
          questionId: attempt.questionId,
        },
      },
      create: {
        userId: anonymousUserId,
        questionId: attempt.questionId,
        dueAt: new Date(attempt.nextReviewAt),
        lastReviewedAt: new Date(attempt.createdAt),
        reviewCount: 1,
      },
      update: {
        dueAt: new Date(attempt.nextReviewAt),
        lastReviewedAt: new Date(attempt.createdAt),
        reviewCount: {
          increment: 1,
        },
      },
    });

    return attempt;
  }

  async listAttempts(questionId?: string) {
    const attempts = await this.prisma.practiceAttempt.findMany({
      where: {
        userId: anonymousUserId,
        questionId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return attempts.map((attempt) => {
      const missingKeyPoints = parseStringArray(attempt.missingPoints);
      const followUpQuestions = parseStringArray(attempt.followupQuestions);
      const matchedKeyPoints = parseStringArray(attempt.matchedPoints);

      return {
        id: attempt.id,
        questionId: attempt.questionId,
        submittedAnswer: attempt.userAnswer,
        score: attempt.aiScore,
        rating: attempt.rating as PracticeAttemptResult["rating"],
        feedbackSummary: attempt.aiFeedback,
        matchedKeyPoints,
        missingKeyPoints,
        followUpQuestions,
        nextReviewAt: attempt.nextReviewAt.toISOString(),
        createdAt: attempt.createdAt.toISOString(),
      } satisfies PracticeAttemptResult;
    });
  }
}

function parseStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
