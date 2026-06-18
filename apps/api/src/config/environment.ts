interface RuntimeEnv {
  DATABASE_URL?: string;
  JWT_ACCESS_SECRET?: string;
  JWT_REFRESH_SECRET?: string;
  REDIS_URL?: string;
  OPENAI_API_KEY?: string;
  WEB_ORIGIN?: string;
  PORT?: string;
  NODE_ENV?: string;
  AI_DAILY_JOB_LIMIT?: string;
}

const requiredKeys = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "REDIS_URL",
  "OPENAI_API_KEY",
] as const;

export function validateApiEnvironment(env: RuntimeEnv = process.env) {
  for (const key of requiredKeys) {
    requireTrimmed(env, key);
  }

  const webOrigin = env.WEB_ORIGIN?.trim();

  if (env.NODE_ENV === "production" && !webOrigin) {
    throw new Error("WEB_ORIGIN is required in production to configure an explicit CORS allowlist.");
  }

  const port = Number(env.PORT?.trim() || 3001);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer.");
  }

  requireOptionalNonnegativeInteger(env.AI_DAILY_JOB_LIMIT, "AI_DAILY_JOB_LIMIT");

  return {
    webOrigin: webOrigin || "http://localhost:3000",
    port,
  };
}

function requireTrimmed(env: RuntimeEnv, key: (typeof requiredKeys)[number]) {
  const value = env[key]?.trim();

  if (!value) {
    throw new Error(`${key} is required to start the API.`);
  }

  return value;
}

function requireOptionalNonnegativeInteger(value: string | undefined, key: string) {
  if (value === undefined || value.trim() === "") {
    return;
  }

  const parsed = Number(value.trim());

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${key} must be a nonnegative integer.`);
  }
}
