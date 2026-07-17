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
import { getSafeRedirectPath } from "~/lib/safe-redirect";
import { createClient } from "~/lib/supabase/server";
import type { ActionResult } from "~/types";

async function getOrigin() {
  const headersList = await headers();
  return (
    env.NEXT_PUBLIC_APP_URL ??
    `${headersList.get("x-forwarded-proto") ?? "http"}://${headersList.get("host")}`
  );
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
  const supabase = await createClient();

  const safeRedirectTo = redirectTo
    ? getSafeRedirectPath(redirectTo, AUTH_REDIRECT_PATHS.afterSignIn)
    : undefined;

  const callbackUrl = new URL("/auth/callback", origin);
  if (safeRedirectTo) {
    callbackUrl.searchParams.set("redirectTo", safeRedirectTo);
  }

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
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: getAuthErrorMessage(error) };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(AUTH_REDIRECT_PATHS.afterSignOut);
}
