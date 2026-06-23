/**
 * /account — basic account settings
 *
 * v1 has no billing (see docs/PRODUCT_AND_UX.md — Stripe is explicitly
 * deferred), so this page is just profile info via Clerk's <UserProfile />
 * plus an account-level preferences stub.
 *
 * TODO:
 * - Embed Clerk's <UserProfile />
 * - Any app-specific preference (e.g. default unit for type scale) goes
 *   below it
 */
import { UserProfile } from "@clerk/nextjs";

export default function AccountPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold tracking-tight">Account</h1>
      <div className="mt-6">
        <UserProfile />
      </div>
    </main>
  );
}
