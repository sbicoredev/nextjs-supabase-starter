import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { constructMetadata } from "~/lib/construct-metadata";

export const metadata = constructMetadata({
  noIndex: true,
  title: "Sign-in error",
});

export default async function AuthCodeErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <Alert className="max-w-sm" variant="destructive">
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>
          {message ?? "We couldn't complete that request."}
        </AlertDescription>
      </Alert>
      <Button nativeButton={false} render={<Link href="/login" />}>
        Back to sign in
      </Button>
    </div>
  );
}
