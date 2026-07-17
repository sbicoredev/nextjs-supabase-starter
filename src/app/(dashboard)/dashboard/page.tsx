import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { constructMetadata } from "~/lib/construct-metadata";
import { createClient } from "~/lib/supabase/server";

export const metadata = constructMetadata({
  noIndex: true,
  title: "Dashboard",
});

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">
          Welcome back
          {user.user_metadata?.full_name
            ? `, ${user.user_metadata.full_name}`
            : ""}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s a quick overview of your account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          This dashboard is a starting point — replace this card with the
          widgets your product actually needs. See{" "}
          <code className="rounded bg-muted px-1 py-0.5">
            docs/architecture.md
          </code>{" "}
          for the feature data flow pattern (Zod schema → Server Action →
          TanStack Query hook → TanStack Form) to follow for every new feature.
        </CardContent>
      </Card>
    </div>
  );
}
