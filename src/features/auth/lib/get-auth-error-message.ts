import type { AuthError } from "@supabase/supabase-js";

import {
  AUTH_ERROR_MESSAGES,
  DEFAULT_AUTH_ERROR_MESSAGE,
} from "~/constants/auth";

/**
 * Maps a Supabase `AuthError` to the friendly copy in `AUTH_ERROR_MESSAGES`.
 *
 * Supabase's raw `error.message` strings are meant for developers, not end
 * users (their wording and casing can change between SDK versions), so
 * every Server Action in `auth.actions.ts` should go through this instead
 * of returning `error.message` directly. Falls back to `error.message` if
 * we don't have a mapped code, and to a generic message if neither is
 * available.
 */
export function getAuthErrorMessage(error: AuthError): string {
  const { code } = error;
  const mapped = code ? AUTH_ERROR_MESSAGES[code] : undefined;

  return mapped ?? error.message ?? DEFAULT_AUTH_ERROR_MESSAGE;
}
