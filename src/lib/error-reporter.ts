/**
 * Centralized error reporting. Currently logs to the console — swap the
 * body of `reportError` for a real integration (Sentry, Logtail, etc.)
 * once you add one. All error boundaries and Server Actions should route
 * errors through this function so there's a single place to change.
 *
 * @example
 * import { reportError } from "~/lib/error-reporter";
 *
 * try {
 *   // ...
 * } catch (error) {
 *   reportError(error, { route: "/dashboard", phase: "data-fetch" });
 * }
 */
export function reportError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  const payload = {
    timestamp: new Date().toISOString(),
    level: "error",
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  };

  if (process.env.NODE_ENV === "development") {
    console.error("[ErrorReporter]", payload);
    return;
  }

  // Structured JSON for log aggregators (Vercel, Cloudflare, etc.)
  console.error(JSON.stringify(payload));

  // TODO: Replace with your error tracking service, e.g.:
  // import * as Sentry from "@sentry/nextjs";
  // Sentry.captureException(error, { extra: context });
}
