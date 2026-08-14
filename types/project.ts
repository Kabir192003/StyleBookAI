/**
 * Project and AIReasoning — the unit a user assembles and saves.
 *
 * A Project can be built manually (Studio) or AI-generated (/studio/ai).
 * When AI-generated, `aiPrompt` stores the original user prompt and
 * `aiReasoning` stores the four explanatory strings the model returns
 * alongside its color/font choices — this reasoning is the core
 * differentiator and must always be surfaced prominently in the UI.
 */
import { Color } from "./color";
import { Font } from "./font";
import { Theme, TypeScale } from "./theme";
import { SpacingScale, ShadowScale, CornerRadiusScale, MoodboardImage } from "./designTokens";
import { DesignSystem } from "./designSystem";
import { PrimitiveColor, ColorValue } from "@/lib/studio/tokenGraph";
import { PlaygroundState } from "@/lib/playground/types";

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
  // The Design Playground's board: the experiment cards plus the swatch and
  // font trays (docs/DESIGN_PLAYGROUND.md §16). Optional/additive like the
  // two fields above — a project saved before the playground existed simply
  // has none and opens with the seed experiments.
  //
  // Written only by an explicit "Save playground", never automatically: the
  // playground is a scratch surface, and silently persisting every throwaway
  // experiment would resurrect abandoned work on the next visit (see the
  // header of store/playgroundStore.ts, which is deliberately unpersisted for
  // the same reason).
  playground?: PlaygroundState;
  context?: AIContext;
  theme?: Pick<Theme, "id" | "slug" | "name">;
  aiGenerated: boolean;
  aiPrompt?: string;
  aiReasoning?: AIReasoning;
  createdAt: string;
  updatedAt: string;
};
