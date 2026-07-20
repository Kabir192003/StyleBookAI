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
import { StudioCanvas } from "@/components/studio/StudioCanvas";

export default function StudioPage() {
  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">Studio</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">Manual project builder</h1>
          <p className="mt-3 text-sm leading-7 text-neutral-600">
            Pick colors, assign roles, choose fonts, and set a type scale to shape a project before saving it.
          </p>
        </div>
        <StudioCanvas />
      </div>
    </main>
  );
}

