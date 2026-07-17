/**
 * App-wide hand-written types that don't belong to a single feature.
 * Prefer deriving types from Zod schemas or `src/lib/supabase/types.ts`
 * over adding new ones here.
 */

export type SearchParams = Record<string, string | string[] | undefined>;

export type ActionResult<T = undefined> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: string };
