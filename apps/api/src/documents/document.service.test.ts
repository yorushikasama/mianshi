import { describe, expect, it, vi } from "vitest";
import type { AiJob } from "@mianshi/shared";
import { DocumentService, type DocumentRepository } from "./document.service";

describe("DocumentService", () => {
  it("creates a user-owned source document and enqueues embedding asynchronously", async () => {
    const repository: DocumentRepository = {
      createDocument: vi.fn(async (input) => ({
        id: "doc_1",
        userId: input.userId,
        documentType: input.documentType,
        title: input.title,
        contentPreview: input.content,
        fileUrl: input.fileUrl ?? null,
        chunkCount: 0,
        createdAt: "2026-06-15T00:00:00.000Z",
      })),
      listDocuments: vi.fn(async () => []),
    };
    const aiJobService = {
      createJob: vi.fn(async (userId: string, input: unknown) => ({
        id: "job_1",
        userId,
        type: "embed_document",
        input,
      })),
    };
    const service = new DocumentService(repository, aiJobService as never);

    const result = await service.createDocument("user_1", {
      documentType: "resume",
      title: "Java 后端简历",
      content: "负责 Spring Boot 订单系统、Redis 缓存和 JVM 线上问题排查。",
    });

    expect(repository.createDocument).toHaveBeenCalledWith({
      userId: "user_1",
      documentType: "resume",
      title: "Java 后端简历",
      content: "负责 Spring Boot 订单系统、Redis 缓存和 JVM 线上问题排查。",
      fileUrl: undefined,
    });
    expect(aiJobService.createJob).toHaveBeenCalledWith("user_1", {
      type: "embed_document",
      input: {
        documentId: "doc_1",
      },
    });
    expect(result).toEqual({
      document: expect.objectContaining({
        id: "doc_1",
        userId: "user_1",
      }),
      job: expect.objectContaining({
        id: "job_1",
        type: "embed_document",
      }) as AiJob,
    });
  });

  it("lists only documents for the current user", async () => {
    const repository: DocumentRepository = {
      createDocument: vi.fn(),
      listDocuments: vi.fn(async () => [
        {
          id: "doc_1",
          userId: "user_1",
          documentType: "job_description",
          title: "Java JD",
          contentPreview: "要求熟悉 JVM、Redis、MySQL。",
          fileUrl: null,
          chunkCount: 2,
          createdAt: "2026-06-15T00:00:00.000Z",
        },
      ]),
    };
    const service = new DocumentService(repository, { createJob: vi.fn() } as never);

    const result = await service.listDocuments("user_1", { documentType: "job_description" });

    expect(repository.listDocuments).toHaveBeenCalledWith({
      userId: "user_1",
      documentType: "job_description",
    });
    expect(result.items[0]?.userId).toBe("user_1");
  });
});
