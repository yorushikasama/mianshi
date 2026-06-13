import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { AiJobController } from "./ai-job.controller";
import { AiJobService } from "./ai-job.service";
import { AiJobWorker } from "./ai-job.worker";
import { AI_JOB_REPOSITORY, AI_JOB_STATE_REPOSITORY, AI_TASK_QUEUE } from "./ai-job.tokens";
import { BullMqAiTaskQueue } from "./bullmq-ai-task.queue";
import { PrismaAiJobRepository } from "./prisma-ai-job.repository";

@Module({
  imports: [DatabaseModule],
  controllers: [AiJobController],
  providers: [
    PrismaAiJobRepository,
    AiJobService,
    BullMqAiTaskQueue,
    AiJobWorker,
    {
      provide: AI_JOB_REPOSITORY,
      useExisting: PrismaAiJobRepository,
    },
    {
      provide: AI_JOB_STATE_REPOSITORY,
      useExisting: PrismaAiJobRepository,
    },
    {
      provide: AI_TASK_QUEUE,
      useExisting: BullMqAiTaskQueue,
    },
  ],
})
export class AiJobModule {}
