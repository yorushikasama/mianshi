import type { Answer, PracticeAttemptInput, PracticeAttemptResult, PracticeReviewState, Question } from "@mianshi/shared";

const defaultApiBaseUrl = "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? defaultApiBaseUrl;
}

export function buildApiUrl(path: string, baseUrl = getApiBaseUrl()) {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

export async function fetchJavaBackendQuestion(questionId: string) {
  return request<Question>(`/catalog/java-backend/questions/${encodeURIComponent(questionId)}`);
}

export async function fetchJavaBackendAnswer(questionId: string) {
  return request<Answer>(`/catalog/java-backend/questions/${encodeURIComponent(questionId)}/answer`);
}

export async function submitPracticeAttempt(input: PracticeAttemptInput) {
  return request<PracticeAttemptResult>("/practice/attempts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function buildPracticeAttemptsPath(questionId?: string) {
  if (!questionId) {
    return "/practice/attempts";
  }

  return `/practice/attempts?questionId=${encodeURIComponent(questionId)}`;
}

export async function fetchPracticeAttempts(questionId?: string) {
  return request<PracticeAttemptResult[]>(buildPracticeAttemptsPath(questionId));
}

export async function fetchPracticeReviewState(questionId: string) {
  return request<PracticeReviewState>(`/practice/review-states/${encodeURIComponent(questionId)}`);
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  return (await response.json()) as T;
}

async function readErrorMessage(response: Response) {
  const text = await response.text();

  if (!text) {
    return `API request failed with status ${response.status}`;
  }

  try {
    const parsed = JSON.parse(text) as { message?: unknown };
    return typeof parsed.message === "string" ? parsed.message : text;
  } catch {
    return text;
  }
}
