/**
 * /sign-up — Clerk sign-up page. Mirrors sign-in/page.tsx.
 *
 * Owner: Amna
 */
import { SignUp } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerkAppearance";

export const metadata = {
  title: "Create your account — StyleBook",
};

export default function SignUpPage() {
  return (
    <main className="flex w-full flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-editorial-serif text-2xl font-semibold text-app-heading">
          Create your account
        </h1>
        <p className="text-sm text-app-text-secondary">
          Free in v1 — save unlimited projects.
        </p>
      </div>
      <SignUp
        appearance={clerkAppearance}
        signInUrl="/sign-in"
        afterSignUpUrl="/dashboard"
      />
    </main>
  );
}
