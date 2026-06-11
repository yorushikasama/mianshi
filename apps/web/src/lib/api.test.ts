import { describe, expect, it } from "vitest";
import { ApiError, buildApiUrl, buildPracticeAttemptsPath } from "./api";

describe("web API client helpers", () => {
  it("builds API URLs without duplicating slashes", () => {
    expect(buildApiUrl("/catalog/java-backend/questions", "http://localhost:3001/")).toBe(
      "http://localhost:3001/catalog/java-backend/questions",
    );
  });

  it("preserves response status in API errors", () => {
    const error = new ApiError("Request failed", 404);

    expect(error.status).toBe(404);
    expect(error.message).toBe("Request failed");
  });

  it("builds encoded practice history paths for a question", () => {
    expect(buildPracticeAttemptsPath("q/java roots")).toBe("/practice/attempts?questionId=q%2Fjava%20roots");
  });
});
