import { Module } from "@nestjs/common";
import { AiJobModule } from "./ai-jobs/ai-job.module";
import { AuthController } from "./auth/auth.controller";
import { AUTH_USER_REPOSITORY, AuthService } from "./auth/auth.service";
import { BearerAuthGuard } from "./auth/bearer-auth.guard";
import { PrismaAuthUserRepository } from "./auth/prisma-auth-user.repository";
import { CatalogController } from "./catalog/catalog.controller";
import { CatalogService } from "./catalog/catalog.service";
import { DatabaseModule } from "./database/database.module";
import { DocumentController } from "./documents/document.controller";
import { DOCUMENT_REPOSITORY, DocumentService } from "./documents/document.service";
import { PrismaDocumentRepository } from "./documents/prisma-document.repository";
import { HealthController } from "./health/health.controller";
import { PracticeController } from "./practice/practice.controller";
import { PrismaPracticeAttemptRepository } from "./practice/prisma-practice-attempt.repository";
import { PRACTICE_ATTEMPT_REPOSITORY, PracticeService } from "./practice/practice.service";
import { PrismaQuestionRepository } from "./questions/prisma-question.repository";
import { QuestionController } from "./questions/question.controller";
import { QUESTION_REPOSITORY, QuestionService } from "./questions/question.service";
import { PrismaReviewRepository } from "./review/prisma-review.repository";
import { ReviewController } from "./review/review.controller";
import { REVIEW_REPOSITORY, ReviewService } from "./review/review.service";

@Module({
  imports: [DatabaseModule, AiJobModule],
  controllers: [
    HealthController,
    AuthController,
    CatalogController,
    QuestionController,
    PracticeController,
    ReviewController,
    DocumentController,
  ],
  providers: [
    CatalogService,
    PrismaAuthUserRepository,
    AuthService,
    BearerAuthGuard,
    {
      provide: AUTH_USER_REPOSITORY,
      useExisting: PrismaAuthUserRepository,
    },
    PrismaQuestionRepository,
    QuestionService,
    {
      provide: QUESTION_REPOSITORY,
      useExisting: PrismaQuestionRepository,
    },
    PrismaPracticeAttemptRepository,
    PracticeService,
    {
      provide: PRACTICE_ATTEMPT_REPOSITORY,
      useExisting: PrismaPracticeAttemptRepository,
    },
    PrismaReviewRepository,
    ReviewService,
    {
      provide: REVIEW_REPOSITORY,
      useExisting: PrismaReviewRepository,
    },
    PrismaDocumentRepository,
    DocumentService,
    {
      provide: DOCUMENT_REPOSITORY,
      useExisting: PrismaDocumentRepository,
    },
  ],
})
export class AppModule {}
