# Team assignments

Kabir + Amna + Dhanshri + Qi. Each section below maps to real stub files
already in the repo — open the file, read the comment block, and start
replacing the TODOs with real code.

Work in feature branches off `main` (see `docs/GIT_WORKFLOW.md`), one
branch per page/feature, PR into `main`.

## Kabir — backend, API routes, and the landing page

Covers everything that connects the frontend to external services —
Supabase, Clerk, and the Anthropic SDK — plus the public-facing landing
page.

- `app/api/ai/generate/route.ts` — the Anthropic SDK call
- `app/api/projects/route.ts`
- `app/api/projects/[id]/route.ts`
- `app/api/export/route.ts`
- `lib/db/schema.sql` (already drafted — review/extend as routes need it)
- `middleware.ts` (Clerk route protection — create when auth-gating
  dashboard/account/studio)
- `app/page.tsx` + `components/landing/HeroSection.tsx` + the 3
  horizontal-scroll sections from `docs/PRODUCT_AND_UX.md` §5 (create
  `components/landing/HorizontalScrollSection.tsx` when starting)
- Vercel/deployment config, env vars, CI

## Amna — auth, account, pricing, layout, dashboard

Covers user-facing auth flows, account management, and the dashboard
views. Great entry point — mostly composing Clerk's prebuilt components
and Tailwind classes.

- `app/(auth)/sign-in/page.tsx`, `app/(auth)/sign-up/page.tsx`
- `app/account/page.tsx`
- `app/pricing/page.tsx` (placeholder only — no billing in v1, see the
  comment at the top of the file)
- `components/layout/Navbar.tsx`, `components/layout/Footer.tsx`,
  `components/ui/Button.tsx`
- `app/dashboard/page.tsx`, `app/dashboard/[projectId]/page.tsx`

## Dhanshri — Browse (colors, fonts, themes)

Covers the browse experience — grid and card UI, filters, and the
structured data that powers it. Once the first grid is right, the others
follow the same shape.

- `app/browse/colors/page.tsx` + `components/colors/ColorGrid.tsx`
- `app/browse/fonts/page.tsx` + `components/fonts/FontGrid.tsx`
- `app/browse/themes/page.tsx` + `components/themes/ThemeGrid.tsx`
- `app/browse/themes/[slug]/page.tsx`
- `data/fonts/seed.ts` (new file — mirror `data/colors/tailwind.ts`'s
  pattern; needed before FontGrid has anything real to render)
- `data/themes/seed.ts` (new file — compose from `allColors` + the font
  seed once it exists)

## Qi — Studio, Preview Lab, AI Generate UI

Covers the core interactive experience — drag-to-reorder swatches, tabbed
mockup views, and the AI prompt flow. Read `docs/PRODUCT_AND_UX.md` §3
and §4 first.

- `app/studio/page.tsx` + `components/studio/StudioCanvas.tsx`
- `app/studio/compare/page.tsx` + `components/studio/PreviewLab.tsx`
- `store/studioStore.ts` + `store/previewLabStore.ts`
- `app/studio/ai/page.tsx` + `components/ai/PromptInput.tsx` (UI only —
  the fetch target `/api/ai/generate` is Kabir's route; build against the
  stub's current 501 response and swap in the real call once that route
  is live)

## Notes

- Every file above already exists in the repo with real content (not an
  empty placeholder), so `git add -A && git commit` will actually track it.
- If a file imports something that doesn't exist yet (e.g. `data/fonts`),
  that's intentional — it's listed as a TODO in the same section and is
  whoever owns that section's first task.
- Update this doc when ownership shifts; it's meant to stay accurate, not
  be a one-time snapshot.
