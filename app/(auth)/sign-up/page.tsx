/**
 * /sign-up — simple username/password account creation, no email or
 * verification step. See lib/auth/ for the password hashing + session
 * cookie logic behind this.
 */
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = {
  title: "Create account — StyleBook",
};

export default function SignUpPage() {
  return (
    <Suspense>
      <AuthForm mode="sign-up" />
    </Suspense>
  );
}
