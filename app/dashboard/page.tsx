/**
 * /dashboard — "My Projects"
 *
 * Spec: docs/PRODUCT_AND_UX.md §2 (Dashboard). Lists every project the
 * signed-in user (Clerk) has saved, newest first.
 *
 * TODO:
 * - Fetch from GET /api/projects (requires Clerk auth — see middleware.ts)
 * - Empty state: "No projects yet" + CTA to /studio or /studio/ai
 * - Each card → /dashboard/[projectId]
 * - "New project" button
 */
export default function DashboardPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Project list not wired up yet — see TODO at the top of this file.
      </p>
    </main>
  );
}
