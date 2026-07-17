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
    <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-20 text-center">
      <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-app-accent-soft px-3 py-1 text-xs font-semibold text-app-accent">
        v1 · no paywall, no plan gating
      </span>
      <h1 className="font-editorial-serif text-4xl font-semibold text-app-heading">
        StyleBook AI is free
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-app-text-secondary">
        Every feature ships free while we&rsquo;re in v1 — unlimited projects, AI
        generation, and every export format. Paid tiers may come later;
        nothing you make now will be locked away.
      </p>

      <div className="mt-10 w-full max-w-sm rounded-2xl border border-app-border bg-app-surface p-8 text-left shadow-sm">
        <div className="mb-6 flex items-baseline gap-2">
          <span className="font-editorial-serif text-4xl font-semibold text-app-text">$0</span>
          <span className="text-sm text-app-text-muted">/ forever, for now</span>
        </div>
        <ul className="mb-8 flex flex-col gap-3">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-app-text">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-app-accent" aria-hidden="true" />
              {f}
            </li>
          ))}
        </ul>
        <Link
          href="/studio"
          className="block w-full rounded-lg bg-app-accent py-3 text-center text-sm font-semibold text-pearl transition-colors hover:bg-app-accent-hover"
        >
          Start building — it&rsquo;s free
        </Link>
      </div>
    </main>
  );
}
