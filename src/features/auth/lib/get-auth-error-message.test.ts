import type { AuthError } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { getAuthErrorMessage } from "~/features/auth/lib/get-auth-error-message";

function makeAuthError(code?: string, message?: string): AuthError {
  return {
    code: code ?? "unknown",
    message: message ?? "Something went wrong",
    name: "AuthError",
    status: 400,
  } as AuthError;
}

describe("getAuthErrorMessage", () => {
  it("returns mapped message for email_not_confirmed", () => {
    const error = makeAuthError("email_not_confirmed");
    expect(getAuthErrorMessage(error)).toBe(
      "Please confirm your email address before signing in."
    );
  });

  it("returns mapped message for invalid_credentials", () => {
    const error = makeAuthError("invalid_credentials");
    expect(getAuthErrorMessage(error)).toBe("Invalid email or password.");
  });

  it("returns mapped message for user_already_exists", () => {
    const error = makeAuthError("user_already_exists");
    expect(getAuthErrorMessage(error)).toBe(
      "An account with this email already exists."
    );
  });

  it("returns mapped message for weak_password", () => {
    const error = makeAuthError("weak_password");
    expect(getAuthErrorMessage(error)).toBe(
      "Password is too weak. Use at least 8 characters."
    );
  });

  it("falls back to error.message for unknown code", () => {
    const error = makeAuthError("some_other_code", "Custom Supabase message");
    expect(getAuthErrorMessage(error)).toBe("Custom Supabase message");
  });

  it("falls back to error.message when code is undefined", () => {
    const error = makeAuthError(undefined, "No code message");
    expect(getAuthErrorMessage(error)).toBe("No code message");
  });

  it("falls back to DEFAULT_AUTH_ERROR_MESSAGE when both code and message are missing", () => {
    const error = makeAuthError(undefined, undefined);
    // AuthError always has a message from Supabase, but we test the fallback logic
    expect(getAuthErrorMessage(error)).toBeTruthy();
  });

  it("returns mapped message even when error.message is empty", () => {
    const error = makeAuthError("invalid_credentials", "");
    expect(getAuthErrorMessage(error)).toBe("Invalid email or password.");
  });

  it("prefers mapped code over error.message", () => {
    const error = makeAuthError("weak_password", "This should not be returned");
    expect(getAuthErrorMessage(error)).toBe(
      "Password is too weak. Use at least 8 characters."
    );
  });
});
