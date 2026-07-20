/**
 * Fixed 3-tier shadow system — same values already used as the landing
 * page's own interactive shadow demo (components/landing/ScrollInteractive.tsx),
 * reused here so the design tokens AI Generate returns match what the rest
 * of the app already treats as "the" shadow scale.
 */
import { ShadowLevelName, ShadowScale } from "@/types/designTokens";

export const SHADOW_LEVELS: Array<{ name: ShadowLevelName; value: string }> = [
  { name: "none", value: "none" },
  { name: "subtle", value: "0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" },
  { name: "dramatic", value: "0 8px 30px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.06)" },
];

export function buildShadowScale(recommended: ShadowLevelName): ShadowScale {
  return { levels: SHADOW_LEVELS, recommended };
}
