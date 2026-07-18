"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { reportError } from "~/lib/error-reporter";

/**
 * Root error boundary. Catches any error thrown while rendering a route
 * that doesn't define its own `error.tsx`. Must be a Client Component —
 * this is a Next.js App Router requirement for error boundaries.
 *
 * Route groups (`(auth)/`, `(dashboard)/`) can add their own `error.tsx`
 * for more specific recovery UI; this one is the catch-all.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { digest: error.digest, boundary: "root" });
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <Alert className="max-w-sm" variant="destructive">
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>
          An unexpected error occurred. You can try again, or head back to the
          homepage.
        </AlertDescription>
      </Alert>
      <div className="flex gap-3">
        <Button onClick={reset} variant="outline">
          Try again
        </Button>
        <Button nativeButton={false} render={<Link href="/" />}>
          Back to home
        </Button>
      </div>
    </div>
  );
}
