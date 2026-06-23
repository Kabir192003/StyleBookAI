import { Color } from "./color";
import { Font } from "./font";
import { Theme, TypeScale } from "./theme";

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
  theme?: Pick<Theme, "id" | "slug" | "name">;
  aiGenerated: boolean;
  aiPrompt?: string;
  aiReasoning?: AIReasoning;
  createdAt: string;
  updatedAt: string;
};
