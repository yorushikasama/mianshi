import { Inject, Injectable } from "@nestjs/common";
import {
  CreateSourceDocumentInputSchema,
  SourceDocumentListQuerySchema,
  SourceDocumentListResultSchema,
  type CreateSourceDocumentInput,
  type DocumentType,
  type SourceDocument,
  type SourceDocumentListResult,
} from "@mianshi/shared";
import { AiJobService } from "../ai-jobs/ai-job.service";

export const DOCUMENT_REPOSITORY = Symbol("DOCUMENT_REPOSITORY");

export interface DocumentRepository {
  createDocument(input: CreateSourceDocumentInput & { userId: string }): Promise<SourceDocument>;
  listDocuments(input: { userId: string; documentType?: DocumentType }): Promise<SourceDocument[]>;
}

@Injectable()
export class DocumentService {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: DocumentRepository,
    private readonly aiJobService: AiJobService,
  ) {}

  async createDocument(userId: string, input: unknown) {
    const parsedInput = CreateSourceDocumentInputSchema.parse(input);
    const document = await this.documentRepository.createDocument({
      userId,
      documentType: parsedInput.documentType,
      title: parsedInput.title,
      content: parsedInput.content,
      fileUrl: parsedInput.fileUrl,
    });
    const job = await this.aiJobService.createJob(userId, {
      type: "embed_document",
      input: {
        documentId: document.id,
      },
    });

    return { document, job };
  }

  async listDocuments(userId: string, input: unknown): Promise<SourceDocumentListResult> {
    const parsedInput = SourceDocumentListQuerySchema.parse(input ?? {});
    const documents = await this.documentRepository.listDocuments({
      userId,
      documentType: parsedInput.documentType,
    });

    return SourceDocumentListResultSchema.parse({
      items: documents,
    });
  }
}
