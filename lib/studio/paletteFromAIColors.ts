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
 *
 * `primitivesFromAIColors` extends the same principle to the Primitive
 * editor: a fresh AI generation used to leave `state.primitives` at its
 * hardcoded default (see StudioBuilder's DEFAULT_PRIMITIVES) while the
 * Palette/export correctly showed the AI's own colors — two unrelated
 * palettes on screen at once. This derives Primitives directly from the
 * same `colors` array and links the Palette roles to them via `ColorRef`,
 * exactly like the sidebar's manual "Linked" button does.
 */
import { PaletteTokens } from "./exportCode";
import { ColorValue, PrimitiveColor, makePrimitiveId } from "./tokenGraph";
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

// Shared by both functions below so the palette's role→color mapping and
// the primitives' identity for that same color can never disagree —
// they're derived from the same index into the same `colors` array.
function resolveIndex(colors: AIColors, roles: string[], fallbackIndex: number): number {
  for (const role of roles) {
    const index = colors.findIndex((c) => c.role?.toLowerCase() === role);
    if (index !== -1) return index;
  }
  return fallbackIndex < colors.length ? fallbackIndex : -1;
}

export function paletteFromAIColors(colors: AIColors | undefined, fallback: PaletteTokens): PaletteTokens {
  if (!colors || colors.length === 0) return fallback;

  const slots = Object.keys(ROLE_CANDIDATES) as Array<keyof PaletteTokens>;
  const next = { ...fallback };
  for (const slot of slots) {
    const index = resolveIndex(colors, ROLE_CANDIDATES[slot], FALLBACK_INDEX[slot]);
    next[slot] = index !== -1 ? colors[index].hex : fallback[slot];
  }
  return next;
}

export type PrimitiveLinkedPalette = Record<keyof PaletteTokens, ColorValue>;

/**
 * One Primitive per entry in the AI's `colors` array (the schema allows
 * 2-12, not just 5 — see lib/ai/schema.ts) using that color's own name and
 * hex, plus a Palette where each of the 5 roles is a `ColorRef` pointing at
 * whichever primitive fills it. Falls back to plain literal hexes (no
 * primitives created) when `colors` is empty/missing, same as
 * `paletteFromAIColors`.
 */
export function primitivesFromAIColors(
  colors: AIColors | undefined,
  fallback: PaletteTokens
): { primitives: PrimitiveColor[]; palette: PrimitiveLinkedPalette } {
  if (!colors || colors.length === 0) {
    return { primitives: [], palette: { ...fallback } };
  }

  const primitives: PrimitiveColor[] = colors.map((c) => ({
    id: makePrimitiveId(),
    name: c.name,
    hex: c.hex,
  }));

  const slots = Object.keys(ROLE_CANDIDATES) as Array<keyof PaletteTokens>;
  const palette = {} as PrimitiveLinkedPalette;
  for (const slot of slots) {
    const index = resolveIndex(colors, ROLE_CANDIDATES[slot], FALLBACK_INDEX[slot]);
    palette[slot] = index !== -1 ? { primitiveId: primitives[index].id } : fallback[slot];
  }
  return { primitives, palette };
}
