/**
 * /sign-in — Clerk sign-in page
 *
 * Clerk does most of the work here; this file just hosts their prebuilt
 * component. Low-complexity file, good first task for getting a PR merged.
 *
 * TODO:
 * - Confirm Clerk env vars are set (see .env.example)
 * - Style the wrapping page (centered card, logo, link to /sign-up)
 */
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignIn />
    </main>
  );
}
