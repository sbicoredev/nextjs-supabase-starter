"use client";

import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { signUpWithPassword } from "~/features/auth/actions/auth.actions";
import { OAuthButtons } from "~/features/auth/components/oauth-buttons";
import { signUpSchema } from "~/features/auth/schemas/auth.schema";

export function SignUpForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value, formApi }) => {
      const { serverError, validationErrors } = await signUpWithPassword(value);
      if (validationErrors) {
        const fieldErr = validationErrors.fieldErrors;
        formApi.setErrorMap({
          onSubmit: {
            form: validationErrors.formErrors,
            fields: Object.fromEntries(
              Object.keys(fieldErr).map((i) => [
                i,
                [{ message: fieldErr[i as keyof typeof value] }],
              ])
            ),
          },
        });
      } else if (serverError) {
        formApi.setErrorMap({ onSubmit: { form: serverError, fields: {} } });
        toast.error(serverError);
      } else {
        setIsSubmitted(true);
      }
    },
    validators: { onBlur: signUpSchema },
  });

  if (isSubmitted) {
    return (
      <Alert>
        <AlertTitle>Check your email</AlertTitle>
        <AlertDescription>
          We sent a confirmation link to your inbox. Click it to activate your
          account.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <OAuthButtons />

        <div className="flex items-center gap-2">
          <Separator className="flex-1" />
          <span className="text-muted-foreground text-xs">OR</span>
          <Separator className="flex-1" />
        </div>

        <form.Field name="fullName">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Full name</FieldLabel>
              <Input
                autoComplete="name"
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Ada Lovelace"
                value={field.state.value}
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                autoComplete="email"
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="you@example.com"
                type="email"
                value={field.state.value}
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Password</FieldLabel>
              <Input
                autoComplete="new-password"
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                type="password"
                value={field.state.value}
              />
              <FieldDescription>
                At least 8 characters, one uppercase letter, one number.
              </FieldDescription>
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        <form.Field name="confirmPassword">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
              <Input
                autoComplete="new-password"
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                type="password"
                value={field.state.value}
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        {/* Rendering a Form-level Error */}
        <form.Subscribe selector={(state) => state.errors}>
          {(errors) =>
            errors.length > 0 ? (
              <em className="font-medium text-destructive text-sm" role="alert">
                {errors.join(", ")}
              </em>
            ) : null
          }
        </form.Subscribe>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button className="w-full" disabled={!canSubmit} type="submit">
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          )}
        </form.Subscribe>

        <FieldDescription className="text-center">
          Already have an account?{" "}
          <Link className="underline underline-offset-4" href="/login">
            Sign in
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
