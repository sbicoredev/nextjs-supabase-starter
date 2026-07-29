"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { returnServerError } from "next-safe-action";
import z from "zod";

import { AUTH_REDIRECT_PATHS, OAUTH_PROVIDERS } from "~/constants/auth";
import { ErrorMessaage } from "~/constants/error-message";
import { env } from "~/env";
import { getAuthErrorMessage } from "~/features/auth/lib/get-auth-error-message";
import {
  forgotPasswordSchema,
  magicLinkSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "~/features/auth/schemas/auth.schema";
import { reportError } from "~/lib/error-reporter";
import { authRateLimit } from "~/lib/rate-limit";
import { actionClient, authActionClient } from "~/lib/safe-action";
import { getSafeRedirectPath } from "~/lib/safe-redirect";
import { getSupabaseServerClient } from "~/lib/supabase/server";
import type { ActionResult } from "~/types";

const authRouteActionClient = actionClient.use(async ({ next }) => {
  const success = await checkAuthRateLimit();
  if (!success) {
    throw new Error(ErrorMessaage.rateLimit.tooManyRequest);
  }
  const supabase = await getSupabaseServerClient();
  return next({ ctx: { supabase } });
});

/**
 * Email + password sign in. On success, redirects to the dashboard (or the
 * `redirectTo` the middleware attached before bouncing the user to
 * /login) — validated with `getSafeRedirectPath` so an attacker can't turn
 * this into an open redirect via `?redirectTo=`.
 *
 * Only returns on failure; success always ends in `redirect()`.
 */
export const signInWithPassword = authRouteActionClient
  .metadata({ actionName: "signInWithPassword" })
  .bindArgsSchemas([z.string().optional()])
  .inputSchema(signInSchema)
  .action(
    async ({
      parsedInput,
      bindArgsClientInputs: [redirectTo],
      ctx: { supabase },
    }) => {
      const { error } = await supabase.auth.signInWithPassword(parsedInput);
      if (error) {
        returnServerError(getAuthErrorMessage(error));
      }

      redirect(
        getSafeRedirectPath(redirectTo, AUTH_REDIRECT_PATHS.afterSignIn)
      );
    }
  );

/**
 * Email + password sign up. Supabase sends a confirmation email that links
 * back to /auth/confirm; the account isn't usable until confirmed (unless
 * email confirmations are disabled in your Supabase project settings).
 */
export const signUpWithPassword = authRouteActionClient
  .metadata({ actionName: "signUpWithPassword" })
  .inputSchema(signUpSchema)
  .action(async ({ parsedInput, ctx: { supabase } }) => {
    const origin = await getOrigin();
    const { error } = await supabase.auth.signUp({
      email: parsedInput.email,
      options: {
        data: { full_name: parsedInput.fullName },
        emailRedirectTo: `${origin}/auth/confirm?type=signup`,
      },
      password: parsedInput.password,
    });
    if (error) {
      returnServerError(getAuthErrorMessage(error));
    }

    return true;
  });

/** Passwordless sign in via a magic link emailed to the user. */
export const signInWithMagicLink = authRouteActionClient
  .metadata({ actionName: "signInWithMagicLink" })
  .inputSchema(magicLinkSchema)
  .action(async ({ parsedInput, ctx: { supabase } }) => {
    const origin = await getOrigin();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsedInput.email,
      options: {
        emailRedirectTo: `${origin}/auth/confirm?type=magiclink`,
        shouldCreateUser: true,
      },
    });
    if (error) {
      returnServerError(getAuthErrorMessage(error));
    }

    return true;
  });

/**
 * Starts the OAuth flow and redirects to the provider's consent screen.
 * `redirectTo` is validated with `getSafeRedirectPath` before being
 * embedded in the callback URL Supabase will bounce back to — otherwise a
 * crafted `?redirectTo=` could ride along through the whole OAuth round
 * trip and become an open redirect on `/auth/callback`.
 *
 * Only returns on failure; success always ends in `redirect()`.
 */
export const signInWithOAuth = authRouteActionClient
  .metadata({ actionName: "signInWithOAuth" })
  .inputSchema(
    z.object({
      provider: z.enum(OAUTH_PROVIDERS),
      redirectTo: z.string().optional(),
    })
  )
  .action(
    async ({ parsedInput: { redirectTo, provider }, ctx: { supabase } }) => {
      const origin = await getOrigin();
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
        returnServerError(getAuthErrorMessage(error));
      }

      if (data.url) {
        // Redirecting to the OAuth provider's own consent screen — an
        // external, non-user-controlled URL, so this is not an open redirect.
        redirect(data.url);
      }

      returnServerError(ErrorMessaage.auth.couldNotStartOauth);
    }
  );

/** Sends a password-reset email containing a link to /auth/confirm. */
export const requestPasswordReset = authRouteActionClient
  .metadata({ actionName: "requestPasswordReset" })
  .inputSchema(forgotPasswordSchema)
  .action(async ({ parsedInput, ctx: { supabase } }) => {
    const origin = await getOrigin();
    const { error } = await supabase.auth.resetPasswordForEmail(
      parsedInput.email,
      { redirectTo: `${origin}/auth/confirm?type=recovery` }
    );
    if (error) {
      returnServerError(getAuthErrorMessage(error));
    }

    return true;
  });

/**
 * Updates the password for the currently authenticated user. Must be
 * called after the recovery link has established a session (see
 * `src/app/auth/confirm/route.ts`).
 *
 * Only returns on failure; success always ends in `redirect()`.
 */
export const updatePassword = authActionClient
  .metadata({ actionName: "updatePassword" })
  .inputSchema(resetPasswordSchema)
  .action(async ({ parsedInput, ctx: { supabase } }) => {
    const { error } = await supabase.auth.updateUser({
      password: parsedInput.password,
    });
    if (error) {
      returnServerError(getAuthErrorMessage(error));
    }

    redirect("/dashboard");
  });

export async function signOut(): Promise<ActionResult<never>> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    reportError(error, { action: "signOut" });
    return { error: "Failed to sign out. Please try again." };
  }

  redirect(AUTH_REDIRECT_PATHS.afterSignOut);
}

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
