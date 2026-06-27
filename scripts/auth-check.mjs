import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

for (const file of [
  "src/lib/auth.ts",
  "src/lib/auth-client.ts",
  "src/lib/server-session.ts",
  "src/app/api/auth/[...all]/route.ts",
  "scripts/auth-runtime-check.mjs",
  "scripts/db-migrate.mjs",
  "scripts/db-auth-check.mjs"
]) {
  assert(existsSync(join(root, file)), `missing auth file: ${file}`);
}
assert(!existsSync(join(root, "src/app/api/auth/resolve-login/route.ts")), "custom username resolver route should not exist");

const pkg = read("package.json");
assert(pkg.includes("better-auth"), "missing dependency: better-auth");
assert(pkg.includes("\"pg\""), "missing dependency: pg");
assert(pkg.includes("\"auth:runtime-check\""), "missing auth runtime check script");
assert(pkg.includes("\"db:migrate\""), "missing db migrate script");
assert(pkg.includes("\"db:auth-check\""), "missing db auth check script");

const env = read(".env.example");
assert(env.includes("BETTER_AUTH_SECRET"), "missing BETTER_AUTH_SECRET");
assert(env.includes("BETTER_AUTH_URL"), "missing BETTER_AUTH_URL");

const migration = read("migrations/001_initial.sql");
for (const table of ["\"user\"", "\"session\"", "\"account\"", "\"verification\""]) {
  assert(migration.includes(`create table ${table}`), `missing Better Auth table: ${table}`);
}
assert(!migration.includes("create table users"), "legacy users table should not exist");
assert(!migration.includes("references users"), "business tables should reference Better Auth user table");
assert(migration.includes('references "user"(id)'), "business tables should reference Better Auth user ids");

const loginCard = read("src/components/auth/animated-login-card.tsx");
assert(loginCard.includes("authClient.signIn.email"), "login form is not wired to Better Auth");
assert(loginCard.includes("authClient.signIn.username"), "login form is not wired to Better Auth username sign-in");
assert(loginCard.includes("loginId.includes(\"@\")"), "login form should choose email or username sign-in from the identifier");
assert(!loginCard.includes("/api/auth/resolve-login"), "login form should use Better Auth username plugin directly");
assert(!loginCard.includes("resolveLoginEmail"), "custom login resolver should not be used");
assert(loginCard.includes("authClient.signUp.email"), "register form is not wired to Better Auth");
assert(loginCard.includes("authClient.emailOtp.verifyEmail"), "register form should verify email with Better Auth OTP");
assert(loginCard.includes("authClient.emailOtp.sendVerificationOtp"), "register form should send Better Auth email OTP");
assert(loginCard.includes("authClient.requestPasswordReset"), "forgot password is not wired to Better Auth");
assert(!loginCard.includes("使用 Google 登录"), "OAuth button should not exist before OAuth is configured");
assert(loginCard.includes("emailCode"), "register form should keep a real email OTP state");
assert(loginCard.includes("获取验证码"), "register form should show a real verification-code button");

const appLayout = read("src/app/(app)/layout.tsx");
assert(appLayout.includes("requireUserSession"), "app layout does not require session");

const runtimeCheck = read("scripts/auth-runtime-check.mjs");
assert(runtimeCheck.includes("blockedAfterSignOut"), "runtime check should verify workbench is blocked after sign-out");

const passwordPage = read("src/app/(app)/settings/password/page.tsx");
assert(passwordPage.includes("authClient.changePassword"), "password settings is not wired to Better Auth changePassword");
assert(passwordPage.includes("currentPassword"), "password settings should send the current password");
assert(passwordPage.includes("newPassword"), "password settings should send the new password");
assert(!passwordPage.includes("原型模式"), "password settings should not still be marked as prototype mode");

const authServer = read("src/lib/auth.ts");
const authClient = read("src/lib/auth-client.ts");
assert(authServer.includes("username()"), "server auth is missing username plugin");
assert(authServer.includes("emailOTP("), "server auth is missing Better Auth email OTP plugin");
assert(authClient.includes("usernameClient()"), "client auth is missing username plugin");
assert(authClient.includes("emailOTPClient()"), "client auth is missing Better Auth email OTP plugin");

console.log("auth check passed");
