import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { GenerateAnswerOutputSchema, GenerateQuestionsOutputSchema, ScoreAttemptOutputSchema } from "@mianshi/shared";
import type {
  AiModelClient,
  AiModelClientResult,
  AnswerContext,
  PromptVersionRecord,
  QuestionContext,
} from "./ai-task.executor";

type RuntimeEnv = {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
};

export type OpenAiConfig = {
  apiKey: string;
  model: string;
};

type OpenAiParsedCompletion = {
  model?: string;
  usage?: {
    total_tokens?: number | null;
  } | null;
  choices?: {
    message?: {
      parsed?: unknown;
      refusal?: string | null;
    };
  }[];
};

type OpenAiParseClient = {
  chat: {
    completions: {
      parse(input: unknown): Promise<OpenAiParsedCompletion>;
    };
  };
};

export class OpenAiStructuredOutputClient implements AiModelClient {
  constructor(
    private readonly client: OpenAiParseClient = createOpenAiClient(),
    private readonly config: OpenAiConfig = getOpenAiConfigFromEnv(),
  ) {}

  async generateQuestions(input: {
    input: {
      domainSlug: string;
      categorySlug?: string;
      count: number;
      difficulty?: string;
      focus?: string;
    };
    promptVersion: PromptVersionRecord;
  }): Promise<AiModelClientResult> {
    const completion = await this.client.chat.completions.parse({
      model: this.config.model,
      messages: [
        { role: "system", content: input.promptVersion.template },
        {
          role: "user",
          content: JSON.stringify(
            {
              task: "generate_questions",
              promptVersion: {
                name: input.promptVersion.name,
                version: input.promptVersion.version,
              },
              input: input.input,
            },
            null,
            2,
          ),
        },
      ],
      response_format: zodResponseFormat(GenerateQuestionsOutputSchema, "generate_questions_output"),
    });

    return toModelClientResult(completion);
  }

  async generateAnswer(input: {
    input: {
      questionId: string;
      answerType?: string;
    };
    question: QuestionContext;
    promptVersion: PromptVersionRecord;
  }): Promise<AiModelClientResult> {
    const completion = await this.client.chat.completions.parse({
      model: this.config.model,
      messages: [
        { role: "system", content: input.promptVersion.template },
        {
          role: "user",
          content: JSON.stringify(
            {
              task: "generate_answer",
              promptVersion: {
                name: input.promptVersion.name,
                version: input.promptVersion.version,
              },
              input: input.input,
              question: input.question,
            },
            null,
            2,
          ),
        },
      ],
      response_format: zodResponseFormat(GenerateAnswerOutputSchema, "generate_answer_output"),
    });

    return toModelClientResult(completion);
  }

  async scoreAttempt(input: {
    input: {
      questionId: string;
      submittedAnswer: string;
      selfRating?: string;
      now?: Date;
    };
    question: QuestionContext;
    answer: AnswerContext;
    promptVersion: PromptVersionRecord;
  }): Promise<AiModelClientResult> {
    const completion = await this.client.chat.completions.parse({
      model: this.config.model,
      messages: [
        { role: "system", content: input.promptVersion.template },
        {
          role: "user",
          content: JSON.stringify(
            {
              task: "score_attempt",
              promptVersion: {
                name: input.promptVersion.name,
                version: input.promptVersion.version,
              },
              input: input.input,
              question: input.question,
              answer: input.answer,
            },
            null,
            2,
          ),
        },
      ],
      response_format: zodResponseFormat(ScoreAttemptOutputSchema, "score_attempt_output"),
    });

    return toModelClientResult(completion);
  }
}

export function getOpenAiConfigFromEnv(env: RuntimeEnv = process.env): OpenAiConfig {
  const apiKey = env.OPENAI_API_KEY?.trim();
  const model = env.OPENAI_MODEL?.trim();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to run AI generation tasks.");
  }

  if (!model) {
    throw new Error("OPENAI_MODEL is required to run AI generation tasks.");
  }

  return { apiKey, model };
}

function createOpenAiClient(config = getOpenAiConfigFromEnv()): OpenAiParseClient {
  return new OpenAI({
    apiKey: config.apiKey,
  }) as OpenAiParseClient;
}

function toModelClientResult(completion: OpenAiParsedCompletion): AiModelClientResult {
  const message = completion.choices?.[0]?.message;

  if (message?.parsed) {
    return {
      output: message.parsed,
      model: completion.model ?? "unknown",
      tokenUsage: completion.usage?.total_tokens ?? 0,
    };
  }

  if (message?.refusal) {
    throw new Error(`OpenAI refused structured output: ${message.refusal}`);
  }

  throw new Error("OpenAI did not return parsed structured output.");
}
