/**
 * Design Playground — overrides ⊕ base → CSS.
 *
 * Pure functions, no React, no store access. This is the only place that
 * knows how a `PlaygroundRole` becomes an actual custom property, so the
 * canvas, the P3 controls and the P4 "Apply to design system" step all
 * agree on what "primary" means without each re-deriving it.
 *
 * Why it works this way: `generateExportCode("CSS", tokens, { scopeSelector })`
 * (lib/studio/exportCode.ts) already emits the complete token set under an
 * arbitrary selector instead of `:root` — that's the mechanism
 * components/studio/LivePreviewSection.tsx uses to inject Studio's CSS into
 * the host page without clobbering the real page's properties. So an
 * experiment is nothing more than a scoped `<style>` block plus the shared
 * component library rendered inside `[data-pg-exp="<id>"]`. Two experiments
 * on screen are the *same* React components resolving different custom
 * properties; nothing per-experiment leaks into the components themselves.
 *
 * ---------------------------------------------------------------------------
 * ROLE → TOKEN MAPPING (read this before changing anything below)
 * ---------------------------------------------------------------------------
 * `PaletteTokens` has exactly five slots (accent/support/surface/ink/muted).
 * The playground has eleven roles. The overflow is handled in two layers:
 *
 *   1. Roles with a real slot are written straight into the palette, so the
 *      whole existing pipeline (dark derivation, Tailwind/JSON export, the
 *      style guide) keeps working unchanged:
 *
 *        primary     -> light.accent          (--color-accent)
 *        secondary   -> light.support         (--color-support)
 *        background  -> light.surface         (--color-surface)
 *        surface     -> light.surface         (only when `background` is unset;
 *                                              the two share one palette slot)
 *        text        -> light.ink             (--color-ink)
 *        muted       -> light.muted           (--color-muted)
 *
 *   2. Roles with no palette slot are pushed through the design system's
 *      theme variant, which `generateExportCode` flattens into the `--ds-*`
 *      family via `themeVariantEntries` (lib/export/designTokens.ts):
 *
 *        background  -> designSystem.light.colorRoles.background   (--ds-color-bg)
 *        surface     -> designSystem.light.colorRoles.surface      (--ds-color-surface)
 *        text        -> ...colorRoles.text                         (--ds-color-text)
 *        muted       -> ...colorRoles.textMuted                    (--ds-color-text-muted)
 *        border      -> ...colorRoles.border                       (--ds-color-border)
 *        primary     -> components.button.background/text          (--ds-button-bg / --ds-button-text)
 *        secondary   -> components.buttonSecondary.*               (--ds-button-secondary-bg / -text)
 *        surface     -> components.card.background, input.background
 *        border      -> components.card.border, input.border
 *
 *      A base system with no `designSystem` at all (a from-scratch manual
 *      build) gets one synthesised via `synthesizeDesignSystemFromPalettes`
 *      — the same function Studio's "Enable component tokens" action uses —
 *      so `--ds-*` is always present inside a playground scope and P2's
 *      components can rely on the `var(--ds-x, var(--color-y))` fallback
 *      chain that lib/studio/livePreviewBlocks.ts established.
 *
 *   3. `accent`, `success`, `warning` and `error` have no home in either
 *      layer — `accent` because the palette's `accent` slot is already spoken
 *      for by `primary`, and the three status colours because the token
 *      system has never had semantic status hues at all. They (and every
 *      other role, for convenience) are appended as an extra `--pg-*` block
 *      after the generated CSS. See PLAYGROUND_EXTRA_PROPERTIES below for the
 *      exact, exhaustive list — P2's component library consumes those names.
 *
 * Component *states* authored by the AI (hover/active/disabled/focus) are
 * deliberately left untouched when a role is overridden: they're carefully
 * generated relative hues and blindly recolouring them produced worse results
 * than letting them ride. A future batch can re-derive them; nothing here
 * should silently guess.
 */
import { getContrastRatio } from "@/lib/colors/colorUtils";
import { deriveDarkPaletteTokens, synthesizeDesignSystemFromPalettes } from "@/lib/studio/deriveThemeVariant";
import { generateExportCode, PaletteTokens, StudioExportTokens } from "@/lib/studio/exportCode";
import type { ComponentName, ComponentTokenSet, DesignSystem, ThemeVariantTokens } from "@/types/designSystem";
import type { Experiment, PlaygroundRole, PlaygroundTypeRole } from "./types";

/**
 * Fallbacks for the three semantic status hues. The token system has no
 * concept of them, so without a default `--pg-success` would resolve to
 * nothing and P2's alert components would render unstyled on first open —
 * which fails the "see ready-made components immediately" acceptance step.
 * Deliberately desaturated to sit next to this app's editorial palette
 * rather than shouting over it; a user overriding the role replaces them.
 */
export const PLAYGROUND_STATUS_DEFAULTS = {
  success: "#2F6B4F",
  warning: "#B4791F",
  error: "#B23B3B",
} as const;

/**
 * The complete list of extra custom properties emitted inside every
 * experiment scope, on top of everything `generateExportCode` already
 * writes. **This is the contract with the component library
 * (components/playground/components/*)** — those components style
 * themselves from these names, so entries may be added here but never
 * renamed or removed without updating P2.
 *
 * Every one of them is guaranteed present (roles the user hasn't assigned
 * resolve to the base system's own value), so components can use
 * `var(--pg-primary)` directly; a fallback is still good practice for the
 * case where a component is rendered outside a playground scope.
 */
export const PLAYGROUND_EXTRA_PROPERTIES = [
  // Colour, one per PlaygroundRole
  "--pg-background",
  "--pg-surface",
  "--pg-primary",
  "--pg-secondary",
  "--pg-accent",
  "--pg-text",
  "--pg-muted",
  "--pg-border",
  "--pg-success",
  "--pg-warning",
  "--pg-error",
  // Readable foreground for each filled role — computed with the same
  // contrast-ratio pick Studio uses for its own on-accent colour, so a
  // component putting a label on a brand fill never has to guess.
  "--pg-on-primary",
  "--pg-on-secondary",
  "--pg-on-accent",
  "--pg-on-success",
  "--pg-on-warning",
  "--pg-on-error",
  "--pg-on-surface",
  // Typography, one per PlaygroundTypeRole. Full font-family stacks
  // (quoted family + a generic fallback), ready to drop into `font-family`.
  "--pg-font-display",
  "--pg-font-heading",
  "--pg-font-subheading",
  "--pg-font-body",
  "--pg-font-label",
  "--pg-font-button",
  "--pg-font-caption",
  // Shape
  "--pg-radius",
] as const;

/** `[data-pg-exp="<id>"]` — the wrapper attribute ExperimentCard renders. */
export function experimentScopeSelector(id: string): string {
  // Attribute selector rather than a class or an id: ids must be unique in
  // the document and a class would collide with Tailwind's utility space.
  // Experiment ids are generated by the store (`exp_...`), never user text,
  // so there is no selector-injection surface here — but keep it that way if
  // renaming ever starts feeding the id.
  return `[data-pg-exp="${id}"]`;
}

/** Same contrast pick Studio and deriveThemeVariant use for on-accent text. */
function onColor(hex: string): string {
  return getContrastRatio(hex, "#FBF8F2") >= getContrastRatio(hex, "#141110") ? "#FBF8F2" : "#141110";
}

function patchComponent(
  components: ThemeVariantTokens["components"],
  name: ComponentName,
  patch: Partial<Pick<ComponentTokenSet, "background" | "text" | "border">>
): void {
  const existing = components[name];
  if (!existing) return;
  // Spread-then-assign so `states` (and anything else added to
  // ComponentTokenSet later) survives untouched — see the note at the top
  // of this file about not re-deriving AI-authored states.
  components[name] = { ...existing, ...patch };
}

/**
 * Applies the experiment's colour overrides to a theme variant in place.
 * Called on a deep-cloned variant only.
 */
function applyRolesToVariant(variant: ThemeVariantTokens, colors: Partial<Record<PlaygroundRole, string>>): void {
  const { background, surface, text, muted, border, primary, secondary } = colors;

  if (background) variant.colorRoles.background = background;
  // `surface` falls back to `background` and vice versa: a user who assigns
  // only one of the pair expects the card surface to follow the page, not to
  // sit on the untouched base colour and look like a bug.
  if (surface ?? background) variant.colorRoles.surface = (surface ?? background)!;
  if (text) variant.colorRoles.text = text;
  if (muted) variant.colorRoles.textMuted = muted;
  if (border) variant.colorRoles.border = border;

  if (primary) patchComponent(variant.components, "button", { background: primary, text: onColor(primary) });
  if (secondary) {
    patchComponent(variant.components, "buttonSecondary", { background: secondary, text: onColor(secondary) });
  }

  const cardSurface = surface ?? background;
  if (cardSurface) {
    patchComponent(variant.components, "card", { background: cardSurface });
    patchComponent(variant.components, "input", { background: cardSurface });
    patchComponent(variant.components, "modal", { background: cardSurface });
  }
  if (text) {
    patchComponent(variant.components, "card", { text });
    patchComponent(variant.components, "input", { text });
    patchComponent(variant.components, "modal", { text });
  }
  if (border) {
    patchComponent(variant.components, "card", { border });
    patchComponent(variant.components, "input", { border });
  }
}

// Structured clone by hand rather than JSON round-tripping: DesignSystem is
// plain data today, but a JSON round-trip silently drops anything that isn't
// (undefined-valued optional keys change shape), and this object is fed
// straight back into the export pipeline.
function cloneVariant(v: ThemeVariantTokens): ThemeVariantTokens {
  const components: ThemeVariantTokens["components"] = {};
  (Object.keys(v.components) as ComponentName[]).forEach((name) => {
    const t = v.components[name];
    if (!t) return;
    components[name] = { ...t, ...(t.states ? { states: { ...t.states } } : {}) };
  });
  return { colorRoles: { ...v.colorRoles }, components };
}

function cloneDesignSystem(ds: DesignSystem): DesignSystem {
  return {
    ...ds,
    light: cloneVariant(ds.light),
    ...(ds.dark ? { dark: cloneVariant(ds.dark) } : {}),
  };
}

/**
 * Merges an experiment's partial overrides over the base system and hands
 * back a complete `StudioExportTokens` — the *same* type the Export drawer
 * and Live Preview consume, so anything downstream (CSS, Tailwind, the
 * eventual "Apply to design system") works on a playground experiment with
 * no special-casing.
 */
export function resolveExperimentTokens(base: StudioExportTokens, exp: Experiment): StudioExportTokens {
  const colors = exp.colors;

  const light: PaletteTokens = {
    accent: colors.primary ?? base.light.accent,
    support: colors.secondary ?? base.light.support,
    // One slot, two roles — `background` is the page and wins; `surface`
    // only reaches the palette when no background was assigned. Both always
    // reach the `--ds-color-bg` / `--ds-color-surface` pair below, and both
    // are always exact as `--pg-background` / `--pg-surface`.
    surface: colors.background ?? colors.surface ?? base.light.surface,
    ink: colors.text ?? base.light.ink,
    muted: colors.muted ?? base.light.muted,
  };

  const hasColorOverride = Object.keys(colors).length > 0;
  // Re-derive dark from the *experimented* light palette rather than
  // carrying the base's dark through unchanged. Reuses the same function
  // StudioBuilder uses for exactly this reason (see the comment on
  // DEFAULT_DARK there — a stale dark palette next to a fresh light one is
  // how three unrelated brands ended up sharing five violet hexes).
  const dark: PaletteTokens = hasColorOverride ? deriveDarkPaletteTokens(light) : base.dark;

  // Always present, so `--ds-*` exists inside every scope even for a manual
  // build with no design system of its own.
  const baseDesignSystem = base.designSystem ?? synthesizeDesignSystemFromPalettes(light, dark);
  const designSystem = cloneDesignSystem(baseDesignSystem);
  if (hasColorOverride) {
    applyRolesToVariant(designSystem.light, colors);
    // The dark variant is regenerated from the derived dark palette rather
    // than patched with the user's light-mode hexes — dropping a light
    // background into a dark variant is how you get white-on-white.
    designSystem.dark = synthesizeDesignSystemFromPalettes(light, dark).dark;
  }

  return {
    ...base,
    light,
    dark,
    // `display` is the headline face; `heading` is the closest thing to it
    // when a user only assigned one of the two. Same idea for the small-text
    // roles collapsing onto the accent face.
    headFont: exp.fonts.display ?? exp.fonts.heading ?? base.headFont,
    bodyFont: exp.fonts.body ?? base.bodyFont,
    accentFont: exp.fonts.label ?? exp.fonts.button ?? base.accentFont,
    radius: exp.radius ?? base.radius,
    designSystem,
  };
}

/** Every font family referenced by an experiment, for the Google Fonts link. */
export function experimentFontFamilies(base: StudioExportTokens, exp: Experiment): string[] {
  const resolved = resolveExperimentTokens(base, exp);
  const families = [resolved.headFont, resolved.bodyFont, resolved.accentFont, ...Object.values(exp.fonts)];
  return Array.from(new Set(families.filter((f): f is string => Boolean(f))));
}

function fontStack(family: string, generic: string): string {
  return `"${family}", ${generic}`;
}

/**
 * The `--pg-*` block described at the top of this file. Emitted as its own
 * rule *after* `generateExportCode`'s output, at identical specificity, so
 * source order decides and these always win — no `!important` needed.
 */
function extraPropertyBlock(selector: string, resolved: StudioExportTokens, exp: Experiment): string {
  const c = exp.colors;
  const roles = resolved.designSystem?.light.colorRoles;

  const background = c.background ?? roles?.background ?? resolved.light.surface;
  const surface = c.surface ?? roles?.surface ?? resolved.light.surface;
  const primary = c.primary ?? resolved.light.accent;
  const secondary = c.secondary ?? resolved.light.support;
  // No palette slot at all — falls back to `support` so a component using
  // --pg-accent for a highlight still reads as part of the brand instead of
  // disappearing.
  const accent = c.accent ?? resolved.light.support;
  const text = c.text ?? roles?.text ?? resolved.light.ink;
  const muted = c.muted ?? roles?.textMuted ?? resolved.light.muted;
  const border = c.border ?? roles?.border ?? resolved.light.muted;
  const success = c.success ?? PLAYGROUND_STATUS_DEFAULTS.success;
  const warning = c.warning ?? PLAYGROUND_STATUS_DEFAULTS.warning;
  const error = c.error ?? PLAYGROUND_STATUS_DEFAULTS.error;

  const f = exp.fonts;
  const display = f.display ?? resolved.headFont;
  const heading = f.heading ?? display;
  const subheading = f.subheading ?? heading;
  const body = f.body ?? resolved.bodyFont;
  const label = f.label ?? resolved.accentFont ?? body;
  const button = f.button ?? label;
  const caption = f.caption ?? body;

  return [
    `${selector} {`,
    `  --pg-background: ${background};`,
    `  --pg-surface: ${surface};`,
    `  --pg-primary: ${primary};`,
    `  --pg-secondary: ${secondary};`,
    `  --pg-accent: ${accent};`,
    `  --pg-text: ${text};`,
    `  --pg-muted: ${muted};`,
    `  --pg-border: ${border};`,
    `  --pg-success: ${success};`,
    `  --pg-warning: ${warning};`,
    `  --pg-error: ${error};`,
    "",
    `  --pg-on-primary: ${onColor(primary)};`,
    `  --pg-on-secondary: ${onColor(secondary)};`,
    `  --pg-on-accent: ${onColor(accent)};`,
    `  --pg-on-success: ${onColor(success)};`,
    `  --pg-on-warning: ${onColor(warning)};`,
    `  --pg-on-error: ${onColor(error)};`,
    `  --pg-on-surface: ${text};`,
    "",
    `  --pg-font-display: ${fontStack(display, "serif")};`,
    `  --pg-font-heading: ${fontStack(heading, "serif")};`,
    `  --pg-font-subheading: ${fontStack(subheading, "sans-serif")};`,
    `  --pg-font-body: ${fontStack(body, "sans-serif")};`,
    `  --pg-font-label: ${fontStack(label, "sans-serif")};`,
    `  --pg-font-button: ${fontStack(button, "sans-serif")};`,
    `  --pg-font-caption: ${fontStack(caption, "sans-serif")};`,
    "",
    `  --pg-radius: ${resolved.radius}px;`,
    "}",
  ].join("\n");
}

/**
 * The full stylesheet for one experiment: the standard scoped token export
 * plus the `--pg-*` block. This is what ExperimentCard injects.
 *
 * Note that both blocks target the same wrapper element, so a component
 * nested anywhere inside it inherits both — there is no ordering
 * requirement on where the component library sits in the tree.
 */
export function experimentCss(base: StudioExportTokens, exp: Experiment): string {
  const selector = experimentScopeSelector(exp.id);
  const resolved = resolveExperimentTokens(base, exp);
  const tokenCss = generateExportCode("CSS", resolved, { scopeSelector: selector });
  return `${tokenCss}\n\n/* Playground semantic roles — see lib/playground/resolveExperiment.ts */\n${extraPropertyBlock(
    selector,
    resolved,
    exp
  )}`;
}
