/**
 * /browse/themes — Theme Gallery
 *
 * Owner: Dhanshri
 *
 * Spec: docs/PRODUCT_AND_UX.md §2 (Browse libraries)
 * Data: `allThemes` from @/data/themes — NOT POPULATED YET. Themes are
 *       hand-curated (not transform-scripted) — compose them from
 *       `allColors` and font data per docs/TECHNICAL_ARCHITECTURE.md §4.
 *
 * TODO (Dhanshri):
 * - Write data/themes/seed.ts with 3-5 real Theme objects to start
 * - Render <ThemeGrid themes={...} /> (stub in components/themes/ThemeGrid.tsx)
 * - Filter by category (minimal/bold/luxury/playful/earthy/tech/elegant/
 *   retro/neon/coastal/editorial/brutalist)
 * - Each card links to /browse/themes/[slug]
 */
export default function BrowseThemesPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold tracking-tight">Themes</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Theme data not seeded yet — see the TODO at the top of this file.
      </p>
    </main>
  );
}
