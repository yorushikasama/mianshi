import { describe, expect, it, vi } from "vitest";
import { requestContextMiddleware } from "./request-context.middleware";

describe("requestContextMiddleware", () => {
  it("preserves an incoming request id and mirrors it to the response", () => {
    const setHeader = vi.fn();
    const next = vi.fn();

    requestContextMiddleware(
      { headers: { "x-request-id": "req_existing" } } as never,
      { setHeader } as never,
      next,
    );

    expect(setHeader).toHaveBeenCalledWith("x-request-id", "req_existing");
    expect(next).toHaveBeenCalled();
  });

  it("generates a request id when the client does not provide one", () => {
    const setHeader = vi.fn();

    requestContextMiddleware({ headers: {} } as never, { setHeader } as never, vi.fn());

    expect(setHeader).toHaveBeenCalledWith("x-request-id", expect.stringMatching(/[0-9a-f-]{36}/));
  });
});
