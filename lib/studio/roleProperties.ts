// The --pg-* semantic-role layer components/system/styles.ts reads from.
// Names here are a contract with that stylesheet, don't rename or remove
// without updating its --pgc-* alias layer. Derived live from `palette`
// rather than stored, so a role can never go stale against it.
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

// Border for a control whose outline *is* its boundary — an outline button or
// a text input with an invisible edge is an invisible control (WCAG SC 1.4.11,
// 3:1). Blends ink into surface until it actually clears that bar rather than
// using a fixed percentage: 12% toward a dark ink reads fine on a light
// surface, but the same 12% toward a light ink barely lifts off a dark one,
// because contrast isn't linear with mix percentage near the dark end of the
// range. That's why outline buttons vanished in dark mode.
//
// Deliberately NOT used for --pg-border: card edges, table rules and dividers
// are decorative chrome, and forcing 3:1 on every hairline would flatten the
// quiet layered surfaces this library is supposed to produce (the same
// distinction lib/ai/validateTokens.ts draws between BORDER_CRITICAL_COMPONENTS
// and DECORATIVE_BORDER_FLOOR).
function controlBorderMix(surface: string, ink: string): string {
  const TARGET_RATIO = 3;
  const MAX_AMOUNT = 0.5;
  let amount = 0.12;
  let border = mix(surface, ink, amount);
  while (getContrastRatio(surface, border) < TARGET_RATIO && amount < MAX_AMOUNT) {
    amount += 0.02;
    border = mix(surface, ink, amount);
  }
  return border;
}

// Role block for one scope, emitted after generateExportCode's output at
// identical specificity so source order wins without !important. `variant`
// is a real parameter, not always-light, because the canvas has a working
// dark mode that needs tokens.dark to avoid dark-mode text at light contrast.
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
  const borderStrong = controlBorderMix(palette.surface, palette.ink);
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
    `  --pg-border-strong: ${borderStrong};`,
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
