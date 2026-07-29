"use server";

import { revalidatePath } from "next/cache";
import { returnServerError } from "next-safe-action";

import { updateProfileSchema } from "~/features/profile/schemas/profile.schema";
import { reportError } from "~/lib/error-reporter";
import { authActionClient } from "~/lib/safe-action";
import type { Profile } from "~/types";

export const getCurrentProfile = authActionClient
  .metadata({ actionName: "getCurrentProfile" })
  .action(async ({ ctx: { supabase, user } }): Promise<Profile> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (error) {
      reportError(error);
      returnServerError("Failed to load profile.");
    }
    return data;
  });

export const updateProfile = authActionClient
  .metadata({ actionName: "updateProfile" })
  .inputSchema(updateProfileSchema)
  .action(async ({ parsedInput, ctx: { supabase, user } }) => {
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: parsedInput.fullName,
        username: parsedInput.username || null,
      })
      .eq("id", user.id);

    if (error) {
      reportError(error);
      returnServerError("Failed to update profile.");
    }

    revalidatePath("/settings");
    return true;
  });
