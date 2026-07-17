"use server";

import { revalidatePath } from "next/cache";

import type { Profile } from "~/features/auth/types/auth.types";
import {
  type UpdateProfileInput,
  updateProfileSchema,
} from "~/features/profile/schemas/profile.schema";
import { createClient } from "~/lib/supabase/server";
import type { ActionResult } from "~/types";

export async function getCurrentProfile(): Promise<ActionResult<Profile>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function updateProfile(
  input: UpdateProfileInput
): Promise<ActionResult<true>> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      username: parsed.data.username || null,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  return { data: true };
}
