/**
 * /dashboard/[projectId] — Single saved project
 *
 * Owner: Amna
 *
 * Spec: docs/PRODUCT_AND_UX.md §2. Read-only view of a saved project with
 * edit/export/delete actions.
 *
 * TODO (Amna):
 * - Fetch from GET /api/projects/[id]
 * - Render with the same PreviewLab/mockup components used in Studio
 * - "Edit" → loads project into studioStore and routes to /studio
 * - "Export" → calls /api/export
 * - "Delete" → DELETE /api/projects/[id] behind a confirm dialog
 */
export default function ProjectDetailPage({
  params,
}: {
  params: { projectId: string };
}) {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#EDE6DA] p-8">
      <h1 className="font-editorial-serif text-3xl font-bold tracking-tight text-[#211E18]">Project</h1>
      <p className="mt-1 text-sm text-[#6E675C]">
        Loading project {params.projectId} — not wired up yet, see TODO at
        the top of this file.
      </p>
    </main>
  );
}
