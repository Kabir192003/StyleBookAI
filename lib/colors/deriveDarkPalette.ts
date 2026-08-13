/**
 * Deterministic per-brand dark palette derivation.
 *
 * The defect this exists to kill: dark mode used to be optional in the AI
 * contract (`dark: themeVariantTokensSchema.optional()` in lib/ai/schema.ts,
 * "only include if the brief asks for a dark theme" in lib/ai/prompt.ts), so
 * the model usually omitted it and StudioBuilder's hardcoded DEFAULT_DARK
 * took over — accent #8B5CF6, support #22D3EE, surface #121022, ink #E6E1F5,
 * muted #6B6483. QA generated three unrelated brands ("Aesthetic Portfolio",
 * "PulseMetrics Dashboard", "Neon Vortex") and got byte-identical dark
 * palettes: the same five violet hexes, on brands that share nothing.
 *
 * The fix has to be code-side and deterministic, otherwise it regresses the
 * first time the model has a bad day. Everything below is derived from the
 * brand's *own* light palette:
 *
 *   - Hue is preserved everywhere. The dark surface ramp is tinted with the
 *     brand's accent hue, so a terracotta brand gets a warm near-black and a
 *     teal brand gets a cool one — never a fixed #121022.
 *   - Lightness is remapped, not inverted naively: surfaces collapse into a
 *     narrow dark band with real elevation steps, inks rise into a narrow
 *     light band, and the accent moves only as far as legibility demands.
 *   - The accent stays recognisably the same brand colour (same hue, similar
 *     saturation) and is only lifted until it clears the dark surface as a
 *     UI element (3:1, WCAG SC 1.4.11).
 *
 * Consumers: lib/studio/deriveThemeVariant.ts (component-level dark variant)
 * and lib/ai/generate.ts (guarantees designSystem.dark always exists).
 */
import {
  AA_LARGE_TEXT,
  AA_NORMAL_TEXT,
  contrast,
  ensureContrast,
  fromHsl,
  hueOf,
  lightnessOf,
  normalizeHex,
  saturationOf,
  withLightness,
} from "./contrast";

/**
 * The five-slot brand palette Studio speaks in (accent/support/surface/ink/
 * muted). Declared structurally here rather than importing PaletteTokens
 * from lib/studio/exportCode.ts so lib/colors stays free of Studio imports —
 * lib/studio/deriveThemeVariant.ts does the adapting.
 */
export type BrandPalette = {
  accent: string;
  support: string;
  surface: string;
  ink: string;
  muted: string;
};

// The dark ramp's lightness targets, as fractions. These are the numbers a
// designer reaches for building a dark theme by hand: a near-black page, a
// slightly lifted card surface so elevation reads, an off-white ink that
// isn't pure #fff (which glares on OLED), and a muted tone with enough room
// left to still clear 4.5:1 against the surface.
const DARK_BACKGROUND_L = 0.07;
const DARK_SURFACE_L = 0.115;
const DARK_INK_L = 0.945;
const DARK_MUTED_L = 0.66;
const DARK_BORDER_L = 0.22;

// How much of the brand's chroma survives into the near-black ramp. Enough
// that a warm brand's dark mode reads warm; low enough that it still reads
// as "dark grey", not "dark red".
const SURFACE_TINT_RATIO = 0.45;
const SURFACE_TINT_MAX = 0.16;
const INK_TINT_MAX = 0.1;
const MUTED_TINT_MAX = 0.14;

// Below this saturation a colour carries no usable hue signal, so the ramp
// falls back to the *accent's* hue rather than tinting with noise.
const NEUTRAL_SATURATION = 0.06;

/**
 * The hue this brand's dark ramp should be tinted with: the accent's if it
 * has one, else the support colour's, else the light surface's, else none
 * (a true neutral ramp). Picking a single ramp hue — rather than tinting
 * each token with its own — is what makes the resulting dark theme read as
 * one coherent surface system instead of five unrelated greys.
 */
export function brandRampHue(palette: BrandPalette): { hue: number | null; saturation: number } {
  const ordered = [palette.accent, palette.support, palette.surface, palette.ink, palette.muted];
  for (const hex of ordered) {
    const s = saturationOf(hex);
    const h = hueOf(hex);
    if (h !== null && s > NEUTRAL_SATURATION) return { hue: h, saturation: s };
  }
  return { hue: hueOf(palette.accent), saturation: saturationOf(palette.accent) };
}

/**
 * Re-lights a brand colour so it works as a fill/accent on a dark surface
 * while staying the same colour. Hue is fixed; saturation is nudged up
 * slightly because a dark background eats perceived chroma; lightness moves
 * only as far as needed to clear `minRatio` against the surface.
 *
 * This is what stops the "Neon Vortex" failure mode QA saw, where the dark
 * accent was byte-identical to the light accent (the light palette simply
 * leaked through untouched).
 */
export function adaptAccentForDark(
  accentHex: string,
  darkSurfaceHex: string,
  minRatio: number = AA_LARGE_TEXT
): string {
  const hex = normalizeHex(accentHex);
  const hue = hueOf(hex);
  const saturation = saturationOf(hex);
  const lightness = lightnessOf(hex);

  // A near-neutral "accent" (the #f0f0ef-as-primary case QA hit) has no
  // chroma to preserve, so give it a floor — an action colour that is
  // indistinguishable from the surface cannot carry primary actions. The
  // deviation is reported by lib/ai/validateTokens.ts.
  const boosted = saturation < 0.12 && hue !== null ? Math.max(saturation, 0.34) : saturation;

  // Dark-mode accents live in the upper-middle of the lightness range:
  // a light-mode 25%-lightness navy is invisible on a near-black page.
  const target = Math.min(0.72, Math.max(lightness, 0.55));
  const candidate = fromHsl(hue, Math.min(1, boosted * 1.05), target);

  return ensureContrast(candidate, darkSurfaceHex, minRatio).hex;
}

/**
 * The whole point of this file: a dark five-slot palette derived from the
 * light one, mathematically, with no fixed hexes anywhere in the output.
 *
 * Verified in the fixture run against the exact three QA brands — the three
 * dark palettes that used to be byte-identical now share no hex at all.
 */
export function deriveDarkPaletteFromLight(light: BrandPalette): BrandPalette {
  const { hue, saturation } = brandRampHue(light);

  const surfaceTint = Math.min(saturation * SURFACE_TINT_RATIO, SURFACE_TINT_MAX);
  const background = fromHsl(hue, surfaceTint, DARK_BACKGROUND_L);
  const surface = fromHsl(hue, surfaceTint * 0.92, DARK_SURFACE_L);

  const accent = adaptAccentForDark(light.accent, surface);
  // The support colour is held to the same rule as the accent so a
  // secondary button stays a legible, on-brand fill rather than a
  // near-invisible smudge.
  const support = adaptAccentForDark(light.support, surface);

  // Ink and muted keep the *ink's* own hue where it has one (some brands
  // deliberately use a tinted body colour), falling back to the ramp hue.
  const inkHue = saturationOf(light.ink) > NEUTRAL_SATURATION ? hueOf(light.ink) : hue;
  const ink = fromHsl(inkHue, Math.min(saturationOf(light.ink), INK_TINT_MAX), DARK_INK_L);

  const mutedHue = saturationOf(light.muted) > NEUTRAL_SATURATION ? hueOf(light.muted) : hue;
  const mutedCandidate = fromHsl(mutedHue, Math.min(saturationOf(light.muted), MUTED_TINT_MAX), DARK_MUTED_L);
  // Muted text is still text: it must clear 4.5:1 on the surface it sits on,
  // which is exactly the check that was missing when #f8fafc shipped on
  // #f8f7f7 (1.02:1) in light mode.
  const muted = ensureContrast(mutedCandidate, surface, AA_NORMAL_TEXT).hex;

  return { accent, support, surface, ink, muted };
}

/** The background/border tones that pair with deriveDarkPaletteFromLight. */
export function deriveDarkSurfaceRamp(light: BrandPalette): {
  background: string;
  surface: string;
  border: string;
} {
  const { hue, saturation } = brandRampHue(light);
  const surfaceTint = Math.min(saturation * SURFACE_TINT_RATIO, SURFACE_TINT_MAX);
  return {
    background: fromHsl(hue, surfaceTint, DARK_BACKGROUND_L),
    surface: fromHsl(hue, surfaceTint * 0.92, DARK_SURFACE_L),
    // Borders are non-text UI: they need to be *visible* against the
    // background (3:1 is the WCAG non-text bar) without becoming a second
    // ink colour.
    border: ensureContrast(fromHsl(hue, surfaceTint * 1.4, DARK_BORDER_L), fromHsl(hue, surfaceTint, DARK_BACKGROUND_L), 1.6)
      .hex,
  };
}

/**
 * True when `palette` is the stock violet DEFAULT_DARK from
 * components/studio/StudioBuilder.tsx (or a near-copy of it). Used by
 * lib/ai/generate.ts to reject a model-supplied dark theme that is really
 * just the app's own placeholder echoed back — the precise regression QA
 * caught across three unrelated brands.
 */
const STOCK_DARK_HEXES = ["#8b5cf6", "#22d3ee", "#121022", "#e6e1f5", "#6b6483"];

export function looksLikeStockDark(hexes: string[]): boolean {
  const normalized = new Set(hexes.map((h) => normalizeHex(h)));
  const overlap = STOCK_DARK_HEXES.filter((h) => normalized.has(h)).length;
  return overlap >= 3;
}

/**
 * Quality gate for a model-authored dark variant. A dark theme that isn't
 * actually dark, or that just re-serves the light palette (the "Neon Vortex"
 * case: dark accent/ink/muted identical to the light ones), is worse than no
 * dark theme at all because it silently looks broken — better to throw it
 * away and derive one.
 */
export function darkPaletteIsUsable(dark: BrandPalette, light: BrandPalette): boolean {
  if (looksLikeStockDark([dark.accent, dark.support, dark.surface, dark.ink, dark.muted])) return false;
  // A dark surface that isn't dark is not a dark theme.
  if (lightnessOf(dark.surface) > 0.3) return false;
  // Ink must actually read on it — a light-mode ink left in place won't.
  if (contrast(dark.ink, dark.surface) < 3) return false;
  // Three or more slots identical to the light palette means the model
  // copied rather than designed.
  const copied = (["accent", "support", "ink", "muted"] as const).filter(
    (slot) => normalizeHex(dark[slot]) === normalizeHex(light[slot])
  ).length;
  return copied < 3;
}

/** Slightly lifts a hex for a dark-mode hover state (dark UIs brighten). */
export function liftForDarkState(hex: string, amount: number): string {
  return withLightness(hex, Math.min(0.95, lightnessOf(hex) + amount));
}
