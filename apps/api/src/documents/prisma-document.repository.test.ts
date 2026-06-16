import { describe, expect, it, vi } from "vitest";
import { PrismaDocumentRepository } from "./prisma-document.repository";

describe("PrismaDocumentRepository", () => {
  it("creates source documents as user-owned records with chunk count metadata", async () => {
    const prisma = {
      sourceDocument: {
        create: vi.fn(async () => ({
          id: "doc_1",
          userId: "user_1",
          documentType: "resume",
          title: "Java 后端简历",
          content: "负责 Spring Boot 订单系统、Redis 缓存和 JVM 线上问题排查。",
          fileUrl: null,
          createdAt: new Date("2026-06-15T00:00:00.000Z"),
          _count: {
            chunks: 0,
          },
        })),
      },
    };
    const repository = new PrismaDocumentRepository(prisma as never);

    const document = await repository.createDocument({
      userId: "user_1",
      documentType: "resume",
      title: "Java 后端简历",
      content: "负责 Spring Boot 订单系统、Redis 缓存和 JVM 线上问题排查。",
    });

    expect(prisma.sourceDocument.create).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        documentType: "resume",
        title: "Java 后端简历",
        content: "负责 Spring Boot 订单系统、Redis 缓存和 JVM 线上问题排查。",
        fileUrl: undefined,
      },
      include: {
        _count: {
          select: {
            chunks: true,
          },
        },
      },
    });
    expect(document).toEqual({
      id: "doc_1",
      userId: "user_1",
      documentType: "resume",
      title: "Java 后端简历",
      contentPreview: "负责 Spring Boot 订单系统、Redis 缓存和 JVM 线上问题排查。",
      fileUrl: null,
      chunkCount: 0,
      createdAt: "2026-06-15T00:00:00.000Z",
    });
  });

  it("lists source documents through a user-isolated query", async () => {
    const prisma = {
      sourceDocument: {
        findMany: vi.fn(async () => [
          {
            id: "doc_1",
            userId: "user_1",
            documentType: "project_note",
            title: "订单项目复盘",
            content: "订单系统使用 Redis 缓存热点商品。",
            fileUrl: null,
            createdAt: new Date("2026-06-15T00:00:00.000Z"),
            _count: {
              chunks: 2,
            },
          },
        ]),
      },
    };
    const repository = new PrismaDocumentRepository(prisma as never);

    const documents = await repository.listDocuments({
      userId: "user_1",
      documentType: "project_note",
    });

    expect(prisma.sourceDocument.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        documentType: "project_note",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            chunks: true,
          },
        },
      },
    });
    expect(documents[0]?.chunkCount).toBe(2);
  });
});
