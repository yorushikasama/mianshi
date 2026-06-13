import type {
  Answer,
  AiJob,
  AiJobListResult,
  AiJobStatus,
  CreateAiJobInput,
  PracticeAttemptInput,
  PracticeAttemptResult,
  PracticeReviewState,
  Question,
  ReviewOverview,
} from "@mianshi/shared";

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

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
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

export async function register(input: { email: string; password: string; displayName?: string }) {
  const session = await request<AuthSession>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
    credentials: "include",
  });
  setAccessToken(session.accessToken);
  return session;
}

export async function login(input: { email: string; password: string }) {
  const session = await request<AuthSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
    credentials: "include",
  });
  setAccessToken(session.accessToken);
  return session;
}

export async function refreshSession() {
  const session = await request<AuthSession>("/auth/refresh", {
    method: "POST",
    credentials: "include",
    auth: false,
  });
  setAccessToken(session.accessToken);
  return session;
}

export async function fetchCurrentUser() {
  return request<{ user: AuthUser }>("/auth/me", {
    auth: true,
  });
}

export async function submitPracticeAttempt(input: PracticeAttemptInput) {
  return request<PracticeAttemptResult>("/practice/attempts", {
    method: "POST",
    body: JSON.stringify(input),
    auth: true,
  });
}

export function buildPracticeAttemptsPath(questionId?: string) {
  if (!questionId) {
    return "/practice/attempts";
  }

  return `/practice/attempts?questionId=${encodeURIComponent(questionId)}`;
}

export async function fetchPracticeAttempts(questionId?: string) {
  return request<PracticeAttemptResult[]>(buildPracticeAttemptsPath(questionId), {
    auth: true,
  });
}

export async function fetchPracticeReviewState(questionId: string) {
  return request<PracticeReviewState>(`/practice/review-states/${encodeURIComponent(questionId)}`, {
    auth: true,
  });
}

export function buildReviewOverviewPath(input?: { dueLimit?: number; recentLimit?: number }) {
  const searchParams = new URLSearchParams();

  if (input?.dueLimit) {
    searchParams.set("dueLimit", String(input.dueLimit));
  }

  if (input?.recentLimit) {
    searchParams.set("recentLimit", String(input.recentLimit));
  }

  const query = searchParams.toString();
  return query ? `/review/overview?${query}` : "/review/overview";
}

export async function fetchReviewOverview(input?: { dueLimit?: number; recentLimit?: number }) {
  return request<ReviewOverview>(buildReviewOverviewPath(input), {
    auth: true,
  });
}

export function buildAiJobsPath(input?: { status?: AiJobStatus; page?: number; pageSize?: number }) {
  const searchParams = new URLSearchParams();

  if (input?.status) {
    searchParams.set("status", input.status);
  }

  if (input?.page) {
    searchParams.set("page", String(input.page));
  }

  if (input?.pageSize) {
    searchParams.set("pageSize", String(input.pageSize));
  }

  const query = searchParams.toString();
  return query ? `/ai/jobs?${query}` : "/ai/jobs";
}

export async function fetchAiJobs(input?: { status?: AiJobStatus; page?: number; pageSize?: number }) {
  return request<AiJobListResult>(buildAiJobsPath(input), {
    auth: true,
  });
}

export async function createAiJob(input: CreateAiJobInput) {
  return request<AiJob>("/ai/jobs", {
    method: "POST",
    body: JSON.stringify(input),
    auth: true,
  });
}

interface ApiRequestInit extends RequestInit {
  auth?: boolean;
  retryOnUnauthorized?: boolean;
}

async function request<T>(path: string, init?: ApiRequestInit): Promise<T> {
  const { auth = false, retryOnUnauthorized = true, ...requestInit } = init ?? {};
  const token = auth ? (accessToken ?? (await tryRefreshAccessToken())) : null;
  const response = await fetch(buildApiUrl(path), {
    ...requestInit,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...requestInit.headers,
    },
  });

  if (response.status === 401 && auth && retryOnUnauthorized) {
    const refreshedToken = await tryRefreshAccessToken();

    if (refreshedToken) {
      return request<T>(path, {
        ...init,
        retryOnUnauthorized: false,
      });
    }
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  return (await response.json()) as T;
}

async function tryRefreshAccessToken() {
  try {
    const session = await request<AuthSession>("/auth/refresh", {
      method: "POST",
      credentials: "include",
      auth: false,
      retryOnUnauthorized: false,
    });
    setAccessToken(session.accessToken);
    return session.accessToken;
  } catch {
    clearAccessToken();
    return null;
  }
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
