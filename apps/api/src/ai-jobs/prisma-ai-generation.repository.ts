import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { DifficultyLevel, DocumentType, QuestionType, RagChunkMetadata, SourceType } from "@mianshi/shared";
import { PrismaService } from "../database/prisma.service";
import type {
  AiGenerationRepository,
  FollowupContext,
  PersistedDraftAnswer,
  PersistedDocumentChunk,
  PersistedGeneratedQuestion,
  PromptVersionRecord,
  QuestionContext,
  RelevantDocumentChunk,
  ScoringContext,
  SourceDocumentForEmbedding,
} from "./ai-task.executor";

type QuestionWithContextRelations = {
  id: string;
  userId: string | null;
  type: QuestionType;
  difficulty: DifficultyLevel;
  title: string;
  content: string;
  sourceType?: SourceType;
  aiGenerated?: boolean;
  domain: { slug: string };
  category: { slug: string };
  tags: { tag: { name: string } }[];
};

type QuestionWithScoringRelations = QuestionWithContextRelations & {
  answers: {
    id: string;
    answerType: string;
    content: string;
    keyPoints: unknown;
  }[];
  reviewStates: {
    stability: number | null;
    difficulty: number | null;
    lastReviewedAt: Date | null;
  }[];
};

type PracticeAttemptWithFollowupRelations = {
  id: string;
  questionId: string;
  userAnswer: string;
  aiScore: number;
  aiFeedback: string;
  matchedPoints: unknown;
  missingPoints: unknown;
  followupQuestions: unknown;
  createdAt: Date;
  question: QuestionWithContextRelations & {
    answers: {
      id: string;
      answerType: string;
      content: string;
      keyPoints: unknown;
    }[];
  };
};

type DocumentChunkWithDocumentRelations = {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  metadata: unknown;
  embedding: unknown;
  document: {
    id: string;
    documentType: DocumentType;
    title: string;
  };
};

@Injectable()
export class PrismaAiGenerationRepository implements AiGenerationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertPromptVersion(input: Omit<PromptVersionRecord, "id">): Promise<PromptVersionRecord> {
    const promptVersion = await this.prisma.promptVersion.upsert({
      where: {
        name_version: {
          name: input.name,
          version: input.version,
        },
      },
      update: {
        template: input.template,
        outputSchema: toPrismaJson(input.outputSchema),
      },
      create: {
        name: input.name,
        version: input.version,
        template: input.template,
        outputSchema: toPrismaJson(input.outputSchema),
      },
    });

    return {
      id: promptVersion.id,
      name: promptVersion.name,
      version: promptVersion.version,
      template: promptVersion.template,
      outputSchema: asJsonObject(promptVersion.outputSchema),
    };
  }

  async createGeneratedQuestions(input: Parameters<AiGenerationRepository["createGeneratedQuestions"]>[0]) {
    return this.prisma.$transaction(async (tx) => {
      const savedQuestions: PersistedGeneratedQuestion[] = [];

      for (const question of input.questions) {
        const domain = await tx.domain.findUniqueOrThrow({
          where: { slug: question.domainSlug },
        });
        const category = await tx.category.findUniqueOrThrow({
          where: {
            domainId_slug: {
              domainId: domain.id,
              slug: question.categorySlug,
            },
          },
        });
        const savedQuestion = await tx.question.create({
          data: {
            userId: input.userId,
            domainId: domain.id,
            categoryId: category.id,
            title: question.title,
            content: question.content,
            type: question.type,
            difficulty: question.difficulty,
            sourceType: "ai_generated",
            aiGenerated: true,
            model: input.model,
            promptVersionId: input.promptVersionId,
            tags: {
              create: question.tags.map((tagName) => ({
                tag: {
                  connectOrCreate: {
                    where: { name: tagName },
                    create: { name: tagName },
                  },
                },
              })),
            },
          },
          include: questionContextRelations,
        });

        savedQuestions.push(toPersistedGeneratedQuestion(savedQuestion as QuestionWithContextRelations));
      }

      return savedQuestions;
    });
  }

  async findQuestionContext(input: { userId: string; questionId: string }): Promise<QuestionContext | null> {
    const question = await this.prisma.question.findFirst({
      where: {
        id: input.questionId,
        OR: [{ userId: null }, { userId: input.userId }],
      },
      include: questionContextRelations,
    });

    return question ? toQuestionContext(question as QuestionWithContextRelations) : null;
  }

  async createDraftAnswer(input: Parameters<AiGenerationRepository["createDraftAnswer"]>[0]): Promise<PersistedDraftAnswer> {
    const answer = await this.prisma.answer.create({
      data: {
        questionId: input.questionId,
        answerType: input.answer.answerType,
        status: "draft",
        content: input.answer.content,
        keyPoints: toPrismaJson(input.answer.keyPoints),
        model: input.model,
        promptVersionId: input.promptVersionId,
        tokenUsage: input.tokenUsage,
      },
    });

    return {
      id: answer.id,
      questionId: answer.questionId,
      answerType: answer.answerType,
      status: "draft",
      content: answer.content,
      keyPoints: asStringArray(answer.keyPoints),
      model: answer.model ?? input.model,
      promptVersionId: answer.promptVersionId ?? input.promptVersionId,
      tokenUsage: answer.tokenUsage,
    };
  }

  async findScoringContext(input: { userId: string; questionId: string }): Promise<ScoringContext | null> {
    const question = await this.prisma.question.findFirst({
      where: {
        id: input.questionId,
        OR: [{ userId: null }, { userId: input.userId }],
      },
      include: {
        ...questionContextRelations,
        answers: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            answerType: true,
            content: true,
            keyPoints: true,
          },
        },
        reviewStates: {
          where: { userId: input.userId },
          take: 1,
        },
      },
    });

    if (!question) {
      return null;
    }

    const typedQuestion = question as QuestionWithScoringRelations;
    const answer = typedQuestion.answers[0];

    if (!answer) {
      return null;
    }

    const reviewState = typedQuestion.reviewStates[0];

    return {
      question: toQuestionContext(typedQuestion),
      answer: {
        id: answer.id,
        answerType: answer.answerType,
        content: answer.content,
        keyPoints: asStringArray(answer.keyPoints),
      },
      reviewState: reviewState
        ? {
            stability: reviewState.stability,
            difficulty: reviewState.difficulty,
            lastReviewedAt: reviewState.lastReviewedAt,
          }
        : null,
    };
  }

  async createScoredPracticeAttempt(input: Parameters<AiGenerationRepository["createScoredPracticeAttempt"]>[0]) {
    await this.prisma.$transaction(async (tx) => {
      await tx.practiceAttempt.create({
        data: {
          id: input.attempt.id,
          userId: input.userId,
          questionId: input.attempt.questionId,
          userAnswer: input.attempt.submittedAnswer,
          aiScore: input.attempt.score,
          rating: input.attempt.rating,
          aiFeedback: input.attempt.feedbackSummary,
          matchedPoints: toPrismaJson(input.attempt.matchedKeyPoints),
          missingPoints: toPrismaJson(input.attempt.missingKeyPoints),
          followupQuestions: toPrismaJson(input.attempt.followUpQuestions),
          nextReviewAt: new Date(input.attempt.nextReviewAt),
          createdAt: new Date(input.attempt.createdAt),
        },
      });

      await tx.reviewState.upsert({
        where: {
          userId_questionId: {
            userId: input.userId,
            questionId: input.attempt.questionId,
          },
        },
        create: {
          userId: input.userId,
          questionId: input.attempt.questionId,
          stability: input.reviewSchedule.stability,
          difficulty: input.reviewSchedule.difficulty,
          dueAt: new Date(input.reviewSchedule.nextReviewAt),
          lastReviewedAt: new Date(input.attempt.createdAt),
          reviewCount: 1,
        },
        update: {
          stability: input.reviewSchedule.stability,
          difficulty: input.reviewSchedule.difficulty,
          dueAt: new Date(input.reviewSchedule.nextReviewAt),
          lastReviewedAt: new Date(input.attempt.createdAt),
          reviewCount: {
            increment: 1,
          },
        },
      });
    });

    return input.attempt;
  }

  async findFollowupContext(input: { userId: string; attemptId: string }): Promise<FollowupContext | null> {
    const attempt = await this.prisma.practiceAttempt.findFirst({
      where: {
        id: input.attemptId,
        userId: input.userId,
      },
      include: {
        question: {
          include: {
            ...questionContextRelations,
            answers: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                id: true,
                answerType: true,
                content: true,
                keyPoints: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return null;
    }

    const typedAttempt = attempt as PracticeAttemptWithFollowupRelations;
    const answer = typedAttempt.question.answers[0];

    if (!answer) {
      return null;
    }

    return {
      attempt: {
        id: typedAttempt.id,
        questionId: typedAttempt.questionId,
        submittedAnswer: typedAttempt.userAnswer,
        score: typedAttempt.aiScore,
        feedbackSummary: typedAttempt.aiFeedback,
        matchedKeyPoints: asStringArray(typedAttempt.matchedPoints),
        missingKeyPoints: asStringArray(typedAttempt.missingPoints),
        followUpQuestions: asStringArray(typedAttempt.followupQuestions),
        createdAt: typedAttempt.createdAt.toISOString(),
      },
      question: toQuestionContext(typedAttempt.question),
      answer: {
        id: answer.id,
        answerType: answer.answerType,
        content: answer.content,
        keyPoints: asStringArray(answer.keyPoints),
      },
    };
  }

  async updatePracticeAttemptFollowups(
    input: Parameters<AiGenerationRepository["updatePracticeAttemptFollowups"]>[0],
  ): Promise<string[]> {
    const result = await this.prisma.practiceAttempt.updateMany({
      where: {
        id: input.attemptId,
        userId: input.userId,
      },
      data: {
        followupQuestions: toPrismaJson(input.followUpQuestions),
      },
    });

    if (result.count === 0) {
      throw new Error("Practice attempt not found");
    }

    return input.followUpQuestions;
  }

  async findSourceDocumentForEmbedding(input: {
    userId: string;
    documentId: string;
  }): Promise<SourceDocumentForEmbedding | null> {
    const document = await this.prisma.sourceDocument.findFirst({
      where: {
        id: input.documentId,
        userId: input.userId,
      },
      select: {
        id: true,
        userId: true,
        documentType: true,
        title: true,
        content: true,
      },
    });

    return document
      ? {
          id: document.id,
          userId: document.userId,
          documentType: document.documentType as DocumentType,
          title: document.title,
          content: document.content,
        }
      : null;
  }

  async replaceDocumentChunks(input: Parameters<AiGenerationRepository["replaceDocumentChunks"]>[0]) {
    return this.prisma.$transaction(async (tx) => {
      const document = await tx.sourceDocument.findFirst({
        where: {
          id: input.documentId,
          userId: input.userId,
        },
        select: { id: true },
      });

      if (!document) {
        throw new Error("Source document not found");
      }

      await tx.documentChunk.deleteMany({
        where: { documentId: input.documentId },
      });

      const chunks: PersistedDocumentChunk[] = [];

      for (const chunk of input.chunks) {
        const savedChunk = await tx.documentChunk.create({
          data: {
            documentId: input.documentId,
            chunkIndex: chunk.chunkIndex,
            content: chunk.content,
            metadata: toPrismaJson(chunk.metadata),
            embedding: toPrismaJson(chunk.embedding),
          },
        });

        chunks.push(toPersistedDocumentChunk(savedChunk));
      }

      return chunks;
    });
  }

  async findRelevantDocumentChunks(input: Parameters<AiGenerationRepository["findRelevantDocumentChunks"]>[0]) {
    const chunks = await this.prisma.documentChunk.findMany({
      where: {
        document: {
          userId: input.userId,
          ...(input.documentType ? { documentType: input.documentType } : {}),
        },
        embedding: {
          not: Prisma.DbNull,
        },
      },
      include: {
        document: {
          select: {
            id: true,
            documentType: true,
            title: true,
          },
        },
      },
    });

    return (chunks as DocumentChunkWithDocumentRelations[])
      .map((chunk) => toRelevantDocumentChunk(chunk, input.queryEmbedding))
      .filter((chunk): chunk is RelevantDocumentChunk => Boolean(chunk))
      .sort((left, right) => right.score - left.score)
      .slice(0, input.topK);
  }
}

const questionContextRelations = {
  domain: {
    select: {
      slug: true,
    },
  },
  category: {
    select: {
      slug: true,
    },
  },
  tags: {
    include: {
      tag: {
        select: {
          name: true,
        },
      },
    },
  },
} as const;

function toPersistedGeneratedQuestion(question: QuestionWithContextRelations): PersistedGeneratedQuestion {
  return {
    ...toQuestionContext(question),
    sourceType: "ai_generated",
    aiGenerated: true,
  };
}

function toQuestionContext(question: QuestionWithContextRelations): QuestionContext {
  return {
    id: question.id,
    userId: question.userId,
    domainSlug: question.domain.slug,
    categorySlug: question.category.slug,
    type: question.type,
    difficulty: question.difficulty,
    title: question.title,
    content: question.content,
    tags: question.tags.map(({ tag }) => tag.name),
  };
}

function asJsonObject(input: unknown): Record<string, unknown> {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }

  return {};
}

function asStringArray(input: unknown): string[] {
  if (Array.isArray(input) && input.every((item) => typeof item === "string")) {
    return input;
  }

  return [];
}

function asNumberArray(input: unknown): number[] {
  if (Array.isArray(input) && input.every((item) => typeof item === "number")) {
    return input;
  }

  return [];
}

function asRagChunkMetadata(input: unknown): RagChunkMetadata {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return input as RagChunkMetadata;
  }

  return {
    documentId: "",
    chunkIndex: 0,
    startChar: 0,
    endChar: 0,
  };
}

function toPersistedDocumentChunk(chunk: {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  metadata: unknown;
  embedding: unknown;
}): PersistedDocumentChunk {
  return {
    id: chunk.id,
    documentId: chunk.documentId,
    chunkIndex: chunk.chunkIndex,
    content: chunk.content,
    metadata: asRagChunkMetadata(chunk.metadata),
    embedding: asNumberArray(chunk.embedding),
  };
}

function toRelevantDocumentChunk(
  chunk: DocumentChunkWithDocumentRelations,
  queryEmbedding: number[],
): RelevantDocumentChunk | null {
  const embedding = asNumberArray(chunk.embedding);

  if (embedding.length === 0 || embedding.length !== queryEmbedding.length) {
    return null;
  }

  return {
    id: chunk.id,
    documentId: chunk.documentId,
    documentType: chunk.document.documentType,
    documentTitle: chunk.document.title,
    chunkIndex: chunk.chunkIndex,
    content: chunk.content,
    metadata: asRagChunkMetadata(chunk.metadata),
    score: cosineSimilarity(queryEmbedding, embedding),
  };
}

function cosineSimilarity(left: number[], right: number[]) {
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;
    dot += leftValue * rightValue;
    leftMagnitude += leftValue ** 2;
    rightMagnitude += rightValue ** 2;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

function toPrismaJson(input: unknown): Prisma.InputJsonValue {
  return input as Prisma.InputJsonValue;
}
