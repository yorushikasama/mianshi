import { describe, expect, it } from "vitest";
import { PracticeController } from "./practice.controller";

describe("PracticeController", () => {
  it("uses the authenticated user id when listing attempts", async () => {
    const service = {
      listAttempts: async (userId: string, questionId?: string) => ({ userId, questionId }),
    };
    const controller = new PracticeController(service as never);

    const result = await controller.listAttempts({ user: { id: "user_1" } } as never, "q_jvm_gc_roots");

    expect(result).toEqual({
      userId: "user_1",
      questionId: "q_jvm_gc_roots",
    });
  });
});
