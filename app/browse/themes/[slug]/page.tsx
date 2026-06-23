/**
 * /browse/themes/[slug] — Theme Detail
 *
 * Owner: Dhanshri
 *
 * Spec: docs/PRODUCT_AND_UX.md §2 — full mockup view: palette + fonts +
 * type scale shown together, plus a live card/button/heading/body preview.
 *
 * TODO (Dhanshri):
 * - Look up the theme by `params.slug` from @/data/themes
 * - Render colorRoles as labeled swatches
 * - Render primaryFont/secondaryFont with the type scale applied
 * - Render a small mockup (card, button, heading, paragraph) styled with
 *   this theme's actual values — this is the page that has to sell the
 *   theme, treat it as the most visually important page in /browse
 */
export default function ThemeDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold tracking-tight">Theme: {params.slug}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Look this slug up in @/data/themes once theme data exists.
      </p>
    </main>
  );
}
