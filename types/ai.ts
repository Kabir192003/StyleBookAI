import { ColorStyle } from "./color";

export type AIGenerateRequest = {
  prompt: string;
  style?: ColorStyle[];
  colorPreferences?: string[];
  avoid?: string[];
};
