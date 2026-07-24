/**
 * /pricing — placeholder only
 *
 * Owner: Amna
 *
 * Billing/Stripe is explicitly deferred for v1 (the whole app ships free,
 * no plan gating anywhere in the code). This route exists so the nav link
 * doesn't 404, and so the folder survives in git. Do NOT build pricing
 * tiers, Stripe checkout, or plan gating against this file for v1.
 *
 * TODO (post-v1, not now): real pricing tiers + Stripe checkout.
 */
import Link from "next/link";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";

const FEATURES = [
  "Unlimited saved projects",
  "AI palette, font & type-scale generation",
  "Preview Lab with WCAG contrast checks",
  "CSS, Tailwind, SCSS & JSON export",
];

export const metadata = {
  title: "Pricing — StyleBook",
};

export default function PricingPage() {
  return (
    <main className="flex flex-col items-center bg-app-bg px-6 py-20 text-center">
      <span className="app-eyebrow mb-4">v1 · no paywall, no plan gating</span>
      <h1 className="text-balance font-geometric-sans text-4xl font-bold tracking-tight text-app-heading">
        StyleBook AI is free
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-app-text-secondary">
        Every feature ships free while we&rsquo;re in v1 — unlimited projects, AI
        generation, and every export format. Paid tiers may come later;
        nothing you make now will be locked away.
      </p>

      <div className="relative mt-10 w-full max-w-sm overflow-visible">
        <div
          className="absolute -right-4 -top-4 z-10 flex h-16 w-16 rotate-12 items-center justify-center rounded-full border-2 border-app-accent bg-app-bg font-mono text-xs font-bold uppercase text-app-accent shadow-app-sm"
          aria-hidden="true"
        >
          Free
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-glass-panel bg-app-glass-panel p-8 text-left shadow-app-lg backdrop-blur-xl">
          <div className="mb-6 flex items-baseline gap-2">
            <span className="font-geometric-sans text-4xl font-bold text-app-text">$0</span>
            <span className="text-sm text-app-text-muted">/ forever, for now</span>
          </div>
          <ul className="mb-8 flex flex-col gap-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-app-text-secondary">
                <Check className="mt-0.5 h-4 w-4 shrink-0 rounded-sm bg-app-success text-pearl" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
          <Link href="/studio" className={buttonVariants({ variant: "primary" }) + " w-full"}>
            Start building — it&rsquo;s free
          </Link>
        </div>
      </div>
    </main>
  );
}
