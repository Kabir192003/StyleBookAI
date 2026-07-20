# StyleBook — Session Context

This file is a full-history handoff document, written to let a new chat
session pick up exactly where this one left off. It covers the project
from the beginning of this working session through to the current repo
state.

## What StyleBook is

A web app for browsing colors, fonts, and complete design themes, plus an
AI tool that generates a palette + font pairing + type scale from a plain-
language brand description. Think "Coolors x Google Fonts x an AI design
assistant," unified into one library with a Studio for assembling
projects. See `docs/PRODUCT_AND_UX.md` and `docs/TECHNICAL_ARCHITECTURE.md`
for the full product/technical spec — this file is about *session
history*, not the product spec itself.

**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Clerk (auth),
Supabase (Postgres), Google Gemini (`@google/generative-ai` — note: some
docs/comments still say "Anthropic," that's stale; the actual SDK in
`package.json` is Gemini), Zustand, GSAP + Lenis (landing page motion),
Framer Motion (product UI micro-interactions), chroma-js/colord, fuse.js,
@dnd-kit, html-to-image + file-saver.

**Repo:** `Kabir192003/StyleBookAI` on GitHub. Working directory on this
machine: `/Users/kabirsharma/Downloads/stylebookai wf`.

**Team:** Kabir (the user in this session) + Amna + Dhanshri + Qi. Each
person has their own long-lived branch. The user is new to git — prior
explanations in this session were written at a beginner level and that
should continue.

**Everything ships free in v1** — no billing, no plan gating, Stripe not
installed in product logic (though `app/api/stripe/` route folders exist
as stubs). Don't add billing logic unless explicitly asked.

## Session narrative, in order

### 1. Landing page build (the bulk of the session)

Started from an existing-but-rough scroll-driven landing page
(`app/page.tsx`) and iterated through many rounds of design feedback to
reach a "premium editorial" system. Rounds, roughly in order:

1. Initial pass: fixed a real bug where the page rendered completely
   blank (`ScrollTrigger` wasn't registered before child components'
   effects called `ScrollTrigger.create()` — moved registration to module
   scope). Also fixed a hydration-mismatch warning storm from
   `Math.random()` being used during render in `ScrollChaos.tsx`.
2. Full craft/UX pass at the user's request ("world-class flagship
   experience"): added real typography wiring, motion helpers, a nav with
   scroll progress, hero polish, per-scene refinement (determinism fixes,
   icons, pacing), a real final CTA + footer. Verified visually at
   multiple breakpoints via the preview tool.
3. User asked for "next level" — added an intro curtain (first-visit-only
   overlay with curtain-lift reveal), a velocity-reactive swatch ticker
   marquee, 3D mouse-tilt on hero windows, a right-edge scene/chapter
   rail for navigation, and scene-reactive ambient-light tinting as you
   scroll through different story beats.
4. User felt the colour-wall section (dark panel of swatches) didn't sit
   well with the rest of the page, and wanted the palette recolored to a
   specific "luxe" register. Iterated the whole design-token layer to:
   **Silk / Pearl / Marble / Champagne / Velvet / Onyx / Oxblood.** Velvet
   (`#222D52`) became the heading/interaction colour; Oxblood (`#6E2A28`)
   became the accent-text colour on light backgrounds — gold/champagne
   text on light surfaces fails contrast, so gold was restricted to
   objects and to text on dark surfaces only. Real self-hosted fonts
   (Sora, Fraunces, Archivo, Inter, Unbounded, IBM Plex Mono) declared in
   `lib/landing/fonts.ts`.
5. User supplied real assets (Unsplash photos, two AI-generated video
   loops, AI-generated mockup renders) to integrate: a cinematic
   photo/video break section, a podium render behind the hero, a
   "manual curation" render as the Studio scene's centerpiece, and an
   export-flow render in the Export scene. Added liquid-glass button/nav
   styling (translucent, blurred, with a specular sheen-sweep on hover)
   and a round of micro-interaction polish (icon tilts, card lifts, glowing
   slider thumbs).
6. Logo design, iterated several times:
   - First attempt: an abstract "petals/leaves" motif rising from an open
     book — user felt it looked like generic leaves, not book pages.
   - Second attempt: thin curled-ribbon shapes — user rejected outright
     ("is that a joke or what?"); they read as fiddlehead ferns/balloons,
     not pages. This was a real design miss, acknowledged directly.
   - Third attempt (accepted): actual dog-eared page-card silhouettes
     (flat body + folded corner, like a "document" icon) fanned like a
     hand of cards, rooted behind the book's gilt fore-edge. This became
     `public/brand/stylebook-mark-simple.svg` / `-mono.svg`. The original
     detailed illustrated mark was preserved untouched throughout as
     `public/brand/stylebook-mark.svg`, plus `-glyph.svg` and
     `-lockup.svg` variants.
   - **Final step:** user supplied their own finished logo SVG (open book
     + rising coloured pages + a large serif "A" letterform + small
     decorative brush-accent shapes), which was saved as the new
     canonical `public/brand/stylebook-logo.svg` and wired into: the nav
     wordmark icon, the intro curtain's mark, and the Workspace scene's
     centerpiece (replacing a flat gold circle with a pearl card
     containing the logo, from which the six feature modules expand
     outward — same GSAP choreography, just a different visual inside).
7. **Real bug fixed:** user reported "scrolling issues, especially at the
   bottom sections." Root cause found: `.export__render`'s `<img>` had no
   reserved aspect-ratio and is lazy-loaded; when it finally loaded
   (often mid-scroll, right as the user reached that section), the
   resulting layout shift left GSAP ScrollTrigger's cached pin
   start/end coordinates stale for everything after it in the DOM
   (Export's own pin, and FinalCTA) — a classic "CLS breaks scroll-driven
   pins" bug. Fixed with two changes:
   - `app/styles/landing/export.css`: added `aspect-ratio: 2000 / 1333`
     to `.export__render` so the container never resizes when the JPEG
     arrives.
   - `app/page.tsx`: added a safety net that calls `ScrollTrigger.refresh()`
     once every image/video on the page has loaded (and once fonts
     settle), so any future CLS source self-corrects instead of silently
     breaking pin math.
   Verified by scrolling through export → the fanned export-format cards
   → final CTA → footer with no jump/misalignment.
8. Also produced a full **design-system reference PDF** on request
   (colour tokens, type scale, spacing/radius/shadow scales, motion
   tokens, component specs, voice/accessibility guidelines) using a
   Python/reportlab script — this was generated to a scratchpad path, not
   committed to the repo. If it's needed again, it would need to be
   regenerated or relocated into the repo (e.g. `docs/`).

### 2. Landing page file map (for quick orientation)

```
app/page.tsx                        → root client component, mounts Lenis,
                                       registers ScrollTrigger, renders all
                                       scenes in order, has the media-load
                                       ScrollTrigger.refresh() safety net
app/styles/landing/globals.css      → design tokens (colour, type, spacing,
                                       radius, shadow, motion) + shared
                                       utility classes (.scene-eyebrow,
                                       .serif-accent, .glass-panel,
                                       .magnetic-btn)
app/styles/landing/*.css            → one stylesheet per scene, same name
components/landing/*.tsx            → one component per scene:
  Hero, ScrollChaos, ScrollUnification, ScrollWorkspace, ScrollAI,
  EditorialBreak, ScrollInteractive, SwatchTicker, ScrollExplore,
  ScrollTypography, ScrollStudio, ScrollAccessibility, ScrollExport,
  FinalCTA, IntroCurtain, LandingNav, SceneRail, CustomCursor
lib/landing/fonts.ts                → next/font declarations, 6 type
                                       personalities (5 display + 1 mono)
lib/landing/motion.ts               → prefersReducedMotion() + seededRandom()
                                       — every scene must branch on the
                                       former; anything with "random"
                                       layout must use the latter (avoids
                                       hydration mismatches)
lib/landing/constants.js            → scene content data (copy, positions,
                                       palettes) kept out of components
hooks/useReducedMotion.ts           → React-hook variant of the same check
public/brand/stylebook-logo.svg     → CANONICAL logo — used everywhere now
public/brand/stylebook-mark*.svg    → earlier logo explorations, kept but
                                       superseded
public/landing/*                    → real photography, two video loops,
                                       AI-generated mockup renders
```

### 3. Non-negotiables established for this codebase

- Import `globals.css` once at the root; extend the palette there, don't
  redefine tokens locally.
- Any "random" layout must use `seededRandom()`, never bare `Math.random()`
  at render/module scope (causes React hydration mismatches).
- Any new ScrollTrigger-driven scene must ship a `prefersReducedMotion()`
  branch before it ships at all.
- `gsap.registerPlugin(ScrollTrigger)` happens once, at module scope, in
  `app/page.tsx` — never inside a component effect a child might run first.
- New CTAs use `.magnetic-btn--primary` or `.magnetic-btn--ghost` only.
- Images/videos that can shift layout after load need reserved
  aspect-ratio CSS, given the export-render bug above.

## 4. Git / GitHub workflow (user is new to git — keep explanations simple)

### What happened, in order

1. All landing-page work (80 files) was committed to the pre-existing
   branch `kabir/backend-deploy-landing` and pushed to `origin`.
2. Hit a push rejection because the remote branch had a commit the local
   repo didn't (a PR merge bringing in a `next.config.ts` → `.js` rename
   from `main`). Diagnosed it as a non-conflicting, identical-tree
   situation and resolved with `git rebase origin/kabir/backend-deploy-landing`
   (clean, no conflicts), then pushed successfully.
3. User opened a PR via the GitHub UI ("Compare & pull request" →
   "Create pull request") and **merged it into `main` themselves**
   (merge commit `f26fa07`). Confirmed via `git fetch` + `git log` that
   `main` now contains the full landing-page commit.
4. Explained several beginner git/GitHub concepts along the way:
   - **Collaborators** (Settings tab, who has push access — a permissions
     list) vs **Contributors** (the repo homepage graph, calculated from
     commit-author email matched to a GitHub account). Discovered that
     *every* commit in the repo's history — including ones with commit
     messages like "Qi: studio, preview lab..." and "Dhanshri: browse
     colors..." — was authored under Kabir's own git identity. So
     teammates haven't actually committed anything themselves yet; they
     just have repo access. Fix going forward: each teammate needs to run
     `git config --global user.name/user.email` with their own info
     before their commits will attribute correctly.
   - **Push vs. Pull Request vs. Merge** are three separate, sequential
     steps: push uploads commits to a branch; a PR is a separate object
     requesting a merge into another branch (created via the "Create pull
     request" button, which is the *correct* next step after a push, not
     a duplicate of it); merge is a third, later action that actually
     combines the branches.
   - The general day-to-day loop recommended: pull latest `main` → create/
     use your own branch → edit → `git add` → `git commit -m "..."` →
     `git push` → open a PR into `main` when ready → (someone) merges.

### GitHub Issues created (via `gh issue create`, using existing
`docs/TEAM_ASSIGNMENTS.md` as the source of truth for who owns what)

All four reference the person's **already-existing branch** and the same
workflow (pull `main` → work on own branch → commit/push → PR into `main`):

- **[#3](https://github.com/Kabir192003/StyleBookAI/issues/3)** — Amna:
  auth, account, pricing, layout, dashboard (branch
  `amna/auth-account-layout-dashboard`)
- **[#4](https://github.com/Kabir192003/StyleBookAI/issues/4)** —
  Dhanshri: Browse — colors, fonts, themes (branch
  `dhanshri/browse-colors-fonts-themes`)
- **[#5](https://github.com/Kabir192003/StyleBookAI/issues/5)** — Qi:
  Studio, Preview Lab, AI Generate UI (branch `qi/studio-preview-ai-ui`)
- **[#6](https://github.com/Kabir192003/StyleBookAI/issues/6)** — Kabir:
  backend API routes — wire up Gemini + Supabase (branch
  `kabir/backend-deploy-landing`) — notes landing page ✅ done; Supabase
  client (`lib/db/supabase.ts`) and all env keys already exist and work,
  but the actual routes are unfinished

### Verified current state of the backend (checked directly, not assumed)

"Linked" is true for *credentials and packages*, not yet true for
*working code*:

- ✅ `.env.local` has real values for `GEMINI_API_KEY`, Supabase URL/anon/
  service-role keys, Clerk keys
- ✅ `@google/generative-ai` and `@supabase/supabase-js` are installed
- ✅ `lib/db/supabase.ts` — a real client factory exists (`supabase` for
  browser/RLS-respecting use, `getSupabaseAdmin()` for server-only,
  RLS-bypassing use)
- ✅ `lib/db/schema.sql` — drafted (`users`, `projects` tables + RLS
  policies)
- ✅ `app/api/` folder structure exists for: `ai`, `colors`, `export`,
  `fonts`, `projects`, `stripe`, `themes` — but most are route stubs
- ⬜ `lib/ai/` — folder exists, **empty**, no Gemini client written yet
- ⬜ `app/api/ai/generate/route.ts` — stub, returns `501`
- ⬜ `app/api/projects/route.ts` — stub, returns `501`
- ⬜ `app/api/projects/[id]/route.ts` — stub, returns `501`
- ⬜ `app/api/export/route.ts` — stub, returns `501`
- ⬜ `middleware.ts` — doesn't exist yet (needed for Clerk route
  protection on dashboard/account/studio)

## 5. Session 2 — backend, real data, deployment, AI generation

A second working session, picking up right where session 1 left off
(issue #6, Kabir's backend). This section covers everything since.

### 5.1 Team + GitHub reality check

- Real GitHub usernames confirmed via collaborator list: Kabir =
  `Kabir192003`, Amna = `Amnaseth20`, Dhanshri = `dhan242`, Qi =
  `ruoqizhao1idm`. Issues #3–#6 were assigned to each via `gh issue edit
  --add-assignee`.
- **Amna and Qi both did real, independent work** — genuine PRs authored
  under their own GitHub accounts (not Kabir's), unlike the session-1
  finding that all *earlier* commits were mis-attributed. Qi's PR (#8,
  Studio/Preview Lab/AI Generate UI) was reviewed and merged. Amna's PR
  (#7, full auth/account/dashboard/pricing pages, real split-screen
  sign-in design) was reviewed, confirmed complete and matching her
  issue, but ultimately **closed without merging** — Kabir decided not to
  bring her page work into `main` for now.
- Dhanshri is **not technical** — her contribution was a finished visual
  design in **Lovable** (project "Design Browse Hub," workspace
  "dhanashri's Lovable," Kabir is a collaborator there), built in
  **TanStack Start**, not this repo's Next.js stack. Kabir explicitly
  directed: port her design into working code himself (that's executing
  her real creative work, not writing "her part" from scratch) — but did
  **not** fabricate Amna's part, since Amna produced nothing to port at
  the time that question came up.
- **Do not fake git authorship.** Kabir asked at one point whether ported
  work could be committed under Dhanshri's name to make her contribution
  "look real" — this was declined (fabricating commit authorship is a
  real integrity issue, not just a technical one) in favor of honest
  attribution: Kabir's name on the commit, credit to her design in the
  commit message/PR body instead.

### 5.2 Backend routes built (issue #6)

- `lib/ai/` — Gemini client (`gemini.ts`), zod schemas (`schema.ts`),
  prompt builder (`prompt.ts`), orchestration (`generate.ts`): builds a
  candidate pool of real colors/fonts/moodboard images, prompts Gemini,
  validates + retries once, maps ids back to real data so results are
  always renderable.
- `lib/db/getOrCreateUser.ts`, `lib/db/projectMapper.ts` — Clerk↔Supabase
  user resolution, Project↔row mapping.
- `lib/validation/project.ts` — full zod schema for save/update payloads.
- `lib/export/generators.ts` — CSS/SCSS/Tailwind/JSON generators.
- `app/api/ai/generate`, `app/api/projects`, `app/api/projects/[id]`,
  `app/api/export` — all wired, no more 501s.
- `middleware.ts` — Clerk protection on `/dashboard`, `/account`,
  `/studio`.

### 5.3 Real data populated (previously all seed/placeholder)

- **Colors:** `npm run transform:colors` regenerated the full real
  Tailwind palette (297 colors) + 574 pre-existing curated colors = **871
  total**. Found and fixed a real bug in `scripts/transformColors.ts`:
  it never wrote the required `note` field — added `generateNote()`.
- **Fonts:** `data/fonts/seed.ts` — 36 hand-curated real fonts with real
  pairing data — expanded via a new `scripts/transformFonts.ts`
  (mirrors `transformColors.ts`) that hits the real Google Fonts API →
  **1,950 more fonts**, merged in `data/fonts/index.ts` (seed wins on any
  duplicate). Had to paginate `FontGrid` (48 at a time) and cap weights
  requested per font, since a 2,000-font unpaginated grid would blow the
  browser's URL-length limit for the Google Fonts stylesheet link.
- **Themes:** `data/themes/seed.ts` — started at 12 (one per
  `ThemeCategory`), expanded to **30** (2-3 per category) later in the
  session, all built from verified real color/font ids (the `color()`/
  `font()` helpers throw at build time on any unknown id — this caught
  nothing, all 30 verified clean).
- **Moodboards:** `data/moodboards/` — started as 5 hand-picked photos
  reused from `public/landing/*.jpg`, expanded via a new
  `scripts/transformMoodboards.ts` hitting the **Unsplash API** across
  the 12 theme categories → **108 real photos**, hotlinked (not
  downloaded) with photographer + Unsplash credit on every card per
  Unsplash's API terms. Structured as `seed.ts` + `unsplash.ts` merged in
  `index.ts`, same pattern as colors/fonts.

### 5.4 Browse pages (issue #4, ported from Dhanshri's Lovable design)

`app/browse/{colors,fonts,themes}` + `themes/[slug]` + layout — pulled her
"Design Browse Hub" Lovable project's file list, read every component,
and rebuilt it in this repo's conventions: native form elements instead
of a full shadcn/Radix install (kept the dependency footprint small),
real data instead of Lovable's mock data. `components/browse/*`,
`components/colors/ColorCard.tsx`, `components/fonts/{FontCard,
GoogleFontsLoader}.tsx`, `components/themes/ThemeCard.tsx`.

### 5.5 Studio (issue #5, Qi's branch)

Merged directly — `qi/studio-preview-ai-ui` (PR #8) into `main`, then
into Kabir's branch. Real, working manual builder, Preview Lab, and
AI Generate UI shell (though the UI shell had a real bug — see 5.7).

### 5.6 Vercel deployment — a genuine multi-round debugging saga

Kabir set up a Vercel project himself (walked through account creation,
env var import via the "Import .env" button, and getting a
`GOOGLE_FONTS_API_KEY` from Google Cloud Console step by step — he is
not very git/deploy-savvy, needs concrete numbered steps for any external
service UI). Deploy failed multiple times in sequence, each fix
revealing the next problem:

1. **Missing data directories.** An earlier cherry-pick onto Dhanshri's
   branch brought the browse *pages* but not the `data/fonts`/
   `data/themes` directories they import — `Module not found`. Fixed by
   cherry-picking the missing commit.
2. **180 pre-existing TypeScript errors** across 16 landing components
   (untyped refs, missing null-checks on `querySelector` results,
   implicit `any` params) — these were always there but never actually
   type-checked to completion (the build always failed earlier on lint
   first, masking them). Fixed properly (real types + null guards), not
   suppressed.
3. **Missing `<ClerkProvider>`** — `app/layout.tsx` had a TODO comment
   saying to add it, but nobody had. The sign-in/sign-up/account stub
   pages use Clerk's components and failed to prerender without it.
4. **AI Generate timing out in production.** Two compounding causes: (a)
   Vercel's default 10s serverless timeout was too tight for a real
   Gemini round-trip — added `export const maxDuration = 60` and shrank
   candidate caps (colors 120→60, fonts 80→40). (b) `gemini-1.5-flash`
   is fully retired by Google; `gemini-flash-latest` was *also*
   overloaded that day (measured directly: one request hung 30s with no
   response, others got `503` after 17s/3s). Switched to
   `gemini-flash-lite-latest`, which responded in ~2s in testing.
5. **AI Generate results never displayed.** `PromptInput.tsx` fetched the
   real AI response but only ever showed the string "AI generation
   request sent" — the actual project was discarded. Rewrote it to
   render the reasoning panel, real color cards, fonts, moodboard,
   spacing/shadows/radius, and a working "Send to Studio" button that
   writes into `studioStore` — verified end to end (colors landed in
   Studio with their AI-assigned roles intact).

**PR sequence that resulted** (worth knowing since it's non-linear):
Kabir merged PR #9 (Dhanshri's branch) *before* several of these fixes
existed, so `main` briefly had a broken snapshot. Fixed by opening PR
#10 from Kabir's branch (which had everything) straight into `main` —
that superseded #9. PRs #11, #12, #13 (design tokens, expanded
moodboards, 30 themes — see below) followed the same
branch→PR→merge-into-main pattern, all merged.

### 5.7 AI Generate: spacing, shadows, corner radius, moodboards

Extended the generated design system beyond colors/fonts/type scale:
`types/designTokens.ts` (`SpacingScale`, `ShadowScale`,
`CornerRadiusScale`, `MoodboardImage`), `lib/designTokens/{spacing,
shadows,radius}.ts` (spacing: AI picks a 4/8px base, fixed step
multipliers; shadows: fixed none/subtle/dramatic tiers, AI recommends
one; radius: fixed 4/8/12/20 options, AI recommends one). Moodboard
images: AI picks 2-3 matching a brand's mood from the curated library
rather than generating new images — **deliberately not using paid image
generation** (Gemini's `gemini-2.5-flash-image`/"nano-banana" would work
through the same API key but costs real money per image; Kabir chose the
free curated-library approach after being told the cost tradeoff
explicitly). All new `Project` fields are optional so nothing existing
breaks. `ThemeCard`/`ThemePreviewLarge` had a real duplicate-React-key
bug fixed along the way (two color roles can share a hex; must key by
index, not by the hex value).

### 5.8 Environment variables — now all real and populated

`.env.local` has real values for: `GEMINI_API_KEY`, Clerk keys, Supabase
keys, `GOOGLE_FONTS_API_KEY`, and (new this session)
`UNSPLASH_ACCESS_KEY`. Kabir tends to paste raw key values directly into
chat rather than editing the file himself — gently reminded each time
that this puts secrets in the transcript, but the practical move is
usually just to add it to the file for him and move on, not refuse. He
also once opened `.env.local` in **Microsoft Word** by accident (Finder's
"Open With" defaulted there) — flagged the corruption risk and had him
reopen in TextEdit/`open -e` before editing again.

## 6. Repo state right now

- **`main` is fully up to date** — every PR this session (#8, #10, #11,
  #12, #13) is merged. #7 (Amna) was closed, not merged. #9 (Dhanshri,
  stale) was superseded by #10 and its content is fully included there.
- Local git working directory matches `origin/main`'s content (via
  `kabir/backend-deploy-landing`, which has been kept in sync with `main`
  throughout via repeated merge/PR cycles).
- **Two local-only, never-committed dev conveniences** exist as a
  pattern, not a current diff: a "TEMP local-only test bypass" comment
  toggles in `middleware.ts` (removes `/studio` from protected routes)
  and `app/api/ai/generate/route.ts` (skips the `auth()` check) were used
  repeatedly to test AI Generate without signing in, then always reverted
  before committing. If a future session finds these uncommented, that's
  a leftover from an interrupted session — revert before shipping.
- Vercel is connected and deploying `main` automatically. Production URL
  changes per-deployment (Vercel assigns a new one each time) — ask
  Kabir for the current one rather than assuming.
- Issues #3–#6 are still open on GitHub (never explicitly closed even
  though the underlying work landed via PRs, except #4/#5's content is
  in `main` via #8/#10).

## 7. Natural next steps (pick up here)

- **Sign-in still uses Clerk's default hosted portal**
  (`*.accounts.dev/sign-in`), not Amna's custom-styled `/sign-in` page —
  `middleware.ts`'s `auth().protect()` has no `signInUrl` override.
  Functionally fine, just not on-brand. Low priority, easy fix if wanted.
- Amna's real, complete auth/account/dashboard work still lives on her
  branch/PR #7 (closed, not merged) — revisit if StyleBook ever wants
  those pages live.
- Font/color/theme/moodboard libraries can all be refreshed by rerunning
  their transform scripts (`npm run transform:colors`, `transform:fonts`,
  `transform:moodboards`) — safe to rerun any time, fully regenerates the
  auto-generated files without touching the hand-curated seed files.
- If the design-system PDF from session 1 is wanted again, it still
  hasn't been regenerated or committed anywhere.
