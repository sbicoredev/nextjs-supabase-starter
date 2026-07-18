import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { getCurrentProfile } from "~/features/profile/actions/profile.actions";
import { ProfileForm } from "~/features/profile/components/profile-form";
import { constructMetadata } from "~/lib/construct-metadata";

export const metadata: Metadata = constructMetadata({
  noIndex: true,
  title: "Settings",
});

export default async function SettingsPage() {
  const result = await getCurrentProfile();

  if (result.error !== undefined) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Update your public profile information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={result.data} />
        </CardContent>
      </Card>
    </div>
  );
}
