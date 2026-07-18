import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { LoginForm } from "~/features/auth/components/login-form";
import { constructMetadata } from "~/lib/construct-metadata";
import { getSafeRedirectPath } from "~/lib/safe-redirect";

export const metadata: Metadata = constructMetadata({
  path: "/login",
  title: "Sign in",
});

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; email_not_confirmed?: string }>;
}) {
  const { redirectTo: rawRedirectTo, email_not_confirmed } = await searchParams;
  // Sanitized here, at the point an untrusted query string first enters
  // the app — see `src/lib/safe-redirect.ts` for why this matters.
  const redirectTo = rawRedirectTo
    ? getSafeRedirectPath(rawRedirectTo, "/dashboard")
    : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm
          initialError={
            email_not_confirmed
              ? "Please confirm your email address before signing in."
              : undefined
          }
          redirectTo={redirectTo}
        />
      </CardContent>
    </Card>
  );
}
