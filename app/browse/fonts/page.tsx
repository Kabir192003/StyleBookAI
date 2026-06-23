/**
 * /browse/fonts — Font Library
 *
 * Spec: docs/PRODUCT_AND_UX.md §2 (Browse libraries)
 * Data: `allFonts` from @/data/fonts — NOT POPULATED YET. The font transform
 *       script (mirroring scripts/transformColors.ts) hasn't been written.
 *       Until then this page should render against a small hand-written
 *       array — see the seed pattern in data/colors/tailwind.ts for the
 *       style to copy.
 *
 * TODO:
 * - Write data/fonts/seed.ts with ~10 real Google Fonts (use the Font type)
 * - Render <FontGrid fonts={...} /> (stub in components/fonts/FontGrid.tsx)
 * - Live preview text input, filter by category/mood/use-case
 * - "i" info button per card revealing `font.note` (§6)
 */
export default function BrowseFontsPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold tracking-tight">Fonts</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Font data not seeded yet — see the TODO at the top of this file.
      </p>
    </main>
  );
}
