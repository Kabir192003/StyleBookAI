// `family` / `mood` / `style` power the filter bar in /browse/colors.
// `note` is a required editorial blurb shown behind the "i" button on
// every color card — every entry needs one, see docs/PRODUCT_AND_UX.md §6.
// `isPro` is reserved for a future billing phase; nothing branches on it yet.
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
  note: string;
};
