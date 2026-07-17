import {
  defaultShouldDehydrateQuery,
  isServer,
  QueryClient,
} from "@tanstack/react-query";

/**
 * Creates a TanStack Query client with defaults tuned for a Next.js App
 * Router app that streams server-prefetched queries down to the client.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      dehydrate: {
        // Include pending queries in dehydration so streaming SSR
        // (Suspense) can resolve them on the client.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      queries: {
        retry: 1,
        // Avoid an immediate client-side refetch right after server
        // prefetch/hydration.
        staleTime: 30 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * Returns a QueryClient: a new one per request on the server, a stable
 * singleton in the browser (so navigation doesn't lose cached data).
 */
export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
