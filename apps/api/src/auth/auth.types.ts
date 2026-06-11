import type { AuthenticatedUser } from "./auth.service";

export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthenticatedUser;
}
