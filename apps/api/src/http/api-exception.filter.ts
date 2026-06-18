import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import type { Response } from "express";
import type { RequestWithId } from "./request-context.middleware";

interface ErrorResponseBody {
  code: string;
  message: string;
  details: unknown[];
  requestId: string;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithId>();
    const response = context.getResponse<Response>();
    const { status, body } = buildApiErrorResponse(exception, request.requestId ?? "req_unknown");

    response.status(status).json(body);
  }
}

export function buildApiErrorResponse(exception: unknown, requestId: string): { status: number; body: ErrorResponseBody } {
  if (!(exception instanceof HttpException)) {
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
        details: [],
        requestId,
      },
    };
  }

  const status = exception.getStatus();
  const response = exception.getResponse();
  const details = readDetails(response);

  return {
    status,
    body: {
      code: statusToErrorCode(status),
      message: readMessage(response) || exception.message,
      details,
      requestId,
    },
  };
}

function readMessage(response: string | object) {
  if (typeof response === "string") {
    return response;
  }

  const message = (response as { message?: unknown }).message;

  if (Array.isArray(message)) {
    return message.join("; ");
  }

  return typeof message === "string" ? message : null;
}

function readDetails(response: string | object) {
  if (typeof response === "string") {
    return [];
  }

  const { details, issues, message } = response as {
    details?: unknown;
    issues?: unknown;
    message?: unknown;
  };

  if (Array.isArray(details)) {
    return details;
  }

  if (Array.isArray(issues)) {
    return issues;
  }

  return Array.isArray(message) ? message : [];
}

function statusToErrorCode(status: number) {
  if (status === HttpStatus.BAD_REQUEST) {
    return "VALIDATION_ERROR";
  }

  if (status === HttpStatus.UNAUTHORIZED) {
    return "UNAUTHORIZED";
  }

  if (status === HttpStatus.FORBIDDEN) {
    return "FORBIDDEN";
  }

  if (status === HttpStatus.NOT_FOUND) {
    return "NOT_FOUND";
  }

  return "REQUEST_ERROR";
}
