/**
 * /studio/compare — Palette & Font Preview Lab
 *
 * Owner: Qi
 *
 * This is the centerpiece feature. Full interaction spec:
 * docs/PRODUCT_AND_UX.md §3 — read it before building.
 *
 * Three connected views (tabs within the same canvas), backed by
 * store/previewLabStore.ts:
 *   1. Side-by-side swatches with contrast badges (drag to reorder via
 *      @dnd-kit)
 *   2. Mood mockup — same colors applied to a card/heading/button/input
 *   3. Font-on-color — heading + body fonts rendered on the mockup's
 *      background colors
 *
 * TODO: build <PreviewLab /> in components/studio/PreviewLab.tsx and
 * render it here. "Send to Studio" action should write into studioStore.
 */
import { PreviewLab } from "@/components/studio/PreviewLab";

export default function ComparePage() {
  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">Studio compare</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">Preview Lab</h1>
          <p className="mt-3 text-sm leading-7 text-neutral-600">
            Test palette mood, reorder swatches, and compare type choices in a single place before sending the system into the studio flow.
          </p>
        </div>
        <PreviewLab />
      </div>
    </main>
  );
}
