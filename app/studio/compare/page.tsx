/**
 * /studio/compare — Palette & Font Preview Lab
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
    <main className="p-8">
      <h1 className="text-3xl font-bold tracking-tight">Preview Lab</h1>
      <PreviewLab />
    </main>
  );
}
