import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export interface RequestWithId extends Request {
  requestId?: string;
}

export function requestContextMiddleware(request: RequestWithId, response: Response, next: NextFunction) {
  const requestId = readRequestId(request.headers["x-request-id"]) || randomUUID();

  request.requestId = requestId;
  response.setHeader("x-request-id", requestId);
  next();
}

function readRequestId(value: string | string[] | undefined) {
  const requestId = Array.isArray(value) ? value[0] : value;
  return requestId?.trim() || null;
}
