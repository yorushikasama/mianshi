import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("PWA service worker", () => {
  it("only caches the static app shell and public assets", () => {
    const serviceWorker = readFileSync(join(process.cwd(), "public", "sw.js"), "utf8");

    expect(serviceWorker).toContain('pathname.startsWith("/api/")');
    expect(serviceWorker).toContain('request.headers.has("authorization")');
    expect(serviceWorker).toContain("APP_SHELL.includes(pathname)");
    expect(serviceWorker).toContain('pathname.startsWith("/_next/static/")');
    expect(serviceWorker).toContain('pathname.startsWith("/assets/")');
  });
});
