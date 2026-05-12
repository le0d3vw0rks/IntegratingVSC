import { test, expect, vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { SignJWT, jwtVerify } from "jose";
import type { cookies as CookiesFn } from "next/headers";

const TEST_SECRET = new TextEncoder().encode("development-secret-key");

async function makeToken(payload: object, expiresIn = "7d") {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(TEST_SECRET);
}

vi.mock("server-only", () => ({}));

const mockCookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function setup(cookieValue?: string) {
  const { cookies } = await import("next/headers");
  vi.mocked(cookies as typeof CookiesFn).mockResolvedValue({
    set: mockCookieSet,
    get: vi.fn().mockReturnValue(cookieValue ? { value: cookieValue } : undefined),
  } as never);
  const { createSession, getSession } = await import("../auth");
  return { createSession, getSession };
}

test("createSession sets a cookie named auth-token", async () => {
  const { createSession } = await setup();
  await createSession("user-1", "test@example.com");

  expect(mockCookieSet).toHaveBeenCalledOnce();
  expect(mockCookieSet.mock.calls[0][0]).toBe("auth-token");
});

test("createSession sets httpOnly, sameSite lax, path /", async () => {
  const { createSession } = await setup();
  await createSession("user-1", "test@example.com");

  const options = mockCookieSet.mock.calls[0][2];
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

test("createSession sets secure: false outside production", async () => {
  const { createSession } = await setup();
  await createSession("user-1", "test@example.com");

  const options = mockCookieSet.mock.calls[0][2];
  expect(options.secure).toBe(false);
});

test("createSession sets cookie expiry ~7 days from now", async () => {
  const before = Date.now();
  const { createSession } = await setup();
  await createSession("user-1", "test@example.com");
  const after = Date.now();

  const options = mockCookieSet.mock.calls[0][2];
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  expect(options.expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(options.expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

test("createSession issues a JWT containing userId and email", async () => {
  const { createSession } = await setup();
  await createSession("user-42", "leo@example.com");

  const token = mockCookieSet.mock.calls[0][1];
  const { payload } = await jwtVerify(token, TEST_SECRET);

  expect(payload.userId).toBe("user-42");
  expect(payload.email).toBe("leo@example.com");
});

// ─── getSession ────────────────────────────────────────────────────────────

test("getSession returns null when no cookie is present", async () => {
  const { getSession } = await setup();
  const result = await getSession();
  expect(result).toBeNull();
});

test("getSession returns the session payload for a valid token", async () => {
  const token = await makeToken({ userId: "user-1", email: "test@example.com" });
  const { getSession } = await setup(token);
  const result = await getSession();

  expect(result?.userId).toBe("user-1");
  expect(result?.email).toBe("test@example.com");
});

test("getSession returns null for a malformed token", async () => {
  const { getSession } = await setup("not.a.valid.jwt");
  const result = await getSession();
  expect(result).toBeNull();
});

test("getSession returns null for an expired token", async () => {
  const token = await new SignJWT({ userId: "user-1", email: "test@example.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(Math.floor(Date.now() / 1000) - 1)
    .setIssuedAt()
    .sign(TEST_SECRET);
  const { getSession } = await setup(token);
  const result = await getSession();
  expect(result).toBeNull();
});
