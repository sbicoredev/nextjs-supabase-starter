import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ResetPasswordForm } from "~/features/auth/components/reset-password-form";
import { constructMetadata } from "~/lib/construct-metadata";

export const metadata = constructMetadata({
  path: "/reset-password",
  title: "Set a new password",
});

export default function ResetPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Set a new password</CardTitle>
        <CardDescription>
          Choose a strong password for your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  );
}
