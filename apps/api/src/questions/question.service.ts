import { Inject, Injectable } from "@nestjs/common";
import { z } from "zod";
import type { Answer, DifficultyLevel, QuestionType, SourceType } from "@mianshi/shared";
import { difficultyLevels, questionTypes } from "@mianshi/shared";

const PaginationSchema = z.object({
  domainSlug: z.string().trim().min(1).optional(),
  categorySlug: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const CreateQuestionInputSchema = z.object({
  domainSlug: z.string().trim().min(1),
  categorySlug: z.string().trim().min(1),
  type: z.enum(questionTypes),
  difficulty: z.enum(difficultyLevels),
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(6000),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
});

const UpdateQuestionInputSchema = z
  .object({
    type: z.enum(questionTypes).optional(),
    difficulty: z.enum(difficultyLevels).optional(),
    title: z.string().trim().min(1).max(200).optional(),
    content: z.string().trim().min(1).max(6000).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field is required",
  });

export interface QuestionRecord {
  id: string;
  userId: string | null;
  domainSlug: string;
  categorySlug: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  title: string;
  content: string;
  tags: string[];
  sourceType: SourceType;
  aiGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionRepository {
  listQuestions(input: {
    userId: string;
    domainSlug?: string;
    categorySlug?: string;
    page: number;
    pageSize: number;
  }): Promise<{ items: QuestionRecord[]; total: number }>;
  findQuestionById(questionId: string): Promise<QuestionRecord | null>;
  findLatestAnswerByQuestionId(questionId: string): Promise<Answer | null>;
  createQuestion(input: Omit<QuestionRecord, "id" | "createdAt" | "updatedAt">): Promise<QuestionRecord>;
  updateQuestion(
    questionId: string,
    input: Partial<Pick<QuestionRecord, "title" | "content" | "difficulty" | "type" | "tags">>,
  ): Promise<QuestionRecord | null>;
  deleteQuestion(questionId: string): Promise<boolean>;
}

export const QUESTION_REPOSITORY = Symbol("QUESTION_REPOSITORY");

@Injectable()
export class QuestionService {
  constructor(
    @Inject(QUESTION_REPOSITORY)
    private readonly questionRepository: QuestionRepository,
  ) {}

  async listQuestions(userId: string, input: unknown) {
    const parsedInput = PaginationSchema.parse(input);
    const result = await this.questionRepository.listQuestions({
      userId,
      domainSlug: parsedInput.domainSlug,
      categorySlug: parsedInput.categorySlug,
      page: parsedInput.page,
      pageSize: parsedInput.pageSize,
    });

    return {
      items: result.items,
      total: result.total,
      page: parsedInput.page,
      pageSize: parsedInput.pageSize,
      totalPages: Math.ceil(result.total / parsedInput.pageSize),
    };
  }

  async getQuestion(userId: string, questionId: string) {
    const question = await this.findVisibleQuestion(userId, questionId);

    if (!question) {
      throw new Error("Question not found");
    }

    return question;
  }

  async getQuestionAnswer(userId: string, questionId: string) {
    const question = await this.findVisibleQuestion(userId, questionId);

    if (!question) {
      throw new Error("Question not found");
    }

    const answer = await this.questionRepository.findLatestAnswerByQuestionId(questionId);

    if (!answer) {
      throw new Error("Answer not found");
    }

    return answer;
  }

  async createQuestion(userId: string, input: unknown) {
    const parsedInput = CreateQuestionInputSchema.parse(input);

    return this.questionRepository.createQuestion({
      ...parsedInput,
      userId,
      sourceType: "manual",
      aiGenerated: false,
    });
  }

  async updateQuestion(userId: string, questionId: string, input: unknown) {
    const question = await this.findVisibleQuestion(userId, questionId);

    if (!question) {
      throw new Error("Question not found");
    }

    if (question.userId !== userId) {
      throw new Error("Question is not editable");
    }

    const parsedInput = UpdateQuestionInputSchema.parse(input);
    const updatedQuestion = await this.questionRepository.updateQuestion(questionId, parsedInput);

    if (!updatedQuestion) {
      throw new Error("Question not found");
    }

    return updatedQuestion;
  }

  async deleteQuestion(userId: string, questionId: string) {
    const question = await this.findVisibleQuestion(userId, questionId);

    if (!question) {
      throw new Error("Question not found");
    }

    if (question.userId !== userId) {
      throw new Error("Question is not editable");
    }

    await this.questionRepository.deleteQuestion(questionId);
  }

  private async findVisibleQuestion(userId: string, questionId: string) {
    const question = await this.questionRepository.findQuestionById(questionId);

    if (!question || (question.userId !== null && question.userId !== userId)) {
      return null;
    }

    return question;
  }
}
