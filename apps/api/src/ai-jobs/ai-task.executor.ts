import { Inject, Injectable } from "@nestjs/common";
import { z } from "zod";
import {
  GenerateAnswerOutputSchema,
  GenerateFollowupOutputSchema,
  GenerateQuestionsOutputSchema,
  ScoreAttemptOutputSchema,
  answerTypes,
  buildPracticeAttemptFromAiScore,
  chunkTextForRag,
  fsrsRatingNames,
  scheduleNextPracticeReview,
  type DocumentType,
  type DifficultyLevel,
  type GenerateAnswerOutput,
  type GeneratedQuestion,
  type GenerateFollowupOutput,
  type PracticeAttemptResult,
  type QuestionType,
  type RagChunkMetadata,
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

const GenerateFollowupInputSchema = z.object({
  attemptId: z.string().trim().min(1),
  count: z.coerce.number().int().min(1).max(8).default(3),
});

const EmbedDocumentInputSchema = z.object({
  documentId: z.string().trim().min(1),
  maxChunkChars: z.coerce.number().int().min(1).max(4_000).default(1_200),
  overlapChars: z.coerce.number().int().min(0).max(800).default(160),
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

export interface FollowupAttemptContext {
  id: string;
  questionId: string;
  submittedAnswer: string;
  score: number;
  feedbackSummary: string;
  matchedKeyPoints: string[];
  missingKeyPoints: string[];
  followUpQuestions: string[];
  createdAt: string;
}

export interface FollowupContext {
  attempt: FollowupAttemptContext;
  question: QuestionContext;
  answer: AnswerContext;
}

export interface SourceDocumentForEmbedding {
  id: string;
  userId: string;
  documentType: DocumentType;
  title: string;
  content: string;
}

export interface PersistedDocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  metadata: RagChunkMetadata;
  embedding: number[];
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
  findFollowupContext(input: { userId: string; attemptId: string }): Promise<FollowupContext | null>;
  updatePracticeAttemptFollowups(input: {
    userId: string;
    attemptId: string;
    followUpQuestions: string[];
  }): Promise<string[]>;
  findSourceDocumentForEmbedding(input: { userId: string; documentId: string }): Promise<SourceDocumentForEmbedding | null>;
  replaceDocumentChunks(input: {
    userId: string;
    documentId: string;
    chunks: Array<{
      chunkIndex: number;
      content: string;
      metadata: RagChunkMetadata;
      embedding: number[];
    }>;
  }): Promise<PersistedDocumentChunk[]>;
}

export interface AiModelClientResult {
  output: unknown;
  model: string;
  tokenUsage: number;
}

export interface AiEmbeddingClientResult {
  embeddings: number[][];
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
  generateFollowup(input: {
    input: z.infer<typeof GenerateFollowupInputSchema>;
    context: FollowupContext;
    promptVersion: PromptVersionRecord;
  }): Promise<AiModelClientResult>;
  embedTexts(input: { texts: string[] }): Promise<AiEmbeddingClientResult>;
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

    if (input.type === "generate_followup") {
      return this.generateFollowup(input);
    }

    if (input.type === "embed_document") {
      return this.embedDocument(input);
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

  private async generateFollowup(input: AiTaskExecutionInput): Promise<AiTaskExecutionResult> {
    const parsedInput = GenerateFollowupInputSchema.parse(input.input);
    const context = await this.repository.findFollowupContext({
      userId: input.userId,
      attemptId: parsedInput.attemptId,
    });

    if (!context) {
      throw new Error("Practice attempt not found");
    }

    const promptVersion = await this.repository.upsertPromptVersion({
      name: `generate_followup:${context.question.domainSlug}`,
      version: "v1",
      template: generateFollowupPromptTemplate(),
      outputSchema: GenerateFollowupOutputSchema.toJSONSchema() as Record<string, unknown>,
    });
    const response = await this.modelClient.generateFollowup({
      input: parsedInput,
      context,
      promptVersion,
    });
    const output: GenerateFollowupOutput = GenerateFollowupOutputSchema.parse(response.output);
    const followUpQuestions = await this.repository.updatePracticeAttemptFollowups({
      userId: input.userId,
      attemptId: parsedInput.attemptId,
      followUpQuestions: output.followUpQuestions,
    });

    return {
      output: {
        attemptId: parsedInput.attemptId,
        followUpQuestions,
      },
      model: response.model,
      promptVersionId: promptVersion.id,
      tokenUsage: response.tokenUsage,
    };
  }

  private async embedDocument(input: AiTaskExecutionInput): Promise<AiTaskExecutionResult> {
    const parsedInput = EmbedDocumentInputSchema.parse(input.input);
    const document = await this.repository.findSourceDocumentForEmbedding({
      userId: input.userId,
      documentId: parsedInput.documentId,
    });

    if (!document) {
      throw new Error("Source document not found");
    }

    const textChunks = chunkTextForRag({
      documentId: document.id,
      content: document.content,
      maxChunkChars: parsedInput.maxChunkChars,
      overlapChars: parsedInput.overlapChars,
    });

    const response = await this.modelClient.embedTexts({
      texts: textChunks.map((chunk) => chunk.content),
    });

    if (response.embeddings.length !== textChunks.length) {
      throw new Error("Embedding count does not match document chunk count");
    }

    const chunks = await this.repository.replaceDocumentChunks({
      userId: input.userId,
      documentId: document.id,
      chunks: textChunks.map((chunk, index) => ({
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        metadata: chunk.metadata,
        embedding: response.embeddings[index] ?? [],
      })),
    });

    return {
      output: {
        documentId: document.id,
        chunkCount: chunks.length,
      },
      model: response.model,
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

function generateFollowupPromptTemplate() {
  return [
    "你是一个技术面试复习系统的追问生成器。",
    "根据题目、参考答案、用户回答、评分反馈和缺失要点，生成能模拟真实技术面试的后续追问。",
    "追问必须聚焦用户回答中的薄弱点、项目表达和排查思路，不要生成闲聊内容。",
  ].join("\n");
}
