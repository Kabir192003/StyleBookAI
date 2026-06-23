/**
 * /studio — Manual project builder
 *
 * Owner: Qi
 *
 * Spec: docs/PRODUCT_AND_UX.md §2 (Studio) and §3 (Preview Lab is embedded
 * inside this flow).
 *
 * TODO (Qi):
 * - Pull selection state from store/studioStore.ts (stub already there)
 * - Let the user pick colors and assign roles (primary/secondary/accent/
 *   background/surface/text/textMuted)
 * - Pick heading + body fonts
 * - Type scale controls (base size + named ratio)
 * - Embed the Preview Lab view from components/studio/PreviewLab.tsx
 * - "Save project" action → POST /api/projects (built by the lead)
 */
export default function StudioPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold tracking-tight">Studio</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Manual project builder — see the TODO at the top of this file.
      </p>
    </main>
  );
}
