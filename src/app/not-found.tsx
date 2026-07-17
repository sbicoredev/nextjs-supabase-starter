import Link from "next/link";

import { Button } from "~/components/ui/button";
import { constructMetadata } from "~/lib/construct-metadata";

export const metadata = constructMetadata({
  noIndex: true,
  title: "Not found",
});

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">
          Page not found
        </h1>
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist or has moved.
        </p>
      </div>
      <Button nativeButton={false} render={<Link href="/" />}>
        Back to home
      </Button>
    </div>
  );
}
