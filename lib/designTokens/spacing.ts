/**
 * Spacing scale generator — pure function, mirrors
 * lib/typeScale/generateTypeScale.ts's pattern. AI Generate picks a base
 * unit (4 or 8px, the two common systems); the step multipliers are fixed
 * so every generated scale stays a coherent, real spacing system.
 */
import { SpacingScale } from "@/types/designTokens";

export const SPACING_BASE_OPTIONS = [4, 8] as const;

const STEP_MULTIPLIERS = [1, 2, 3, 4, 6, 8, 12, 16];

export function generateSpacingScale(base: number): SpacingScale {
  const resolvedBase = SPACING_BASE_OPTIONS.includes(base as 4 | 8) ? base : 4;
  return {
    base: resolvedBase,
    steps: STEP_MULTIPLIERS.map((m) => m * resolvedBase),
  };
}
