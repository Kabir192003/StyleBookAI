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
    <main className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center gap-6 bg-app-bg px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-glass-panel bg-app-glass-panel p-8 shadow-app-lg backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center gap-1.5 text-center">
          <p className="app-eyebrow">Create account</p>
          <h1 className="font-geometric-sans text-2xl font-bold tracking-tight text-app-heading">
            Start your first plate
          </h1>
          <p className="text-sm text-app-text-secondary">
            Free in v1 — save unlimited projects.
          </p>
        </div>
        <SignUp appearance={clerkAppearance} signInUrl="/sign-in" afterSignUpUrl="/dashboard" />
      </div>

      <p className="flex items-center gap-2 font-mono text-[11px] text-app-text-muted">
        <span className="h-px w-5 bg-app-accent/40" aria-hidden="true" />
        Secured by Clerk
      </p>
    </main>
  );
}
