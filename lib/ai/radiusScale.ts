// Named corner-radius scale for AI-generated projects. Unlike
// lib/designTokens/radius.ts's fixed `{options, recommended}` shape, this
// derives a real ramp (sm/md/lg/pill) from the model's own chosen base, and
// allows `0` as a legal base (needed for brutalist/hard-corner briefs). Rides
// alongside the existing CornerRadiusScale as AIGeneratedProject.radiusScale
// (types/ai.ts) rather than replacing it, so existing consumers are unaffected.
import { CornerRadiusScale } from "@/types/designTokens";
import { NamedRadiusScale } from "@/types/ai";

// Values the model may choose from; anything else it returns snaps to the
// nearest entry. Includes 0 for brutalist/square-corner brands.
export const RADIUS_BASE_OPTIONS = [0, 2, 4, 6, 8, 10, 12, 16, 20, 24];

export function snapRadiusBase(value: number | undefined, fallback = 8): number {
  if (value === undefined || Number.isNaN(value)) return fallback;
  const clamped = Math.min(24, Math.max(0, value));
  return RADIUS_BASE_OPTIONS.reduce((best, option) =>
    Math.abs(option - clamped) < Math.abs(best - clamped) ? option : best
  );
}

// Derives the named ramp from the brand's base radius. A base of 0 zeroes the
// *whole* ramp including `full` — a hard-corners brand shouldn't get a
// pill-shaped avatar sneaking back in via a different token.
export function buildNamedRadiusScale(base: number): NamedRadiusScale {
  const md = snapRadiusBase(base);
  if (md === 0) {
    return { none: 0, sm: 0, md: 0, lg: 0, full: 0, base: "md" };
  }
  return {
    none: 0,
    sm: Math.max(2, Math.round(md / 2)),
    md,
    lg: Math.round(md * 1.75),
    // 9999 rather than 50%: the token is consumed as a px value by
    // lib/export/generators.ts and Studio, where a large constant is the
    // conventional pill idiom and behaves correctly at any element size.
    full: 9999,
    base: "md",
  };
}

/**
 * The `CornerRadiusScale` shape the rest of the app already consumes, with
 * the derived ramp as its options instead of the old fixed four. `full` is
 * deliberately left out of `options` — it is a semantic choice ("pill"), not
 * a step on a size ramp, and putting 9999 in a picker would be nonsense.
 */
export function buildRadiusScaleFromBase(base: number): CornerRadiusScale {
  const scale = buildNamedRadiusScale(base);
  const options = Array.from(new Set([scale.none, scale.sm, scale.md, scale.lg])).sort((a, b) => a - b);
  return { options, recommended: scale.md };
}
