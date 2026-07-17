/**
 * /sign-up — Clerk sign-up page. Mirrors sign-in/page.tsx, different
 * plate on the cover panel.
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
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Cover panel */}
      <div className="flex flex-col justify-between bg-app-cover-bg p-10 md:w-[46%] md:p-12">
        <div className="flex items-center gap-2 font-editorial-serif text-lg font-semibold text-app-cover-text">
          <span className="block h-6 w-6 rounded-sm bg-gold-foil" aria-hidden="true" />
          StyleBook
        </div>

        <div className="flex flex-col gap-6 py-16 md:py-0">
          <p className="font-mono text-xs uppercase tracking-widest text-champagne">
            Plate No. 002 — Bold Streetwear Brand
          </p>
          <p className="font-editorial-serif text-3xl leading-snug text-app-cover-text">
            Describe a brand in <span className="text-champagne">plain words</span> — get a palette,
            pairing, and scale with reasoning attached.
          </p>
          <div className="flex gap-3">
            {["#111111", "#FF3D00", "#FFD600", "#FFF8E1"].map((c) => (
              <div key={c} className="h-12 w-12 rounded-md border border-white/10" style={{ background: c }} />
            ))}
          </div>
          <p className="font-mono text-[11px] text-app-cover-text-muted">
            HEADING · ARCHIVO BLACK &nbsp;&nbsp; BODY · SPACE GROTESK &nbsp;&nbsp; SCALE · AUGMENTED FOURTH
          </p>
        </div>

        <p className="font-mono text-[11px] text-app-cover-text-muted">© {new Date().getFullYear()} StyleBook AI</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-app-bg p-10">
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-app-text-muted">Create account</p>
          <h1 className="font-editorial-serif text-2xl font-semibold text-app-heading">Start your first plate</h1>
          <p className="text-sm text-app-text-secondary">Free in v1 — save unlimited projects.</p>
        </div>
        <SignUp appearance={clerkAppearance} signInUrl="/sign-in" afterSignUpUrl="/dashboard" />
        <p className="flex items-center gap-2 font-mono text-[11px] text-app-text-muted">
          <span className="h-[2px] w-5 bg-gold-foil" aria-hidden="true" />
          Secured by Clerk
        </p>
      </div>
    </div>
  );
}
