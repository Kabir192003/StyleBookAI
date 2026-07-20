/**
 * Pure color math utilities — no React, no side effects.
 *
 * `hexToRgb` and `rgbToHsl` are the low-level converters used by the
 * data transform script (scripts/transformColors.ts) to pre-compute RGB
 * and HSL at seed time so components never do this at render.
 * `buildColor` is the only intended entry point for creating a Color
 * object — it derives rgb/hsl from hex and enforces that `note` is
 * supplied, preventing colors from shipping without editorial copy.
 */
import { Color } from "@/types";

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

export function rgbToHsl(r: number, g: number, b: number) {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;
  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rN:
        h = (gN - bN) / d + (gN < bN ? 6 : 0);
        break;
      case gN:
        h = (bN - rN) / d + 2;
        break;
      case bN:
        h = (rN - gN) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// WCAG 2.x relative luminance + contrast ratio — used by Preview Lab and
// the theme detail page to report real, computed contrast, not a guess.
function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getWcagLevel(ratio: number): "AAA" | "AA" | "Fail" {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "Fail";
}

// `note` is required on Color, so any caller of buildColor() is forced to
// write the editorial note at the point of data entry — it can't be added
// "later" by accident, since every shade ships with one from creation.
export function buildColor(
  partial: Omit<Color, "rgb" | "hsl">
): Color {
  const rgb = hexToRgb(partial.hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return { ...partial, rgb, hsl };
}
