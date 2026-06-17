import { Inject, Injectable } from "@nestjs/common";
import { PracticeAttemptInputSchema, buildPracticeReviewState, evaluatePracticeAttempt } from "@mianshi/shared";
import type { Answer, PracticeAttemptInput, PracticeAttemptResult, Question } from "@mianshi/shared";
import { CatalogService } from "../catalog/catalog.service";

export interface SubmitPracticeAttemptInput extends PracticeAttemptInput {
  now?: Date;
}

export const PRACTICE_ATTEMPT_REPOSITORY = Symbol("PRACTICE_ATTEMPT_REPOSITORY");

export interface PracticeAttemptRepository {
  saveAttempt(userId: string, attempt: PracticeAttemptResult): Promise<PracticeAttemptResult>;
  listAttempts(userId: string, questionId?: string): Promise<PracticeAttemptResult[]>;
}

export const PRACTICE_QUESTION_REPOSITORY = Symbol("PRACTICE_QUESTION_REPOSITORY");

export interface PracticeQuestionRepository {
  findPracticeQuestion(input: {
    userId: string;
    questionId: string;
  }): Promise<{ question: Question; answer: Answer | null } | null>;
}

@Injectable()
export class PracticeService {
  constructor(
    private readonly catalogService: CatalogService,
    @Inject(PRACTICE_ATTEMPT_REPOSITORY)
    private readonly practiceAttemptRepository: PracticeAttemptRepository,
    @Inject(PRACTICE_QUESTION_REPOSITORY)
    private readonly practiceQuestionRepository: PracticeQuestionRepository,
  ) {}

  async submitAttempt(userId: string, input: SubmitPracticeAttemptInput) {
    const parsedInput = PracticeAttemptInputSchema.parse(input);
    const practiceQuestion = await this.findPracticeQuestion(userId, parsedInput.questionId);
    const question = practiceQuestion?.question;
    const answer = practiceQuestion?.answer;

    if (!question) {
      throw new Error("Question not found");
    }

    if (!answer) {
      throw new Error("Answer not found");
    }

    const attempt = evaluatePracticeAttempt({
      question,
      answer,
      submittedAnswer: parsedInput.submittedAnswer,
      selfRating: parsedInput.selfRating,
      now: input.now,
    });

    return this.practiceAttemptRepository.saveAttempt(userId, attempt);
  }

  async listAttempts(userId: string, questionId?: string) {
    return this.practiceAttemptRepository.listAttempts(userId, questionId);
  }

  async getReviewState(userId: string, questionId: string) {
    const practiceQuestion = await this.findPracticeQuestion(userId, questionId);

    if (!practiceQuestion) {
      throw new Error("Question not found");
    }

    return buildPracticeReviewState(questionId, await this.practiceAttemptRepository.listAttempts(userId, questionId));
  }

  private async findPracticeQuestion(userId: string, questionId: string) {
    const persistedQuestion = await this.practiceQuestionRepository.findPracticeQuestion({ userId, questionId });

    if (persistedQuestion) {
      return persistedQuestion;
    }

    const question = this.catalogService.getJavaBackendQuestion(questionId);
    const answer = this.catalogService.getJavaBackendAnswerForQuestion(questionId);

    return question ? { question, answer: answer ?? null } : null;
  }
}
