import { describe, expect, it } from "vitest";
import { AuthService, type AuthUserRepository } from "./auth.service";

class FakeAuthUserRepository implements AuthUserRepository {
  readonly users = new Map<string, { id: string; email: string; passwordHash: string; displayName: string | null; role: string }>();

  async findByEmail(email: string) {
    return [...this.users.values()].find((user) => user.email === email) ?? null;
  }

  async findById(userId: string) {
    return this.users.get(userId) ?? null;
  }

  async createUser(input: { email: string; passwordHash: string; displayName?: string | null }) {
    const user = {
      id: `user_${this.users.size + 1}`,
      email: input.email,
      passwordHash: input.passwordHash,
      displayName: input.displayName ?? null,
      role: "user",
    };
    this.users.set(user.id, user);
    return user;
  }
}

function createService() {
  const repository = new FakeAuthUserRepository();
  const service = new AuthService(repository, {
    accessTokenSecret: "test-access-secret",
    refreshTokenSecret: "test-refresh-secret",
  });

  return { repository, service };
}

describe("AuthService", () => {
  it("registers a user with a hashed password and normalized email", async () => {
    const { repository, service } = createService();

    const session = await service.register({
      email: "  Owner@Example.COM ",
      password: "correct horse battery staple",
      displayName: "主人",
    });

    expect(session.user.email).toBe("owner@example.com");
    expect(session.user.displayName).toBe("主人");
    expect(session.accessToken).toMatch(/^ey/);
    expect(session.refreshToken).toMatch(/^ey/);

    const savedUser = await repository.findByEmail("owner@example.com");
    expect(savedUser?.passwordHash).toMatch(/^scrypt\$/);
    expect(savedUser?.passwordHash).not.toBe("correct horse battery staple");
  });

  it("rejects duplicate registration by normalized email", async () => {
    const { service } = createService();

    await service.register({
      email: "owner@example.com",
      password: "correct horse battery staple",
    });

    await expect(() =>
      service.register({
        email: "OWNER@example.com",
        password: "correct horse battery staple",
      }),
    ).rejects.toThrow("Email already registered");
  });

  it("logs in with valid credentials and rejects invalid credentials", async () => {
    const { service } = createService();

    await service.register({
      email: "owner@example.com",
      password: "correct horse battery staple",
    });

    const session = await service.login({
      email: "OWNER@example.com",
      password: "correct horse battery staple",
    });

    expect(session.user.email).toBe("owner@example.com");
    await expect(() => service.login({ email: "owner@example.com", password: "wrong password" })).rejects.toThrow(
      "Invalid credentials",
    );
  });

  it("refreshes a session only from a refresh token", async () => {
    const { service } = createService();

    const session = await service.register({
      email: "owner@example.com",
      password: "correct horse battery staple",
    });

    const refreshed = await service.refresh(session.refreshToken);

    expect(refreshed.user.id).toBe(session.user.id);
    await expect(() => service.refresh(session.accessToken)).rejects.toThrow("Invalid refresh token");
  });
});
