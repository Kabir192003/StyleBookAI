/**
 * Fixed corner-radius scale — AI Generate picks which value best fits the
 * brand (sharp/minimal vs soft/friendly), the option set itself stays fixed
 * so results are always a real, renderable radius.
 */
import { CornerRadiusScale } from "@/types/designTokens";

export const RADIUS_OPTIONS = [4, 8, 12, 20];

export function buildRadiusScale(recommended: number): CornerRadiusScale {
  const resolved = RADIUS_OPTIONS.includes(recommended) ? recommended : 8;
  return { options: RADIUS_OPTIONS, recommended: resolved };
}
