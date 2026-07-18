import type { Tables } from "~/lib/supabase/types";

/**
 * App-wide hand-written types that don't belong to a single feature.
 * Prefer deriving types from Zod schemas or `src/lib/supabase/types.ts`
 * over adding new ones here.
 */
export type Profile = Tables<"profiles">;

export type ActionResult<T = undefined> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: string };

export type SearchParams = Record<string, string | string[] | undefined>;
