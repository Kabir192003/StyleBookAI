# StyleBook — Session Context

This file is a full-history handoff document, written to let a new chat
session pick up exactly where this one left off. It covers the project
from the beginning through to the current repo state (PR #26 merged).

## What StyleBook is

A web app for browsing colors, fonts, and complete design themes, plus an
AI tool that generates a palette + font pairing + type scale (and,
optionally, a full component design system) from a plain-language brand
description. Think "Coolors x Google Fonts x an AI design assistant,"
unified into one library with a Studio for assembling projects. See
`docs/PRODUCT_AND_UX.md` and `docs/TECHNICAL_ARCHITECTURE.md` for the full
product/technical spec — this file is about *session history*, not the
product spec itself.

**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Clerk (auth),
Supabase (Postgres), **Google Gemini** (`@google/generative-ai`) for AI
generation, Zustand (incl. `zustand/middleware` `persist` for the AI
result store), GSAP + Lenis (landing page motion), Framer Motion (product
UI micro-interactions), chroma-js/colord, fuse.js, @dnd-kit, html-to-image
+ file-saver (declared but not actually wired up to any PDF/image export
yet — see Session 3.3).

A Gemini → Anthropic Claude swap was explored mid-session-3 (cost
analysis, then a full implementation) and then **fully reverted** back to
Gemini at the user's request — see Session 3.2. If any doc/comment still
says "Anthropic" anywhere, that's stale; the actual provider in
`package.json` and `lib/ai/gemini.ts` is Gemini.

**Repo:** `Kabir192003/StyleBookAI` on GitHub. Working directory on this
machine: `/Users/kabirsharma/Downloads/stylebookai wf`.

**Team:** Kabir (the user) + Amna + Dhanshri + Qi. Each person has their
own long-lived branch. The user is new to git — explanations should stay
at a beginner level.

**Everything ships free in v1** — no billing, no plan gating, Stripe not
installed in product logic (though `app/api/stripe/` route folders exist
as stubs). Don't add billing logic unless explicitly asked.

## Session 1 — original landing page (superseded)

The very first working session built a scroll-driven landing page from
scratch (intro curtain, velocity-reactive marquee, 3D hero tilt, a
scene-rail nav, several rounds of logo design, a real CLS/ScrollTrigger
bug fix). **All of this was fully replaced in Session 3.1** by a port of
`Landing.dc.html` from claude.ai/design — the original scene components
(`Hero`, `ScrollChaos`, `ScrollWorkspace`, etc.), their CSS files, and
`lib/landing/useGsapScroll.ts` were all deleted. The only session-1
artifacts still in the repo are the brand assets in `public/brand/` (the
canonical logo work) and `public/landing/*` media, some of which the new
landing page still uses. If you need the old implementation's details for
historical reasons, they're in git history (see commits before `76f95f3`)
— not reproduced here since none of it describes current code.

## Session 2 — backend, real data, deployment, AI generation

### 2.1 Team + GitHub reality check

- Real GitHub usernames: Kabir = `Kabir192003`, Amna = `Amnaseth20`,
  Dhanshri = `dhan242`, Qi = `ruoqizhao1idm`.
- Amna and Qi did real, independently-authored work. Qi's PR (#8,
  Studio/Preview Lab/AI Generate UI) was merged. Amna's PR (#7, full
  auth/account/dashboard/pricing) was reviewed and complete but **closed
  without merging** — Kabir decided not to bring it into `main`.
- Dhanshri is not technical — her contribution was a finished visual
  design in Lovable ("Design Browse Hub," TanStack Start, not this repo's
  stack). Kabir had it ported into working Next.js code directly.
- **Established integrity rule:** never fake git authorship. Kabir once
  asked whether ported work could be committed under Dhanshri's name to
  make her contribution "look real" — declined. Honest attribution only:
  committer's real name, credit to the original designer in the commit
  message/PR body instead.

### 2.2 Backend routes built (issue #6)

`lib/ai/` (Gemini client, zod schemas, prompt builder, orchestration),
`lib/db/getOrCreateUser.ts` + `projectMapper.ts`, `lib/validation/project.ts`,
`lib/export/generators.ts` (CSS/SCSS/Tailwind/JSON), all four `app/api/*`
routes wired up, `middleware.ts` added for Clerk route protection.

### 2.3 Real data populated

- **Colors:** 297 real Tailwind colors + 574 curated = **871 total**
  (`npm run transform:colors`).
- **Fonts:** 36 hand-curated seed fonts + 1,950 from the real Google
  Fonts API = **~1,986 total** (`npm run transform:fonts`,
  `data/fonts/index.ts` dedupes by family, seed wins).
- **Themes:** grew from 12 to 30 curated themes (`data/themes/seed.ts`).
- **Moodboards:** grew from 5 to 108+ real Unsplash photos, hotlinked
  with photographer + Unsplash credit per their API terms
  (`scripts/transformMoodboards.ts`).

### 2.4 Browse pages, Studio, Vercel deploy saga

Browse pages ported from Dhanshri's Lovable design. Studio/Preview
Lab/AI Generate UI shell merged from Qi's branch. Vercel deployment took
several rounds to get green: missing data directories from a bad
cherry-pick, 180 pre-existing TypeScript errors across 16 landing
components (fixed properly, not suppressed), a missing `<ClerkProvider>`,
AI Generate timing out in production (raised `maxDuration`, shrank
candidate caps, switched off a retired/overloaded Gemini model to
`gemini-flash-lite-latest`), and AI Generate results being fetched but
never actually rendered (fixed to show the real reasoning/colors/fonts/
moodboard and a working "Send to Studio").

### 2.5 AI Generate: spacing, shadows, corner radius, moodboards

Extended the generated design system beyond colors/fonts/type-scale:
`types/designTokens.ts` (`SpacingScale`, `ShadowScale`,
`CornerRadiusScale`, `MoodboardImage`), `lib/designTokens/{spacing,
shadows,radius}.ts`. Moodboard images are picked from the curated library
by the AI, not generated — **deliberately avoiding paid image generation**
(Gemini's image models cost real money per image; the free curated-library
approach was chosen explicitly after discussing the cost tradeoff).

## Session 3 — design import, AI provider exploration, complex prompts, Studio/AI parity

This is the longest and most recent stretch — PRs #14 through #26.

### 3.1 Design import from claude.ai/design (PRs #14–#22)

A claude.ai/design project (id `e8b56667-29ed-4994-bde7-c72528baec60`)
supplied `.dc.html` reference files, imported one at a time via the
`claude_design` MCP tool and implemented faithfully in this repo's real
React/Tailwind/data, in this order:

| File | What it became | PR |
|---|---|---|
| `Colours.dc.html` | `/browse/colors` "colour wall" | #15 |
| `Fonts.dc.html` | `/browse/fonts` "specimen room" | #16 |
| `Themes.dc.html` | `/browse/themes` "newsstand" | #17 |
| — | Shared `SiteHeader`, mounted globally | #14, #18 |
| `ThemeDetail.dc.html` | `/browse/themes/[slug]` full-page takeover | #19 |
| `Studio.dc.html` | `/studio` rebuilt as a live token editor (from scratch) | #20 |
| `AiGenerator.dc.html` | `/studio/ai` restyled as a **dark cosmic** generator, deliberately distinct from the rest of the site's cream/ink chrome | #21 |
| `Landing.dc.html` | Entire `/` landing page replaced (see Session 1 note above) | #22 |

The AI Generator's dark-cosmic look (#21) is exactly what Session 3.5
below undoes — it never actually matched the rest of the site, and once
the AI results page grew a design-system panel, that panel inherited the
same dark styling and looked broken when reused inside Studio's light
theme.

### 3.2 Gemini → Anthropic Claude: explored, implemented, fully reverted

User asked whether their $60 Anthropic credit balance could fund swapping
providers. After a cost analysis (confirmed feasible, ~$0.02/call), user
approved the swap and it was **fully implemented**: `lib/ai/anthropic.ts`
client, `callClaude()` using structured outputs (`zodOutputFormat` +
`client.messages.parse()`, model `claude-opus-4-8`), schema/prompt/route
comment updates, live-tested successfully against the real Anthropic API.

Then, in the same session, the user discovered their Anthropic credit
didn't actually apply the way they'd hoped (a separate "Cloud Prepay"
wallet issue, unrelated to StyleBook) and asked to **revert**. Since none
of the swap had been pushed, `git checkout` cleanly restored every
touched file to its pre-swap Gemini state, `.env.local` was restored, and
`npx tsc --noEmit` confirmed a clean revert. **Current provider is
Gemini** (`gemini-flash-lite-latest` by default, overridable via
`GEMINI_MODEL`). No Anthropic code remains in the repo.

### 3.3 Root-caused why AI Generate "gave bad results" (PR #23)

User reported the AI ignoring specific colors mentioned in prompts.
Root cause, found by reading `lib/ai/generate.ts`'s
`selectCandidateColors()`: the frontend only ever sends the free-text
`prompt` (never the unused `style`/`colorPreferences` fields), so
candidate selection always fell through to `allColors.slice(0, 60)` —
and since `allColors` is grouped by family (slate→gray→zinc→neutral→
stone→red...), **every single request got the identical ~60
candidates — mostly neutrals/reds — regardless of what was typed.** Fixed
by tokenizing the prompt and matching colors against family/mood/style/
name (plus a synonym map for words like "navy"/"coral"/"mint" that don't
literally match the vocabulary), then filling remaining candidate slots
with a diverse round-robin across families instead of a raw slice.
Verified with a standalone before/after comparison script.

### 3.4 Complex-prompt handling: exact counts, custom hex, full design systems (PR #24)

Three more reported problems, fixed together:

1. **Long/detailed prompts failed with "invalid request"** — the zod
   `prompt` field was capped at 500 chars; raised to 4000.
2. **Exact requested counts weren't honored** ("5-6 hex codes", "3
   fonts") — `colors` was hard-bound to 5-7 items; widened to 2-12, with
   an explicit prompt instruction to match a stated count.
3. **Exact hex codes weren't honored** — the AI could previously only
   pick a `colorId` from the candidate catalog, never invent a color.
   Now each color entry can be `{colorId}` (preferred, keeps real
   editorial metadata) **or** `{hex, name?}` — when the model returns a
   literal hex, `lib/colors/deriveColorMetadata.ts`'s
   `synthesizeColorFromHex()` builds a full `Color` object around it
   (family/mood/style derived from HSL), so every downstream consumer
   still sees a real `Color` shape without expanding the static 871-item
   catalog file itself.

Also built, opt-in via a checkbox in `/studio/ai` ("Generate a full
design system"): `types/designSystem.ts` — component tokens (button/
input/dropdown/card/nav/table/modal/alert/badge) × interaction states ×
light+dark theme variants, WCAG accessibility notes, icon style, grid,
breakpoints. Threaded through the AI contract, persistence (`Project`
gained an optional `designSystem` field, mirrored through
`lib/validation/project.ts` → `lib/db/projectMapper.ts` →
`app/api/projects/[id]/route.ts`'s update whitelist — that's the
established pattern any new optional `Project` field must follow), and
export (`lib/export/generators.ts` now also emits spacing/shadows/
design-system tokens, previously missing entirely).

### 3.5 Font repetition, preview bugs, Studio/AI parity (PR #25)

A large batch fixing five real bugs and building three real features,
all confirmed via a three-way parallel codebase exploration before
touching anything:

**Bugs fixed:**
- **Fonts kept repeating** despite specific requests — same shape of bug
  as 3.3's color issue: `selectCandidateFonts()` unconditionally
  included all 36 `data/fonts/seed.ts` fonts before any prompt matching,
  leaving only 4 of the 40-candidate cap for the ~1,950-font Google
  catalog, and matching never checked `font.family` at all (only mood/
  style/category, which for Google Fonts are auto-generated and near-
  identical within a category). Fixed by unifying the pool and adding
  family-name matching — same fix shape as colors.
- **Preview colors sometimes didn't match** the AI's chosen palette —
  `findColor()` in `PromptInput.tsx` searched for role strings that
  didn't match what the prompt actually asked Gemini to use. Both now
  share one closed vocabulary: `primary, secondary, background, surface,
  text, muted`.
- **Every design-system component rendered as an identical generic
  tile** ("card looks like a button") — `DesignSystemGallery.tsx` now
  gives each `ComponentName` its own shape (pill, labeled box,
  header+body card, mini table, modal, nav bar).
- **Spacing showed only 4 of 8 steps, unlabeled** — now all 8, with
  index + px labels (`components/design-system/SpacingVisualization.tsx`,
  shared between the AI page and Studio).
- **Studio's dark-mode toggle did nothing visually** — `state.mode` was
  set and displayed but never read by anything that affects rendering.
  Studio's `StudioState` now holds two independent `PaletteTokens` sets
  (`light`/`dark`), and the live-preview CSS vars read from whichever is
  active — a real functional toggle now.

**Built:**
- **Context-aware mock preview** — the AI classifies the brief as
  `saas | ecommerce | government | editorial | generic`
  (`AIContext` in `types/project.ts`), and `components/ai/
  LivePreviewMock.tsx` renders a different layout/copy per context (a
  product grid for e-commerce, a formal document layout for government,
  etc.) while still deriving every color/font from the same resolved
  tokens.
- **AI ⇄ Studio round-trip** — `store/aiResultStore.ts`, a
  `sessionStorage`-persisted Zustand store holding the last `{prompt,
  includeDesignSystem, result}`. `PromptInput.tsx` saves to it on every
  successful generate and restores from it on mount (in a `useEffect`,
  not the `useState` initializer — reading a browser-storage-backed
  store during the initializer renders ahead of the server and triggers
  a real React hydration-mismatch warning, caught during this session's
  own verification). `StudioBuilder.tsx` hydrates its richer optional
  fields (`spacing`/`shadows`/`designSystem`/`moodboard`/`aiReasoning`)
  from the same store, and shows a "← Back to AI result" button whenever
  it has data — guarded so it doesn't leak a stale AI result's tokens
  into an unrelated deep link (e.g. a saved theme's "Apply this
  edition"), via an explicit `?from=ai` marker.
- **Studio export formats** — `lib/studio/exportCode.ts` gained Flutter
  (`AppColors`/`ThemeData`), React (a `theme.ts` tokens object), and
  Style Guide (Markdown) alongside the existing CSS/Tailwind/JSON/
  SwiftUI/Figma, and every format now covers light+dark palettes,
  spacing, shadows, and full design-system component tokens (previously
  only the flat 5-color+font+radius set).

**Real lesson learned:** `npx tsc --noEmit` does **not** run ESLint.
This PR shipped with an unescaped `"` quote in JSX
(`react/no-unescaped-entities`), which `tsc` never flags but `next
build`'s lint pass treats as a hard error — it broke the actual Vercel
deploy. Fixed immediately in PR #26. **Going forward, `npm run build`
(not just `tsc`) is required before calling any frontend change verified.**

### 3.6 Currently in flight (approved, not yet implemented)

User flagged, via a screenshot, that the design-system gallery panel
looks broken inside Studio — because it inherited `AiGenerator.dc.html`'s
(#21) dark-cosmic styling wholesale, and that styling was never adapted
for Studio's light cream page. When asked to just theme-fix the gallery,
the user pushed back further: **the AI results page itself shouldn't be
dark-cosmic at all — it should match the rest of the site**, and the
design-system panel should be **fully editable when viewed in Studio**
(every other token there already is).

A plan for this is written and approved at
`/Users/kabirsharma/.claude/plans/optimized-growing-mist.md` (session-
scoped path, may not survive between machines/sessions — re-derive from
this section if it's gone):

1. Reskin `components/ai/PromptInput.tsx`'s chrome (not the generated
   `LivePreviewMock`, which intentionally uses the *generated brand's*
   own colors) from the dark-cosmic palette to the site's one light
   vocabulary — the same constants `SiteHeader.tsx`/`StudioBuilder.tsx`
   already use (`bg-[#EDE6DA]` page background, `#211E18` ink,
   `#6E675C`/`#8A8477` muted, `#222D52` accent, `bg-[#F2EBE0]` cards).
2. `DesignSystemGallery.tsx` drops its dark styling entirely (both call
   sites are light now) and gains `editable?: boolean` +
   `onChange?: (next: DesignSystem) => void` — color inputs for theme
   roles and each component's background/text/border, a collapsible
   per-component states editor, and simple inputs for grid/breakpoints/
   icon style/accessibility notes.
3. `SpacingVisualization.tsx` gains an editable base (4px/8px) toggle,
   regenerating steps via the already-pure `generateSpacingScale()`.
4. `StudioBuilder.tsx` wires `editable` + `onChange` into both of the
   above, plus a recommended-shadow-level 3-button row.

Explicit scope trims already agreed: shadows are only editable as "which
preset is recommended," not custom box-shadow values; spacing is only
editable as base, not per-step; Studio's classic 5-token palette and the
design-system's theme roles stay two independent systems, not unified;
the gallery stays read-only on `/studio/ai` (editable only in Studio).

**Next action for whoever picks this up:** implement the plan above,
verify with `npx tsc --noEmit` **and** `npm run build` (see the 3.5
lesson), browser-test both `/studio/ai` (chrome now matches
`/browse/colors`/`/studio`) and Studio (gallery legible + actually
editable, edits reflected in the export drawer), then push/PR/merge only
once explicitly asked.

## Repo state right now

- **`main` is fully up to date** through PR #26. Working branch
  `kabir/backend-deploy-landing` is in sync with `main`.
- Every PR this session followed the same pattern: implement → verify
  (`tsc`, and now also `npm run build`) → browser-test → commit → wait
  for explicit "push it" / "push and merge" before touching GitHub.
- **No secrets are ever pasted into chat or files by the assistant** —
  when a key was needed (Anthropic, during the since-reverted swap), the
  user was directed to add it to `.env.local` themselves.
- **Two local-only, never-committed dev conveniences** exist as a
  recurring pattern, not a current diff: temporarily removing
  `/studio(.*)` from `middleware.ts`'s protected routes to browser-test
  without signing in, always reverted (`git checkout -- middleware.ts`,
  confirmed via `git diff`) before any commit. If a future session finds
  this uncommented, that's a leftover from an interrupted session —
  revert before shipping.
- Vercel is connected and deploys `main` automatically. Production URL
  changes per-deployment — ask Kabir for the current one.
- User has explicitly deferred expanding the static color catalog (871
  swatches) — the AI can already produce any hex on demand via 3.4's
  hex-synthesis path, which was accepted as sufficient for now; a
  separate hand-curated catalog expansion is a distinct future task, not
  started.

## Natural next steps (pick up here)

1. **Implement the plan in Session 3.6** — this is the immediate next
   task, already approved, not yet coded.
2. Sign-in still uses Clerk's default hosted portal, not a custom-styled
   page — low priority, easy fix if wanted.
3. Amna's real, complete auth/account/dashboard work still lives on her
   branch/PR #7 (closed, not merged) — revisit if StyleBook ever wants
   those pages live.
4. Font/color/theme/moodboard libraries can be refreshed any time via
   `npm run transform:colors` / `transform:fonts` / `transform:moodboards`
   — safe to rerun, regenerates only the auto-generated files.
5. If a hand-curated color-catalog expansion is wanted later, that's a
   separate task from the AI's hex-synthesis capability (3.4) — see the
   "Repo state" note above.
6. `html-to-image`/`file-saver` are installed but nothing actually
   generates a PDF/PNG export yet — the Style Guide export (3.5) is
   Markdown, not an image/PDF, as an explicit scope trim.
