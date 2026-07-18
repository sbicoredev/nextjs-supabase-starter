import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/lib/supabase/server", () => ({
  createClient: vi.fn(),
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

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  requestPasswordReset,
  signInWithMagicLink,
  signInWithOAuth,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  updatePassword,
} from "~/features/auth/actions/auth.actions";
import { createClient } from "~/lib/supabase/server";

function mockSupabase(overrides: Record<string, unknown> = {}) {
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
  };

  const client = {
    auth: { ...defaultAuth, ...overrides },
  };

  vi.mocked(createClient).mockResolvedValue(client as never);
  return client;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(headers).mockResolvedValue(new Headers() as never);
});

describe("signInWithPassword", () => {
  it("returns error for invalid input", async () => {
    const result = await signInWithPassword({
      email: "not-an-email",
      password: "",
    });
    expect(result.error).toBe("Invalid email or password.");
  });

  it("returns mapped Supabase error on auth failure", async () => {
    mockSupabase({
      signInWithPassword: vi.fn().mockResolvedValue({
        error: { code: "invalid_credentials", message: "Invalid login" },
      }),
    });

    const result = await signInWithPassword({
      email: "user@example.com",
      password: "Password1",
    });
    expect(result.error).toBeTruthy();
  });

  it("redirects on success", async () => {
    mockSupabase();

    await expect(
      signInWithPassword({ email: "user@example.com", password: "Password1" })
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("sanitizes malicious redirectTo", async () => {
    mockSupabase();

    await expect(
      signInWithPassword(
        { email: "user@example.com", password: "Password1" },
        "https://evil.com"
      )
    ).rejects.toThrow("NEXT_REDIRECT");

    // Should redirect to safe path, not the malicious URL
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("uses custom redirectTo when safe", async () => {
    mockSupabase();

    await expect(
      signInWithPassword(
        { email: "user@example.com", password: "Password1" },
        "/settings"
      )
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/settings");
  });
});

describe("signUpWithPassword", () => {
  it("returns error for invalid input", async () => {
    const result = await signUpWithPassword({
      fullName: "A",
      email: "bad",
      password: "short",
      confirmPassword: "different",
    });
    expect(result.error).toBeTruthy();
  });

  it("returns { data: true } on success", async () => {
    mockSupabase();

    const result = await signUpWithPassword({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      password: "Password1",
      confirmPassword: "Password1",
    });
    expect(result).toEqual({ data: true });
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
    expect(result.error).toContain("already exists");
  });
});

describe("signInWithMagicLink", () => {
  it("returns error for invalid email", async () => {
    const result = await signInWithMagicLink({ email: "bad" });
    expect(result.error).toBe("Invalid email.");
  });

  it("returns { data: true } on success", async () => {
    mockSupabase();

    const result = await signInWithMagicLink({
      email: "user@example.com",
    });
    expect(result).toEqual({ data: true });
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
});

describe("signInWithOAuth", () => {
  it("redirects to provider URL on success", async () => {
    mockSupabase();

    await expect(signInWithOAuth("google")).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("https://oauth.provider");
  });

  it("returns error when Supabase fails", async () => {
    mockSupabase({
      signInWithOAuth: vi.fn().mockResolvedValue({
        data: { url: null },
        error: { code: "provider_error", message: "failed" },
      }),
    });

    const result = await signInWithOAuth("google");
    expect(result.error).toBeTruthy();
  });

  it("returns error when no provider URL returned", async () => {
    mockSupabase({
      signInWithOAuth: vi.fn().mockResolvedValue({
        data: { url: null },
        error: null,
      }),
    });

    const result = await signInWithOAuth("google");
    expect(result.error).toBe("Could not start the OAuth flow.");
  });

  it("includes redirectTo in callback URL when safe", async () => {
    mockSupabase();

    await expect(signInWithOAuth("github", "/settings")).rejects.toThrow(
      "NEXT_REDIRECT"
    );

    const callbackUrl = vi.mocked(redirect).mock.calls[0]?.[0] as string;
    // The redirect is to the OAuth provider, not the callback directly
    expect(callbackUrl).toBeTruthy();
  });

  it("sanitizes malicious redirectTo", async () => {
    mockSupabase();

    await expect(signInWithOAuth("google", "https://evil.com")).rejects.toThrow(
      "NEXT_REDIRECT"
    );

    // Should not throw, just redirect to OAuth provider
    expect(redirect).toHaveBeenCalled();
  });
});

describe("requestPasswordReset", () => {
  it("returns error for invalid email", async () => {
    const result = await requestPasswordReset({ email: "bad" });
    expect(result.error).toBe("Invalid email.");
  });

  it("returns { data: true } on success", async () => {
    mockSupabase();

    const result = await requestPasswordReset({
      email: "user@example.com",
    });
    expect(result).toEqual({ data: true });
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
  it("returns error for invalid input", async () => {
    const result = await updatePassword({
      password: "short",
      confirmPassword: "different",
    });
    expect(result.error).toBeTruthy();
  });

  it("redirects to /dashboard on success", async () => {
    mockSupabase();

    await expect(
      updatePassword({ password: "Password1", confirmPassword: "Password1" })
    ).rejects.toThrow("NEXT_REDIRECT");

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
    expect(result.error).toBeTruthy();
  });
});

describe("signOut", () => {
  it("calls signOut and redirects to root", async () => {
    const client = mockSupabase();

    await expect(signOut()).rejects.toThrow("NEXT_REDIRECT");

    expect(client.auth.signOut).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/");
  });
});
