import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const root = fileURLToPath(new URL("..", import.meta.url));
const { loadEnvConfig } = nextEnv;
loadEnvConfig(root);
const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const stamp = Date.now();
const email = `stage1-${stamp}@example.test`;
const username = `stage1_${stamp}`;
const password = `Stage1-${stamp}!`;

async function page(path, init = {}) {
  return fetch(`${baseURL}${path}`, {
    redirect: "manual",
    ...init,
    headers: {
      origin: baseURL,
      ...init.headers
    }
  });
}

async function request(path, init = {}) {
  const res = await fetch(`${baseURL}/api/auth${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      origin: baseURL,
      ...init.headers
    }
  });
  const text = await res.text();
  const body = text && res.headers.get("content-type")?.includes("application/json") ? JSON.parse(text) : text;
  return { res, body };
}

const blockedDashboard = await page("/dashboard");
assert(
  [302, 303, 307, 308].includes(blockedDashboard.status),
  `dashboard should redirect before login, got ${blockedDashboard.status}`
);
assert(blockedDashboard.headers.get("location")?.includes("/login"), "dashboard did not redirect to login");

const signUp = await request("/sign-up/email", {
  method: "POST",
  body: JSON.stringify({ email, username, password, name: "Stage One" })
});
assert(signUp.res.ok, `sign up failed: ${signUp.res.status} ${JSON.stringify(signUp.body)}`);

const signIn = await request("/sign-in/email", {
  method: "POST",
  body: JSON.stringify({ email, password })
});
assert(signIn.res.ok, `sign in failed: ${signIn.res.status} ${JSON.stringify(signIn.body)}`);

const cookie = signIn.res.headers.get("set-cookie");
assert(cookie, "sign in did not set a session cookie");

const dashboard = await page("/dashboard", { headers: { cookie } });
assert(dashboard.ok, `dashboard failed after login: ${dashboard.status}`);

const session = await request("/get-session", { headers: { cookie } });
assert(session.res.ok, `get session failed: ${session.res.status} ${JSON.stringify(session.body)}`);
assert.equal(session.body?.user?.email, email);

const signOut = await request("/sign-out", {
  method: "POST",
  headers: { cookie },
  body: JSON.stringify({})
});
assert(signOut.res.ok, `sign out failed: ${signOut.res.status} ${JSON.stringify(signOut.body)}`);

const blockedAfterSignOut = await page("/dashboard", { headers: { cookie } });
assert(
  [302, 303, 307, 308].includes(blockedAfterSignOut.status),
  `dashboard should redirect after sign out, got ${blockedAfterSignOut.status}`
);
assert(blockedAfterSignOut.headers.get("location")?.includes("/login"), "dashboard did not redirect to login after sign out");

const usernameSignIn = await request("/sign-in/username", {
  method: "POST",
  body: JSON.stringify({ username, password })
});
assert(usernameSignIn.res.ok, `username sign in failed: ${usernameSignIn.res.status} ${JSON.stringify(usernameSignIn.body)}`);

console.log("auth runtime check passed");
