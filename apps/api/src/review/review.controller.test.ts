import { describe, expect, it } from "vitest";
import { ReviewController } from "./review.controller";

describe("ReviewController", () => {
  it("uses the authenticated user id when reading the review overview", async () => {
    const service = {
      getOverview: async (userId: string, input: unknown) => ({ userId, input }),
      getToday: async () => ({}),
    };
    const controller = new ReviewController(service as never);

    const result = await controller.getOverview({ user: { id: "user_1" } } as never, {
      dueLimit: "8",
      recentLimit: "4",
    });

    expect(result).toEqual({
      userId: "user_1",
      input: {
        dueLimit: "8",
        recentLimit: "4",
      },
    });
  });

  it("uses the authenticated user id when reading today's review queue", async () => {
    const service = {
      getOverview: async () => ({}),
      getToday: async (userId: string, input: unknown) => ({ userId, input }),
    };
    const controller = new ReviewController(service as never);

    const result = await controller.getToday({ user: { id: "user_1" } } as never, {
      limit: "6",
    });

    expect(result).toEqual({
      userId: "user_1",
      input: {
        limit: "6",
      },
    });
  });
});
