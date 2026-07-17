import type { NextConfig } from "next";

/**
 * Baseline security headers applied to every response. These are
 * conservative and shouldn't break anything, but they're not a substitute
 * for a real Content-Security-Policy — CSP is deliberately not included
 * here because a safe default depends on your app's actual script/style/
 * connect sources (fonts, analytics, Supabase Storage, etc.) and a wrong
 * one silently breaks the app. Add one once you know your app's origins;
 * see https://nextjs.org/docs/app/guides/content-security-policy.
 */
const securityHeaders = [
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
