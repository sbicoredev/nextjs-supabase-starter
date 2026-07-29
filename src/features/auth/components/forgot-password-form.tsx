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
import { requestPasswordReset } from "~/features/auth/actions/auth.actions";
import { forgotPasswordSchema } from "~/features/auth/schemas/auth.schema";

export function ForgotPasswordForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm({
    defaultValues: { email: "" },
    onSubmit: async ({ value, formApi }) => {
      const { serverError, validationErrors } =
        await requestPasswordReset(value);
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
    validators: { onBlur: forgotPasswordSchema },
  });

  if (isSubmitted) {
    return (
      <Alert>
        <AlertTitle>Check your email</AlertTitle>
        <AlertDescription>
          If an account exists for that address, we sent a link to reset your
          password.
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
              {isSubmitting ? "Sending link…" : "Send reset link"}
            </Button>
          )}
        </form.Subscribe>

        <FieldDescription className="text-center">
          <Link className="underline underline-offset-4" href="/login">
            Back to sign in
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
