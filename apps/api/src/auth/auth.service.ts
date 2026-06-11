import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHmac } from "node:crypto";
import { promisify } from "node:util";
import { Inject, Injectable, Optional } from "@nestjs/common";
import { z } from "zod";

const scrypt = promisify(scryptCallback);

const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((email) => z.email().safeParse(email).success, "Invalid email address");

const RegisterInputSchema = z.object({
  email: EmailSchema,
  password: z.string().min(12),
  displayName: z.string().trim().min(1).max(80).optional(),
});

const LoginInputSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1),
});

type TokenType = "access" | "refresh";

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
}

export interface AuthUserRecord extends AuthenticatedUser {
  passwordHash: string;
}

export interface AuthUserRepository {
  findByEmail(email: string): Promise<AuthUserRecord | null>;
  findById(userId: string): Promise<AuthUserRecord | null>;
  createUser(input: { email: string; passwordHash: string; displayName?: string | null }): Promise<AuthUserRecord>;
}

export const AUTH_USER_REPOSITORY = Symbol("AUTH_USER_REPOSITORY");

export interface AuthConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
}

export interface AuthSession {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_USER_REPOSITORY)
    private readonly userRepository: AuthUserRepository,
    @Optional()
    private readonly config: AuthConfig = getAuthConfigFromEnv(),
  ) {}

  async register(input: unknown): Promise<AuthSession> {
    const parsedInput = RegisterInputSchema.parse(input);
    const existingUser = await this.userRepository.findByEmail(parsedInput.email);

    if (existingUser) {
      throw new Error("Email already registered");
    }

    const user = await this.userRepository.createUser({
      email: parsedInput.email,
      displayName: parsedInput.displayName ?? null,
      passwordHash: await hashPassword(parsedInput.password),
    });

    return this.createSession(user);
  }

  async login(input: unknown): Promise<AuthSession> {
    const parsedInput = LoginInputSchema.parse(input);
    const user = await this.userRepository.findByEmail(parsedInput.email);

    if (!user || !(await verifyPassword(parsedInput.password, user.passwordHash))) {
      throw new Error("Invalid credentials");
    }

    return this.createSession(user);
  }

  async refresh(refreshToken: string): Promise<AuthSession> {
    const payload = verifyToken(refreshToken, this.config.refreshTokenSecret, "refresh");
    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new Error("Invalid refresh token");
    }

    return this.createSession(user);
  }

  async authenticateAccessToken(accessToken: string): Promise<AuthenticatedUser> {
    const payload = verifyToken(accessToken, this.config.accessTokenSecret, "access");
    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new Error("Invalid access token");
    }

    return toAuthenticatedUser(user);
  }

  private createSession(user: AuthUserRecord): AuthSession {
    const safeUser = toAuthenticatedUser(user);

    return {
      user: safeUser,
      accessToken: signToken(safeUser, this.config.accessTokenSecret, "access", 15 * 60),
      refreshToken: signToken(safeUser, this.config.refreshTokenSecret, "refresh", 30 * 24 * 60 * 60),
    };
  }
}

export function getAuthConfigFromEnv(env = process.env): AuthConfig {
  return {
    accessTokenSecret: getRequiredEnv(env, "JWT_ACCESS_SECRET"),
    refreshTokenSecret: getRequiredEnv(env, "JWT_REFRESH_SECRET"),
  };
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString("base64url")}`;
}

async function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, salt, expectedHash] = passwordHash.split("$");

  if (algorithm !== "scrypt" || !salt || !expectedHash) {
    return false;
  }

  const expected = Buffer.from(expectedHash, "base64url");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function signToken(user: AuthenticatedUser, secret: string, type: TokenType, expiresInSeconds: number) {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url({ alg: "HS256", typ: "JWT" });
  const payload = encodeBase64Url({
    sub: user.id,
    email: user.email,
    role: user.role,
    typ: type,
    iat: now,
    exp: now + expiresInSeconds,
  });
  const signature = sign(`${header}.${payload}`, secret);

  return `${header}.${payload}.${signature}`;
}

function verifyToken(token: string, secret: string, expectedType: TokenType) {
  const [encodedHeader, encodedPayload, signature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error(`Invalid ${expectedType} token`);
  }

  const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`, secret);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw new Error(`Invalid ${expectedType} token`);
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as {
    sub?: string;
    typ?: string;
    exp?: number;
  };

  if (!payload.sub || payload.typ !== expectedType || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error(`Invalid ${expectedType} token`);
  }

  return { sub: payload.sub };
}

function sign(input: string, secret: string) {
  return createHmac("sha256", secret).update(input).digest("base64url");
}

function encodeBase64Url(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function getRequiredEnv(env: NodeJS.ProcessEnv, name: string) {
  const value = env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function toAuthenticatedUser(user: AuthUserRecord): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
}
