import { describe, expect, it } from "vitest";
import { QuestionController } from "./question.controller";

describe("QuestionController", () => {
  it("uses the authenticated user id when listing questions", async () => {
    const service = {
      listQuestions: async (userId: string, input: unknown) => ({ userId, input }),
    };
    const controller = new QuestionController(service as never);

    const result = await controller.listQuestions({ user: { id: "user_1" } } as never, {
      domainSlug: "java_backend",
    });

    expect(result).toEqual({
      userId: "user_1",
      input: {
        domainSlug: "java_backend",
      },
    });
  });
});
