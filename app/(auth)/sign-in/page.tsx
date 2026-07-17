/**
 * /sign-in — Clerk sign-in page
 *
 * Owner: Amna
 *
 * Split-screen: a dark onyx "cover" panel on the left — showing a real
 * project's palette + a WCAG contrast callout, the same proof-of-craft
 * idea as a swatch book's inside cover — and Clerk's themed <SignIn />
 * on the cream page-panel on the right.
 */
import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerkAppearance";

export const metadata = {
  title: "Sign in — StyleBook",
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Cover panel */}
      <div className="flex flex-col justify-between bg-app-cover-bg p-10 md:w-[46%] md:p-12">
        <div className="flex items-center gap-2 font-editorial-serif text-lg font-semibold text-app-cover-text">
          <span className="block h-6 w-6 rounded-sm bg-gold-foil" aria-hidden="true" />
          StyleBook
        </div>

        <div className="flex flex-col gap-6 py-16 md:py-0">
          <p className="font-mono text-xs uppercase tracking-widest text-champagne">
            Plate No. 014 — Coastal Hotel Rebrand
          </p>
          <p className="font-editorial-serif text-3xl leading-snug text-app-cover-text">
            &ldquo;Text on background reads at{" "}
            <span className="text-champagne">9.2:1</span> — comfortably AAA.&rdquo;
          </p>
          <div className="flex gap-3">
            {["#075985", "#0284C7", "#BAE6FD", "#F0F9FF"].map((c) => (
              <div key={c} className="h-12 w-12 rounded-md border border-white/10" style={{ background: c }} />
            ))}
          </div>
          <p className="font-mono text-[11px] text-app-cover-text-muted">
            HEADING · PLAYFAIR DISPLAY &nbsp;&nbsp; BODY · SOURCE SANS &nbsp;&nbsp; SCALE · MAJOR THIRD
          </p>
        </div>

        <p className="font-mono text-[11px] text-app-cover-text-muted">© {new Date().getFullYear()} StyleBook AI</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-app-bg p-10">
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-app-text-muted">Sign in</p>
          <h1 className="font-editorial-serif text-2xl font-semibold text-app-heading">Welcome back</h1>
          <p className="text-sm text-app-text-secondary">Continue building your palette where you left off.</p>
        </div>
        <SignIn appearance={clerkAppearance} signUpUrl="/sign-up" afterSignInUrl="/dashboard" />
        <p className="flex items-center gap-2 font-mono text-[11px] text-app-text-muted">
          <span className="h-[2px] w-5 bg-gold-foil" aria-hidden="true" />
          Secured by Clerk
        </p>
      </div>
    </div>
  );
}
