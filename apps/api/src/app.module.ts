import { Module } from "@nestjs/common";
import { CatalogController } from "./catalog/catalog.controller";
import { CatalogService } from "./catalog/catalog.service";
import { PrismaService } from "./database/prisma.service";
import { HealthController } from "./health/health.controller";
import { PracticeController } from "./practice/practice.controller";
import { PrismaPracticeAttemptRepository } from "./practice/prisma-practice-attempt.repository";
import { PRACTICE_ATTEMPT_REPOSITORY, PracticeService } from "./practice/practice.service";

@Module({
  controllers: [HealthController, CatalogController, PracticeController],
  providers: [
    CatalogService,
    PrismaService,
    PrismaPracticeAttemptRepository,
    PracticeService,
    {
      provide: PRACTICE_ATTEMPT_REPOSITORY,
      useExisting: PrismaPracticeAttemptRepository,
    },
  ],
})
export class AppModule {}
