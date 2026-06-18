import type { NextFunction, Response } from "express";
import type { RequestWithId } from "./request-context.middleware";

export function requestLoggerMiddleware(request: RequestWithId, response: Response, next: NextFunction) {
  const startedAt = Date.now();

  response.once("finish", () => {
    console.info(
      JSON.stringify({
        level: "info",
        message: "api_request",
        method: request.method,
        path: request.originalUrl ?? request.url,
        statusCode: response.statusCode,
        durationMs: Math.max(0, Date.now() - startedAt),
        requestId: request.requestId ?? "req_unknown",
      }),
    );
  });

  next();
}
