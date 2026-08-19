/**
 * Orchestrates POST /api/ai/generate: picks a candidate pool of real
 * colors/fonts, prompts Gemini, validates the JSON it returns, retries once
 * on failure, then maps ids back to real Color/Font objects so the result
 * is always renderable. See docs/TECHNICAL_ARCHITECTURE.md §6.
 */
import { getGeminiJsonModel } from "./gemini";
import { buildGeneratePrompt } from "./prompt";
import { GeminiPaletteResponseSchema, GeminiPaletteResponse, parseSections } from "./schema";
import { generateTypeScale } from "@/lib/typeScale/generateTypeScale";
import { generateSpacingScale } from "@/lib/designTokens/spacing";
import { buildShadowScale } from "@/lib/designTokens/shadows";
import { buildNamedRadiusScale, buildRadiusScaleFromBase, snapRadiusBase } from "./radiusScale";
import { synthesizeColorFromHex } from "@/lib/colors/deriveColorMetadata";
import { hexToRgb, rgbToHsl } from "@/lib/colors/colorUtils";
import {
  ensureActionablePrimary,
  validateDesignSystem,
  validatePaletteRoles,
} from "./validateTokens";
import { enforceFontRoles } from "./fontRoles";
import { groundReasoning } from "./reasoning";
import {
  parsePromptConstraints,
  reportMissingHexes,
  reportPhotographyBan,
  reportRadiusConstraint,
} from "./constraints";
import { brandPaletteFromThemeVariant, deriveDarkThemeVariantFromLight } from "@/lib/studio/deriveThemeVariant";
import { darkPaletteIsUsable } from "@/lib/colors/deriveDarkPalette";
import { allColors } from "@/data/colors";
import { allFonts } from "@/data/fonts";
import { moodboardImages } from "@/data/moodboards";
import { AIDeviation, AIGenerateRequest, AIGeneratedProject, ContrastReport } from "@/types/ai";
import { AIReasoning } from "@/types/project";
import { DesignSystem } from "@/types/designSystem";
import { Color } from "@/types/color";
import { Font } from "@/types/font";
import { MoodboardImage } from "@/types/designTokens";

// A full design-system response (component tokens x states x light/dark)
// is much larger than a plain palette — give Gemini more headroom so it
// doesn't get cut off mid-JSON.
const DESIGN_SYSTEM_MAX_OUTPUT_TOKENS = 8192;

// Kept small — a larger candidate list means a bigger prompt, which means
// a slower Gemini round-trip, which risks the serverless function timeout
// (see maxDuration in app/api/ai/generate/route.ts).
const MAX_CANDIDATE_COLORS = 60;
const MAX_CANDIDATE_FONTS = 40;
const MAX_CANDIDATE_MOODBOARD_IMAGES = 60;

export class AIGenerationError extends Error {}

// The UI only ever sends the free-text `prompt` — style/colorPreferences/avoid
// are schema-supported but currently unused — so tokenizing the prompt itself
// is the real signal for candidate selection; a plain pool.slice(0, N) would
// hand Gemini the same handful of colors every time since allColors is
// grouped by family.
function tokenizePrompt(prompt: string): Set<string> {
  return new Set(
    prompt
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
  );
}

// Common color words that don't literally match a ColorFamily/name (e.g.
// "navy", "coral", "mint") but clearly signal one — without this a prompt
// mentioning them would match nothing and fall back to the generic pool.
const COLOR_FAMILY_SYNONYMS: Record<string, Color["family"]> = {
  navy: "blue",
  cobalt: "blue",
  azure: "blue",
  sky: "blue",
  cerulean: "blue",
  turquoise: "teal",
  aqua: "teal",
  cyan: "teal",
  mint: "green",
  sage: "green",
  emerald: "green",
  forest: "green",
  olive: "green",
  lime: "green",
  coral: "red",
  salmon: "red",
  scarlet: "red",
  crimson: "red",
  maroon: "red",
  cherry: "red",
  ruby: "red",
  gold: "yellow",
  mustard: "yellow",
  amber: "orange",
  tangerine: "orange",
  rust: "orange",
  peach: "orange",
  terracotta: "orange",
  lavender: "purple",
  violet: "purple",
  plum: "purple",
  burgundy: "purple",
  magenta: "purple",
  lilac: "purple",
  indigo: "purple",
  blush: "pink",
  rose: "pink",
  fuchsia: "pink",
  tan: "brown",
  beige: "brown",
  khaki: "brown",
  chocolate: "brown",
  sand: "brown",
  camel: "brown",
  charcoal: "neutral",
  graphite: "neutral",
  ivory: "neutral",
  cream: "neutral",
  slate: "neutral",
  stone: "neutral",
  gray: "neutral",
  grey: "neutral",
  black: "neutral",
  white: "neutral",
};

function colorMatchesPrompt(color: Color, tokens: Set<string>): boolean {
  if (tokens.has(color.family)) return true;
  if (color.mood.some((m) => tokens.has(m))) return true;
  if (color.style.some((s) => tokens.has(s))) return true;
  for (const token of tokens) {
    if (COLOR_FAMILY_SYNONYMS[token] === color.family) return true;
  }
  return color.name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2)
    .some((word) => tokens.has(word));
}

// Splits `items` into groups by `groupKeyFn` and interleaves them (round-
// robin) up to `limit`, so a capped selection stays diverse across groups
// instead of favoring whichever group happens to sort first in the source
// array.
function roundRobinSample<T>(items: T[], groupKeyFn: (item: T) => string, limit: number): T[] {
  if (items.length <= limit) return items;

  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = groupKeyFn(item);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  const groupArrays = Array.from(groups.values());
  const result: T[] = [];
  for (let i = 0; result.length < limit; i++) {
    const before = result.length;
    for (const group of groupArrays) {
      if (i < group.length) {
        result.push(group[i]);
        if (result.length >= limit) break;
      }
    }
    if (result.length === before) break; // every group exhausted
  }

  return result;
}

function selectCandidateColors(request: AIGenerateRequest): Color[] {
  let pool = allColors;

  if (request.style?.length) {
    const styled = pool.filter((c) => c.style.some((s) => request.style!.includes(s)));
    if (styled.length > 0) pool = styled;
  }

  if (request.colorPreferences?.length) {
    const prefs = request.colorPreferences.map((p) => p.toLowerCase());
    const matched = pool.filter((c) =>
      prefs.some(
        (p) =>
          c.family.toLowerCase().includes(p) ||
          c.name.toLowerCase().includes(p) ||
          c.mood.some((m) => m.toLowerCase().includes(p))
      )
    );
    if (matched.length > 0) pool = matched;
  }

  if (request.avoid?.length) {
    const avoid = request.avoid.map((a) => a.toLowerCase());
    pool = pool.filter(
      (c) => !avoid.some((a) => c.family.toLowerCase().includes(a) || c.name.toLowerCase().includes(a))
    );
  }

  if (pool.length === 0) pool = allColors;

  const tokens = tokenizePrompt(request.prompt);
  const promptMatched = pool.filter((c) => colorMatchesPrompt(c, tokens));

  if (promptMatched.length === 0) {
    // No explicit color signal — still diversify across families instead of
    // a raw slice (which would always be the same handful of neutrals).
    return roundRobinSample(pool, (c) => c.family, MAX_CANDIDATE_COLORS);
  }

  if (promptMatched.length >= MAX_CANDIDATE_COLORS) {
    return roundRobinSample(promptMatched, (c) => c.family, MAX_CANDIDATE_COLORS);
  }

  // Requested colors first (guaranteed present), then round out the palette
  // with diverse supporting colors (backgrounds, neutrals, accents) for the
  // remaining slots.
  const matchedIds = new Set(promptMatched.map((c) => c.id));
  const remaining = pool.filter((c) => !matchedIds.has(c.id));
  const fill = roundRobinSample(remaining, (c) => c.family, MAX_CANDIDATE_COLORS - promptMatched.length);
  return [...promptMatched, ...fill];
}

// Previously this matched only mood/style/category — never the font's own
// name — so a prompt naming a specific typeface ("something like Garamond")
// could never match it. Splitting the family into words and checking prompt
// tokens against them closes that gap (mirrors colorMatchesPrompt's name
// check).
function fontMatchesPrompt(font: Font, tokens: Set<string>): boolean {
  if (font.mood.some((m) => tokens.has(m.toLowerCase()))) return true;
  if (font.style.some((s) => tokens.has(s.toLowerCase()))) return true;
  if (tokens.has(font.category.toLowerCase())) return true;
  return font.family
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2)
    .some((word) => tokens.has(word));
}

// allFonts is ~2000 entries (the full Google Fonts catalog, data/fonts/google.ts)
// plus the hand-tagged seed set, treated as one pool and prompt-matched the
// same way colors are (see selectCandidateColors) — seed fonts still surface
// disproportionately for a matching prompt since their mood/style tags are
// real hand-written data, where the Google catalog's are auto-generated per
// category.
function selectCandidateFonts(request: AIGenerateRequest): Font[] {
  let pool = allFonts;

  if (request.style?.length) {
    const requestedStyles: string[] = request.style;
    const styleMatched = pool.filter((f) => f.style.some((s) => requestedStyles.includes(s)));
    if (styleMatched.length > 0) pool = styleMatched;
  }

  const tokens = tokenizePrompt(request.prompt);
  const promptMatched = pool.filter((f) => fontMatchesPrompt(f, tokens));

  if (promptMatched.length === 0) {
    // No explicit font signal — still diversify across categories instead
    // of always landing on the same seed-heavy slice.
    return roundRobinSample(pool, (f) => f.category, MAX_CANDIDATE_FONTS);
  }

  if (promptMatched.length >= MAX_CANDIDATE_FONTS) {
    return roundRobinSample(promptMatched, (f) => f.category, MAX_CANDIDATE_FONTS);
  }

  const matchedIds = new Set(promptMatched.map((f) => f.id));
  const remaining = pool.filter((f) => !matchedIds.has(f.id));
  const fill = roundRobinSample(remaining, (f) => f.category, MAX_CANDIDATE_FONTS - promptMatched.length);
  return [...promptMatched, ...fill];
}

// moodboardImages is grouped sequentially by category (see
// scripts/transformMoodboards.ts), so a plain slice would silently drop
// whole categories once the pool exceeds the cap — round-robin across
// categories (by id prefix) instead so every mood stays represented.
function selectCandidateMoodboardImages(request: AIGenerateRequest): MoodboardImage[] {
  let pool = moodboardImages;

  if (request.style?.length) {
    const requestedStyles: string[] = request.style;
    const matched = pool.filter((m) => m.mood.some((mood) => requestedStyles.includes(mood)));
    if (matched.length > 0) pool = matched;
  }

  const tokens = tokenizePrompt(request.prompt);
  const promptMatched = pool.filter((m) => m.mood.some((mood) => tokens.has(mood.toLowerCase())));

  const groupKey = (image: MoodboardImage) => image.id.replace(/-\d+$/, "");

  if (promptMatched.length === 0) {
    if (pool.length <= MAX_CANDIDATE_MOODBOARD_IMAGES) return pool;
    return roundRobinSample(pool, groupKey, MAX_CANDIDATE_MOODBOARD_IMAGES);
  }

  if (promptMatched.length >= MAX_CANDIDATE_MOODBOARD_IMAGES) {
    return roundRobinSample(promptMatched, groupKey, MAX_CANDIDATE_MOODBOARD_IMAGES);
  }

  const matchedIds = new Set(promptMatched.map((m) => m.id));
  const remaining = pool.filter((m) => !matchedIds.has(m.id));
  const fill = roundRobinSample(remaining, groupKey, MAX_CANDIDATE_MOODBOARD_IMAGES - promptMatched.length);
  return [...promptMatched, ...fill];
}

async function callGemini(prompt: string, options?: { maxOutputTokens?: number }): Promise<GeminiPaletteResponse> {
  const model = getGeminiJsonModel(options);
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new AIGenerationError("Gemini did not return valid JSON");
  }

  const parsed = GeminiPaletteResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AIGenerationError(`Gemini response failed validation: ${parsed.error.message}`);
  }
  return parsed.data;
}

/**
 * A hex repaired by the contrast pass has to carry its precomputed rgb/hsl
 * with it — `Color` stores both (see buildColor in lib/colors/colorUtils.ts)
 * and every consumer reads them instead of re-deriving, so leaving them stale
 * would show one swatch and export a different one.
 */
function withRepairedHex<T extends Color>(color: T, hex: string): T {
  if (hex.toLowerCase() === color.hex.toLowerCase()) return color;
  const rgb = hexToRgb(hex);
  return { ...color, hex, rgb, hsl: rgbToHsl(rgb.r, rgb.g, rgb.b) };
}

// Guarantees `designSystem.dark` exists and actually belongs to this brand.
// A model-authored dark variant is kept only if it passes the quality gate in
// lib/colors/deriveDarkPalette.ts (actually dark, ink readable, not just the
// light palette echoed back); otherwise it's derived from this brand's own
// light tokens instead of falling back to a generic stock dark palette.
function ensureDarkVariant(designSystem: DesignSystem): { designSystem: DesignSystem; derived: boolean } {
  const lightPalette = brandPaletteFromThemeVariant(designSystem.light);
  const modelDark = designSystem.dark;

  if (modelDark && darkPaletteIsUsable(brandPaletteFromThemeVariant(modelDark), lightPalette)) {
    return { designSystem, derived: false };
  }

  return {
    designSystem: { ...designSystem, dark: deriveDarkThemeVariantFromLight(designSystem.light) },
    derived: true,
  };
}

export async function generateProjectFromPrompt(request: AIGenerateRequest): Promise<AIGeneratedProject> {
  const candidateColors = selectCandidateColors(request);
  const candidateFonts = selectCandidateFonts(request);
  const candidateMoodboardImages = selectCandidateMoodboardImages(request);
  const prompt = buildGeneratePrompt(request, candidateColors, candidateFonts, candidateMoodboardImages);
  const modelOptions = request.includeDesignSystem
    ? { maxOutputTokens: DESIGN_SYSTEM_MAX_OUTPUT_TOKENS }
    : undefined;

  let raw: GeminiPaletteResponse;
  try {
    raw = await callGemini(prompt, modelOptions);
  } catch (firstError) {
    const reason = firstError instanceof Error ? firstError.message : String(firstError);
    const stricterPrompt = `${prompt}\n\nYour previous response was invalid: ${reason}. Return ONLY valid JSON matching the exact shape above, using real ids from the candidate lists.`;
    raw = await callGemini(stricterPrompt, modelOptions);
  }

  const colorById = new Map(candidateColors.map((c) => [c.id, c]));
  const resolvedColors = raw.colors.map(({ colorId, hex, name, role }) => {
    if (hex) {
      // Gemini returned a literal hex instead of a candidate id (asked for
      // an exact color the catalog couldn't approximate) — synthesize a
      // full Color around it so every downstream consumer (export,
      // Project.colors) still sees a real Color shape.
      return { ...synthesizeColorFromHex(hex, name), role };
    }
    const color = colorId ? colorById.get(colorId) : undefined;
    if (!color) {
      throw new AIGenerationError(`Gemini returned an unknown colorId: ${colorId}`);
    }
    return { ...color, role };
  });

  const fontById = new Map(candidateFonts.map((f) => [f.id, f]));
  const primaryFont = fontById.get(raw.primaryFontId);
  const secondaryFont = fontById.get(raw.secondaryFontId);
  const accentFont = raw.accentFontId ? fontById.get(raw.accentFontId) : undefined;

  if (!primaryFont || !secondaryFont) {
    throw new AIGenerationError("Gemini returned an unknown font id");
  }

  // Post-generation pipeline: the model's raw answer is treated as a
  // proposal, and everything it can't reliably do itself (measuring
  // contrast, honouring literal constraints, keeping dark mode per-brand,
  // keeping prose truthful) is checked and repaired in code below.
  const constraints = parsePromptConstraints(request.prompt);
  const deviations: AIDeviation[] = [];

  // 1. Fonts — a monospace/display face in the body slot is replaced and the
  //    swap reported (lib/ai/fontRoles.ts).
  const fontResult = enforceFontRoles(
    { primary: primaryFont, secondary: secondaryFont, accent: accentFont },
    candidateFonts,
    { banMonospace: constraints.banMonospace }
  );
  deviations.push(...fontResult.deviations);

  // 2. Palette — the primary must be able to act as an action colour, and
  //    text/muted must be readable on the palette's own background.
  const primaryResult = ensureActionablePrimary(resolvedColors);
  const paletteResult = validatePaletteRoles(primaryResult.colors);
  deviations.push(...primaryResult.deviations, ...paletteResult.deviations);
  const finalColors = paletteResult.colors.map((color, index) =>
    withRepairedHex(resolvedColors[index], color.hex)
  );
  const paletteChecks = [...primaryResult.checks, ...paletteResult.checks];

  // 3. Design system — always gets a brand-derived dark variant, then every
  //    meaningful pair in BOTH variants is measured and repaired.
  let designSystem: DesignSystem | undefined;
  let contrastReport: ContrastReport | undefined;
  if (raw.designSystem) {
    const normalized: DesignSystem = {
      ...raw.designSystem,
      accessibility: raw.designSystem.accessibility
        ? { level: raw.designSystem.accessibility.level, notes: raw.designSystem.accessibility.notes ?? [] }
        : undefined,
    };
    const withDark = ensureDarkVariant(normalized);
    if (withDark.derived) {
      deviations.push({
        kind: "auto-correction",
        subject: "designSystem.dark",
        requested: normalized.dark ? "model-authored dark theme" : "no dark theme returned",
        applied: "dark theme derived from this brand's light tokens",
        reason: normalized.dark
          ? "The returned dark theme wasn't usable (not actually dark, unreadable ink, or the light palette repeated), so it was rebuilt from the light palette's own hues."
          : "Dark mode is always generated. It was derived from this brand's light palette — hues preserved, lightness remapped — rather than falling back to a stock dark theme.",
      });
    }

    const validated = validateDesignSystem(withDark.designSystem);
    designSystem = validated.designSystem;
    contrastReport = {
      ...validated.report,
      checks: [...paletteChecks, ...validated.report.checks],
    };
    deviations.push(...validated.deviations);
  } else if (paletteChecks.length > 0) {
    // No design system requested — still report what was measured on the
    // flat palette so a plain generation is never silently unverified.
    const enforced = paletteChecks.filter((c) => !c.informational);
    const failCount = enforced.filter((c) => !c.passes).length;
    contrastReport = {
      level: failCount > 0 ? "Fail" : enforced.every((c) => c.ratio >= 7) ? "AAA" : "AA",
      checks: paletteChecks,
      passCount: enforced.length - failCount,
      failCount,
      repairedCount: paletteChecks.filter((c) => c.repaired).length,
      notes: enforced.map((c) => `${c.label}: ${c.ratio}:1 (minimum ${c.required}:1).`),
    };
  }

  const typeScale = generateTypeScale(raw.baseSize ?? 16, raw.typeScaleRatio);
  const spacing = generateSpacingScale(raw.spacingBase ?? 4);
  const shadows = buildShadowScale(raw.shadowLevel ?? "subtle");

  // 4. Radius — an explicit "0px corners" in the brief now beats the model's
  //    taste outright (it used to be unrepresentable, so it silently became
  //    4px), and the single flat value becomes a real sm/md/lg/pill ramp.
  const modelRadius = snapRadiusBase(raw.cornerRadius, 8);
  const appliedRadius = constraints.cornerRadius ? snapRadiusBase(constraints.cornerRadius.value) : modelRadius;
  deviations.push(...reportRadiusConstraint(constraints, modelRadius, appliedRadius));
  const cornerRadius = buildRadiusScaleFromBase(appliedRadius);
  const radiusScale = buildNamedRadiusScale(appliedRadius);

  const moodboardById = new Map(candidateMoodboardImages.map((m) => [m.id, m]));
  const selectedMoodboard = (raw.moodboardImageIds ?? [])
    .map((id) => moodboardById.get(id))
    .filter((image): image is MoodboardImage => Boolean(image));

  // 5. Imagery — the moodboard library is Unsplash photography, so a brief
  //    that bans stock imagery is honoured by dropping it, not by swapping
  //    in different photos.
  const moodboard = constraints.banPhotography ? [] : selectedMoodboard;
  deviations.push(...reportPhotographyBan(constraints, selectedMoodboard.length));

  // 6. Explicit hexes the user typed must survive to the final palette.
  deviations.push(...reportMissingHexes(constraints, finalColors.map((c) => c.hex)));

  // 7. Reasoning — strip the model's unverifiable compliance claims and
  //    append a factual summary of the tokens as actually shipped, so the
  //    prose can no longer drift from (or lie about) the result.
  const reasoning: AIReasoning = groundReasoning(raw.reasoning, {
    brandName: raw.projectName,
    colors: finalColors.map((c) => ({ role: c.role, name: c.name, hex: c.hex })),
    fonts: {
      heading: fontResult.roles.primary.family,
      body: fontResult.roles.secondary.family,
      accent: fontResult.roles.accent?.family,
      headingCategory: fontResult.roles.primary.category,
      bodyCategory: fontResult.roles.secondary.category,
    },
    typeScale: {
      ratioName: raw.typeScaleRatio,
      baseSize: raw.baseSize ?? 16,
      steps: Object.keys(typeScale.sizes).length,
    },
    radius: { base: radiusScale.md, sm: radiusScale.sm, lg: radiusScale.lg },
    spacingBase: raw.spacingBase ?? 4,
    shadowLevel: raw.shadowLevel ?? "subtle",
    report: contrastReport,
    repairedCount: contrastReport?.repairedCount ?? 0,
  });

  return {
    name: raw.projectName,
    colors: finalColors,
    fonts: fontResult.roles,
    typeScale,
    spacing,
    shadows,
    cornerRadius,
    radiusScale,
    moodboard: moodboard.length > 0 ? moodboard : undefined,
    designSystem,
    context: raw.context ?? "generic",
    mockup: raw.mockup,
    // Sections are validated one at a time rather than as an array, so a
    // single malformed entry drops itself instead of failing the whole
    // generation and taking a good palette down with it.
    uiStructure: raw.uiStructure
      ? { ...raw.uiStructure, sections: parseSections(raw.uiStructure.sections) }
      : undefined,
    aiGenerated: true,
    aiPrompt: request.prompt,
    aiReasoning: reasoning,
    contrastReport,
    deviations: deviations.length > 0 ? deviations : undefined,
  };
}
