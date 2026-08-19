// Optional "full design system" tokens AI Generate can produce alongside
// the core palette/fonts/type-scale, when the user opts in via the
// "Generate a full design system" checkbox in <PromptInput />. See
// lib/ai/schema.ts for the zod mirror and docs/TECHNICAL_ARCHITECTURE.md §6.

export type ComponentTokenSet = {
  background: string; // hex
  text: string; // hex
  border?: string; // hex
  states?: Partial<
    Record<"hover" | "active" | "disabled" | "focus", { background?: string; text?: string; border?: string }>
  >;
};

export type ComponentName =
  | "button"
  | "buttonSecondary"
  | "input"
  | "dropdown"
  | "card"
  | "navigation"
  | "table"
  | "modal"
  | "alert"
  | "badge";

export type ComponentTokens = Partial<Record<ComponentName, ComponentTokenSet>>;

export type ThemeVariantTokens = {
  colorRoles: {
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
  };
  components: ComponentTokens;
};

export type AccessibilityNotes = {
  level: "AA" | "AAA";
  notes: string[];
};

export type IconStyle = {
  style: "line" | "solid" | "duotone";
  strokeWidth?: number;
  note: string;
};

export type GridSystem = {
  columns: number;
  gutter: number; // px
  maxWidth: number; // px
};

export type Breakpoints = {
  sm: number; // px
  md: number;
  lg: number;
  xl: number;
};

export type DesignSystem = {
  light: ThemeVariantTokens;
  dark?: ThemeVariantTokens;
  accessibility?: AccessibilityNotes;
  iconStyle?: IconStyle;
  grid?: GridSystem;
  breakpoints?: Breakpoints;
};
