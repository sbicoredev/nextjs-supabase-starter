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
  // In development, always log to the console so developers see it.
  if (process.env.NODE_ENV === "development") {
    console.error("[ErrorReporter]", error, context);
    return;
  }

  // Production: log to console as a baseline. Replace with your error
  // tracking service (e.g. Sentry.captureException(error, { extra: context }))
  // once integrated.
  console.error("[ErrorReporter]", error, context);

  // TODO: Add your error tracking service here, e.g.:
  // import * as Sentry from "@sentry/nextjs";
  // Sentry.captureException(error, { extra: context });
}
