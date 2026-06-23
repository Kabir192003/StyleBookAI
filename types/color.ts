/**
 * Color type and its vocabulary unions.
 *
 * `family` / `mood` / `style` power the filter bar in /browse/colors.
 * `collection` groups colors by origin (e.g. "tailwind", "curated").
 * `note` is a required one-sentence editorial blurb shown behind the "i"
 * button — every color must have one; buildColor() in lib/colors enforces
 * this at the type level so it can't be forgotten at data-entry time.
 * `isPro` is reserved for a future billing phase; nothing branches on it yet.
 */
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
