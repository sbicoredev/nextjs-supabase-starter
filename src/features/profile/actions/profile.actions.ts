"use server";

import { revalidatePath } from "next/cache";

import {
  type UpdateProfileInput,
  updateProfileSchema,
} from "~/features/profile/schemas/profile.schema";
import { reportError } from "~/lib/error-reporter";
import { createUserRateLimit } from "~/lib/rate-limit";
import { createClient } from "~/lib/supabase/server";
import type { ActionResult, Profile } from "~/types";

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
    reportError(error);
    return { error: "Failed to load profile." };
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

  const { success } = await createUserRateLimit(user.id).limit("updateProfile");
  if (!success) {
    return { error: "Too many requests. Please try again later." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      username: parsed.data.username || null,
    })
    .eq("id", user.id);

  if (error) {
    reportError(error);
    return { error: "Failed to update profile." };
  }

  revalidatePath("/settings");
  return { data: true };
}
