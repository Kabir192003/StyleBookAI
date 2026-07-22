/**
 * Request/response shapes for POST /api/ai/generate.
 *
 * `style`, `colorPreferences`, and `avoid` are optional refinements the
 * user can pass alongside the free-text prompt — the quick-pick chips in
 * <PromptInput /> populate these. Keep this type in sync with the zod
 * schema in app/api/ai/generate/route.ts.
 */
import { ColorStyle } from "./color";
import { Project } from "./project";

export type AIGenerateRequest = {
  prompt: string;
  style?: ColorStyle[];
  colorPreferences?: string[];
  avoid?: string[];
  // Opts into the full design-system contract (component tokens/states,
  // light+dark, accessibility, icon style, grid, breakpoints) — off by
  // default so a plain "give me a palette" prompt stays fast/cheap.
  includeDesignSystem?: boolean;
};

// What POST /api/ai/generate actually returns — a draft Project, not yet
// saved (no id/userId/timestamps until the user chooses to save it).
export type AIGeneratedProject = Omit<Project, "id" | "userId" | "createdAt" | "updatedAt">;
