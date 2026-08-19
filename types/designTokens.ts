// Spacing, shadow, corner-radius, and moodboard types — additional design
// tokens AI Generate produces alongside colors/fonts/typeScale. See
// lib/designTokens/ for the generators.

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
  // Unsplash's API terms require crediting the photographer + Unsplash
  // wherever a photo is shown — present whenever the image is real
  // Unsplash content (absent for the handful of self-hosted starter photos).
  credit?: {
    photographerName: string;
    photographerUrl: string;
    unsplashUrl: string;
  };
};
