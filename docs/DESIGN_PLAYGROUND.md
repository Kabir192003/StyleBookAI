# Design Playground — implementation spec

Status: **P1 + P2 done, P3 + P4 unfinished.** This file is the contract
between the batches building the feature. If you are picking this work up
cold, read this first, then `docs/TECHNICAL_ARCHITECTURE.md`, then `CLAUDE.md`.

## WHERE THIS STANDS (updated 2026-08-13, commit `09d324a`)

Working and verified in the browser at `/studio/playground`:
- Two seeded experiments render side by side, each with all six component
  groups, from one shared React library. `--pg-primary` `#222D52` vs `#C36B3E`
  produces button backgrounds `rgb(34,45,82)` vs `rgb(195,107,62)` — the
  scoped-token mechanism works, which is the feature's whole premise.
- The component library is genuinely interactive: 21 `:hover`, 14
  `:focus-visible`, 8 `:active`, 32 `:disabled` rules over 92 real `<button>`
  and 28 real `<input>` elements.
- Experiment add / duplicate / delete / reorder, the Studio sub-nav across all
  four routes, and tablet stacking are all verified.
- Playground persistence types, zod schema and the `projectMapper` four-place
  allowlist are done (P4 got that far).

**Still to build:**
- **P3 (controls)** — barely started. Nothing landed. Needs: the colour picker
  (hex/RGB/HSL + native, kept in sync via `colord`), swatch + font trays with
  search over the ~1,950-font catalogue, per-card role assignment wired to the
  store's `setExperimentColor`/`setExperimentFont`, the clipboard
  detect→preview→select→add flow (`lib/playground/clipboardParse.ts`, reading
  both `useClipboardStore` and `navigator.clipboard.readText()`), and the
  contrast readout using `getContrastRatio`.
- **P4 (apply)** — persistence landed; `ApplyToSystemButton` and
  `lib/playground/applyToSystem.ts` did not. The agreed design: Apply stages
  the resolved experiment through `useStudioImportStore` and navigates to
  `/studio`, where `StudioBuilder` folds it into `StudioState` on mount — so
  the existing undo/redo covers it for free. **Do not lift `StudioState` into
  Zustand**; that is a large refactor of a working 1,200-line component and the
  staging bridge already exists for exactly this (Preview Lab uses it).
  `applyStudioImport` must start honouring `color.role` while keeping its
  positional fallback so Preview Lab keeps working.
- The `ExperimentCard` footer expects `<ApplyToSystemButton experimentId>`.

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
