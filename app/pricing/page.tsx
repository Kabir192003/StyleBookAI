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
 *
 * Styling adapted to the site's cream/ink/navy editorial system instead
 * of the separate glass/dark design system this was originally built
 * against, to stay visually consistent with Studio/browse/SiteHeader.
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
    <main className="flex min-h-[calc(100vh-56px)] flex-col items-center bg-[#EDE6DA] px-6 py-20 text-center">
      <span className="mb-4 inline-flex items-center gap-2 font-mono-plex text-xs uppercase tracking-[0.13em] text-[#222D52]">
        <span className="h-px w-5 bg-[#222D52]/50" aria-hidden="true" />
        v1 · no paywall, no plan gating
      </span>
      <h1 className="text-balance font-editorial-serif text-4xl font-bold tracking-tight text-[#211E18]">
        StyleBook AI is free
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[#6E675C]">
        Every feature ships free while we&rsquo;re in v1 — unlimited projects, AI
        generation, and every export format. Paid tiers may come later;
        nothing you make now will be locked away.
      </p>

      <div className="relative mt-10 w-full max-w-sm overflow-visible">
        <div
          className="absolute -right-4 -top-4 z-10 flex h-16 w-16 rotate-12 items-center justify-center rounded-full border-2 border-[#222D52] bg-[#EDE6DA] font-mono-plex text-xs font-bold uppercase text-[#222D52] shadow-[0_1px_3px_rgba(24,28,45,0.08)]"
          aria-hidden="true"
        >
          Free
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-black/[0.12] bg-white/70 p-8 text-left shadow-[0_20px_60px_-20px_rgba(20,17,12,0.35)] backdrop-blur-xl">
          <div className="mb-6 flex items-baseline gap-2">
            <span className="font-editorial-serif text-4xl font-bold text-[#211E18]">$0</span>
            <span className="text-sm text-[#8A8477]">/ forever, for now</span>
          </div>
          <ul className="mb-8 flex flex-col gap-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-[#6E675C]">
                <Check className="mt-0.5 h-4 w-4 shrink-0 rounded-sm bg-[#22733F] text-white" aria-hidden="true" />
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
