import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import type { AuthUserRecord, AuthUserRepository } from "./auth.service";

@Injectable()
export class PrismaAuthUserRepository implements AuthUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user ? toAuthUserRecord(user) : null;
  }

  async findById(userId: string): Promise<AuthUserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    return user ? toAuthUserRecord(user) : null;
  }

  async createUser(input: { email: string; passwordHash: string; displayName?: string | null }) {
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        displayName: input.displayName,
      },
    });

    return toAuthUserRecord(user);
  }
}

function toAuthUserRecord(user: {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
  role: string;
}): AuthUserRecord {
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    displayName: user.displayName,
    role: user.role,
  };
}
