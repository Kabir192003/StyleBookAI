/**
 * Pure type-scale math — no React, no side effects.
 *
 * Given a base size and a ratio, computes the full ladder used by
 * TypeScale.sizes. Shared by the AI route (which picks a ratio by name)
 * and the Studio manual builder (which lets the user pick a ratio directly).
 */
import { TypeScale } from "@/types/theme";

export const TYPE_SCALE_RATIOS: Record<string, number> = {
  "Minor Second": 1.067,
  "Major Second": 1.125,
  "Minor Third": 1.2,
  "Major Third": 1.25,
  "Perfect Fourth": 1.333,
  "Augmented Fourth": 1.414,
  "Perfect Fifth": 1.5,
  "Golden Ratio": 1.618,
};

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function generateTypeScale(baseSize: number, ratioName: string, bodyBaseSize?: number): TypeScale {
  const ratio = TYPE_SCALE_RATIOS[ratioName] ?? TYPE_SCALE_RATIOS["Major Third"];

  const base = baseSize;
  const xs = base / ratio;
  const sm = base / Math.sqrt(ratio);
  const lg = base * ratio;
  const xl = lg * ratio;
  const xl2 = xl * ratio;
  const xl3 = xl2 * ratio;
  const xl4 = xl3 * ratio;
  const xl5 = xl4 * ratio;
  const xl6 = xl5 * ratio;

  // Body and caption (SEMANTIC_TYPE_ROLES' two "body"-face steps) get their
  // own anchor when bodyBaseSize is given, same ratio, so a person can move
  // body text size without dragging every heading with it — see the
  // bodyBaseSize comment on TypeScale.
  const bodyAnchor = bodyBaseSize ?? base;
  const bodyXs = bodyAnchor / ratio;

  return {
    baseSize: base,
    ratio,
    ratioName,
    ...(bodyBaseSize !== undefined ? { bodyBaseSize } : {}),
    sizes: {
      xs: round(bodyXs),
      sm: round(sm),
      base: round(bodyAnchor),
      lg: round(lg),
      xl: round(xl),
      "2xl": round(xl2),
      "3xl": round(xl3),
      "4xl": round(xl4),
      "5xl": round(xl5),
      "6xl": round(xl6),
    },
  };
}
