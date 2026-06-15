import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { DifficultyLevel, QuestionType, SourceType } from "@mianshi/shared";
import { PrismaService } from "../database/prisma.service";
import type {
  AiGenerationRepository,
  PersistedDraftAnswer,
  PersistedGeneratedQuestion,
  PromptVersionRecord,
  QuestionContext,
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

function toPrismaJson(input: unknown): Prisma.InputJsonValue {
  return input as Prisma.InputJsonValue;
}
