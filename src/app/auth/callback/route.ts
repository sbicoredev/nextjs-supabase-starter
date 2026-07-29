import { type NextRequest, NextResponse } from "next/server";

import { getSafeRedirectPath } from "~/lib/safe-redirect";
import { getSupabaseServerClient } from "~/lib/supabase/server";

/**
 * OAuth (PKCE) callback. The provider redirects here with a `code` query
 * param after the user approves access; we exchange it for a session.
 *
 * `redirectTo` is attacker-reachable (it's just a query param on a public
 * URL), so it's re-validated here with `getSafeRedirectPath` even though
 * `signInWithOAuth` already validated it before setting it — this is the
 * boundary where an untrusted request actually lands, so it gets its own
 * check rather than trusting the upstream caller.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = getSafeRedirectPath(
    searchParams.get("redirectTo"),
    "/dashboard"
  );

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/auth-code-error?message=${encodeURIComponent(
      "We couldn't sign you in. Please try again."
    )}`
  );
}
