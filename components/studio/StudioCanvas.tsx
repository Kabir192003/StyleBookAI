/**
 * StudioCanvas — the manual builder's color/font picker panel, embedded
 * in app/studio/page.tsx. Distinct from PreviewLab (which is the result
 * viewer) — this is the *input* side: pick colors, assign roles, pick
 * fonts, set the type scale.
 *
 * TODO:
 * - Color picker: search/filter over allColors (reuse ColorGrid in a
 *   compact "pick" mode) + role assignment dropdown per pick
 * - Font picker: search/filter over font data once data/fonts/seed.ts
 *   exists
 * - Type scale control: base size input + named ratio select (minor
 *   third, major third, golden ratio, etc. — see types/theme.ts)
 * - Everything writes into store/studioStore.ts
 */
"use client";

import { useStudioStore } from "@/store/studioStore";

export function StudioCanvas() {
  const { colors } = useStudioStore();

  return (
    <div className="mt-6 rounded-lg border p-4">
      <p className="text-sm text-neutral-500">
        {colors.length} colors picked — build the picker UI here.
      </p>
    </div>
  );
}
