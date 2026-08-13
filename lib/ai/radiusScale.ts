/**
 * Named corner-radius scale for AI-generated projects.
 *
 * Spacing has always come back as a full progressive scale
 * (lib/designTokens/spacing.ts) while radius came back as a single number —
 * `buildRadiusScale()` in lib/designTokens/radius.ts returns a fixed
 * `{ options: [4, 8, 12, 20], recommended }`, so a generated system had one
 * flat corner value for buttons, cards and modals alike. Real interfaces need
 * a ramp: tight on inputs, softer on cards, softest on modals, plus a pill.
 *
 * Two things are fixed here at once:
 *   1. The ramp itself, derived from the model's chosen base so per-prompt
 *      variation survives (a base of 4 and a base of 16 produce genuinely
 *      different systems, not the same four numbers).
 *   2. `0` becomes reachable. The old option set forbade it, which is exactly
 *      why a QA prompt asking for "hard 0px corners" silently shipped 4px.
 *
 * This is additive on purpose: the numeric ramp is still handed to the
 * existing `CornerRadiusScale` (types/designTokens.ts, which this batch does
 * not own) via `options`, so lib/export/generators.ts and Studio keep working
 * unchanged, while the named mapping rides alongside on AIGeneratedProject as
 * `radiusScale` (types/ai.ts).
 */
import { CornerRadiusScale } from "@/types/designTokens";
import { NamedRadiusScale } from "@/types/ai";

/**
 * Values the model may choose from. Widened from [4, 8, 12, 20] — `0` for
 * brutalist/technical brands that genuinely want square corners, and finer
 * intermediate steps so "slightly soft" and "very soft" aren't the same
 * answer. Anything else the model returns snaps to the nearest entry.
 */
export const RADIUS_BASE_OPTIONS = [0, 2, 4, 6, 8, 10, 12, 16, 20, 24];

export function snapRadiusBase(value: number | undefined, fallback = 8): number {
  if (value === undefined || Number.isNaN(value)) return fallback;
  const clamped = Math.min(24, Math.max(0, value));
  return RADIUS_BASE_OPTIONS.reduce((best, option) =>
    Math.abs(option - clamped) < Math.abs(best - clamped) ? option : best
  );
}

/**
 * Derives the named ramp from the brand's base radius.
 *
 * A base of 0 zeroes the *whole* ramp including `full`: a brand that asked
 * for hard corners does not want pill-shaped avatars sneaking back in via a
 * different token. That is the concrete constraint-honouring behaviour the
 * "hard 0px corners" QA prompt was owed.
 */
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
