/**
 * /dashboard — "My Projects"
 *
 * Owner: Amna
 *
 * Spec: docs/PRODUCT_AND_UX.md §2 (Dashboard). Lists every project the
 * signed-in user (Clerk) has saved, newest first.
 *
 * TODO (Amna):
 * - Fetch from GET /api/projects (requires Clerk auth — see middleware.ts)
 * - Empty state: "No projects yet" + CTA to /studio or /studio/ai
 * - Each card → /dashboard/[projectId]
 * - "New project" button
 */
export default function DashboardPage() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#EDE6DA] p-8">
      <h1 className="font-editorial-serif text-3xl font-bold tracking-tight text-[#211E18]">My Projects</h1>
      <p className="mt-1 text-sm text-[#6E675C]">
        Project list not wired up yet — see TODO at the top of this file.
      </p>
    </main>
  );
}
