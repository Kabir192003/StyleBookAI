/**
 * FontGrid — renders a filterable grid of Font cards, each in its own
 * typeface. Used by: app/browse/fonts/page.tsx, and the Preview Lab.
 *
 * Owner: Dhanshri
 *
 * TODO (Dhanshri):
 * - Load the Google Font per card (next/font/google or a <link> tag using
 *   font.googleFontsId)
 * - Adjustable live preview text, shared across all visible cards
 * - "i" info button per card opening a popover with `font.note`
 */
import { Font } from "@/types/font";

export function FontGrid({ fonts }: { fonts: Font[] }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {fonts.map((font) => (
        <div key={font.id} className="rounded-lg border p-4">
          <p className="text-2xl">{font.family}</p>
          <p className="mt-1 text-xs text-neutral-500">{font.category}</p>
        </div>
      ))}
    </div>
  );
}
