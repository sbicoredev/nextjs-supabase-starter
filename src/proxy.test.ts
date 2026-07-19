import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUpdateSession, mockGeneralLimit, mockAuthLimit } = vi.hoisted(
  () => ({
    mockUpdateSession: vi.fn().mockResolvedValue({ status: 200 }),
    mockGeneralLimit: vi.fn().mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60_000,
    }),
    mockAuthLimit: vi.fn().mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 300_000,
    }),
  })
);

vi.mock("~/lib/supabase/middleware", () => ({
  updateSession: (...args: unknown[]) => mockUpdateSession(...args),
}));

vi.mock("~/lib/rate-limit", () => ({
  generalRateLimit: {
    limit: (...args: unknown[]) => mockGeneralLimit(...args),
  },
  authRateLimit: {
    limit: (...args: unknown[]) => mockAuthLimit(...args),
  },
}));

vi.mock("next/server", () => ({
  NextResponse: class MockNextResponse {
    body: string;
    status: number;
    headers: Record<string, string>;
    constructor(
      body: string,
      init?: { status?: number; headers?: Record<string, string> }
    ) {
      this.body = body;
      this.status = init?.status ?? 200;
      this.headers = init?.headers ?? {};
    }
  },
}));

import { proxy } from "~/proxy";

function makeRequest(
  pathname: string,
  options?: { ip?: string; forwardedFor?: string }
) {
  const url = new URL(pathname, "http://localhost:3000");
  const headers = new Headers();
  if (options?.forwardedFor) {
    headers.set("x-forwarded-for", options.forwardedFor);
  }
  return {
    nextUrl: { pathname: url.pathname, searchParams: url.searchParams },
    url: url.toString(),
    headers,
    ip: options?.ip,
  } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateSession.mockResolvedValue({ status: 200 });
});

describe("proxy", () => {
  it("calls updateSession on successful rate limit", async () => {
    const request = makeRequest("/");
    await proxy(request);
    expect(mockUpdateSession).toHaveBeenCalledWith(request);
  });

  it("uses authRateLimit for auth routes", async () => {
    const request = makeRequest("/login");
    await proxy(request);
    expect(mockAuthLimit).toHaveBeenCalled();
    expect(mockGeneralLimit).not.toHaveBeenCalled();
  });

  it("uses generalRateLimit for non-auth routes", async () => {
    const request = makeRequest("/dashboard");
    await proxy(request);
    expect(mockGeneralLimit).toHaveBeenCalled();
    expect(mockAuthLimit).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limit fails", async () => {
    const reset = Date.now() + 60_000;
    mockGeneralLimit.mockResolvedValueOnce({
      success: false,
      limit: 100,
      remaining: 0,
      reset,
    });
    const request = makeRequest("/");
    const response = (await proxy(request)) as unknown as {
      status: number;
      body: string;
    };
    expect(response.status).toBe(429);
    expect(response.body).toBe("Too Many Requests, Please try again later.");
  });

  it("returns 503 when rate limit throws", async () => {
    mockGeneralLimit.mockRejectedValueOnce(new Error("Redis unavailable"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const request = makeRequest("/");
    const response = (await proxy(request)) as unknown as {
      status: number;
      body: string;
    };
    expect(response.status).toBe(503);
    expect(response.body).toBe("Service Unavailable");
    consoleSpy.mockRestore();
  });

  it("uses request.ip when available", async () => {
    const request = makeRequest("/", { ip: "1.2.3.4" });
    await proxy(request);
    expect(mockGeneralLimit).toHaveBeenCalledWith("1.2.3.4");
  });

  it("falls back to x-forwarded-for header", async () => {
    const request = makeRequest("/", { forwardedFor: "10.0.0.1, 10.0.0.2" });
    await proxy(request);
    expect(mockGeneralLimit).toHaveBeenCalledWith("10.0.0.1");
  });

  it("falls back to anonymous when no IP available", async () => {
    const request = makeRequest("/");
    await proxy(request);
    expect(mockGeneralLimit).toHaveBeenCalledWith("anonymous");
  });
});
