/**
 * User type — mirrors the `users` row in Supabase.
 *
 * `clerkId` is the primary join key between Clerk's auth system and our
 * own DB rows. The Stripe fields exist for the post-v1 billing phase;
 * they are nullable and no code should read them in v1. `plan` defaults
 * to "free" for every new user — leave it there until billing ships.
 */
export type Plan = "free" | "pro";

export type User = {
  id: string;
  clerkId: string;
  email: string;
  plan: Plan;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  createdAt: string;
};
