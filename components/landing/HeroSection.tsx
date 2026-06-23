/**
 * HeroSection — the first normal-scroll section of the landing page.
 * Spec: docs/PRODUCT_AND_UX.md §5, item 1.
 *
 * TODO:
 * - Headline + subhead + two CTAs ("Browse the library" → /browse/colors,
 *   "Try AI generation" → /studio/ai)
 * - Slow, looping gradient drift in the background (animate a CSS custom
 *   property, independent of scroll position) to establish "this is a
 *   color tool" immediately
 */
export function HeroSection() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-4 p-24 text-center">
      <h1 className="text-5xl font-bold tracking-tight">StyleBook AI</h1>
      <p className="max-w-md text-base text-neutral-500">
        Colors, fonts, and themes in one place. Browse the library or
        describe your brand and let AI build it for you.
      </p>
      <div className="flex gap-3">
        <a href="/browse/colors" className="rounded-md border px-4 py-2 text-sm">
          Browse the library
        </a>
        <a href="/studio/ai" className="rounded-md bg-black px-4 py-2 text-sm text-white">
          Try AI generation
        </a>
      </div>
    </section>
  );
}
