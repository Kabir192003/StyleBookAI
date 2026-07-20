/**
 * Spacing, shadow, corner-radius, and moodboard types — the additional
 * design tokens AI Generate produces alongside colors/fonts/typeScale.
 * See lib/designTokens/ for the generators and data/moodboards.ts for the
 * curated image library.
 */

export type SpacingScale = {
  base: number; // px
  steps: number[]; // computed spacing values in px, smallest to largest
};

export type ShadowLevelName = "none" | "subtle" | "dramatic";

export type ShadowScale = {
  levels: Array<{ name: ShadowLevelName; value: string }>;
  recommended: ShadowLevelName;
};

export type CornerRadiusScale = {
  options: number[]; // px
  recommended: number;
};

export type MoodboardImage = {
  id: string;
  src: string;
  alt: string;
  mood: string[];
};
