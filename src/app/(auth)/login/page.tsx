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

export const metadata = constructMetadata({
  path: "/login",
  title: "Sign in",
});

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo: rawRedirectTo } = await searchParams;
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
        <LoginForm redirectTo={redirectTo} />
      </CardContent>
    </Card>
  );
}
