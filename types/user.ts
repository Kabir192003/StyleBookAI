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
