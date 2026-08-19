// A Project can be built manually (Studio) or AI-generated (/studio/ai).
// When AI-generated, `aiReasoning` stores the four explanatory strings the
// model returns alongside its color/font choices — this is the core
// differentiator and should always be surfaced prominently in the UI.
import { Color } from "./color";
import { Font } from "./font";
import { Theme, TypeScale } from "./theme";
import { SpacingScale, ShadowScale, CornerRadiusScale, MoodboardImage } from "./designTokens";
import { DesignSystem } from "./designSystem";
import { PrimitiveColor, ColorValue } from "@/lib/studio/tokenGraph";

export type AIReasoning = {
  palette: string;
  fonts: string;
  typeScale: string;
  overall: string;
};

// Drives which mock preview layout the AI results page renders — see
// components/ai/PromptInput.tsx.
export type AIContext = "saas" | "ecommerce" | "government" | "editorial" | "generic";

export type Project = {
  id: string;
  userId: string;
  name: string;
  description?: string;
  colors: Array<Color & { role?: string }>;
  fonts: { primary: Font; secondary: Font; accent?: Font };
  typeScale: TypeScale;
  spacing?: SpacingScale;
  shadows?: ShadowScale;
  cornerRadius?: CornerRadiusScale;
  moodboard?: MoodboardImage[];
  // Only present when AI Generate was asked for a full design system
  // (component tokens/states, light+dark, accessibility, icon style, grid,
  // breakpoints) rather than just a palette/font/type-scale — see
  // types/designSystem.ts.
  designSystem?: DesignSystem;
  // Studio's color token graph — optional, additive. Old projects saved
  // before this existed simply don't have it and fall back to the literal
  // hex already in `colors`/`designSystem`, exactly as before. When
  // present, restores which palette role links to which named primitive
  // on reload, rather than just the resolved hex.
  colorPrimitives?: PrimitiveColor[];
  studioPaletteLinks?: {
    light: { accent: ColorValue; support: ColorValue; surface: ColorValue; ink: ColorValue; muted: ColorValue };
    dark: { accent: ColorValue; support: ColorValue; surface: ColorValue; ink: ColorValue; muted: ColorValue };
  };
  context?: AIContext;
  theme?: Pick<Theme, "id" | "slug" | "name">;
  aiGenerated: boolean;
  aiPrompt?: string;
  aiReasoning?: AIReasoning;
  createdAt: string;
  updatedAt: string;
};
