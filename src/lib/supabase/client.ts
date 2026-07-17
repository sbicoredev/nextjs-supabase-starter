import { createBrowserClient } from "@supabase/ssr";

import { env } from "~/env";
import type { Database } from "~/lib/supabase/types";

/**
 * Supabase client for use in Client Components ("use client").
 *
 * Creates a new browser client per call — cheap, since it just wires up
 * fetch + storage. Call this inside components/hooks, not at module scope,
 * so it plays nicely with React Strict Mode and Fast Refresh.
 */
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}
