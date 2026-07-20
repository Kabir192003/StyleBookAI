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

export type AIReasoning = {
  palette: string;
  fonts: string;
  typeScale: string;
  overall: string;
};

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
  theme?: Pick<Theme, "id" | "slug" | "name">;
  aiGenerated: boolean;
  aiPrompt?: string;
  aiReasoning?: AIReasoning;
  createdAt: string;
  updatedAt: string;
};
