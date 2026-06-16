import { Injectable } from "@nestjs/common";
import type { DocumentType, SourceDocument } from "@mianshi/shared";
import { PrismaService } from "../database/prisma.service";
import type { DocumentRepository } from "./document.service";

type SourceDocumentRow = {
  id: string;
  userId: string;
  documentType: DocumentType;
  title: string;
  content: string;
  fileUrl: string | null;
  createdAt: Date;
  _count: {
    chunks: number;
  };
};

@Injectable()
export class PrismaDocumentRepository implements DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createDocument(input: Parameters<DocumentRepository["createDocument"]>[0]): Promise<SourceDocument> {
    const document = await this.prisma.sourceDocument.create({
      data: {
        userId: input.userId,
        documentType: input.documentType,
        title: input.title,
        content: input.content,
        fileUrl: input.fileUrl,
      },
      include: documentCountInclude,
    });

    return toSourceDocument(document as SourceDocumentRow);
  }

  async listDocuments(input: Parameters<DocumentRepository["listDocuments"]>[0]): Promise<SourceDocument[]> {
    const documents = await this.prisma.sourceDocument.findMany({
      where: {
        userId: input.userId,
        documentType: input.documentType,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: documentCountInclude,
    });

    return documents.map((document) => toSourceDocument(document as SourceDocumentRow));
  }
}

const documentCountInclude = {
  _count: {
    select: {
      chunks: true,
    },
  },
} as const;

function toSourceDocument(document: SourceDocumentRow): SourceDocument {
  return {
    id: document.id,
    userId: document.userId,
    documentType: document.documentType,
    title: document.title,
    contentPreview: document.content.length > 240 ? `${document.content.slice(0, 240)}...` : document.content,
    fileUrl: document.fileUrl,
    chunkCount: document._count.chunks,
    createdAt: document.createdAt.toISOString(),
  };
}
