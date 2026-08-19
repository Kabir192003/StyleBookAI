// `googleFontsId` is the exact string used in a Google Fonts URL — keep it
// accurate so next/font/google can load the face without a network lookup
// at build time. `pairsWith` holds ids of fonts that complement this one,
// used by the AI to suggest heading/body pairings.
export type FontCategory =
  | "sans-serif"
  | "serif"
  | "display"
  | "monospace"
  | "handwriting"
  | "variable";

export type FontUseCase = "heading" | "body" | "accent" | "code";

export type Font = {
  id: string;
  family: string;
  category: FontCategory;
  variants: string[];
  mood: string[];
  style: string[];
  era: string;
  useCase: FontUseCase[];
  googleFontsId: string;
  isPro: boolean;
  pairsWith: string[];
  note: string; // editorial blurb behind the "i" info button, see docs/PRODUCT_AND_UX.md §6
};
