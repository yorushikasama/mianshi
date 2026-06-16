import { describe, expect, it } from "vitest";
import {
  CreateSourceDocumentInputSchema,
  SourceDocumentSchema,
  chunkTextForRag,
  documentTypes,
} from "./documents";

describe("document schemas and RAG chunking", () => {
  it("validates supported user-owned source document input", () => {
    const input = CreateSourceDocumentInputSchema.parse({
      documentType: "resume",
      title: "Java 后端简历",
      content: "负责 Spring Boot 订单系统、Redis 缓存和 JVM 线上问题排查。",
    });

    expect(documentTypes).toContain("job_description");
    expect(input.documentType).toBe("resume");
    expect(input.title).toBe("Java 后端简历");
  });

  it("accepts persisted source document metadata without exposing other users", () => {
    const document = SourceDocumentSchema.parse({
      id: "doc_1",
      userId: "user_1",
      documentType: "project_note",
      title: "订单项目复盘",
      contentPreview: "订单系统使用 Redis 缓存热点商品。",
      fileUrl: null,
      chunkCount: 3,
      createdAt: "2026-06-15T00:00:00.000Z",
    });

    expect(document.userId).toBe("user_1");
    expect(document.chunkCount).toBe(3);
  });

  it("chunks long RAG text with deterministic overlap metadata", () => {
    const chunks = chunkTextForRag({
      documentId: "doc_1",
      content: "0123456789abcdefghijklmnopqrstuvwxyz",
      maxChunkChars: 12,
      overlapChars: 4,
    });

    expect(chunks.map((chunk) => chunk.content)).toEqual([
      "0123456789ab",
      "89abcdefghij",
      "ghijklmnopqr",
      "opqrstuvwxyz",
    ]);
    expect(chunks[1]?.metadata).toEqual({
      documentId: "doc_1",
      chunkIndex: 1,
      startChar: 8,
      endChar: 20,
    });
  });
});
