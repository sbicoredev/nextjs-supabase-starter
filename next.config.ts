import type { NextConfig } from "next";

/**
 * Content Security Policy — a restrictive baseline that covers the most
 * common Next.js + Supabase + Tailwind setup. You WILL need to adjust
 * this once you add third-party scripts (analytics, fonts, etc.).
 *
 * Use report-only mode first (`Content-Security-Policy-Report-Only`) to
 * find violations without breaking the app, then switch to enforced mode.
 *
 * See https://nextjs.org/docs/app/guides/content-security-policy
 */
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // next.js dev needs unsafe-eval; remove in prod if possible
  "style-src 'self' 'unsafe-inline'", // tailwind + shadcn inject inline styles
  "img-src 'self' data: blob: https://*.supabase.co", // supabase storage images
  "font-src 'self' https://fonts.gstatic.com", // next/font/google
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co", // supabase api + realtime
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ headers: securityHeaders, source: "/:path*" }];
  },
  images: {
    remotePatterns: [
      {
        // Update this to match your Supabase project's storage host,
        // e.g. "abcdefghijk.supabase.co"
        hostname: "*.supabase.co",
        protocol: "https",
      },
    ],
  },
  reactStrictMode: true,
};

export default nextConfig;
