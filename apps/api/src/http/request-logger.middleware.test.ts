import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";
import { requestLoggerMiddleware } from "./request-logger.middleware";

describe("requestLoggerMiddleware", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs safe structured request metadata when the response finishes", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const response = new EventEmitter() as EventEmitter & { statusCode: number; once: EventEmitter["once"] };
    response.statusCode = 201;

    requestLoggerMiddleware(
      {
        method: "POST",
        originalUrl: "/ai/jobs",
        requestId: "req_1",
        headers: {
          authorization: "Bearer secret-token",
        },
        body: {
          resume: "sensitive",
        },
      } as never,
      response as never,
      vi.fn(),
    );

    response.emit("finish");

    expect(info).toHaveBeenCalledOnce();
    const logLine = info.mock.calls[0]?.[0] as string;
    expect(JSON.parse(logLine)).toMatchObject({
      level: "info",
      message: "api_request",
      method: "POST",
      path: "/ai/jobs",
      statusCode: 201,
      requestId: "req_1",
    });
    expect(logLine).not.toContain("secret-token");
    expect(logLine).not.toContain("sensitive");
  });
});
