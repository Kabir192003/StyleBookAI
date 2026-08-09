/**
 * The single canonical mapping from an AI-generated project's `colors`
 * array (role-tagged: primary/secondary/background/surface/text/muted)
 * onto Studio's 5-slot palette (accent/support/surface/ink/muted).
 *
 * Previously this logic was duplicated: PromptInput's openInStudio()
 * computed it one way to build URL params, while StudioBuilder separately
 * derived the palette from `aiResult.designSystem.light` (a *different*,
 * independently AI-authored color set — the model returns both a flat
 * `colors` array and, when a full design system is requested, its own
 * `designSystem.light.colorRoles`/`components`). Those two never had to
 * agree, so a role like "secondary" could show one hex on the results
 * page and a different hex once Studio opened — a confirmed data-fidelity
 * defect. Both callers now go through this one function so there is
 * exactly one source of truth for "what does 'support' mean for this
 * result" (see components/ai/PromptInput.tsx and
 * components/studio/StudioBuilder.tsx).
 */
import { PaletteTokens } from "./exportCode";
import { AIGeneratedProject } from "@/types/ai";

type AIColors = AIGeneratedProject["colors"];

const ROLE_CANDIDATES: Record<keyof PaletteTokens, string[]> = {
  accent: ["primary", "accent"],
  support: ["secondary", "support"],
  surface: ["background", "surface"],
  ink: ["text"],
  muted: ["muted", "textmuted"],
};

const FALLBACK_INDEX: Record<keyof PaletteTokens, number> = {
  accent: 0,
  support: 1,
  surface: 2,
  ink: 3,
  muted: 4,
};

function resolveOne(colors: AIColors, roles: string[], fallbackIndex: number, fallbackHex: string): string {
  for (const role of roles) {
    const match = colors.find((c) => c.role?.toLowerCase() === role);
    if (match) return match.hex;
  }
  return colors[fallbackIndex]?.hex ?? fallbackHex;
}

export function paletteFromAIColors(colors: AIColors | undefined, fallback: PaletteTokens): PaletteTokens {
  if (!colors || colors.length === 0) return fallback;

  const slots = Object.keys(ROLE_CANDIDATES) as Array<keyof PaletteTokens>;
  const next = { ...fallback };
  for (const slot of slots) {
    next[slot] = resolveOne(colors, ROLE_CANDIDATES[slot], FALLBACK_INDEX[slot], fallback[slot]);
  }
  return next;
}
