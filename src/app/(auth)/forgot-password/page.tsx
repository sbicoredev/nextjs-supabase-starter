import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ForgotPasswordForm } from "~/features/auth/components/forgot-password-form";
import { constructMetadata } from "~/lib/construct-metadata";

export const metadata = constructMetadata({
  path: "/forgot-password",
  title: "Reset your password",
});

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Forgot your password?</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  );
}
