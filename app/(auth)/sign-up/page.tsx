/**
 * /sign-up — Clerk sign-up page. Mirrors sign-in/page.tsx.
 *
 * Owner: Amna
 *
 * TODO (Amna): style the wrapping page (centered card, logo, link to /sign-in).
 */
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignUp />
    </main>
  );
}
