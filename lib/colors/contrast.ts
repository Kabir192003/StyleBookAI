// Hue-preserving contrast repair — the pure math lib/ai/validateTokens.ts
// leans on to measure and fix contrast after the model responds, since the
// model itself can't be trusted to get ratios right. Ratios come from
// getContrastRatio() in ./colorUtils (WCAG 2.x relative luminance), the same
// function ContrastBadge and the theme pages use, so a badge in the UI and a
// repair here can never disagree.
//
// Repair strategy: walk the foreground's HSL lightness while holding hue and
// saturation fixed, taking the smallest move that clears the target — hue is
// what makes a token feel like *this* brand, so it's never touched. A full
// 0-100 sweep finds a solution whenever one exists; when one genuinely
// doesn't, that's reported honestly rather than papered over (see the
// "could not be auto-fixed" line in the generated accessibility notes).
import chroma from "chroma-js";
import { getContrastRatio } from "./colorUtils";

// WCAG 2.1 thresholds. AA_LARGE (3:1) is also the SC 1.4.11 non-text
// threshold, which is what we hold UI boundaries (borders, button fills
// against the page) to — a 1px divider is not body copy and forcing 4.5:1
// on it would wreck every calm, low-contrast surface treatment.
export const AA_NORMAL_TEXT = 4.5;
export const AA_LARGE_TEXT = 3;
export const AAA_NORMAL_TEXT = 7;

export type ContrastRepair = {
  hex: string;
  ratio: number;
  /** True when `hex` differs from the input — i.e. we had to move it. */
  repaired: boolean;
  /** True when even a full lightness sweep could not reach `target`. */
  unresolved: boolean;
  originalHex: string;
  originalRatio: number;
};

export function normalizeHex(hex: string): string {
  // chroma parses 3-digit shorthand fine, but every downstream consumer
  // (export generators, saved Project JSON, the Studio colour inputs) reads
  // and writes 6-digit lowercase — normalise once here so a model-supplied
  // "#fff" never round-trips as a different string than the same colour
  // picked from the catalog.
  return chroma(hex).hex().toLowerCase();
}

/**
 * Lightness of `hex` on a 0-1 scale. Used for polarity decisions ("is this
 * a dark surface?") rather than for contrast maths, which always goes
 * through getContrastRatio.
 */
export function lightnessOf(hex: string): number {
  const l = chroma(hex).get("hsl.l");
  return Number.isNaN(l) ? 0 : l;
}

export function saturationOf(hex: string): number {
  const s = chroma(hex).get("hsl.s");
  return Number.isNaN(s) ? 0 : s;
}

/**
 * Hue in degrees, or `null` for true neutrals where chroma reports NaN.
 * Callers that re-tint a neutral (the dark-surface ramp in
 * ./deriveDarkPalette) need to know the difference between "hue 0" (red)
 * and "no hue at all" (grey), which a plain 0 fallback would erase.
 */
export function hueOf(hex: string): number | null {
  const h = chroma(hex).get("hsl.h");
  return Number.isNaN(h) ? null : h;
}

export function withLightness(hex: string, lightness: number): string {
  return chroma(hex)
    .set("hsl.l", Math.min(1, Math.max(0, lightness)))
    .hex()
    .toLowerCase();
}

export function withSaturation(hex: string, saturation: number): string {
  return chroma(hex)
    .set("hsl.s", Math.min(1, Math.max(0, saturation)))
    .hex()
    .toLowerCase();
}

/** Builds a hex from explicit HSL, tolerating a null hue (renders grey). */
export function fromHsl(hue: number | null, saturation: number, lightness: number): string {
  if (hue === null) {
    return chroma.hsl(0, 0, Math.min(1, Math.max(0, lightness))).hex().toLowerCase();
  }
  return chroma
    .hsl(((hue % 360) + 360) % 360, Math.min(1, Math.max(0, saturation)), Math.min(1, Math.max(0, lightness)))
    .hex()
    .toLowerCase();
}

export function contrast(a: string, b: string): number {
  return getContrastRatio(normalizeHex(a), normalizeHex(b));
}

/** Rounds to 2dp for display/report use — never for comparisons. */
export function roundRatio(ratio: number): number {
  return Math.round(ratio * 100) / 100;
}

/**
 * Moves `foreground` along its own lightness axis until it clears `target`
 * against `background`, preserving hue and saturation.
 *
 * The sweep is symmetric (both lighter and darker) and picks the *smallest*
 * lightness delta that works, so a repair stays as close to the model's
 * intent as the maths allows — a slightly-too-pale muted grey gets nudged a
 * few percent, not slammed to black. Ties break toward the direction that
 * agrees with the background's polarity (go lighter on a dark background),
 * which is what a designer would do by hand.
 *
 * Step size is 1/200 of the lightness range: fine enough that repairs are
 * visually minimal, coarse enough to stay cheap inside a request handler.
 */
export function ensureContrast(
  foreground: string,
  background: string,
  target: number = AA_NORMAL_TEXT
): ContrastRepair {
  const fg = normalizeHex(foreground);
  const bg = normalizeHex(background);
  const originalRatio = contrast(fg, bg);

  if (originalRatio >= target) {
    return { hex: fg, ratio: originalRatio, repaired: false, unresolved: false, originalHex: fg, originalRatio };
  }

  const startL = lightnessOf(fg);
  const backgroundIsDark = lightnessOf(bg) < 0.5;
  const STEP = 1 / 200;

  let best: { hex: string; ratio: number; delta: number } | null = null;
  // Best-effort fallback for the unresolvable case: whatever got closest.
  let closest = { hex: fg, ratio: originalRatio };

  for (let step = 1; step <= 200; step++) {
    const delta = step * STEP;
    // Order matters only for exact ties — try the polarity-appropriate
    // direction first so an equal-delta tie resolves the way a designer
    // would resolve it.
    const candidates = backgroundIsDark
      ? [startL + delta, startL - delta]
      : [startL - delta, startL + delta];

    for (const l of candidates) {
      if (l < 0 || l > 1) continue;
      const candidate = withLightness(fg, l);
      const ratio = contrast(candidate, bg);
      if (ratio > closest.ratio) closest = { hex: candidate, ratio };
      if (ratio >= target) {
        best = { hex: candidate, ratio, delta };
        break;
      }
    }
    if (best) break;
  }

  if (best) {
    return {
      hex: best.hex,
      ratio: best.ratio,
      repaired: best.hex !== fg,
      unresolved: false,
      originalHex: fg,
      originalRatio,
    };
  }

  // No lightness of this hue clears the target against this background —
  // the caller (lib/ai/validateTokens.ts) reports this honestly in the
  // accessibility notes instead of shipping a silent failure.
  return {
    hex: closest.hex,
    ratio: closest.ratio,
    repaired: closest.hex !== fg,
    unresolved: true,
    originalHex: fg,
    originalRatio,
  };
}

/**
 * Picks the more legible of a brand-tinted light and dark ink for text
 * sitting on `background`, then guarantees the result actually clears
 * `target` (a mid-lightness fill can beat both, in which case we sweep).
 *
 * Prefers tinted inks over pure #fff/#000 so button labels still belong to
 * the brand — deriveThemeVariantFromPalette() in lib/studio/deriveThemeVariant.ts
 * has always done this with two fixed hexes; this version keeps the idea but
 * carries the background's own hue into the ink.
 */
export function readableInkOn(background: string, target: number = AA_NORMAL_TEXT): string {
  const bg = normalizeHex(background);
  const hue = hueOf(bg);
  const tint = Math.min(saturationOf(bg) * 0.35, 0.12);
  const light = fromHsl(hue, tint, 0.97);
  const dark = fromHsl(hue, tint, 0.09);

  const pick = contrast(light, bg) >= contrast(dark, bg) ? light : dark;
  return ensureContrast(pick, bg, target).hex;
}
