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
 * five-slot Studio palette has no name for a border, muted text, or the
 * status colours, and widening the palette would change every export format.
 * So the roles are *derived* here, always live from `palette` rather than a
 * stored `designSystem.colorRoles` snapshot — nothing in the UI edits a role
 * independently of the palette, so a frozen snapshot would just go stale.
 * Status colours (success/warning/error) come from a small default set, since
 * no design system in this app authors those.
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
  // Primary and accent deliberately share one source (palette.accent), the
  // way most design systems use one brand colour for both — --pg-accent
  // drives focus rings, the outline button's hover state, the tab underline,
  // and the progress bar fill, so it can't be left pointing at something the
  // Accent swatch doesn't actually control. Support stays distinct, secondary
  // buttons only.
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

// The complete stylesheet for the canvas: the standard scoped token export
// plus the role block, in both variants. The dark block is emitted at
// `${selector}[data-theme="dark"]`, mirroring `generateExportCode`'s own dark
// tokens — the canvas switches theme by toggling one attribute, so both
// layers must answer to the same switch, or dark mode changes `--color-*`
// while every `--pg-*` role stays at its light value.
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
