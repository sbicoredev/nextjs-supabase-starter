import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { SignUpForm } from "~/features/auth/components/sign-up-form";
import { constructMetadata } from "~/lib/construct-metadata";

export const metadata = constructMetadata({
  path: "/sign-up",
  title: "Create an account",
});

export default function SignUpPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create an account</CardTitle>
        <CardDescription>
          Enter your details below to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm />
      </CardContent>
    </Card>
  );
}
