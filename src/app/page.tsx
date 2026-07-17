import { ArrowRight, Database, Lock, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { siteConfig } from "~/configs/site-config";

const FEATURES = [
  {
    description:
      "Email/password, magic link, and OAuth via Supabase, with proxy-based session refresh and route protection.",
    icon: Lock,
    title: "Auth, done right",
  },
  {
    description:
      "Server actions + TanStack Query, typed end to end from your Supabase schema down to the UI.",
    icon: Database,
    title: "Typed data layer",
  },
  {
    description:
      "TanStack Form and Zod share one schema, so validation logic never drifts between client and server.",
    icon: Sparkles,
    title: "Forms that validate themselves",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-6">
          <span className="font-semibold">{siteConfig.name}</span>
          <nav className="flex items-center gap-2">
            <Button
              nativeButton={false}
              render={<Link href="/login" />}
              variant="ghost"
            >
              Sign in
            </Button>
            <Button nativeButton={false} render={<Link href="/sign-up" />}>
              Get started
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-4 py-16 md:px-6 md:py-24">
        <section className="flex flex-col items-start gap-6">
          <h1 className="max-w-2xl font-semibold text-4xl tracking-tight md:text-5xl">
            A Next.js + Supabase starter you can actually ship from.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            {siteConfig.description}
          </p>
          <div className="flex gap-3">
            <Button
              nativeButton={false}
              render={<Link href="/sign-up" />}
              size="lg"
            >
              Get started
              <ArrowRight />
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/login" />}
              size="lg"
              variant="outline"
            >
              Sign in
            </Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="mb-4 size-5 text-muted-foreground" />
                <CardTitle className="text-base">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                {feature.description}
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="mx-auto max-w-5xl px-4 text-muted-foreground text-sm md:px-6">
          Built with Next.js, Supabase, shadcn/ui, and TanStack.
        </div>
      </footer>
    </div>
  );
}
