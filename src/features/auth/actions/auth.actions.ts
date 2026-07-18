"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_REDIRECT_PATHS, type OAuthProvider } from "~/constants/auth";
import { env } from "~/env";
import { getAuthErrorMessage } from "~/features/auth/lib/get-auth-error-message";
import {
  type ForgotPasswordInput,
  forgotPasswordSchema,
  type MagicLinkInput,
  magicLinkSchema,
  type ResetPasswordInput,
  resetPasswordSchema,
  type SignInInput,
  type SignUpInput,
  signInSchema,
  signUpSchema,
} from "~/features/auth/schemas/auth.schema";
import { reportError } from "~/lib/error-reporter";
import { authRateLimit, createUserRateLimit } from "~/lib/rate-limit";
import { getSafeRedirectPath } from "~/lib/safe-redirect";
import { createClient } from "~/lib/supabase/server";
import type { ActionResult } from "~/types";

async function getOrigin() {
  const headersList = await headers();
  const origin =
    env.NEXT_PUBLIC_APP_URL ??
    `${headersList.get("x-forwarded-proto") ?? "http"}://${headersList.get("host")}`;

  if (!origin || origin.includes("null")) {
    throw new Error(
      "Could not determine the application URL. Set NEXT_PUBLIC_APP_URL in your environment."
    );
  }

  return origin;
}

async function checkAuthRateLimit(): Promise<boolean> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for")?.split(",")[0];
  const ip = forwardedFor ?? "anonymous";
  const { success } = await authRateLimit.limit(ip);
  return success;
}

/**
 * Email + password sign in. On success, redirects to the dashboard (or the
 * `redirectTo` the middleware attached before bouncing the user to
 * /login) — validated with `getSafeRedirectPath` so an attacker can't turn
 * this into an open redirect via `?redirectTo=`.
 *
 * Only returns on failure; success always ends in `redirect()`.
 */
export async function signInWithPassword(
  input: SignInInput,
  redirectTo?: string
): Promise<ActionResult<never>> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid email or password." };
  }

  const success = await checkAuthRateLimit();
  if (!success) {
    return { error: "Too many requests. Please try again later." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  redirect(getSafeRedirectPath(redirectTo, AUTH_REDIRECT_PATHS.afterSignIn));
}

/**
 * Email + password sign up. Supabase sends a confirmation email that links
 * back to /auth/confirm; the account isn't usable until confirmed (unless
 * email confirmations are disabled in your Supabase project settings).
 */
export async function signUpWithPassword(
  input: SignUpInput
): Promise<ActionResult<true>> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const success = await checkAuthRateLimit();
  if (!success) {
    return { error: "Too many requests. Please try again later." };
  }

  const origin = await getOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${origin}/auth/confirm?type=signup`,
    },
    password: parsed.data.password,
  });
  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  return { data: true };
}

/** Passwordless sign in via a magic link emailed to the user. */
export async function signInWithMagicLink(
  input: MagicLinkInput
): Promise<ActionResult<true>> {
  const parsed = magicLinkSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid email." };
  }

  const success = await checkAuthRateLimit();
  if (!success) {
    return { error: "Too many requests. Please try again later." };
  }

  const origin = await getOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?type=magiclink`,
      shouldCreateUser: true,
    },
  });
  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  return { data: true };
}

/**
 * Starts the OAuth flow and redirects to the provider's consent screen.
 * `redirectTo` is validated with `getSafeRedirectPath` before being
 * embedded in the callback URL Supabase will bounce back to — otherwise a
 * crafted `?redirectTo=` could ride along through the whole OAuth round
 * trip and become an open redirect on `/auth/callback`.
 *
 * Only returns on failure; success always ends in `redirect()`.
 */
export async function signInWithOAuth(
  provider: OAuthProvider,
  redirectTo?: string
): Promise<ActionResult<never>> {
  const origin = await getOrigin();
  const safeRedirectTo = redirectTo
    ? getSafeRedirectPath(redirectTo, AUTH_REDIRECT_PATHS.afterSignIn)
    : undefined;

  const callbackUrl = new URL("/auth/callback", origin);
  if (safeRedirectTo) {
    callbackUrl.searchParams.set("redirectTo", safeRedirectTo);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    options: { redirectTo: callbackUrl.toString() },
    provider,
  });
  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  if (data.url) {
    // Redirecting to the OAuth provider's own consent screen — an
    // external, non-user-controlled URL, so this is not an open redirect.
    redirect(data.url);
  }

  return { error: "Could not start the OAuth flow." };
}

/** Sends a password-reset email containing a link to /auth/confirm. */
export async function requestPasswordReset(
  input: ForgotPasswordInput
): Promise<ActionResult<true>> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid email." };
  }

  const success = await checkAuthRateLimit();
  if (!success) {
    return { error: "Too many requests. Please try again later." };
  }

  const origin = await getOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${origin}/auth/confirm?type=recovery` }
  );
  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  return { data: true };
}

/**
 * Updates the password for the currently authenticated user. Must be
 * called after the recovery link has established a session (see
 * `src/app/auth/confirm/route.ts`).
 *
 * Only returns on failure; success always ends in `redirect()`.
 */
export async function updatePassword(
  input: ResetPasswordInput
): Promise<ActionResult<never>> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in to reset your password." };
  }

  const { success } = await createUserRateLimit(user.id).limit(
    "updatePassword"
  );
  if (!success) {
    return { error: "Too many requests. Please try again later." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  redirect("/dashboard");
}

export async function signOut(): Promise<ActionResult<never>> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    reportError(error, { action: "signOut" });
    return { error: "Failed to sign out. Please try again." };
  }

  redirect(AUTH_REDIRECT_PATHS.afterSignOut);
}
