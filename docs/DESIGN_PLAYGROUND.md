# Design Playground — implementation spec

Status: **architecture pivot decided 2026-08-14, not yet built.** Read this
whole "WHERE THIS STANDS" section first — it supersedes some of the original
spec below, which is kept for its still-accurate reference material (token
mechanism, reuse table, data model). If you are picking this up cold, read
this, then `docs/TECHNICAL_ARCHITECTURE.md`, then `CLAUDE.md`.

## Unrelated fix landed alongside this (2026-08-14): Tokens Studio typography

Not part of the Playground work, but done in the same session while resuming
it — noted here since this is the active plan doc. The Figma exporter's DTCG
structure was already correct and untouched; the bug was narrower: the
**Tokens Studio compatibility layer** (`toTokensStudioJson` in
`lib/export/designTokens.ts`) emitted `fontFamily`/`fontWeight` (DTCG's
singular spec types) with typography composites embedding literal values,
when Tokens Studio expects its own plural `fontFamilies`/`fontWeights` types
with the typography composite *referencing* them via `{group.token}` — and
the old two-entry weight map (`display: 700, body: 400`) had no token at all
for `h3`'s actual weight of 600, so any reference to it would have been
`{fontWeights.h3}` pointing at nothing.

Fixed via a `tokensStudioTypography` flag on `DtcgOptions`, set only by
`toTokensStudioJson` — `toDtcgJson` (the plain "Design Tokens" tab) is
byte-for-byte unchanged, verified via the real `/api/export` route, not just
the unit-level function. Weight tokens are now derived from whichever numeric
weights `SEMANTIC_TYPE_ROLES` actually uses (`regular`/`semibold`/`bold`),
not a generic 100–900 ladder, so a token always exists for every weight a
role needs — that's what makes a dangling reference structurally hard to
reintroduce, not just currently absent. A `validateTypographyReferences`
guard also throws at generation time if a reference ever fails to resolve,
verified directly (passes on a valid tree, throws with the exact bad
reference and the list of what *is* available on a broken one).

## WHERE THIS STANDS (updated 2026-08-14)

### The decision: fold Playground into Studio. One page, not two.

Studio's `/studio` right-hand side currently does three overlapping jobs — a
static mock landing page, `LivePreviewSection`'s arrangeable block canvas, and
`DesignSystemGallery`'s token-editor-dressed-as-preview. Playground's component
library (P2, done) is a strict upgrade on all three: real, interactive
components instead of static HTML or hex-field lists. Keeping both surfaces
means maintaining two "preview my system" experiences that will drift apart.
**Decision: there is one Studio page. `/studio/playground` as a separate route
goes away once the merge lands.**

### What "merge" means concretely

`StudioBuilder`'s **sidebar stays exactly as-is** (Identity, Palette,
Typography, Shape & density) — that's the global token editor, untouched.

The right-hand side becomes two architecturally distinct things, not one
undifferentiated grid:

1. **The Live Preview** — one card, bound live and two-way to `StudioState`.
   Editing anything here (a role's colour, a role's font, per-component
   overrides) writes straight into `StudioState`, same as editing the sidebar
   does — there is no "Apply" step for this card, because it *is* the current
   system, not an experiment. This is the card that owns **clipboard-paste and
   full font/colour-library access** — drag a clipped colour or font from
   `useClipboardStore` onto a role, or open the full picker (hex/RGB/HSL +
   the ~1,950-font catalogue with search), and the live preview updates
   immediately. Per-component inline editing lives here too: an "Edit" affordance
   beside each rendered component (button, card, input, …) opens the same
   role-assignment control the comparison cards use, scoped to that one
   component's tokens.
2. **Comparison cards** — the existing Playground `Experiment` model, unchanged
   in spirit: sandboxed overrides, side by side, explicit **Apply to Design
   System** (stages through `useStudioImportStore`, same as today's plan) to
   promote one into the Live Preview / `StudioState`.

**This is the point the user asked to preserve explicitly: keep the Live
Preview (colour/font pasting, per-component editing) architecturally separate
from the comparison-card experiments — don't collapse everything into "just
another experiment card."** The Live Preview is privileged: it's the system;
comparison cards are proposals.

**Export** becomes one `ExportDrawer`, scoped to whichever card is
active/focused (the Live Preview by default, or a comparison card if the user
is focused on one) — `generateExportCode` already takes any
`StudioExportTokens`, so this needs no new export logic, just wiring the
drawer to the currently-focused card's resolved tokens instead of always
`state` directly.

### What gets deleted, not just deprecated

The static mock landing page in `StudioBuilder`, `LivePreviewSection`'s
arrangeable block canvas, `SpacingVisualization`'s standalone card, and
`DesignSystemGallery`'s usage *inside Studio* (its `/studio/ai` read-only usage
— showing what the AI produced before any editing — stays; that's a different
job). This is real code coming out. Good for maintenance, but it's a deletion
pass, not purely additive — treat it with the same care as any removal (check
nothing else imports these, don't just orphan them).

### The AI-generation coverage gap (user's concern, resolved architecturally)

`designSystem.components` (AI-authored) only names 10 component types (button,
buttonSecondary, input, dropdown, card, navigation, table, modal, alert,
badge). Playground's 6 groups cover ~20 individual components — toggle,
tooltip, avatar, progress, skeleton, tabs, breadcrumbs, toast have no
AI-authored token slot. **This is fine, not a blocker**: P1 already built the
`--pg-*` semantic-role layer specifically so every component falls back to a
role token when there's no bespoke AI token (`var(--ds-x, var(--pg-y))`
chains). The only real requirement: every Playground component's fallback
chain must terminate in something the AI *does* generate — audit this during
the merge, don't assume it. Add a subtle visual marker distinguishing
"AI-authored token" from "derived from role tokens" (same principle as the
"Verified, not claimed" panel already shipped for AI generation) so nothing
overclaims curation it didn't do.

### Sequencing — minimize thrown-away work

P3 (controls: colour picker, font tray, clipboard import, contrast readout,
role assignment) and P4 (apply logic) were already specced as reusable,
route-agnostic modules. **Build them first, exactly as originally planned**,
then do the Studio-page merge as a separate pass that mounts those modules in
both places (Live Preview card + comparison cards) instead of only
`/studio/playground`. Almost nothing already planned gets thrown away — it
just ends up mounted differently. Do not start the deletion pass until P3/P4
are solid; merge risk compounds if the replacement isn't ready when the old
surfaces come out.

### Still true from before

- **P1 + P2 are done and verified** — see the git log
  (`Add Design Playground foundation, component library and persistence`,
  commit `09d324a`) for the evidence: two experiments rendering side by side
  with genuinely different scoped tokens, and a real-interactive component
  library (21 `:hover`, 14 `:focus-visible`, 8 `:active`, 32 `:disabled` rules
  over 92 real buttons / 28 real inputs).
- **Correction (2026-08-14, verified live in browser after a `.next` cache
  wipe fixed a broken dev-server reload that made `/studio/playground` look
  like it 404'd):** this section previously said P3 "nothing landed" and P4
  "`ApplyToSystemButton` did not land." Both files exist in the repo (and
  have since `09d324a`) — `components/playground/controls/{SwatchTray,
  FontTray,CustomColorPicker}.tsx`, `components/playground/
  ApplyToSystemButton.tsx`, `lib/playground/applyToSystem.ts` — fully coded,
  `tsc`-clean, non-trivial (150–250 lines each). The doc was simply never
  updated after they landed. **The real gap is narrower and more specific:
  none of them are imported anywhere.** `grep -rl "SwatchTray\|FontTray\|
  CustomColorPicker"` outside their own files returns nothing, and
  `ExperimentCard.tsx` / `PlaygroundToolbar.tsx` / `PlaygroundCanvas.tsx`
  import none of them. Confirmed live: `/studio/playground` renders two
  experiment cards with the full real P2 component library, but there is no
  colour picker, no font tray, no way to assign a colour/font to a role on a
  card, no contrast readout, and no "Apply to design system" button anywhere
  in the DOM.
  - Still fully missing, not just unwired: a **role-assignment control**
    (click a role on a card, pick from tray/custom — referenced in this doc's
    prose and in `SwatchTray`'s own comment as "the role popovers inside each
    experiment card," but no such component exists yet), the **contrast
    readout** UI (`lib/playground/contrastPairs.ts` exists and is unused —
    confirmed via the same grep pattern), and **`ClipboardImportDialog`**
    (named directly in a comment in `lib/playground/clipboardParse.ts` as the
    file that owns the async clipboard-read + dialog UI — that file does not
    exist; `SwatchTray`'s "Paste" button (`onOpenImport` prop) has nothing to
    call).
  - Remaining wiring work, in order: (1) mount `SwatchTray` + `FontTray` in
    `PlaygroundToolbar` (both are prop-free besides `SwatchTray`'s
    `onOpenImport`); (2) build `ClipboardImportDialog` from
    `clipboardParse.ts`'s pure functions (`parseClipboardText`,
    `excludeExisting`) plus `useClipboardStore` for the in-app-clipboard half
    and `navigator.clipboard.readText()` for the OS-paste half — detect →
    preview (ticked/unticked per `suggested`) → select → add, never blind-add;
    (3) build the role-assignment control and mount it per role per card,
    wired to `setExperimentColor`/`setExperimentFont`; (4) mount
    `ApplyToSystemButton` in `ExperimentCard`'s footer (self-contained, takes
    only `experimentId`); (5) build the contrast readout off
    `contrastPairs.ts`; (6) "Save playground" — persistence plumbing
    (`playground` field) is already wired end-to-end in `types/project.ts`,
    `lib/validation/project.ts`, `lib/db/projectMapper.ts`, confirmed by
    reading all three — only the UI trigger and the load-time hydrate call
    are missing.

**Gotcha already paid for once:** `components/playground/components/styles.ts`
holds the stylesheet as a template literal. Backticks inside its CSS comments
terminate the string — keep prose in there quoted, not backticked.

## What it is

A visual experimentation surface inside Studio. A user places several
**experiments** side by side, each one a different combination of colours and
fonts drawn from their generated system, and sees those combinations rendered
on real, interactive UI components. It answers "which of these actually works?"
before anything is committed to the canonical design system.

It is explicitly **not** Figma. No freeform vector canvas. A responsive,
reorderable grid of experiment cards.

## Non-negotiables

- Do not rebuild Studio. Do not break existing Studio functionality.
- The playground is an **isolated experimentation layer**. Nothing it does
  touches the canonical token system until the user explicitly hits
  *Apply to Design System*.
- Components consume **tokens**, never hard-coded per-experiment styles.
  Changing one token in an experiment must update every component in that
  experiment automatically, with no per-theme CSS.
- No new state-management library. Zustand is already here.
- No unnecessary dependencies. Everything needed is already installed.

## The architecture that makes this work

`lib/studio/exportCode.ts` exports:

```ts
generateExportCode("CSS", tokens: StudioExportTokens, { scopeSelector?: string })
```

With `scopeSelector` it emits the full token set scoped to that selector
instead of `:root` — including the `[data-theme="dark"]` variant block. This is
already used by `LivePreviewSection` to inject Studio's CSS into the host page
without clobbering the real `:root`.

**Each experiment therefore = one scoped `<style>` block + the shared component
library.** Experiment `exp_3` renders its components inside
`<div data-pg-exp="exp_3">`, with CSS scoped to `[data-pg-exp="exp_3"]`. Two
experiments on screen are two scoped blocks; the components are identical React
in both cases and simply resolve different custom properties. That is
requirement 18 satisfied structurally rather than by convention.

Custom properties available inside a scope (see `generateExportCode`'s CSS
branch for the authoritative list): `--color-accent`, `--color-support`,
`--color-surface`, `--color-ink`, `--color-muted`, `--font-display`,
`--font-body`, `--radius`, `--text-{xs…6xl}`, `--space-{1…8}`,
`--shadow-{none,subtle,dramatic}`, and when a design system is present the
`--ds-*` family (`--ds-color-bg`, `--ds-button-bg`, `--ds-button-text`,
`--ds-card-border`, …).

Playground components MUST style themselves only from these, using the same
`var(--ds-x, var(--color-y))` fallback chain `lib/studio/livePreviewBlocks.ts`
already uses, so a manual (non-AI) system still renders.

## Existing systems to reuse — do not duplicate

| Need | Use this |
|---|---|
| Token → CSS | `generateExportCode` in `lib/studio/exportCode.ts` |
| Token shape | `StudioExportTokens` / `PaletteTokens` (same file) |
| Primitive/alias colour graph | `lib/studio/tokenGraph.ts` (`resolvePalette`, `ColorValue`) |
| Contrast maths | `getContrastRatio` (`lib/colors/colorUtils.ts`), `lib/colors/contrast.ts` |
| Dark derivation | `deriveDarkPaletteTokens` (`lib/studio/deriveThemeVariant.ts`) |
| In-app clipboard | `useClipboardStore` — `colors: ClipboardColorItem[]`, `fonts: ClipboardFontItem[]` |
| Font loading | `components/fonts/GoogleFontsLoader.tsx` |
| Font catalogue | `data/fonts` (`allFonts`) |
| Drag reorder | `@dnd-kit` — pattern in `components/studio/PreviewLab.tsx` and `LivePreviewSection.tsx` |
| Studio state + undo/redo | `StudioState` in `components/studio/StudioBuilder.tsx` |

**Persistence trap:** `lib/db/projectMapper.ts` is an explicit
`Pick<Project, …>` allowlist, not a passthrough. A new field added to
`Project`/`ProjectInput` and to the zod schema will still be **silently dropped
on save** unless it is also added to that `Pick<>` and copied by name in both
`rowToProject()` and `projectInputToRow()`.

## Route and navigation

New route `app/studio/playground/page.tsx`. Studio's IA is already route-based
(`/studio`, `/studio/ai`, `/studio/compare`), so this fits without changing the
existing structure. Add a shared Studio sub-nav so the sections are
discoverable from each other — do not restructure `StudioBuilder`'s internals.

## Data model — `lib/playground/types.ts`

Authoritative. Both the state batch and the components batch code against this.

```ts
export type PlaygroundRole =
  | "background" | "surface" | "primary" | "secondary" | "accent"
  | "text" | "muted" | "border" | "success" | "warning" | "error";

export type PlaygroundTypeRole =
  | "display" | "heading" | "subheading" | "body" | "label" | "button" | "caption";

/** A colour available to drop into a role. Sourced from the generated system,
 *  the in-app clipboard, a pasted string, or the custom picker. */
export type PlaygroundSwatch = {
  id: string;
  hex: string;
  name: string;
  origin: "system" | "clipboard" | "custom" | "pasted";
};

export type PlaygroundFont = {
  id: string;
  family: string;
  category: string;
  origin: "system" | "clipboard" | "custom" | "pasted";
};

export type Experiment = {
  id: string;
  name: string;
  /** Role -> hex. Partial: unassigned roles fall back to the base system. */
  colors: Partial<Record<PlaygroundRole, string>>;
  /** Type role -> font family. Partial, same fallback rule. */
  fonts: Partial<Record<PlaygroundTypeRole, string>>;
  radius?: number;
  /** Which component groups this card shows. Empty = the default set. */
  visibleGroups?: string[];
};

export type PlaygroundState = {
  experiments: Experiment[];
  swatches: PlaygroundSwatch[];
  fonts: PlaygroundFont[];
};
```

An experiment stores **overrides only**. Rendering resolves
`base StudioState ⊕ experiment overrides` into a `StudioExportTokens`, which
goes through `generateExportCode`. That keeps one token schema, per
requirement 19.

## Batches

### P1 — Foundation (blocks P3, P4)
`lib/playground/types.ts`, `lib/playground/resolveExperiment.ts`
(overrides ⊕ base → `StudioExportTokens`), `store/playgroundStore.ts` (Zustand,
experiment CRUD: add/duplicate/rename/delete/clear/reorder), the route, the
Studio sub-nav, and the canvas shell with a dnd-kit reorderable responsive
grid. Renders each experiment's scoped `<style>` + a placeholder slot where P2's
component board mounts.

### P2 — Component library (parallel with P1)
`components/playground/components/*`. Pure, presentational, token-consuming,
**genuinely interactive** — real `:hover` / `:focus-visible` / `:active` /
`:disabled` CSS, not screenshots of states. No store access, no props beyond
`size`/`density` variants. Quality over quantity: ~15 excellent components beat
50 unfinished. Groups: Buttons (primary/secondary/outline/ghost/destructive/icon
+ loading), Inputs (default/filled/error/success/disabled + real focus), Cards
(basic/product/profile/article), Navigation (navbar/tabs/breadcrumbs), Feedback
(4 alerts/badge/toast), Controls (checkbox/radio/toggle/dropdown/tooltip/
avatar/progress/skeleton/modal).

### P3 — Controls (after P1)
Colour picker (hex/RGB/HSL + native picker), multi-select swatch + font trays,
role assignment, clipboard import with the **detect → preview → select → add**
flow (never blind-add; parse `#hex`, `rgb()`, `hsl()`, quoted and bare font
names, from both `useClipboardStore` and `navigator.clipboard.readText()`),
and the live contrast readout (real measured ratios, AA/AAA pass/fail, informative
not blocking).

### P4 — Apply + persistence (after P1, P3)
*Apply to Design System*: show an explicit diff of what changes, confirm before
overwriting, write into `StudioState` so existing undo/redo covers it, and
update the Studio preview. Plus *Save Playground* — deliberate persistence
only, never auto-saving every scratch experiment. Remember the
`projectMapper` allowlist trap above.

## Acceptance

The 22-step list in the original brief. The one-line version: generate a
system, open the playground, see real components immediately, build two
experiments side by side, change a font or colour in one and watch only that
one update, interact with real hover/focus states, read true contrast numbers,
paste from the clipboard with a confirmation step, apply one experiment to the
real design system, undo it, and export the result.
