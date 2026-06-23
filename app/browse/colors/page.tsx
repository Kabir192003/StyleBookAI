/**
 * /browse/colors — Color Library
 *
 * Owner: Dhanshri
 *
 * Spec: docs/PRODUCT_AND_UX.md §2 (Browse libraries)
 * Data: `allColors` from @/data/colors (582 colors right now, ~800 after
 *       `npm run transform:colors` is run)
 *
 * TODO (Dhanshri):
 * - Render <ColorGrid colors={allColors} /> (build that component in
 *   components/colors/ColorGrid.tsx — stub already there)
 * - Filter bar: family / mood / style / collection, search by name or hex
 * - Each card needs the "i" info button revealing `color.note` (§6) —
 *   do NOT confuse this with AI reasoning, this is the static per-item note
 */
import { allColors } from "@/data/colors";
import { ColorGrid } from "@/components/colors/ColorGrid";

export default function BrowseColorsPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold tracking-tight">Colors</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {allColors.length} colors loaded.
      </p>
      <ColorGrid colors={allColors} />
    </main>
  );
}
