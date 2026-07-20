import { describe, expect, it } from "vitest";

import {
  AUTH_ERROR_MESSAGES,
  AUTH_REDIRECT_PATHS,
  AUTH_ROUTES,
  DEFAULT_AUTH_ERROR_MESSAGE,
  OAUTH_PROVIDERS,
  PROTECTED_ROUTE_PREFIXES,
  RECOVERY_ROUTES,
} from "~/constants/auth";

describe("PROTECTED_ROUTE_PREFIXES", () => {
  it("includes /dashboard", () => {
    expect(PROTECTED_ROUTE_PREFIXES).toContain("/dashboard");
  });

  it("includes /settings", () => {
    expect(PROTECTED_ROUTE_PREFIXES).toContain("/settings");
  });
});

describe("AUTH_ROUTES", () => {
  it("includes the auth pages that should redirect a signed-in user away", () => {
    expect(AUTH_ROUTES).toContain("/login");
    expect(AUTH_ROUTES).toContain("/sign-up");
    expect(AUTH_ROUTES).toContain("/forgot-password");
  });

  it("does not include /reset-password", () => {
    // /reset-password requires an authenticated recovery session to reach,
    // so it must not be redirected-away-from like the other auth routes.
    expect(AUTH_ROUTES).not.toContain("/reset-password");
  });
});

describe("RECOVERY_ROUTES", () => {
  it("includes /reset-password", () => {
    expect(RECOVERY_ROUTES).toContain("/reset-password");
  });
});

describe("AUTH_REDIRECT_PATHS", () => {
  it("afterSignIn points to a protected route", () => {
    expect(PROTECTED_ROUTE_PREFIXES).toContain(AUTH_REDIRECT_PATHS.afterSignIn);
  });

  it("afterSignUp points to a protected route", () => {
    expect(PROTECTED_ROUTE_PREFIXES).toContain(AUTH_REDIRECT_PATHS.afterSignUp);
  });

  it("afterSignOut points to root", () => {
    expect(AUTH_REDIRECT_PATHS.afterSignOut).toBe("/");
  });

  it("afterSignIn and afterSignUp are the same", () => {
    expect(AUTH_REDIRECT_PATHS.afterSignIn).toBe(
      AUTH_REDIRECT_PATHS.afterSignUp
    );
  });
});

describe("OAUTH_PROVIDERS", () => {
  it("includes google", () => {
    expect(OAUTH_PROVIDERS).toContain("google");
  });

  it("includes github", () => {
    expect(OAUTH_PROVIDERS).toContain("github");
  });
});

describe("AUTH_ERROR_MESSAGES", () => {
  it("has entries for all expected error codes", () => {
    expect(AUTH_ERROR_MESSAGES.email_not_confirmed).toBeTruthy();
    expect(AUTH_ERROR_MESSAGES.invalid_credentials).toBeTruthy();
    expect(AUTH_ERROR_MESSAGES.user_already_exists).toBeTruthy();
    expect(AUTH_ERROR_MESSAGES.weak_password).toBeTruthy();
  });

  it("all values are non-empty strings", () => {
    for (const message of Object.values(AUTH_ERROR_MESSAGES)) {
      expect(typeof message).toBe("string");
      expect(message.length).toBeGreaterThan(0);
    }
  });
});

describe("DEFAULT_AUTH_ERROR_MESSAGE", () => {
  it("is a non-empty string", () => {
    expect(typeof DEFAULT_AUTH_ERROR_MESSAGE).toBe("string");
    expect(DEFAULT_AUTH_ERROR_MESSAGE.length).toBeGreaterThan(0);
  });
});
