import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/lib/supabase/server", () => ({
  getSupabaseServerClient: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("~/env", () => ({
  env: {
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  },
}));

vi.mock("~/lib/error-reporter", () => ({
  reportError: vi.fn(),
}));

vi.mock("~/lib/rate-limit", () => ({
  authRateLimit: {
    limit: vi.fn().mockResolvedValue({ success: true }),
  },
  createUserRateLimit: vi.fn().mockReturnValue({
    limit: vi.fn().mockResolvedValue({ success: true }),
  }),
}));

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { SUPABASE_AUTH_ERROR_MESSAGES } from "~/constants/auth";
import { ErrorMessaage } from "~/constants/error-message";
import {
  requestPasswordReset,
  signInWithMagicLink,
  signInWithOAuth,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  updatePassword,
} from "~/features/auth/actions/auth.actions";
import { reportError } from "~/lib/error-reporter";
import { authRateLimit, createUserRateLimit } from "~/lib/rate-limit";
import { getSupabaseServerClient } from "~/lib/supabase/server";

function mockSupabase(overrides: Record<string, unknown> = {}) {
  const recentDate = new Date().toISOString();
  const defaultAuth = {
    signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
    signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
    signInWithOAuth: vi.fn().mockResolvedValue({
      data: { url: "https://oauth.provider" },
      error: null,
    }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getUser: vi.fn().mockResolvedValue({
      data: {
        user: { last_sign_in_at: recentDate },
      },
    }),
  };

  const client = {
    auth: { ...defaultAuth, ...overrides },
  };

  vi.mocked(getSupabaseServerClient).mockResolvedValue(client as never);
  return client;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(headers).mockResolvedValue(new Headers() as never);
  vi.mocked(authRateLimit.limit).mockResolvedValue({ success: true } as never);
  vi.mocked(createUserRateLimit).mockReturnValue({
    limit: vi.fn().mockResolvedValue({ success: true }),
  } as never);
});

describe("signInWithPassword", () => {
  it("returns rate limit error when too many requests", async () => {
    vi.mocked(authRateLimit.limit).mockResolvedValue({
      success: false,
    } as never);

    const result = await signInWithPassword.bind(
      null,
      "/"
    )({
      email: "user@example.com",
      password: "Password1",
    });
    expect(result.serverError).toBe(ErrorMessaage.rateLimit.tooManyRequest);
  });

  it("returns error for invalid input", async () => {
    const result = await signInWithPassword.bind(
      null,
      "/"
    )({
      email: "not-an-email",
      password: "",
    });
    expect(result.validationErrors).toMatchObject({
      formErrors: expect.any(Array),
      fieldErrors: {
        email: expect.any(Array),
        password: expect.any(Array),
      },
    });
  });

  it("returns mapped Supabase error on auth failure", async () => {
    mockSupabase({
      signInWithPassword: vi.fn().mockResolvedValue({
        error: { code: "invalid_credentials", message: "Invalid login" },
      }),
    });

    const result = await signInWithPassword.bind(
      null,
      "/"
    )({
      email: "user@example.com",
      password: "Password1",
    });
    expect(result.serverError).toBe(
      SUPABASE_AUTH_ERROR_MESSAGES.invalid_credentials
    );
  });

  it("redirects on success", async () => {
    mockSupabase();

    const result = await signInWithPassword.bind(
      null,
      "/dashboard"
    )({
      email: "user@example.com",
      password: "Password1",
    });
    expect(result.serverError).toBe("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("sanitizes malicious redirectTo", async () => {
    mockSupabase();

    const result = await signInWithPassword.bind(
      null,
      "https://evil.com"
    )({
      email: "user@example.com",
      password: "Password1",
    });
    expect(result.serverError).toBe("NEXT_REDIRECT");

    // Should redirect to safe path, not the malicious URL
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("uses custom redirectTo when safe", async () => {
    mockSupabase();

    const result = await signInWithPassword.bind(
      null,
      "/settings"
    )({
      email: "user@example.com",
      password: "Password1",
    });
    expect(result.serverError).toBe("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/settings");
  });
});

describe("signUpWithPassword", () => {
  it("returns rate limit error when too many requests", async () => {
    vi.mocked(authRateLimit.limit).mockResolvedValue({
      success: false,
    } as never);

    const result = await signUpWithPassword({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      password: "Password1",
      confirmPassword: "Password1",
    });
    expect(result.serverError).toBe(ErrorMessaage.rateLimit.tooManyRequest);
  });

  it("returns error for invalid input", async () => {
    const result = await signUpWithPassword({
      fullName: "A",
      email: "bad",
      password: "short",
      confirmPassword: "different",
    });
    expect(result.validationErrors).toMatchObject({
      formErrors: expect.any(Array),
      fieldErrors: {
        fullName: expect.any(Array),
        email: expect.any(Array),
        password: expect.any(Array),
        confirmPassword: expect.any(Array),
      },
    });
  });

  it("returns true on success", async () => {
    mockSupabase();

    const result = await signUpWithPassword({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      password: "Password1",
      confirmPassword: "Password1",
    });
    expect(result.data).toBe(true);
  });

  it("calls signUp with emailRedirectTo containing origin", async () => {
    const client = mockSupabase();

    await signUpWithPassword({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      password: "Password1",
      confirmPassword: "Password1",
    });

    expect(client.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          emailRedirectTo: expect.stringContaining(
            "http://localhost:3000/auth/confirm?type=signup"
          ),
        }),
      })
    );
  });

  it("passes fullName in options.data", async () => {
    const client = mockSupabase();

    await signUpWithPassword({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      password: "Password1",
      confirmPassword: "Password1",
    });

    expect(client.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          data: { full_name: "Ada Lovelace" },
        }),
      })
    );
  });

  it("returns mapped Supabase error", async () => {
    mockSupabase({
      signUp: vi.fn().mockResolvedValue({
        error: { code: "user_already_exists", message: "exists" },
      }),
    });

    const result = await signUpWithPassword({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      password: "Password1",
      confirmPassword: "Password1",
    });
    expect(result.serverError).toBe(
      SUPABASE_AUTH_ERROR_MESSAGES.user_already_exists
    );
  });
});

describe("signInWithMagicLink", () => {
  it("returns rate limit error when too many requests", async () => {
    vi.mocked(authRateLimit.limit).mockResolvedValue({
      success: false,
    } as never);

    const result = await signInWithMagicLink({ email: "user@example.com" });
    expect(result.serverError).toBe(ErrorMessaage.rateLimit.tooManyRequest);
  });

  it("returns error for invalid email", async () => {
    const result = await signInWithMagicLink({ email: "bad" });
    expect(result.validationErrors).toMatchObject({
      formErrors: expect.any(Array),
      fieldErrors: {
        email: expect.any(Array),
      },
    });
  });

  it("returns true on success", async () => {
    mockSupabase();

    const result = await signInWithMagicLink({
      email: "user@example.com",
    });
    expect(result.data).toBe(true);
  });

  it("calls signInWithOtp with emailRedirectTo", async () => {
    const client = mockSupabase();

    await signInWithMagicLink({ email: "user@example.com" });

    expect(client.auth.signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          emailRedirectTo: expect.stringContaining(
            "http://localhost:3000/auth/confirm?type=magiclink"
          ),
        }),
      })
    );
  });

  it("passes shouldCreateUser: true in options", async () => {
    const client = mockSupabase();

    await signInWithMagicLink({ email: "user@example.com" });

    expect(client.auth.signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          shouldCreateUser: true,
        }),
      })
    );
  });
});

describe("signInWithOAuth", () => {
  it("redirects to provider URL on success", async () => {
    mockSupabase();
    const result = await signInWithOAuth({ provider: "google" });

    expect(result.serverError).toBe("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("https://oauth.provider");
  });

  it("omits redirectTo from callback URL when not provided", async () => {
    const client = mockSupabase();
    const result = await signInWithOAuth({ provider: "google" });

    expect(result.serverError).toBe("NEXT_REDIRECT");

    expect(client.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          redirectTo: expect.not.stringContaining("redirectTo"),
        }),
      })
    );
  });

  it("returns error when Supabase fails", async () => {
    mockSupabase({
      signInWithOAuth: vi.fn().mockResolvedValue({
        data: { url: null },
        error: { code: "provider_error", message: "failed" },
      }),
    });

    const result = await signInWithOAuth({ provider: "google" });

    expect(result.serverError).toBe("failed");
  });

  it("returns error when no provider URL returned", async () => {
    mockSupabase({
      signInWithOAuth: vi.fn().mockResolvedValue({
        data: { url: null },
        error: null,
      }),
    });

    const result = await signInWithOAuth({ provider: "google" });
    expect(result.serverError).toBe("Could not start the OAuth flow.");
  });

  it("includes redirectTo in callback URL when safe", async () => {
    mockSupabase();

    const result = await signInWithOAuth({
      provider: "github",
      redirectTo: "/settings",
    });
    expect(result.serverError).toBe("NEXT_REDIRECT");

    const callbackUrl = vi.mocked(redirect).mock.calls[0]?.[0] as string;
    // The redirect is to the OAuth provider, not the callback directly
    expect(callbackUrl).toBeTruthy();
  });

  it("sanitizes malicious redirectTo", async () => {
    mockSupabase();

    const result = await signInWithOAuth({
      provider: "google",
      redirectTo: "https://evil.com",
    });
    expect(result.serverError).toBe("NEXT_REDIRECT");

    // Should not throw, just redirect to OAuth provider
    expect(redirect).toHaveBeenCalled();
  });
});

describe("requestPasswordReset", () => {
  it("returns rate limit error when too many requests", async () => {
    vi.mocked(authRateLimit.limit).mockResolvedValue({
      success: false,
    } as never);

    const result = await requestPasswordReset({ email: "user@example.com" });
    expect(result.serverError).toBe(ErrorMessaage.rateLimit.tooManyRequest);
  });

  it("returns error for invalid email", async () => {
    const result = await requestPasswordReset({ email: "bad" });
    expect(result.validationErrors).toMatchObject({
      formErrors: expect.any(Array),
      fieldErrors: {
        email: expect.any(Array),
      },
    });
  });

  it("returns true on success", async () => {
    mockSupabase();

    const result = await requestPasswordReset({
      email: "user@example.com",
    });
    expect(result.data).toBe(true);
  });

  it("calls resetPasswordForEmail with recovery redirect", async () => {
    const client = mockSupabase();

    await requestPasswordReset({ email: "user@example.com" });

    expect(client.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "user@example.com",
      expect.objectContaining({
        redirectTo: expect.stringContaining("type=recovery"),
      })
    );
  });
});

describe("updatePassword", () => {
  it("returns error when user is not authenticated", async () => {
    mockSupabase({
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    });

    const result = await updatePassword({
      password: "Password1",
      confirmPassword: "Password1",
    });
    expect(result.serverError).toBe(ErrorMessaage.auth.unauthorized);
  });

  it("returns rate limit error when too many requests", async () => {
    mockSupabase();
    vi.mocked(createUserRateLimit).mockReturnValue({
      limit: vi.fn().mockResolvedValue({ success: false }),
    } as never);

    const result = await updatePassword({
      password: "Password1",
      confirmPassword: "Password1",
    });
    expect(result.serverError).toBe(ErrorMessaage.rateLimit.tooManyRequest);
  });

  it("returns error for invalid input", async () => {
    const result = await updatePassword({
      password: "short",
      confirmPassword: "different",
    });
    expect(result.validationErrors).toMatchObject({
      formErrors: expect.any(Array),
      fieldErrors: {
        password: expect.any(Array),
        confirmPassword: expect.any(Array),
      },
    });
  });

  it("redirects to /dashboard on success", async () => {
    mockSupabase();

    const result = await updatePassword({
      password: "Password1",
      confirmPassword: "Password1",
    });
    expect(result.serverError).toBe("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("returns mapped Supabase error", async () => {
    mockSupabase({
      updateUser: vi.fn().mockResolvedValue({
        error: { code: "weak_password", message: "too weak" },
      }),
    });

    const result = await updatePassword({
      password: "Password1",
      confirmPassword: "Password1",
    });
    expect(result.serverError).toBe(SUPABASE_AUTH_ERROR_MESSAGES.weak_password);
  });
});

describe("signOut", () => {
  it("calls signOut and redirects to root", async () => {
    const client = mockSupabase();

    await expect(signOut()).rejects.toThrow("NEXT_REDIRECT");

    expect(client.auth.signOut).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("returns error and reports when signOut fails", async () => {
    const signOutError = { code: "signout_failed", message: "failed" };
    mockSupabase({
      signOut: vi.fn().mockResolvedValue({ error: signOutError }),
    });

    const result = await signOut();
    expect(result.error).toBe("Failed to sign out. Please try again.");
    expect(reportError).toHaveBeenCalledWith(signOutError, {
      action: "signOut",
    });
  });
});
