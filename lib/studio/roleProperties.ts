/**
 * The `--pg-*` semantic-role layer: the custom properties the component
 * library in components/system styles itself from, derived from a resolved
 * `StudioExportTokens`.
 *
 * **This is the contract with components/system/styles.ts.** Those components
 * resolve these exact names, so entries may be added here but never renamed or
 * removed without updating the stylesheet's `--pgc-*` alias layer.
 *
 * Why a second layer on top of what `generateExportCode` already emits: the
 * five-slot Studio palette (accent/support/surface/ink/muted) has no name for
 * a border, a muted-text colour, or the success/warning/error trio, and a real
 * component library needs all of them. Rather than widen the palette — which
 * would change every export format and every saved project — the roles are
 * *derived* here, always live from `palette`, and never from a stored
 * `designSystem.colorRoles` snapshot: nothing in the UI lets a user edit a
 * role independently of the palette, so a frozen colorRoles value can only
 * ever go stale the moment a primitive or palette colour changes after
 * creation — which is exactly the bug this rewrite fixes. Status colours
 * (success/warning/error) still come from a small default set, since no
 * design system in this app authors those at all.
 *
 * Every property is unconditionally present, so a component can write
 * `var(--pg-primary)` and rely on it. The fallbacks in styles.ts exist for the
 * case where the library renders outside a canvas scope entirely.
 */
import { getContrastRatio } from "@/lib/colors/colorUtils";
import type { StudioExportTokens } from "@/lib/studio/exportCode";
import { generateExportCode } from "@/lib/studio/exportCode";
import { mix } from "@/lib/studio/deriveThemeVariant";

/**
 * Status colours have no slot anywhere in the token system — not in the
 * five-colour palette, not in `DesignSystem.colorRoles`, and the AI is never
 * asked for them. Without a default, `--pg-success` would resolve to nothing
 * and every alert would render unstyled. Deliberately desaturated to sit
 * alongside an editorial palette rather than shouting over it.
 */
export const STATUS_DEFAULTS = {
  success: "#2F6B4F",
  warning: "#B4791F",
  error: "#B23B3B",
} as const;

/** Same contrast pick Studio and deriveThemeVariant use for on-accent text. */
function onColor(hex: string): string {
  return getContrastRatio(hex, "#FBF8F2") >= getContrastRatio(hex, "#141110") ? "#FBF8F2" : "#141110";
}

function fontStack(family: string, generic: string): string {
  return `"${family}", ${generic}`;
}

/**
 * The role block for one scope. Emitted *after* `generateExportCode`'s output
 * at identical specificity, so source order decides and these win without
 * `!important`.
 *
 * `variant` picks which half of the system the roles come from. It is a real
 * parameter rather than always-light because the canvas has a working dark
 * mode: reading `tokens.dark` while the canvas renders dark is how you get
 * dark-mode text at light-mode contrast.
 */
export function rolePropertyBlock(
  selector: string,
  tokens: StudioExportTokens,
  variant: "light" | "dark" = "light"
): string {
  const palette = variant === "dark" ? tokens.dark : tokens.light;

  const background = palette.surface;
  const surface = palette.surface;
  const primary = palette.accent;
  const secondary = palette.support;
  // Was `palette.support` — the Palette sidebar's "Accent" swatch fed
  // --pg-primary (button fills) but never --pg-accent itself, so editing
  // Accent never reached anything --pg-accent drives: focus rings, the
  // outline button's hover border/text, the tab underline, the progress
  // bar fill, badge/alert's neutral tone default. A role literally named
  // "Accent" not reaching the CSS variable named --pg-accent was exactly
  // that: editing it looked like it did nothing, everywhere except primary
  // buttons. Primary and accent now share one source, same as most design
  // systems using one brand colour for both — Support remains distinct,
  // secondary buttons only.
  const accent = palette.accent;
  const text = palette.ink;
  const muted = palette.muted;
  // Same blend deriveThemeVariantFromPalette uses when it first sets up a
  // design system's colorRoles.border — computed here instead of read from
  // that (possibly stale) stored value, so it stays live.
  const border = mix(palette.surface, palette.ink, 0.12);
  const { success, warning, error } = STATUS_DEFAULTS;

  const display = tokens.headFont;
  const body = tokens.bodyFont;
  const label = tokens.accentFont ?? body;

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
    // The three heading roles share the display face and the three small-text
    // roles share the body face. The system has two font slots (plus an
    // optional accent); pretending it has seven would mean the canvas showed
    // distinctions no export could reproduce.
    `  --pg-font-display: ${fontStack(display, "serif")};`,
    `  --pg-font-heading: ${fontStack(display, "serif")};`,
    `  --pg-font-subheading: ${fontStack(display, "sans-serif")};`,
    `  --pg-font-body: ${fontStack(body, "sans-serif")};`,
    `  --pg-font-label: ${fontStack(label, "sans-serif")};`,
    `  --pg-font-button: ${fontStack(label, "sans-serif")};`,
    `  --pg-font-caption: ${fontStack(body, "sans-serif")};`,
    "",
    `  --pg-radius: ${tokens.radius}px;`,
    "}",
  ].join("\n");
}

/**
 * The complete stylesheet for the canvas: the standard scoped token export
 * plus the role block, in both variants.
 *
 * The dark block is emitted at `${selector}[data-theme="dark"]`, mirroring
 * exactly what `generateExportCode` does with its own dark tokens. That
 * mirroring is the point — the canvas switches theme by toggling one
 * attribute, and both layers have to answer to the same switch. Emitting only
 * the light roles (an earlier shape of this function) meant dark mode changed
 * `--color-*` but left every `--pg-*` role at its light value, so the
 * components kept their light-mode text on a dark surface.
 *
 * All blocks target the same wrapper, so a component nested anywhere inside
 * inherits them and there is no ordering requirement on where it sits.
 */
export function canvasCss(selector: string, tokens: StudioExportTokens): string {
  const tokenCss = generateExportCode("CSS", tokens, { scopeSelector: selector });
  return [
    tokenCss,
    "",
    "/* Semantic roles — see lib/studio/roleProperties.ts */",
    rolePropertyBlock(selector, tokens, "light"),
    rolePropertyBlock(`${selector}[data-theme="dark"]`, tokens, "dark"),
  ].join("\n");
}
