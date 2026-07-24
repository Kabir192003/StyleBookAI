/**
 * /sign-in — Clerk sign-in page
 *
 * Owner: Amna
 *
 * No separate wrapping layout/logo here — components/layout/SiteHeader.tsx
 * is mounted globally (app/layout.tsx) and already shows the wordmark on
 * every page, this one included. Centered glass-panel card on Silk per
 * docs/StyleBook-Design-System.pdf §02: Onyx is reserved for the rare
 * gallery moment, never general chrome, so auth stays on Silk like
 * everything else, using the same .glass-panel treatment as the rest of
 * the site (rgba pearl 84%, blur 24px, hairline border).
 */
import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerkAppearance";

export const metadata = {
  title: "Sign in — StyleBook",
};

export default function SignInPage() {
  return (
    <main className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center gap-6 bg-app-bg px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-glass-panel bg-app-glass-panel p-8 shadow-app-lg backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center gap-1.5 text-center">
          <p className="app-eyebrow">Sign in</p>
          <h1 className="font-geometric-sans text-2xl font-bold tracking-tight text-app-heading">
            Welcome back
          </h1>
          <p className="text-sm text-app-text-secondary">
            Continue building your palette where you left off.
          </p>
        </div>
        <SignIn appearance={clerkAppearance} signUpUrl="/sign-up" afterSignInUrl="/dashboard" />
      </div>

      <p className="flex items-center gap-2 font-mono text-[11px] text-app-text-muted">
        <span className="h-px w-5 bg-app-accent/40" aria-hidden="true" />
        Secured by Clerk
      </p>
    </main>
  );
}
