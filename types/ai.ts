/**
 * Request/response shapes for POST /api/ai/generate.
 *
 * `style`, `colorPreferences`, and `avoid` are optional refinements the
 * user can pass alongside the free-text prompt — the quick-pick chips in
 * <PromptInput /> populate these. Keep this type in sync with the zod
 * schema in app/api/ai/generate/route.ts.
 */
import { ColorStyle } from "./color";

export type AIGenerateRequest = {
  prompt: string;
  style?: ColorStyle[];
  colorPreferences?: string[];
  avoid?: string[];
};
