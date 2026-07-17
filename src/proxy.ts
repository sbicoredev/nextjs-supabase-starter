import type { NextRequest } from "next/server";

import { updateSession } from "~/lib/supabase/middleware";

/**
 * Next.js request-boundary entry point (renamed from `middleware` to
 * `proxy` in Next.js 16). Runs before every matched route, refreshing the
 * Supabase session cookie and gatekeeping protected/auth routes.
 *
 * Keep this file limited to routing/network concerns (redirects, cookie
 * refresh). Heavier auth/authorization logic belongs in the Data Access
 * Layer (see `src/features/auth`) so it runs in the same context as the
 * data it protects.
 */
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - image/font/svg file extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
