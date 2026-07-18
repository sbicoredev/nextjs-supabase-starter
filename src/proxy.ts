import { type NextRequest, NextResponse } from "next/server";

import { authRateLimit, generalRateLimit } from "~/lib/rate-limit";
import { updateSession } from "~/lib/supabase/middleware";

import { AUTH_ROUTES } from "./constants/auth";

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
export async function proxy(request: NextRequest) {
  // request.ip is set by the trusted upstream proxy (Vercel, Cloudflare, etc.)
  // and can't be spoofed by the client. x-forwarded-for can be spoofed when
  // there's no trusted proxy, so we only use it as a secondary signal.
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0];
  // @ts-expect-error - request.ip is available on Vercel/Node runtimes
  const ip = request.ip ?? forwardedFor ?? "anonymous";

  const { pathname } = request.nextUrl;

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const ratelimit = isAuthRoute ? authRateLimit : generalRateLimit;
  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString(),
        "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
      },
    });
  }
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
