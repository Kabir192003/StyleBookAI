/**
 * Converts Studio's local StudioState (5-token palette + font family
 * strings — see components/studio/StudioBuilder.tsx) into a real
 * ProjectInput payload for POST/PUT /api/projects.
 *
 * Previously this silently discarded real work on every save:
 *  - Only the *currently active* mode's palette (state.light OR
 *    state.dark, whichever the toggle was on) was ever persisted — the
 *    other was thrown away with no warning.
 *  - cornerRadius was set to `undefined` whenever a designSystem was
 *    present, even though the radius slider is always live and always
 *    edited independently of whether a designSystem exists.
 *  - typeScale was hardcoded to 16px/Major Third regardless of what
 *    Studio's own state.typeScale (now always present, either the AI's
 *    real generated scale or the user's own edit) actually held.
 * None of that is true anymore: both palettes are preserved via a real
 * designSystem (deriveThemeVariantFromPalette, one call per mode), radius
 * and typeScale are always taken from state, not conditionally dropped.
 */
import { allFonts } from "@/data/fonts";
import { synthesizeColorFromHex } from "@/lib/colors/deriveColorMetadata";
import { deriveThemeVariantFromPalette } from "./deriveThemeVariant";
import type { ProjectInput } from "@/lib/validation/project";
import type { Font } from "@/types/font";
import type { DesignSystem } from "@/types/designSystem";
import type { StudioState } from "@/components/studio/StudioBuilder";

const ROLE_LABELS: Record<string, string> = {
  accent: "Accent",
  support: "Support",
  surface: "Surface",
  ink: "Ink",
  muted: "Muted",
};

function findOrSynthesizeFont(family: string): Font {
  const match = allFonts.find((f) => f.family.toLowerCase() === family.toLowerCase());
  if (match) return match;

  return {
    id: `studio-${family.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    family,
    category: "sans-serif",
    variants: ["400", "500", "600", "700"],
    mood: [],
    style: [],
    era: "modern",
    useCase: ["heading", "body"],
    googleFontsId: family,
    isPro: false,
    pairsWith: [],
    note: `${family}, picked directly in Studio.`,
  };
}

// Both palettes always survive a save via a real designSystem, whether or
// not one arrived from AI. If state.designSystem already exists (an AI
// result with component-level tokens, accessibility notes, icon style,
// etc.), that richer data is preserved as-is — only colorRoles and the
// two palette-driven components (button/buttonSecondary) are refreshed
// from state.light/state.dark, since the palette editor is the one place
// a designer actually edits color in Studio and must always win.
function buildDesignSystem(state: StudioState): DesignSystem {
  const light = deriveThemeVariantFromPalette(state.light);
  const dark = deriveThemeVariantFromPalette(state.dark);

  if (!state.designSystem) {
    return { light, dark };
  }

  return {
    ...state.designSystem,
    light: {
      ...state.designSystem.light,
      colorRoles: light.colorRoles,
      components: { ...state.designSystem.light.components, ...light.components },
    },
    dark: state.designSystem.dark
      ? {
          ...state.designSystem.dark,
          colorRoles: dark.colorRoles,
          components: { ...state.designSystem.dark.components, ...dark.components },
        }
      : dark,
  };
}

export function projectInputFromStudioState(state: StudioState): ProjectInput {
  const activePalette = state.mode === "Dark" ? state.dark : state.light;

  const colors = (Object.keys(activePalette) as Array<keyof typeof activePalette>).map((role) => ({
    ...synthesizeColorFromHex(activePalette[role], ROLE_LABELS[role]),
    role,
  }));

  return {
    name: state.name,
    colors,
    fonts: {
      primary: findOrSynthesizeFont(state.headFont),
      secondary: findOrSynthesizeFont(state.bodyFont),
      ...(state.accentFont ? { accent: findOrSynthesizeFont(state.accentFont) } : {}),
    },
    typeScale: state.typeScale,
    spacing: state.spacing,
    shadows: state.shadows,
    cornerRadius: { options: [state.radius], recommended: state.radius },
    moodboard: state.moodboard,
    designSystem: buildDesignSystem(state),
    aiGenerated: Boolean(state.aiReasoning),
    aiReasoning: state.aiReasoning,
  };
}
