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

const FEATURES = [
  "Unlimited saved projects",
  "AI palette, font & type-scale generation",
  "Preview Lab with WCAG contrast checks",
  "CSS, Tailwind, SCSS, JSON & PDF export",
];

export const metadata = {
  title: "Pricing — StyleBook",
};

export default function PricingPage() {
  return (
    <main className="flex flex-col items-center bg-app-cover-bg px-6 py-20 text-center">
      <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1 text-xs font-semibold text-champagne">
        v1 · no paywall, no plan gating
      </span>
      <h1 className="font-editorial-serif text-4xl font-semibold text-app-cover-text">
        StyleBook AI is free
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-app-cover-text-muted">
        Every feature ships free while we&rsquo;re in v1 — unlimited projects, AI
        generation, and every export format. Paid tiers may come later;
        nothing you make now will be locked away.
      </p>

      <div className="relative mt-10 w-full max-w-sm overflow-visible">
        <div
          className="absolute -right-4 -top-4 z-10 flex h-16 w-16 rotate-12 items-center justify-center rounded-full border-[3px] border-app-danger bg-app-bg font-mono text-xs font-bold uppercase text-app-danger"
          aria-hidden="true"
        >
          Free
        </div>
        <div className="relative overflow-hidden rounded-lg border border-black/10 bg-app-surface p-8 text-left shadow-lg">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gold-foil" aria-hidden="true" />
          <div className="mb-6 flex items-baseline gap-2">
            <span className="font-editorial-serif text-4xl font-semibold text-app-text">$0</span>
            <span className="text-sm text-app-text-muted">/ forever, for now</span>
          </div>
          <ul className="mb-8 flex flex-col gap-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-app-text">
                <Check className="mt-0.5 h-4 w-4 shrink-0 rounded-sm bg-app-success text-pearl" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/studio"
            className="block w-full rounded-lg bg-gold-foil py-3 text-center text-sm font-semibold text-onyx transition-all hover:brightness-105"
          >
            Start building — it&rsquo;s free
          </Link>
        </div>
      </div>
    </main>
  );
}
