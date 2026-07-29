"use client";

import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { updateProfile } from "~/features/profile/actions/profile.actions";
import { updateProfileSchema } from "~/features/profile/schemas/profile.schema";
import type { Profile } from "~/types";

export function ProfileForm({ profile }: { profile: Profile }) {
  const form = useForm({
    defaultValues: {
      fullName: profile.full_name ?? "",
      username: profile.username ?? "",
    },
    onSubmit: async ({ value }) => {
      const result = await updateProfile(value);
      if (result.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success("Profile updated.");
    },
    validators: { onBlur: updateProfileSchema },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field name="fullName">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Full name</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                value={field.state.value}
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        <form.Field name="username">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Username</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                value={field.state.value}
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button className="w-fit" disabled={!canSubmit} type="submit">
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  );
}
