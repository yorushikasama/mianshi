-- AlterTable
ALTER TABLE "AiJob" ADD COLUMN "queueJobId" TEXT;
ALTER TABLE "AiJob" ADD COLUMN "model" TEXT;
ALTER TABLE "AiJob" ADD COLUMN "promptVersionId" TEXT;
ALTER TABLE "AiJob" ADD COLUMN "tokenUsage" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AiJob" ADD COLUMN "latencyMs" INTEGER;
ALTER TABLE "AiJob" ADD COLUMN "inputHash" TEXT;
ALTER TABLE "AiJob" ADD COLUMN "startedAt" TIMESTAMP(3);
ALTER TABLE "AiJob" ADD COLUMN "completedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "AiJob_userId_createdAt_idx" ON "AiJob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiJob_inputHash_idx" ON "AiJob"("inputHash");

-- AddForeignKey
ALTER TABLE "AiJob" ADD CONSTRAINT "AiJob_promptVersionId_fkey" FOREIGN KEY ("promptVersionId") REFERENCES "PromptVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
