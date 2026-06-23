/**
 * Font type and its vocabulary unions.
 *
 * `googleFontsId` is the exact string used in a Google Fonts URL — keep
 * it accurate so next/font/google can load the face without a network
 * lookup at build time. `pairsWith` holds ids of fonts that complement
 * this one, used by the AI to suggest heading/body pairings. `note` works
 * the same as on Color — one editorial sentence, required per font.
 */
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
  /**
   * Short, evergreen editorial note shown behind the "i" info button on
   * every font card in manual/browse mode. One or two sentences, written
   * once per font. See docs/PRODUCT_AND_UX.md §6.
   */
  note: string;
};
