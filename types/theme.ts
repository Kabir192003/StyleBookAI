/**
 * Theme, TypeScale, and ThemeCategory types.
 *
 * A Theme is the highest-level unit in the library: it composes Color +
 * Font + TypeScale into a named, categorised design system. `colorRoles`
 * maps semantic names (primary/background/text…) to hex values so
 * components can apply a theme without knowing which specific colors it uses.
 * `TypeScale` stores the computed size ladder alongside the ratio that
 * generated it so the UI can reconstruct or tweak it later.
 */
import { Color } from "./color";
import { Font } from "./font";

export type ThemeCategory =
  | "minimal"
  | "bold"
  | "luxury"
  | "playful"
  | "earthy"
  | "tech"
  | "elegant"
  | "retro"
  | "neon"
  | "coastal"
  | "editorial"
  | "brutalist";

export type TypeScale = {
  baseSize: number;
  ratio: number;
  ratioName: string;
  sizes: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    "2xl": number;
    "3xl": number;
    "4xl": number;
    "5xl": number;
    "6xl": number;
  };
};

export type Theme = {
  id: string;
  slug: string;
  name: string;
  category: ThemeCategory;
  tags: string[];
  description: string;
  colors: Color[];
  colorRoles: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  primaryFont: Font;
  secondaryFont: Font;
  accentFont?: Font;
  typeScale: TypeScale;
  isPro: boolean;
  thumbnail: string;
};
