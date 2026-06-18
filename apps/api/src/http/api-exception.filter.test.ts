import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { buildApiErrorResponse } from "./api-exception.filter";

describe("buildApiErrorResponse", () => {
  it("formats validation errors with request id", () => {
    expect(
      buildApiErrorResponse(
        new BadRequestException({
          message: "Invalid request payload",
          issues: [{ path: ["email"], message: "Invalid email" }],
        }),
        "req_1",
      ),
    ).toEqual({
      status: 400,
      body: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: [{ path: ["email"], message: "Invalid email" }],
        requestId: "req_1",
      },
    });
  });

  it("does not leak unexpected error messages", () => {
    expect(buildApiErrorResponse(new Error("database password leaked"), "req_2")).toEqual({
      status: 500,
      body: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
        details: [],
        requestId: "req_2",
      },
    });
  });
});
