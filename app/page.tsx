/**
 * / — root landing page
 *
 * Marketing surface — build this last. The real hero lives in
 * components/landing/HeroSection.tsx; this file composes the scroll
 * sections from docs/PRODUCT_AND_UX.md §5.
 *
 * TODO:
 * - Import <HeroSection /> + 3 horizontal-scroll sections (create
 *   components/landing/HorizontalScrollSection.tsx when starting)
 * - Remove the placeholder markup below once sections are in place
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-24 text-center">
      <h1 className="text-5xl font-bold tracking-tight">StyleBook AI</h1>
      <p className="max-w-md text-base text-neutral-500">
        Colours, fonts, and themes in one place. Browse the library or
        describe your brand and let AI build it for you.
      </p>
      <p className="text-xs uppercase tracking-widest text-neutral-400">
        Phase 1 scaffold — landing page hero comes next
      </p>
    </main>
  );
}
