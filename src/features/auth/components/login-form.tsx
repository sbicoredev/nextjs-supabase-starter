"use client";

import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { toast } from "sonner";

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
import { signInWithPassword } from "~/features/auth/actions/auth.actions";
import { OAuthButtons } from "~/features/auth/components/oauth-buttons";

export function LoginForm({
  redirectTo,
  initialError,
}: {
  redirectTo?: string;
  initialError?: string;
}) {
  const form = useForm({
    defaultValues: { email: "jhon@mail.com", password: "Pass@123" },
    onSubmit: async ({ value, formApi }) => {
      const { serverError, validationErrors } = await signInWithPassword.bind(
        null,
        "/"
      )(value);
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
      }
    },
    // validators: { onBlur: signInSchema },
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
        <OAuthButtons redirectTo={redirectTo} />

        <div className="flex items-center gap-2">
          <Separator className="flex-1" />
          <span className="text-muted-foreground text-xs">OR</span>
          <Separator className="flex-1" />
        </div>

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
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Link
                  className="text-muted-foreground text-sm underline-offset-4 hover:underline"
                  href="/forgot-password"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                autoComplete="current-password"
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

        {initialError ? (
          <p className="font-medium text-destructive text-sm" role="alert">
            {initialError}
          </p>
        ) : null}

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
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          )}
        </form.Subscribe>

        <FieldDescription className="text-center">
          Don&apos;t have an account?{" "}
          <Link className="underline underline-offset-4" href="/sign-up">
            Sign up
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
