import { Inject, Injectable } from "@nestjs/common";
import { z } from "zod";
import {
  GenerateAnswerOutputSchema,
  GenerateQuestionsOutputSchema,
  ScoreAttemptOutputSchema,
  answerTypes,
  buildPracticeAttemptFromAiScore,
  fsrsRatingNames,
  scheduleNextPracticeReview,
  type DifficultyLevel,
  type GenerateAnswerOutput,
  type GeneratedQuestion,
  type PracticeAttemptResult,
  type QuestionType,
  type ScheduledPracticeReview,
  type ScoreAttemptOutput,
} from "@mianshi/shared";
import {
  AI_GENERATION_REPOSITORY,
  AI_MODEL_CLIENT,
  type AiTaskExecutionInput,
  type AiTaskExecutionResult,
  type AiTaskExecutor,
} from "./ai-job.tokens";

const GenerateQuestionsInputSchema = z.object({
  domainSlug: z.string().trim().min(1).default("java_backend"),
  categorySlug: z.string().trim().min(1).optional(),
  count: z.coerce.number().int().min(1).max(20).default(5),
  difficulty: z.string().trim().min(1).optional(),
  focus: z.string().trim().min(1).max(1000).optional(),
});

const GenerateAnswerInputSchema = z.object({
  questionId: z.string().trim().min(1),
  answerType: z.enum(answerTypes).optional(),
});

const ScoreAttemptInputSchema = z.object({
  questionId: z.string().trim().min(1),
  submittedAnswer: z.string().trim().min(4).max(4000),
  selfRating: z.enum(fsrsRatingNames).optional(),
  now: z.coerce.date().optional(),
});

export interface PromptVersionRecord {
  id: string;
  name: string;
  version: string;
  template: string;
  outputSchema: Record<string, unknown>;
}

export interface QuestionContext {
  id: string;
  userId: string | null;
  domainSlug: string;
  categorySlug: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  title: string;
  content: string;
  tags: string[];
}

export interface PersistedGeneratedQuestion extends GeneratedQuestion {
  id: string;
  userId: string | null;
  sourceType: "ai_generated";
  aiGenerated: true;
}

export interface PersistedDraftAnswer extends GenerateAnswerOutput {
  id: string;
  questionId: string;
  status: "draft";
  model: string;
  promptVersionId: string;
  tokenUsage: number;
}

export interface AnswerContext {
  id: string;
  answerType: string;
  content: string;
  keyPoints: string[];
}

export interface ScoringContext {
  question: QuestionContext;
  answer: AnswerContext;
  reviewState: {
    stability?: number | null;
    difficulty?: number | null;
    lastReviewedAt?: Date | string | null;
  } | null;
}

export interface AiGenerationRepository {
  upsertPromptVersion(input: Omit<PromptVersionRecord, "id">): Promise<PromptVersionRecord>;
  createGeneratedQuestions(input: {
    userId: string;
    questions: GeneratedQuestion[];
    model: string;
    promptVersionId: string;
    tokenUsage: number;
  }): Promise<PersistedGeneratedQuestion[]>;
  findQuestionContext(input: { userId: string; questionId: string }): Promise<QuestionContext | null>;
  createDraftAnswer(input: {
    questionId: string;
    answer: GenerateAnswerOutput;
    model: string;
    promptVersionId: string;
    tokenUsage: number;
  }): Promise<PersistedDraftAnswer>;
  findScoringContext(input: { userId: string; questionId: string }): Promise<ScoringContext | null>;
  createScoredPracticeAttempt(input: {
    userId: string;
    attempt: PracticeAttemptResult;
    reviewSchedule: ScheduledPracticeReview;
  }): Promise<PracticeAttemptResult>;
}

export interface AiModelClientResult {
  output: unknown;
  model: string;
  tokenUsage: number;
}

export interface AiModelClient {
  generateQuestions(input: {
    input: z.infer<typeof GenerateQuestionsInputSchema>;
    promptVersion: PromptVersionRecord;
  }): Promise<AiModelClientResult>;
  generateAnswer(input: {
    input: z.infer<typeof GenerateAnswerInputSchema>;
    question: QuestionContext;
    promptVersion: PromptVersionRecord;
  }): Promise<AiModelClientResult>;
  scoreAttempt(input: {
    input: z.infer<typeof ScoreAttemptInputSchema>;
    question: QuestionContext;
    answer: AnswerContext;
    promptVersion: PromptVersionRecord;
  }): Promise<AiModelClientResult>;
}

@Injectable()
export class AiTaskExecutorService implements AiTaskExecutor {
  constructor(
    @Inject(AI_GENERATION_REPOSITORY)
    private readonly repository: AiGenerationRepository,
    @Inject(AI_MODEL_CLIENT)
    private readonly modelClient: AiModelClient,
  ) {}

  async execute(input: AiTaskExecutionInput): Promise<AiTaskExecutionResult> {
    if (input.type === "generate_questions") {
      return this.generateQuestions(input);
    }

    if (input.type === "generate_answer") {
      return this.generateAnswer(input);
    }

    if (input.type === "score_attempt") {
      return this.scoreAttempt(input);
    }

    throw new Error(`AI task type is not supported yet: ${input.type}`);
  }

  private async generateQuestions(input: AiTaskExecutionInput): Promise<AiTaskExecutionResult> {
    const parsedInput = GenerateQuestionsInputSchema.parse(input.input);
    const promptVersion = await this.repository.upsertPromptVersion({
      name: `generate_questions:${parsedInput.domainSlug}`,
      version: "v1",
      template: generateQuestionsPromptTemplate(),
      outputSchema: GenerateQuestionsOutputSchema.toJSONSchema() as Record<string, unknown>,
    });
    const response = await this.modelClient.generateQuestions({
      input: parsedInput,
      promptVersion,
    });
    const output = GenerateQuestionsOutputSchema.parse(response.output);
    const questions = await this.repository.createGeneratedQuestions({
      userId: input.userId,
      questions: output.questions,
      model: response.model,
      promptVersionId: promptVersion.id,
      tokenUsage: response.tokenUsage,
    });

    return {
      output: { questions },
      model: response.model,
      promptVersionId: promptVersion.id,
      tokenUsage: response.tokenUsage,
    };
  }

  private async generateAnswer(input: AiTaskExecutionInput): Promise<AiTaskExecutionResult> {
    const parsedInput = GenerateAnswerInputSchema.parse(input.input);
    const question = await this.repository.findQuestionContext({
      userId: input.userId,
      questionId: parsedInput.questionId,
    });

    if (!question) {
      throw new Error("Question not found");
    }

    const promptVersion = await this.repository.upsertPromptVersion({
      name: `generate_answer:${question.domainSlug}`,
      version: "v1",
      template: generateAnswerPromptTemplate(),
      outputSchema: GenerateAnswerOutputSchema.toJSONSchema() as Record<string, unknown>,
    });
    const response = await this.modelClient.generateAnswer({
      input: parsedInput,
      question,
      promptVersion,
    });
    const output = GenerateAnswerOutputSchema.parse(response.output);
    const answer = await this.repository.createDraftAnswer({
      questionId: question.id,
      answer: output,
      model: response.model,
      promptVersionId: promptVersion.id,
      tokenUsage: response.tokenUsage,
    });

    return {
      output: { answer },
      model: response.model,
      promptVersionId: promptVersion.id,
      tokenUsage: response.tokenUsage,
    };
  }

  private async scoreAttempt(input: AiTaskExecutionInput): Promise<AiTaskExecutionResult> {
    const parsedInput = ScoreAttemptInputSchema.parse(input.input);
    const context = await this.repository.findScoringContext({
      userId: input.userId,
      questionId: parsedInput.questionId,
    });

    if (!context) {
      throw new Error("Question or answer not found");
    }

    const promptVersion = await this.repository.upsertPromptVersion({
      name: `score_attempt:${context.question.domainSlug}`,
      version: "v1",
      template: scoreAttemptPromptTemplate(),
      outputSchema: ScoreAttemptOutputSchema.toJSONSchema() as Record<string, unknown>,
    });
    const response = await this.modelClient.scoreAttempt({
      input: parsedInput,
      question: context.question,
      answer: context.answer,
      promptVersion,
    });
    const scoreOutput: ScoreAttemptOutput = ScoreAttemptOutputSchema.parse(response.output);
    const now = parsedInput.now ?? new Date();
    const attempt = buildPracticeAttemptFromAiScore({
      questionId: context.question.id,
      submittedAnswer: parsedInput.submittedAnswer,
      scoreOutput,
      selfRating: parsedInput.selfRating,
      now,
      previousReviewState: context.reviewState,
    });
    const reviewSchedule = scheduleNextPracticeReview({
      aiScore: scoreOutput.score,
      userRating: parsedInput.selfRating,
      now,
      previousReviewState: context.reviewState,
    });
    const savedAttempt = await this.repository.createScoredPracticeAttempt({
      userId: input.userId,
      attempt,
      reviewSchedule,
    });

    return {
      output: {
        attempt: savedAttempt,
        reviewSchedule,
      },
      model: response.model,
      promptVersionId: promptVersion.id,
      tokenUsage: response.tokenUsage,
    };
  }
}

function generateQuestionsPromptTemplate() {
  return [
    "你是一个技术面试复习系统的题目生成器。",
    "第一版默认服务 Java 后端面试，但输出必须使用通用 domain/category/type/difficulty/tag 字段。",
    "生成高质量、可练习、非聊天式的面试题，并严格返回结构化 JSON。",
  ].join("\n");
}

function generateAnswerPromptTemplate() {
  return [
    "你是一个技术面试复习系统的答案生成器。",
    "根据题目上下文生成可用于面试表达的答案，保留关键要点。",
    "不要覆盖用户已有答案，后端会把结果保存为 draft。",
  ].join("\n");
}

function scoreAttemptPromptTemplate() {
  return [
    "你是一个技术面试复习系统的评分器。",
    "根据题目、参考答案要点和用户回答，输出 0-100 分、简短反馈、命中要点、缺失要点和可继续追问的问题。",
    "不要输出 FSRS rating 或复习时间，后端会根据分数和用户自评计算复习调度。",
  ].join("\n");
}
