import { describe, expect, it } from "vitest";
import { DocumentController } from "./document.controller";

describe("DocumentController", () => {
  it("uses the authenticated user id when creating documents", async () => {
    const service = {
      createDocument: async (userId: string, input: unknown) => ({ userId, input }),
      listDocuments: async () => ({ items: [] }),
    };
    const controller = new DocumentController(service as never);

    const result = await controller.createDocument({ user: { id: "user_1" } } as never, {
      documentType: "resume",
      title: "Java 后端简历",
      content: "负责 Spring Boot 订单系统。",
    });

    expect(result).toEqual({
      userId: "user_1",
      input: {
        documentType: "resume",
        title: "Java 后端简历",
        content: "负责 Spring Boot 订单系统。",
      },
    });
  });

  it("uses the authenticated user id when listing documents", async () => {
    const service = {
      createDocument: async () => ({}),
      listDocuments: async (userId: string, input: unknown) => ({ userId, input }),
    };
    const controller = new DocumentController(service as never);

    const result = await controller.listDocuments({ user: { id: "user_1" } } as never, {
      documentType: "project_note",
    });

    expect(result).toEqual({
      userId: "user_1",
      input: {
        documentType: "project_note",
      },
    });
  });
});
