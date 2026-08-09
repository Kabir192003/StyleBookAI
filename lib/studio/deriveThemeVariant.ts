/**
 * Derives a full ThemeVariantTokens (the shape a Project's designSystem
 * needs, see types/designSystem.ts) from Studio's simpler 5-token
 * palette. Used so that saving a project never silently drops the
 * palette Studio isn't currently viewing — see lib/studio/projectFromState.ts,
 * which calls this once per mode (light + dark) so both survive Save,
 * not just whichever one was on screen when the user clicked it.
 *
 * The mapping is a deliberate, documented convention — not a guess:
 *   colorRoles.background/surface -> the palette's surface
 *   colorRoles.text               -> ink
 *   colorRoles.textMuted          -> muted
 *   colorRoles.border             -> ink mixed 12% into surface
 *   components.button             -> accent bg, readable text
 *   components.buttonSecondary    -> support bg, readable text
 */
import { PaletteTokens } from "./exportCode";
import { DesignSystem, ThemeVariantTokens } from "@/types/designSystem";
import { getContrastRatio } from "@/lib/colors/colorUtils";

function onColor(hex: string): string {
  return getContrastRatio(hex, "#FBF8F2") >= getContrastRatio(hex, "#141110") ? "#FBF8F2" : "#141110";
}

// Blends `mixHex` into `baseHex` at `amount` (0-1) — a plain hex mix, the
// data-side equivalent of the CSS `color-mix()` calls used elsewhere in
// Studio's live preview (border tones, muted overlays), since a saved
// design-system value has to be a real hex, not a CSS function.
function mix(baseHex: string, mixHex: string, amount: number): string {
  const b = parseInt(baseHex.replace("#", ""), 16);
  const m = parseInt(mixHex.replace("#", ""), 16);
  const channel = (shift: number) => {
    const bc = (b >> shift) & 255;
    const mc = (m >> shift) & 255;
    return Math.round(bc + (mc - bc) * amount);
  };
  const r = channel(16);
  const g = channel(8);
  const bch = channel(0);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bch).toString(16).slice(1)}`;
}

export function deriveThemeVariantFromPalette(palette: PaletteTokens): ThemeVariantTokens {
  return {
    colorRoles: {
      background: palette.surface,
      surface: palette.surface,
      text: palette.ink,
      textMuted: palette.muted,
      border: mix(palette.surface, palette.ink, 0.12),
    },
    components: {
      button: { background: palette.accent, text: onColor(palette.accent) },
      buttonSecondary: { background: palette.support, text: onColor(palette.support) },
    },
  };
}

// Powers Studio's "Enable component tokens" action — lets a from-scratch
// manual build opt into the same advanced design-system surface
// (DesignSystemGallery: per-component tokens, accessibility, icon style,
// grid, breakpoints) that previously only ever existed on AI-seeded
// projects, with sensible starting defaults rather than an empty shell.
export function synthesizeDesignSystemFromPalettes(light: PaletteTokens, dark: PaletteTokens): DesignSystem {
  return {
    light: deriveThemeVariantFromPalette(light),
    dark: deriveThemeVariantFromPalette(dark),
    accessibility: {
      level: "AA",
      notes: ["Starter accessibility target — replace with real contrast findings for the components you add."],
    },
    iconStyle: { style: "line", strokeWidth: 1.5, note: "Default starting point — adjust to match your brand." },
    grid: { columns: 12, gutter: 24, maxWidth: 1200 },
    breakpoints: { sm: 640, md: 768, lg: 1024, xl: 1280 },
  };
}
