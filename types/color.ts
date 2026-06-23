export type ColorFamily =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "purple"
  | "pink"
  | "brown"
  | "neutral";

export type ColorMood =
  | "calm"
  | "energetic"
  | "warm"
  | "cool"
  | "luxurious"
  | "playful"
  | "earthy"
  | "moody";

export type ColorStyle =
  | "minimal"
  | "bold"
  | "vintage"
  | "modern"
  | "pastel"
  | "neon"
  | "muted";

export type Color = {
  id: string;
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  family: ColorFamily;
  mood: ColorMood[];
  style: ColorStyle[];
  collection: string;
  isPro: boolean;
  /**
   * Short, evergreen editorial note shown behind the "i" info button on
   * every color card in manual/browse mode. One or two sentences, written
   * once per color — independent of any AI generation. Not optional: every
   * color needs one before it ships. See docs/PRODUCT_AND_UX.md §6.
   */
  note: string;
};
