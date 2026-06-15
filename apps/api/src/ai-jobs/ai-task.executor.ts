import { Inject, Injectable } from "@nestjs/common";
import { z } from "zod";
import {
  GenerateAnswerOutputSchema,
  GenerateQuestionsOutputSchema,
  answerTypes,
  type DifficultyLevel,
  type GenerateAnswerOutput,
  type GeneratedQuestion,
  type QuestionType,
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
