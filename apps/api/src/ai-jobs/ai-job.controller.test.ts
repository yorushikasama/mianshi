import { describe, expect, it } from "vitest";
import { ForbiddenException } from "@nestjs/common";
import { AiJobController } from "./ai-job.controller";

describe("AiJobController", () => {
  it("uses the authenticated user id when creating an AI job", async () => {
    const service = {
      createJob: async (userId: string, input: unknown) => ({ userId, input }),
      listJobs: async () => ({ items: [], total: 0 }),
      getJob: async () => ({}),
    };
    const controller = new AiJobController(service as never);

    const result = await controller.createJob({ user: { id: "user_1" } } as never, {
      type: "generate_questions",
      input: {
        domainSlug: "java_backend",
      },
    });

    expect(result).toEqual({
      userId: "user_1",
      input: {
        type: "generate_questions",
        input: {
          domainSlug: "java_backend",
        },
      },
    });
  });

  it("uses the authenticated user id when listing AI jobs", async () => {
    const service = {
      createJob: async () => ({}),
      listJobs: async (userId: string, input: unknown) => ({ userId, input }),
      getJob: async () => ({}),
    };
    const controller = new AiJobController(service as never);

    const result = await controller.listJobs({ user: { id: "user_1" } } as never, {
      status: "pending",
    });

    expect(result).toEqual({
      userId: "user_1",
      input: {
        status: "pending",
      },
    });
  });

  it("maps daily AI job limit errors to forbidden responses", async () => {
    const service = {
      createJob: async () => {
        throw new Error("Daily AI job limit reached");
      },
      listJobs: async () => ({ items: [], total: 0 }),
      getJob: async () => ({}),
    };
    const controller = new AiJobController(service as never);

    await expect(() =>
      controller.createJob({ user: { id: "user_1" } } as never, {
        type: "generate_questions",
        input: {},
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
