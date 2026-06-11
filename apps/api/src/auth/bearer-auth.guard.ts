import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import type { AuthenticatedRequest } from "./auth.types";

@Injectable()
export class BearerAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const header = Array.isArray(authorization) ? authorization[0] : authorization;

    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    try {
      request.user = await this.authService.authenticateAccessToken(header.slice("Bearer ".length).trim());
      return true;
    } catch {
      throw new UnauthorizedException("Invalid bearer token");
    }
  }
}
