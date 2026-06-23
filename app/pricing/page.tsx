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
export default function PricingPage() {
  return (
    <main className="p-8 text-center">
      <h1 className="text-3xl font-bold tracking-tight">StyleBook AI is free</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Every feature is free during v1. Pricing tiers are deferred — see
        the comment at the top of this file.
      </p>
    </main>
  );
}
