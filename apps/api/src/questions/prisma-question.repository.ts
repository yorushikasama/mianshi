import { Injectable } from "@nestjs/common";
import type { Answer, DifficultyLevel, QuestionType, SourceType } from "@mianshi/shared";
import { PrismaService } from "../database/prisma.service";
import type { PracticeQuestionRepository } from "../practice/practice.service";
import type { QuestionRecord, QuestionRepository } from "./question.service";

type PrismaQuestionWithRelations = {
  id: string;
  userId: string | null;
  title: string;
  content: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  sourceType: SourceType;
  aiGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
  domain: { slug: string };
  category: { slug: string };
  tags: { tag: { name: string } }[];
};

type PrismaPracticeQuestionWithRelations = PrismaQuestionWithRelations & {
  answers: {
    id: string;
    questionId: string;
    answerType: Answer["answerType"];
    status: Answer["status"];
    content: string;
    keyPoints: unknown;
    model: string | null;
    promptVersionId: string | null;
    promptVersion: { version: string } | null;
    tokenUsage: number;
  }[];
};

@Injectable()
export class PrismaQuestionRepository implements QuestionRepository, PracticeQuestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listQuestions(input: {
    userId: string;
    domainSlug?: string;
    categorySlug?: string;
    page: number;
    pageSize: number;
  }) {
    const where = {
      AND: [
        {
          OR: [{ userId: null }, { userId: input.userId }],
        },
        input.domainSlug ? { domain: { slug: input.domainSlug } } : {},
        input.categorySlug ? { category: { slug: input.categorySlug } } : {},
      ],
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.question.findMany({
        where,
        include: questionRelations,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      this.prisma.question.count({ where }),
    ]);

    return {
      items: items.map(toQuestionRecord),
      total,
    };
  }

  async findQuestionById(questionId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: questionRelations,
    });

    return question ? toQuestionRecord(question) : null;
  }

  async findPracticeQuestion(input: { userId: string; questionId: string }) {
    const question = await this.prisma.question.findFirst({
      where: {
        id: input.questionId,
        OR: [{ userId: null }, { userId: input.userId }],
      },
      include: {
        ...questionRelations,
        answers: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            questionId: true,
            answerType: true,
            status: true,
            content: true,
            keyPoints: true,
            model: true,
            promptVersionId: true,
            promptVersion: {
              select: {
                version: true,
              },
            },
            tokenUsage: true,
          },
        },
      },
    });

    if (!question) {
      return null;
    }

    const typedQuestion = question as PrismaPracticeQuestionWithRelations;

    return {
      question: toQuestionRecord(typedQuestion),
      answer: typedQuestion.answers[0] ? toAnswer(typedQuestion.answers[0]) : null,
    };
  }

  async createQuestion(input: Omit<QuestionRecord, "id" | "createdAt" | "updatedAt">) {
    const question = await this.prisma.$transaction(async (tx) => {
      const domain = await tx.domain.findUniqueOrThrow({
        where: { slug: input.domainSlug },
      });
      const category = await tx.category.findUniqueOrThrow({
        where: {
          domainId_slug: {
            domainId: domain.id,
            slug: input.categorySlug,
          },
        },
      });

      return tx.question.create({
        data: {
          userId: input.userId,
          domainId: domain.id,
          categoryId: category.id,
          title: input.title,
          content: input.content,
          type: input.type,
          difficulty: input.difficulty,
          sourceType: input.sourceType,
          aiGenerated: input.aiGenerated,
          tags: {
            create: input.tags.map((tagName) => ({
              tag: {
                connectOrCreate: {
                  where: { name: tagName },
                  create: { name: tagName },
                },
              },
            })),
          },
        },
        include: questionRelations,
      });
    });

    return toQuestionRecord(question);
  }

  async updateQuestion(
    questionId: string,
    input: Partial<Pick<QuestionRecord, "title" | "content" | "difficulty" | "type" | "tags">>,
  ) {
    const question = await this.prisma.$transaction(async (tx) => {
      if (input.tags) {
        await tx.questionTag.deleteMany({
          where: { questionId },
        });
      }

      return tx.question.update({
        where: { id: questionId },
        data: {
          title: input.title,
          content: input.content,
          difficulty: input.difficulty,
          type: input.type,
          tags: input.tags
            ? {
                create: input.tags.map((tagName) => ({
                  tag: {
                    connectOrCreate: {
                      where: { name: tagName },
                      create: { name: tagName },
                    },
                  },
                })),
              }
            : undefined,
        },
        include: questionRelations,
      });
    });

    return question ? toQuestionRecord(question) : null;
  }

  async deleteQuestion(questionId: string) {
    await this.prisma.question.delete({
      where: { id: questionId },
    });

    return true;
  }
}

const questionRelations = {
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

function toQuestionRecord(question: PrismaQuestionWithRelations): QuestionRecord {
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
    sourceType: question.sourceType,
    aiGenerated: question.aiGenerated,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
  };
}

function toAnswer(answer: PrismaPracticeQuestionWithRelations["answers"][number]): Answer {
  return {
    id: answer.id,
    questionId: answer.questionId,
    answerType: answer.answerType,
    status: answer.status,
    content: answer.content,
    keyPoints: asStringArray(answer.keyPoints),
    model: answer.model ?? "unknown",
    promptVersion: answer.promptVersion?.version ?? answer.promptVersionId ?? "unknown",
    tokenUsage: answer.tokenUsage,
  };
}

function asStringArray(input: unknown): string[] {
  if (Array.isArray(input) && input.every((item) => typeof item === "string")) {
    return input;
  }

  return [];
}
