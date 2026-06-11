import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { ZodError } from "zod";
import { BearerAuthGuard } from "./bearer-auth.guard";
import { AuthService, type AuthSession } from "./auth.service";
import type { AuthenticatedRequest } from "./auth.types";

const refreshCookieName = "mianshi_refresh_token";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    return this.respondWithSession(await this.runAuthAction(() => this.authService.register(body)), response);
  }

  @Post("login")
  async login(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    return this.respondWithSession(await this.runAuthAction(() => this.authService.login(body)), response);
  }

  @Post("refresh")
  async refresh(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    const cookieHeader = request.headers.cookie;
    const refreshToken = readCookie(Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader, refreshCookieName);

    if (!refreshToken) {
      throw new UnauthorizedException("Missing refresh token");
    }

    return this.respondWithSession(await this.runAuthAction(() => this.authService.refresh(refreshToken)), response);
  }

  @Get("me")
  @UseGuards(BearerAuthGuard)
  getMe(@Req() request: AuthenticatedRequest) {
    return { user: request.user };
  }

  private async runAuthAction(action: () => Promise<AuthSession>) {
    try {
      return await action();
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: "Invalid auth payload",
          issues: error.issues,
        });
      }

      if (error instanceof Error && error.message.includes("credentials")) {
        throw new UnauthorizedException(error.message);
      }

      if (error instanceof Error && error.message.includes("already registered")) {
        throw new ConflictException(error.message);
      }

      if (error instanceof Error && error.message.includes("refresh token")) {
        throw new UnauthorizedException(error.message);
      }

      throw error;
    }
  }

  private respondWithSession(session: AuthSession, response: Response) {
    response.cookie(refreshCookieName, session.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/auth/refresh",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return {
      user: session.user,
      accessToken: session.accessToken,
    };
  }
}

function readCookie(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const cookie = cookies.find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}
