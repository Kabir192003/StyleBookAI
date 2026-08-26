// A Theme composes Color + Font + TypeScale into a named design system.
// `colorRoles` maps semantic names (primary/background/text…) to hex values
// so components can apply a theme without knowing which colors it uses.
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
  // Independent anchor for body copy — when set, `sizes.base`/`sizes.xs`
  // (the two "body" face steps, see SEMANTIC_TYPE_ROLES) are computed from
  // this instead of `baseSize`, so a person can move body text size without
  // dragging every heading with it. Optional and additive: existing
  // TypeScale values (AI-generated projects, saved themes, tests) with no
  // bodyBaseSize behave exactly as before, one ladder from one base.
  bodyBaseSize?: number;
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
