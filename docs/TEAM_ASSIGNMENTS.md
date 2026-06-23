# Team assignments

Kabir (tech lead) + Amna + Dhanshri + Qi. Each row below is a real,
already-committed stub file with a header comment and TODO list — open
the file, read the comment block, and start replacing the TODOs with
real code.

Work in feature branches off `main` (see `docs/GIT_WORKFLOW.md`), one
branch per page/feature, PR into `main`, Kabir reviews and squash-merges.

## Kabir — backend, deploy, and the landing page

This is intentionally the largest share: everything that touches
Supabase, Clerk config, or the Anthropic SDK runs through here, plus
deployment, plus the landing page — since the landing page is the first
impression of the whole product and the UX bar there has to be high.

- `app/api/ai/generate/route.ts` — the Anthropic SDK call
- `app/api/projects/route.ts`
- `app/api/projects/[id]/route.ts`
- `app/api/export/route.ts`
- `lib/db/schema.sql` (already drafted — review/extend as routes need it)
- `middleware.ts` (Clerk route protection — not yet stubbed, create when
  auth-gating dashboard/account/studio)
- `app/page.tsx` + `components/landing/HeroSection.tsx` + the 3
  horizontal-scroll sections from `docs/PRODUCT_AND_UX.md` §5 (create
  `components/landing/HorizontalScrollSection.tsx` when starting)
- Vercel/deployment config, env vars, CI
- Final UX pass on every page before merge — Kabir has the final say on
  anything that affects look/feel, even on someone else's PR
- Review every PR before merge

## Amna — auth, account, pricing, layout, dashboard

Self-contained, low-logic pages — mostly composing Clerk's prebuilt
components and Tailwind classes, plus dashboard views that become simple
fetch-and-render once Kabir's `/api/projects` routes exist. Good entry
point, nothing here requires deep familiarity with the rest of the
codebase.

- `app/(auth)/sign-in/page.tsx`, `app/(auth)/sign-up/page.tsx`
- `app/account/page.tsx`
- `app/pricing/page.tsx` (placeholder only — no billing in v1, see the
  comment at the top of the file)
- `components/layout/Navbar.tsx`, `components/layout/Footer.tsx`,
  `components/ui/Button.tsx`
- `app/dashboard/page.tsx`, `app/dashboard/[projectId]/page.tsx`

## Dhanshri — Browse (colors, fonts, themes)

Pattern-heavy: lots of grid/card/filter UI and structured data seeding —
plays well with AI-assisted scaffolding once the first grid is right,
the rest follows the same shape.

- `app/browse/colors/page.tsx` + `components/colors/ColorGrid.tsx`
- `app/browse/fonts/page.tsx` + `components/fonts/FontGrid.tsx`
- `app/browse/themes/page.tsx` + `components/themes/ThemeGrid.tsx`
- `app/browse/themes/[slug]/page.tsx`
- `data/fonts/seed.ts` (new file — mirror `data/colors/tailwind.ts`'s
  pattern; needed before FontGrid has anything real to render)
- `data/themes/seed.ts` (new file — compose from `allColors` + the font
  seed once it exists)

## Qi — Studio, Preview Lab, AI Generate UI

The core differentiator's UI half — the most interactive piece in the
app (drag-to-reorder swatches, tabbed mockup views, the AI prompt flow).
Worth leaning on AI tooling for the state-management boilerplate
(Zustand stores, the dnd-kit wiring) so the time goes into the
interaction itself. Read `docs/PRODUCT_AND_UX.md` §3 and §4 first.

- `app/studio/page.tsx` + `components/studio/StudioCanvas.tsx`
- `app/studio/compare/page.tsx` + `components/studio/PreviewLab.tsx`
- `store/studioStore.ts` + `store/previewLabStore.ts`
- `app/studio/ai/page.tsx` + `components/ai/PromptInput.tsx` (UI only —
  the fetch target `/api/ai/generate` is Kabir's file; build against the
  stub's current 501 response and swap in the real call once that
  branch merges)

## Notes

- Every file above already exists in the repo with real content (not an
  empty placeholder), so `git add -A && git commit` will actually track
  it.
- If a file imports something that doesn't exist yet (e.g. `data/fonts`),
  that's intentional — it's listed as a TODO in the same section and is
  whoever owns that section's first task.
- Kabir's section is the largest by design: backend integration,
  deployment, and the landing page all carry outsized risk/visibility
  relative to their line count, and the lead owns final UX sign-off
  across every page regardless of who wrote it.
- Update this doc when ownership shifts; it's meant to stay accurate, not
  be a one-time snapshot.
