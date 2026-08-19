// Converts Studio's local StudioState (5-token palette + font family strings
// — see components/studio/StudioBuilder.tsx) into a real ProjectInput payload
// for POST/PUT /api/projects. Both light and dark palettes are always
// preserved via a real designSystem (deriveThemeVariantFromPalette, one call
// per mode) — not just whichever mode the toggle happened to be on — and
// radius/typeScale are always taken from state rather than conditionally
// dropped.
import { allFonts } from "@/data/fonts";
import { synthesizeColorFromHex } from "@/lib/colors/deriveColorMetadata";
import { RADIUS_OPTIONS } from "@/lib/designTokens/radius";
import { deriveThemeVariantFromPalette } from "./deriveThemeVariant";
import { resolvePalette } from "./tokenGraph";
import type { ProjectInput } from "@/lib/validation/project";
import type { PaletteTokens } from "./exportCode";
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

// If state.designSystem already exists (an AI result with component-level
// tokens, accessibility notes, icon style, etc.), that richer data is kept as
// is — only colorRoles and the two palette-driven components (button/
// buttonSecondary) are refreshed from the resolved palette, since the palette
// editor is the one place a designer edits colour in Studio and must win.
function buildDesignSystem(state: StudioState, resolvedLight: PaletteTokens, resolvedDark: PaletteTokens): DesignSystem {
  const light = deriveThemeVariantFromPalette(resolvedLight);
  const dark = deriveThemeVariantFromPalette(resolvedDark);

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
  const resolvedLight = resolvePalette(state.light, state.primitives);
  const resolvedDark = resolvePalette(state.dark, state.primitives);
  const resolvedActivePalette = state.mode === "Dark" ? resolvedDark : resolvedLight;

  const colors = (Object.keys(resolvedActivePalette) as Array<keyof typeof resolvedActivePalette>).map((role) => ({
    ...synthesizeColorFromHex(resolvedActivePalette[role], ROLE_LABELS[role]),
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
    // `recommended` stays the user's actual live radius even if it isn't one
    // of the fixed ladder steps (the slider allows any value) — snapping it
    // would silently change what's applied throughout Studio. `options` is
    // the fixed ladder plus the live value, so a custom radius still
    // round-trips and radiusOptions in lib/export/designTokens.ts can still
    // emit more than one radius token.
    cornerRadius: {
      options: Array.from(new Set([...RADIUS_OPTIONS, state.radius])).sort((a, b) => a - b),
      recommended: state.radius,
    },
    moodboard: state.moodboard,
    designSystem: buildDesignSystem(state, resolvedLight, resolvedDark),
    // Raw (possibly-linked) palette + the named primitives it references —
    // restores which role is Custom vs Linked on reload, rather than just
    // the resolved hex above (which is all `colors`/`designSystem` need).
    colorPrimitives: state.primitives,
    studioPaletteLinks: { light: state.light, dark: state.dark },
    aiGenerated: Boolean(state.aiReasoning),
    aiReasoning: state.aiReasoning,
  };
}
