/**
 * /sign-in — Clerk sign-in page
 *
 * Owner: Amna
 *
 * Clerk does most of the work here; this file hosts their prebuilt
 * component, themed via lib/clerkAppearance.ts to match the app-shell
 * brand. Wrapped by app/(auth)/layout.tsx (logo, centered).
 */
import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerkAppearance";

export const metadata = {
  title: "Sign in — StyleBook",
};

export default function SignInPage() {
  return (
    <main className="flex w-full flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-editorial-serif text-2xl font-semibold text-app-heading">
          Welcome back
        </h1>
        <p className="text-sm text-app-text-secondary">
          Sign in to keep building your palette.
        </p>
      </div>
      <SignIn
        appearance={clerkAppearance}
        signUpUrl="/sign-up"
        afterSignInUrl="/dashboard"
      />
    </main>
  );
}
