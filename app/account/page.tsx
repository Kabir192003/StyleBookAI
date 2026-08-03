/**
 * /account — basic account settings
 *
 * Owner: Amna
 *
 * Auth (Clerk) was removed — see CLAUDE.md. This is a placeholder until a
 * simple username/password login exists to back real account settings.
 */
export default function AccountPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold tracking-tight">Account</h1>
      <p className="mt-3 text-sm text-neutral-500">
        Account settings aren&apos;t wired up yet — sign-in isn&apos;t built. Coming
        with the username/password login.
      </p>
    </main>
  );
}
