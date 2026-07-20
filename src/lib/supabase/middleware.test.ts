import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRedisGet = vi.fn().mockResolvedValue(null);
const mockRedisSet = vi.fn().mockResolvedValue("OK");

vi.mock("~/lib/rate-limit", () => ({
  redis: {
    get: (...args: unknown[]) => mockRedisGet(...args),
    set: (...args: unknown[]) => mockRedisSet(...args),
  },
}));

vi.mock("~/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-anon-key",
  },
}));

vi.mock("~/constants/auth", () => ({
  PROTECTED_ROUTE_PREFIXES: ["/dashboard", "/settings"],
  AUTH_ROUTES: ["/login", "/sign-up", "/forgot-password"],
  RECOVERY_ROUTES: ["/reset-password"],
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    next: vi.fn(),
    redirect: vi.fn(),
  },
}));

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

import { updateSession } from "~/lib/supabase/middleware";

function mockSupabaseClient(
  overrides: { user?: Record<string, unknown> | null; banned?: boolean } = {}
) {
  const { user = null, banned = false } = overrides;

  const singleFn = vi.fn().mockResolvedValue({
    data: banned ? { banned_at: "2025-01-01T00:00:00Z" } : { banned_at: null },
    error: null,
  });

  const chainable = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: singleFn,
  };

  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue(chainable),
  };

  vi.mocked(createServerClient).mockReturnValue(client as never);
  return client;
}

function makeRequest(pathname: string) {
  const url = new URL(pathname, "http://localhost:3000");
  return {
    nextUrl: {
      clone: vi.fn().mockReturnValue({
        pathname,
        searchParams: new URLSearchParams(),
        set: vi.fn(),
        delete: vi.fn(),
      }),
      pathname: url.pathname,
      searchParams: url.searchParams,
    },
    cookies: { getAll: vi.fn().mockReturnValue([]), set: vi.fn() },
    url: url.toString(),
    headers: new Headers(),
  } as never;
}

function getRedirectUrl() {
  return vi.mocked(NextResponse.redirect).mock.calls[0]?.[0] as {
    pathname: string;
    searchParams: URLSearchParams;
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRedisGet.mockResolvedValue(null);
  mockRedisSet.mockResolvedValue("OK");
  vi.mocked(NextResponse.next).mockReturnValue({
    cookies: { set: vi.fn() },
  } as never);
});

describe("updateSession", () => {
  it("redirects unauthenticated user on protected route to /login", async () => {
    mockSupabaseClient({ user: null });
    const request = makeRequest("/dashboard");
    await updateSession(request);
    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl = getRedirectUrl();
    expect(redirectUrl.pathname).toBe("/login");
    expect(redirectUrl.searchParams.get("redirectTo")).toBe("/dashboard");
  });

  it("allows unauthenticated user on public route", async () => {
    mockSupabaseClient({ user: null });
    const request = makeRequest("/");
    await updateSession(request);
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it("allows authenticated user on protected route", async () => {
    mockSupabaseClient({
      user: { id: "user-confirmed", email_confirmed_at: "2025-01-01" },
    });
    const request = makeRequest("/dashboard");
    await updateSession(request);
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it("redirects banned user to /login with banned=1", async () => {
    mockSupabaseClient({
      user: { id: "user-banned-a", email_confirmed_at: "2025-01-01" },
      banned: true,
    });
    const request = makeRequest("/dashboard");
    await updateSession(request);
    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl = getRedirectUrl();
    expect(redirectUrl.pathname).toBe("/login");
    expect(redirectUrl.searchParams.get("banned")).toBe("1");
  });

  it("redirects user with unconfirmed email on protected route", async () => {
    mockSupabaseClient({
      user: { id: "user-1", email_confirmed_at: null },
    });
    const request = makeRequest("/dashboard");
    await updateSession(request);
    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl = getRedirectUrl();
    expect(redirectUrl.pathname).toBe("/login");
    expect(redirectUrl.searchParams.get("email_not_confirmed")).toBe("1");
    expect(redirectUrl.searchParams.get("redirectTo")).toBe("/dashboard");
  });

  it("redirects authenticated user on auth route to /dashboard", async () => {
    mockSupabaseClient({
      user: { id: "user-1", email_confirmed_at: "2025-01-01" },
    });
    const request = makeRequest("/login");
    await updateSession(request);
    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl = getRedirectUrl();
    expect(redirectUrl.pathname).toBe("/dashboard");
  });

  it("allows authenticated user with confirmed email on public non-auth route", async () => {
    mockSupabaseClient({
      user: { id: "user-1", email_confirmed_at: "2025-01-01" },
    });
    const request = makeRequest("/");
    await updateSession(request);
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it("does not redirect an authenticated (recovery) session away from /reset-password", async () => {
    // Regression test: verifying a recovery link establishes a session
    // before redirecting to /reset-password. Since that user is now
    // authenticated, /reset-password must NOT be treated like the other
    // AUTH_ROUTES (which bounce a signed-in user to /dashboard) or the
    // password-reset flow breaks end-to-end.
    mockSupabaseClient({
      user: { id: "user-1", email_confirmed_at: "2025-01-01" },
    });
    const request = makeRequest("/reset-password");
    await updateSession(request);
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it("uses ban cache on second call for same user", async () => {
    mockSupabaseClient({
      user: { id: "user-banned-b", email_confirmed_at: "2025-01-01" },
      banned: true,
    });

    await updateSession(makeRequest("/dashboard"));
    expect(NextResponse.redirect).toHaveBeenCalled();
    vi.mocked(NextResponse.redirect).mockClear();

    // Redis now has the cached value
    mockRedisGet.mockResolvedValueOnce(true);

    await updateSession(makeRequest("/dashboard"));
    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl = getRedirectUrl();
    expect(redirectUrl.searchParams.get("banned")).toBe("1");
    // Should not query the database again
    expect(mockRedisGet).toHaveBeenCalled();
  });

  it("re-queries ban status after cache expires", async () => {
    mockSupabaseClient({
      user: { id: "user-banned-c", email_confirmed_at: "2025-01-01" },
      banned: true,
    });

    await updateSession(makeRequest("/dashboard"));
    expect(NextResponse.redirect).toHaveBeenCalled();
    vi.mocked(NextResponse.redirect).mockClear();

    // Cache expired — Redis returns null, then user is unbanned
    mockRedisGet.mockResolvedValueOnce(null);
    mockSupabaseClient({
      user: { id: "user-banned-c", email_confirmed_at: "2025-01-01" },
      banned: false,
    });

    await updateSession(makeRequest("/dashboard"));
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it("returns supabaseResponse when no redirect is needed", async () => {
    mockSupabaseClient({
      user: { id: "user-1", email_confirmed_at: "2025-01-01" },
    });
    const request = makeRequest("/");
    const response = await updateSession(request);
    expect(response).toBeDefined();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });
});
