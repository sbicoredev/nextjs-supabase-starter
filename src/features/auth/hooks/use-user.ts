"use client";

import type { User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { createClient } from "~/lib/supabase/client";

const userQueryKey = ["auth", "user"] as const;

/**
 * Client-side hook for the current Supabase user. Backed by TanStack Query
 * so components can share one cached fetch, and kept in sync with
 * Supabase's `onAuthStateChange` events (sign in, sign out, token refresh).
 *
 * Prefer reading the user in a Server Component via
 * `supabase.auth.getUser()` when you can — reach for this hook only in
 * Client Components (e.g. a header user menu).
 */
export function useUser() {
  const queryClient = useQueryClient();
  const [supabase] = useState(() => createClient());

  const query = useQuery<User | null>({
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
    queryKey: userQueryKey,
  });

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.setQueryData(userQueryKey, session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase, queryClient]);

  return query;
}
