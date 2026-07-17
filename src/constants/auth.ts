/**
 * Route prefixes that require an authenticated session.
 * Checked in `src/lib/supabase/middleware.ts` against the request pathname.
 */
export const PROTECTED_ROUTE_PREFIXES = ["/dashboard", "/settings"];

/**
 * Routes that a signed-in user shouldn't see (they get redirected to
 * /dashboard instead). Keep this in sync with the (auth) route group.
 */
export const AUTH_ROUTES = [
  "/login",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
];

export const AUTH_REDIRECT_PATHS = {
  afterSignIn: "/dashboard",
  afterSignOut: "/",
  afterSignUp: "/dashboard",
} as const;

export const OAUTH_PROVIDERS = ["google", "github"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

/**
 * Maps Supabase Auth error codes (`error.code` on `AuthError`) to
 * user-facing copy. See `~/features/auth/lib/get-auth-error-message` for
 * where this is applied — every Server Action in `auth.actions.ts` goes
 * through it rather than showing Supabase's raw `error.message`.
 */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  email_not_confirmed: "Please confirm your email address before signing in.",
  invalid_credentials: "Invalid email or password.",
  user_already_exists: "An account with this email already exists.",
  weak_password: "Password is too weak. Use at least 8 characters.",
};

/** Shown when an AuthError has no entry in AUTH_ERROR_MESSAGES and no message. */
export const DEFAULT_AUTH_ERROR_MESSAGE =
  "Something went wrong. Please try again.";
