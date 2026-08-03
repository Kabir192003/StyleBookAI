/**
 * /sign-in — simple username/password sign-in. See lib/auth/ for the
 * password hashing + session cookie logic behind this.
 */
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = {
  title: "Sign in — StyleBook",
};

export default function SignInPage() {
  return (
    <Suspense>
      <AuthForm mode="sign-in" />
    </Suspense>
  );
}
