/**
 * Where the playground's *base* system comes from.
 *
 * Studio's canonical token state (`StudioState`) is component-local to
 * components/studio/StudioBuilder.tsx — it is deliberately not a store, so
 * its undo/redo history stays a single owned stack. The playground lives on
 * its own route and therefore can't read that state directly, so it rebuilds
 * an equivalent `StudioExportTokens` from the same upstream source Studio
 * itself seeds from: the persisted AI result (store/aiResultStore.ts,
 * sessionStorage). That's the same hand-off `/studio` uses when you click
 * "Open in Studio", so opening the playground straight after a generation
 * shows the brand you just made, not a stock palette.
 *
 * With no AI result in the session it falls back to Studio's own from-scratch
 * defaults, mirrored here (Studio's DEFAULT_STATE isn't exported, and the
 * ownership boundary for this batch doesn't allow exporting it — the values
 * are duplicated deliberately and are flagged in the handoff notes so the two
 * can be reconciled later). Either way the playground is never empty, which
 * is the "see ready-made components immediately" acceptance step.
 *
 * P4 replaces the read side of this with a real "current Studio system"
 * bridge when it wires up Apply-to-design-system.
 */
import { paletteFromAIColors } from "@/lib/studio/paletteFromAIColors";
import { deriveDarkPaletteTokens } from "@/lib/studio/deriveThemeVariant";
import { PaletteTokens, StudioExportTokens } from "@/lib/studio/exportCode";
import { generateTypeScale } from "@/lib/typeScale/generateTypeScale";
import { generateSpacingScale } from "@/lib/designTokens/spacing";
import { buildShadowScale } from "@/lib/designTokens/shadows";
import type { AIGeneratedProject } from "@/types/ai";
import type { Experiment } from "./types";

// Mirrors StudioBuilder's DEFAULT_LIGHT / default fonts / radius. Kept in
// sync by hand; see the file header for why it isn't imported.
const FALLBACK_LIGHT: PaletteTokens = {
  accent: "#222D52",
  support: "#C36B3E",
  surface: "#F5F1E8",
  ink: "#211E18",
  muted: "#8A8477",
};

export const PLAYGROUND_FALLBACK_BASE: StudioExportTokens = {
  name: "Northwind",
  light: FALLBACK_LIGHT,
  // Derived, never a hardcoded dark set — same rule as StudioBuilder.
  dark: deriveDarkPaletteTokens(FALLBACK_LIGHT),
  headFont: "Fraunces",
  bodyFont: "Archivo",
  radius: 10,
  typeScale: generateTypeScale(16, "Major Third"),
  spacing: generateSpacingScale(4),
  shadows: buildShadowScale("subtle"),
};

/**
 * Builds the playground's base tokens from a persisted AI result. Palette
 * goes through `paletteFromAIColors` — the single canonical mapping from an
 * AI result's role-tagged `colors` array onto Studio's five slots — rather
 * than through `designSystem.light`, which is an independently generated
 * colour set that isn't guaranteed to agree with it. StudioBuilder made
 * exactly that mistake once and shipped a "secondary" that differed between
 * the results page and Studio.
 */
export function playgroundBaseFromAIResult(result: AIGeneratedProject | null): StudioExportTokens {
  if (!result) return PLAYGROUND_FALLBACK_BASE;
  const light = paletteFromAIColors(result.colors, FALLBACK_LIGHT);
  return {
    name: result.name || PLAYGROUND_FALLBACK_BASE.name,
    light,
    dark: deriveDarkPaletteTokens(light),
    headFont: result.fonts?.primary?.family ?? PLAYGROUND_FALLBACK_BASE.headFont,
    bodyFont: result.fonts?.secondary?.family ?? PLAYGROUND_FALLBACK_BASE.bodyFont,
    accentFont: result.fonts?.accent?.family,
    radius: PLAYGROUND_FALLBACK_BASE.radius,
    typeScale: result.typeScale ?? PLAYGROUND_FALLBACK_BASE.typeScale,
    spacing: result.spacing ?? PLAYGROUND_FALLBACK_BASE.spacing,
    shadows: result.shadows ?? PLAYGROUND_FALLBACK_BASE.shadows,
    designSystem: result.designSystem,
  };
}

/**
 * The two experiments a fresh playground opens with. Not empty and not
 * identical: the point of the surface is comparison, so the second card is a
 * real alternative (brand roles swapped, softer shape) that visibly differs
 * from the first the moment the page loads. Both are ordinary experiments —
 * the user can rename, edit or delete either.
 *
 * Fixed ids rather than generated ones: this array is built during the first
 * render, which also runs on the server, and a random id would differ between
 * the server HTML and the client's first render and trip a hydration
 * mismatch (the same class of defect documented in StudioBuilder's
 * DEFAULT_PRIMITIVES and in LivePreviewSection's mount guard).
 */
export function seedExperiments(base: StudioExportTokens): Experiment[] {
  return [
    {
      // No overrides at all — this card *is* the current system, so the
      // comparison always has a control to read the alternatives against.
      id: "exp-base",
      name: `${base.name} — as built`,
      colors: {},
      fonts: {},
    },
    {
      id: "exp-inverted",
      name: "Support-led, softer",
      colors: {
        primary: base.light.support,
        secondary: base.light.accent,
        accent: base.light.accent,
      },
      fonts: {},
      // Deliberately a large step away from the base radius: at a 2px
      // difference nobody can tell the two cards apart at a glance, which
      // defeats the point of putting them side by side.
      radius: Math.min(24, base.radius + 12),
    },
  ];
}
