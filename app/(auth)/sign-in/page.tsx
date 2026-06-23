/**
 * /sign-in — Clerk sign-in page
 *
 * Owner: Amna
 *
 * Clerk does most of the work here; this file just hosts their prebuilt
 * component. Good first task for getting a PR merged.
 *
 * TODO (Amna):
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
