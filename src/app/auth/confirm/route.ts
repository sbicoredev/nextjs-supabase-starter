import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "~/lib/supabase/server";

/**
 * Handles email-link confirmations: sign-up confirmation, magic link
 * sign-in, and password-recovery links. Supabase sends users here with
 * `token_hash` + `type` query params (see the `emailRedirectTo` values set
 * in `src/features/auth/actions/auth.actions.ts`).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      const redirectPath =
        type === "recovery" ? "/reset-password" : "/dashboard";
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/auth-code-error?message=${encodeURIComponent(
      "This link is invalid or has expired."
    )}`
  );
}
