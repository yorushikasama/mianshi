import { Inject, Injectable } from "@nestjs/common";
import { PracticeAttemptInputSchema, buildPracticeReviewState, evaluatePracticeAttempt } from "@mianshi/shared";
import type { PracticeAttemptInput, PracticeAttemptResult } from "@mianshi/shared";
import { CatalogService } from "../catalog/catalog.service";

export interface SubmitPracticeAttemptInput extends PracticeAttemptInput {
  now?: Date;
}

export const PRACTICE_ATTEMPT_REPOSITORY = Symbol("PRACTICE_ATTEMPT_REPOSITORY");

export interface PracticeAttemptRepository {
  saveAttempt(attempt: PracticeAttemptResult): Promise<PracticeAttemptResult>;
  listAttempts(questionId?: string): Promise<PracticeAttemptResult[]>;
}

@Injectable()
export class PracticeService {
  constructor(
    private readonly catalogService: CatalogService,
    @Inject(PRACTICE_ATTEMPT_REPOSITORY)
    private readonly practiceAttemptRepository: PracticeAttemptRepository,
  ) {}

  async submitAttempt(input: SubmitPracticeAttemptInput) {
    const parsedInput = PracticeAttemptInputSchema.parse(input);
    const question = this.catalogService.getJavaBackendQuestion(parsedInput.questionId);
    const answer = this.catalogService.getJavaBackendAnswerForQuestion(parsedInput.questionId);

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

    return this.practiceAttemptRepository.saveAttempt(attempt);
  }

  async listAttempts(questionId?: string) {
    return this.practiceAttemptRepository.listAttempts(questionId);
  }

  async getReviewState(questionId: string) {
    const question = this.catalogService.getJavaBackendQuestion(questionId);

    if (!question) {
      throw new Error("Question not found");
    }

    return buildPracticeReviewState(questionId, await this.practiceAttemptRepository.listAttempts(questionId));
  }
}
