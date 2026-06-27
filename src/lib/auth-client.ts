"use client";

import { createAuthClient } from "better-auth/client";
import { emailOTPClient, usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [usernameClient(), emailOTPClient()]
});
