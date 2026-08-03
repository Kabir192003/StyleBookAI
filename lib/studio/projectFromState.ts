/**
 * Converts Studio's local StudioState (5-token palette + font family
 * strings — see components/studio/StudioBuilder.tsx) into a real
 * ProjectInput payload for POST/PUT /api/projects.
 *
 * Studio's manual-build model is much simpler than the full Project shape
 * (a bare hex per role, a font family name, no type scale at all) — this
 * is the one place that bridges the two, synthesizing the metadata a
 * saved Project requires:
 *  - Colors: synthesizeColorFromHex() (already used for AI-picked custom
 *    hexes) derives family/mood/style/rgb/hsl from the hex itself, so a
 *    manually-picked color doesn't need to exist in the curated library.
 *  - Fonts: looked up by family name in the real font library first (so a
 *    saved project references the actual catalog entry, with its real
 *    note/variants/etc.); falls back to a minimal synthesized Font if the
 *    family isn't in the library for some reason.
 *  - Type scale: Studio has no type-scale editor, so a sensible default
 *    (16px, Major Third) is generated on save — not read from anywhere,
 *    since there's nowhere in Studio's UI to have set one.
 */
import { allFonts } from "@/data/fonts";
import { synthesizeColorFromHex } from "@/lib/colors/deriveColorMetadata";
import { generateTypeScale } from "@/lib/typeScale/generateTypeScale";
import type { ProjectInput } from "@/lib/validation/project";
import type { Font } from "@/types/font";
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
    typeScale: generateTypeScale(16, "Major Third"),
    spacing: state.spacing,
    shadows: state.shadows,
    cornerRadius: state.designSystem ? undefined : { options: [state.radius], recommended: state.radius },
    moodboard: state.moodboard,
    designSystem: state.designSystem,
    aiGenerated: Boolean(state.aiReasoning),
    aiReasoning: state.aiReasoning,
  };
}
