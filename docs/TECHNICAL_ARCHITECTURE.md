# StyleBook AI — Technical Architecture

Status: all features ship free in v1. No billing, no plan gating. This doc
describes the system as it should be built right now, with billing noted
separately as a deferred phase.

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14, App Router | Server components for data-heavy browse pages, API routes for AI/export, one deploy target (Vercel). |
| Language | TypeScript, strict mode | Color/Font/Theme/Project shapes are the backbone of the whole app — types catch shape drift early. |
| Styling | Tailwind CSS | Fast iteration, and the app's own color data is partly seeded from Tailwind's palette, so the design system and the product data share a vocabulary. |
| Auth | Custom username/password (`bcryptjs` + `jose`) | Clerk was tried and removed; a simple self-hosted password + JWT-cookie session needs no external auth provider or webhook setup. |
| Database | Supabase (Postgres) | Generous free tier, built-in row-level security, good enough for relational + JSONB project data. |
| AI | Anthropic SDK (Claude) | Generates palette + font pairing + type scale + reasoning from a text prompt. |
| State | Zustand | Studio/Preview Lab need shared client state (selected colors, fonts, roles) without prop-drilling; lighter than Redux. |
| Animation | Framer Motion | Used for micro-interactions everywhere and specifically for the scroll-driven landing page (`useScroll` + `useTransform`). |
| Color math | chroma-js, colord | Contrast ratios, HSL conversions, palette manipulation. |
| Search | Fuse.js | Fuzzy search across colors/fonts/themes by name/tag. |
| Drag & drop | @dnd-kit | Reordering colors in the Preview Lab and Studio. |
| Export | html-to-image, file-saver | Turn a project preview into a downloadable PNG/PDF. |
| Icons | lucide-react | Consistent icon set. |
| Validation | zod | Validate AI request/response shapes and API route inputs. |

**Deferred:** Stripe. Not installed, not wired up. Revisit once there's
usage data indicating which features are worth paywalling.

## 2. Data model (`types/`)

All five core types already exist and should be imported, not redefined:

- **`Color`** — `id, name, hex, rgb, hsl, family, mood[], style[], collection, isPro`
- **`Font`** — `id, family, category, variants[], mood[], style[], era, useCase[], googleFontsId, isPro, pairsWith[]`
- **`Theme`** — bundles a `colors[]` array + `colorRoles` (primary/secondary/accent/background/surface/text/textMuted) + `primaryFont`/`secondaryFont`/`accentFont` + a `TypeScale`
- **`Project`** — a user's saved work: colors with assigned roles, fonts, type scale, optional theme reference, `aiGenerated` flag, `aiPrompt`, `aiReasoning`
- **`User`** — `username`/`password_hash` record with `plan` field (kept for the future, unused for now)

`isPro` stays on `Color`/`Font`/`Theme` as a data attribute — some library
items are simply tagged as premium-quality for later — but nothing in the
app logic should branch on it yet.

## 3. Folder structure

```
app/
  page.tsx                      → scroll-driven landing page
  browse/colors/                → color library
  browse/fonts/                 → font library
  browse/themes/                → theme gallery
  browse/themes/[slug]/         → theme detail
  studio/                       → manual project builder
  studio/compare/               → Preview Lab (colors + fonts side by side)
  studio/ai/                    → AI generation flow
  studio/type-scale/            → type scale adjuster
  dashboard/                    → saved projects list
  dashboard/[projectId]/        → edit a saved project
  sign-in/, sign-up/            → auth pages
  account/                      → real profile/favorites/projects/preferences
  api/
    colors/, fonts/, themes/[slug]/   → data fetch routes (or skip these
                                         and import from data/ directly in
                                         server components — see §5)
    auth/                        → signup/login/logout/me
    ai/generate/                → Claude call
    projects/, projects/[id]/   → CRUD, Supabase-backed, gated behind auth
    favorites/                   → favorite/unfavorite colors, fonts, themes
    export/                     → bundle generation

components/
  ui/        → buttons, inputs, primitives (shadcn-style, hand-rolled)
  layout/    → SiteHeader (with hamburger nav), footer, shells
  colors/    → ColorGrid, ColorPlate, ColorDetail, ColorFilterBar
  fonts/     → FontGrid, FontPreview
  browse/    → FavoriteButton, shared browse primitives
  themes/    → ThemeGrid, ThemeCard, ThemeDetail
  studio/    → StudioBuilder, PreviewLab, ExportDrawer, LivePreviewSection
  ai/        → PromptInput, GenerationResult, ReasoningPanel
  design-system/ → DesignSystemGallery, SpacingVisualization
  export/    → ExportPanel, formatters per output type
  landing/   → HeroSection, HorizontalScrollSection, ScrollProgressDots

lib/
  colors/    → colorUtils.ts (hex/rgb/hsl conversion, contrast calc), deriveColorMetadata.ts
  fonts/     → font pairing helpers
  typeScale/ → scale generation (ratio-based, e.g. 1.25 perfect fourth)
  ai/        → Claude client + prompt templates
  db/        → supabase.ts (client + admin), schema.sql, queries/
  export/    → CSS/SCSS/Tailwind/JSON/PDF generators
  auth/      → password hashing (bcryptjs) + JWT session cookies (jose)
  studio/    → projectFromState.ts (Studio → Project conversion), applyImport.ts (staged-import merge)

data/
  colors/    → tailwind.ts (generated), index.ts (aggregator)
  fonts/     → google-fonts subset, curated pairings
  themes/    → curated theme definitions

hooks/        → useColors, useFonts, useDebounce, useScrollProgress
store/        → Zustand stores (authStore, favoritesStore, aiResultStore,
                previewLabStore, studioImportStore)
types/        → color.ts, font.ts, theme.ts, project.ts, user.ts, ai.ts, index.ts
scripts/      → transformColors.ts (one-time data transform, see §4)
```

## 4. Data pipeline

Color and font libraries are **static data committed to the repo**, not
fetched from an external API at runtime. `scripts/transformColors.ts`
reads `tailwindcss/colors` (a local npm package, no network call) and
writes a typed `Color[]` array to `data/colors/tailwind.ts`. The same
pattern should be used for fonts: a `scripts/transformFonts.ts` that calls
the Google Fonts API *once* during development (using `GOOGLE_FONTS_API_KEY`)
and writes the result to `data/fonts/google.ts`. The running app never makes
that API call — it imports the static file. This keeps the browse pages
fast (no API latency) and keeps the app working even if a font API changes
or rate-limits.

Themes are hand-curated, not transformed — write `data/themes/*.ts` directly
as `Theme[]` objects composed from the color and font data.

## 5. API routes vs. direct data import

Browse pages (`/browse/colors`, `/browse/fonts`, `/browse/themes`) can
import directly from `data/` in server components — there's no need for an
`/api/colors` round-trip when the data is already local and static. Reserve
`app/api/*` for things that need a server boundary:

- `POST /api/ai/generate` — calls Claude, must run server-side (API key).
- `GET/POST/PATCH/DELETE /api/projects` — Supabase reads/writes, needs auth
  context.
- `POST /api/export` — generates a PDF/image bundle, heavier compute, fine
  to keep server-side even though it could theoretically run client-side.

## 6. AI generation contract

`POST /api/ai/generate` — request body matches `AIGenerateRequest`
(`prompt`, optional `style[]`, `colorPreferences[]`, `avoid[]`). The route:

1. Validates the body with zod.
2. Builds a prompt instructing Claude to return **structured JSON only**
   matching a defined schema: 5-7 colors with hex + role, a heading font +
   body font pick (from the existing font library, by `id`, so results are
   always renderable — don't let the model invent fonts that don't exist in
   `data/fonts/`), a type scale ratio, and a `reasoning` object explaining
   the palette, the fonts, and the scale in plain language.
3. Parses and validates the response with zod before returning it — if
   parsing fails, retry once with a stricter instruction, then surface a
   clear error rather than returning malformed data to the client.
4. Returns a shape ready to drop straight into the `Project` type.

## 7. Database (Supabase)

Schema already written in `lib/db/schema.sql`:

- `users` — `username` (unique), `password_hash` (bcrypt), keeps a `plan`
  column for later, no enforcement yet.
- `projects` — `user_id` FK, `data JSONB` (the full `Project` minus id/user/
  timestamps), `ai_generated`, `ai_prompt`.
- `favorites` — `user_id` FK, `type` (color/font/theme), `item_id`.

All access goes through the server-only service-role admin client
(`getSupabaseAdmin()`); row-level security is enabled with `USING (false)`
policies (no client-side/anon access), and route handlers enforce the
`user_id` scoping themselves after verifying the session JWT.

## 8. Environment variables

See `.env.local.example`. Required now: `ANTHROPIC_API_KEY`, Supabase keys,
a JWT signing secret for session cookies, `GOOGLE_FONTS_API_KEY` (dev-time
only, for the font transform script). Stripe vars are commented out — leave
them that way.

## 9. Deployment

Vercel, connected to the GitHub repo, auto-deploy on push to `main`. Supabase
is a managed service with its own dashboard — no additional infra to stand
up. Auth is self-hosted in the app itself (no third-party auth dashboard).

## 10. Deferred: billing phase (do not build yet)

When this comes back: re-add `stripe` to `package.json`, restore
`app/api/stripe/{checkout,portal,webhook}` and `app/pricing`, add plan-check
middleware that reads `User.plan` before allowing AI generation past a free
quota, gate `isPro` library items behind an upgrade prompt. Until then, none
of this exists in the codebase on purpose.
