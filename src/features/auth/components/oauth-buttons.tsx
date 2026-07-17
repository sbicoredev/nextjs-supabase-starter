"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import type { OAuthProvider } from "~/constants/auth";
import { signInWithOAuth } from "~/features/auth/actions/auth.actions";

const PROVIDER_LABELS: Record<OAuthProvider, string> = {
  github: "Continue with GitHub",
  google: "Continue with Google",
};

export function OAuthButtons({ redirectTo }: { redirectTo?: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick(provider: OAuthProvider) {
    startTransition(async () => {
      const result = await signInWithOAuth(provider, redirectTo);
      if (result.error !== undefined) {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="grid gap-2">
      {(Object.keys(PROVIDER_LABELS) as OAuthProvider[]).map((provider) => (
        <Button
          disabled={isPending}
          key={provider}
          onClick={() => handleClick(provider)}
          type="button"
          variant="outline"
        >
          {PROVIDER_LABELS[provider]}
        </Button>
      ))}
    </div>
  );
}
