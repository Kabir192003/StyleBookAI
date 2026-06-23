/**
 * ColorGrid — renders a filterable, searchable grid of Color swatches.
 * Used by: app/browse/colors/page.tsx, and reused inside the Preview Lab
 * and Studio wherever a color picker is needed.
 *
 * Owner: Dhanshri
 *
 * TODO (Dhanshri):
 * - Grid of swatch cards (color block + name + hex)
 * - "i" info button per card opening a popover with `color.note`
 * - Filter bar wired to family/mood/style/collection
 * - Search input (consider Fuse.js per docs/TECHNICAL_ARCHITECTURE.md)
 */
import { Color } from "@/types/color";

export function ColorGrid({ colors }: { colors: Color[] }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
      {colors.map((color) => (
        <div key={color.id} className="overflow-hidden rounded-lg border">
          <div className="h-20" style={{ backgroundColor: color.hex }} />
          <div className="p-2 text-xs">
            <p className="font-medium">{color.name}</p>
            <p className="text-neutral-500">{color.hex}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
