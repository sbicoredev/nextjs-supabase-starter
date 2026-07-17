import { Skeleton } from "~/components/ui/skeleton";

/**
 * Root loading UI, shown by Next.js while a route segment (and anything it
 * `await`s server-side) is still resolving. Route groups can override this
 * with their own `loading.tsx` for a more specific skeleton — this is the
 * generic fallback.
 */
export default function Loading() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <div className="w-full max-w-sm space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}
