// Account creation — no email or verification step, just username/password.
// See lib/auth/ for the hashing + session logic.
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
