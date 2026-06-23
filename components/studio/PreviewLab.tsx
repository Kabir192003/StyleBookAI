/**
 * PreviewLab — the actual three-view UI described in
 * docs/PRODUCT_AND_UX.md §3. This is the single most important component
 * in the app; take the time to read the spec fully before building.
 *
 * Owner: Qi
 *
 * TODO (Qi):
 * - Tab switcher: Swatches / Mockup / Font-on-Color
 * - Swatches view: draggable row (@dnd-kit) + WCAG contrast badge per
 *   adjacent pair
 * - Mockup view: fixed layout (card, heading, paragraph, button, input)
 *   styled with usePreviewLabStore().selectedColors
 * - Font-on-color view: same mockup, with headingFont/bodyFont applied
 */
"use client";

import { usePreviewLabStore } from "@/store/previewLabStore";

export function PreviewLab() {
  const { selectedColors, activeView, setActiveView } = usePreviewLabStore();

  return (
    <div className="mt-6 rounded-lg border p-4">
      <div className="flex gap-2 text-sm">
        <button onClick={() => setActiveView("swatches")} className={activeView === "swatches" ? "font-bold" : ""}>
          Swatches
        </button>
        <button onClick={() => setActiveView("mockup")} className={activeView === "mockup" ? "font-bold" : ""}>
          Mockup
        </button>
        <button onClick={() => setActiveView("fontOnColor")} className={activeView === "fontOnColor" ? "font-bold" : ""}>
          Font on Color
        </button>
      </div>
      <p className="mt-4 text-sm text-neutral-500">
        {selectedColors.length} colors selected — build the {activeView} view here.
      </p>
    </div>
  );
}
