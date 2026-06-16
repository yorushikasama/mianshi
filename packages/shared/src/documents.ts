import { z } from "zod";

export const documentTypes = ["resume", "job_description", "project_note", "learning_note"] as const;

export const CreateSourceDocumentInputSchema = z.object({
  documentType: z.enum(documentTypes),
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(200_000),
  fileUrl: z.string().url().optional(),
});

export const SourceDocumentSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  documentType: z.enum(documentTypes),
  title: z.string().min(1),
  contentPreview: z.string(),
  fileUrl: z.string().nullable(),
  chunkCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
});

export const SourceDocumentListQuerySchema = z.object({
  documentType: z.enum(documentTypes).optional(),
});

export const SourceDocumentListResultSchema = z.object({
  items: z.array(SourceDocumentSchema),
});

export const RagChunkMetadataSchema = z.object({
  documentId: z.string().min(1),
  chunkIndex: z.number().int().nonnegative(),
  startChar: z.number().int().nonnegative(),
  endChar: z.number().int().nonnegative(),
});

export const RagTextChunkSchema = z.object({
  documentId: z.string().min(1),
  chunkIndex: z.number().int().nonnegative(),
  content: z.string().min(1),
  metadata: RagChunkMetadataSchema,
});

export type DocumentType = (typeof documentTypes)[number];
export type CreateSourceDocumentInput = z.infer<typeof CreateSourceDocumentInputSchema>;
export type SourceDocument = z.infer<typeof SourceDocumentSchema>;
export type SourceDocumentListQuery = z.infer<typeof SourceDocumentListQuerySchema>;
export type SourceDocumentListResult = z.infer<typeof SourceDocumentListResultSchema>;
export type RagChunkMetadata = z.infer<typeof RagChunkMetadataSchema>;
export type RagTextChunk = z.infer<typeof RagTextChunkSchema>;

export function chunkTextForRag(input: {
  documentId: string;
  content: string;
  maxChunkChars?: number;
  overlapChars?: number;
}): RagTextChunk[] {
  const maxChunkChars = input.maxChunkChars ?? 1_200;
  const overlapChars = input.overlapChars ?? 160;

  if (maxChunkChars < 1) {
    throw new Error("maxChunkChars must be greater than 0");
  }

  if (overlapChars < 0 || overlapChars >= maxChunkChars) {
    throw new Error("overlapChars must be non-negative and smaller than maxChunkChars");
  }

  const content = input.content.trim();
  if (!content) {
    return [];
  }

  const chunks: RagTextChunk[] = [];
  const step = maxChunkChars - overlapChars;

  for (let startChar = 0; startChar < content.length; startChar += step) {
    const endChar = Math.min(startChar + maxChunkChars, content.length);
    const chunkIndex = chunks.length;
    const chunkContent = content.slice(startChar, endChar);

    chunks.push(
      RagTextChunkSchema.parse({
        documentId: input.documentId,
        chunkIndex,
        content: chunkContent,
        metadata: {
          documentId: input.documentId,
          chunkIndex,
          startChar,
          endChar,
        },
      }),
    );

    if (endChar >= content.length) {
      break;
    }
  }

  return chunks;
}
