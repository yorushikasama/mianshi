import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { AiJobController } from "./ai-job.controller";
import { AiJobService } from "./ai-job.service";
import { AiJobWorker } from "./ai-job.worker";
import { AiTaskExecutorService } from "./ai-task.executor";
import {
  AI_GENERATION_REPOSITORY,
  AI_JOB_REPOSITORY,
  AI_JOB_STATE_REPOSITORY,
  AI_MODEL_CLIENT,
  AI_TASK_EXECUTOR,
  AI_TASK_QUEUE,
} from "./ai-job.tokens";
import { BullMqAiTaskQueue } from "./bullmq-ai-task.queue";
import { OpenAiStructuredOutputClient } from "./openai-structured-output.client";
import { PrismaAiGenerationRepository } from "./prisma-ai-generation.repository";
import { PrismaAiJobRepository } from "./prisma-ai-job.repository";

@Module({
  imports: [DatabaseModule],
  controllers: [AiJobController],
  providers: [
    PrismaAiJobRepository,
    PrismaAiGenerationRepository,
    AiJobService,
    BullMqAiTaskQueue,
    AiTaskExecutorService,
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
    {
      provide: AI_TASK_EXECUTOR,
      useExisting: AiTaskExecutorService,
    },
    {
      provide: AI_GENERATION_REPOSITORY,
      useExisting: PrismaAiGenerationRepository,
    },
    {
      provide: AI_MODEL_CLIENT,
      useFactory: () => new OpenAiStructuredOutputClient(),
    },
  ],
  exports: [AiJobService],
})
export class AiJobModule {}
