/**
 * Orchestrates POST /api/ai/generate: picks a candidate pool of real
 * colors/fonts, prompts Gemini, validates the JSON it returns, retries once
 * on failure, then maps ids back to real Color/Font objects so the result
 * is always renderable. See docs/TECHNICAL_ARCHITECTURE.md §6.
 */
import { getGeminiJsonModel } from "./gemini";
import { buildGeneratePrompt } from "./prompt";
import { GeminiPaletteResponseSchema, GeminiPaletteResponse } from "./schema";
import { generateTypeScale } from "@/lib/typeScale/generateTypeScale";
import { generateSpacingScale } from "@/lib/designTokens/spacing";
import { buildShadowScale } from "@/lib/designTokens/shadows";
import { buildRadiusScale } from "@/lib/designTokens/radius";
import { allColors } from "@/data/colors";
import { allFonts } from "@/data/fonts";
import { fontsSeed } from "@/data/fonts/seed";
import { moodboardImages } from "@/data/moodboards";
import { AIGenerateRequest } from "@/types/ai";
import { AIReasoning, Project } from "@/types/project";
import { Color } from "@/types/color";
import { Font } from "@/types/font";
import { MoodboardImage } from "@/types/designTokens";

// Kept small — a larger candidate list means a bigger prompt, which means
// a slower Gemini round-trip, which risks the serverless function timeout
// (see maxDuration in app/api/ai/generate/route.ts).
const MAX_CANDIDATE_COLORS = 60;
const MAX_CANDIDATE_FONTS = 40;
const MAX_CANDIDATE_MOODBOARD_IMAGES = 60;

export class AIGenerationError extends Error {}

// The UI (components/ai/PromptInput.tsx) only ever sends the free-text
// `prompt` — `style`/`colorPreferences`/`avoid` are never populated. That
// meant candidate selection previously fell through to `pool.slice(0, N)`
// on every request, which — since allColors is grouped by family — silently
// handed Gemini the same ~60 neutrals/reds every single time, regardless of
// what was typed. Tokenizing the prompt and matching against it is the
// actual signal we have; keep the (currently dead but schema-supported)
// style/colorPreferences/avoid handling too in case a future UI populates them.
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

function fontMatchesPrompt(font: Font, tokens: Set<string>): boolean {
  if (font.mood.some((m) => tokens.has(m.toLowerCase()))) return true;
  if (font.style.some((s) => tokens.has(s.toLowerCase()))) return true;
  return tokens.has(font.category.toLowerCase());
}

// allFonts is ~2000 entries now that the full Google Fonts catalog is in
// (data/fonts/google.ts) — cap what's sent to Gemini the same way colors
// are capped, but always keep the 36 hand-curated seed fonts (real
// pairing data, bespoke notes) since they're the highest-quality picks.
function selectCandidateFonts(request: AIGenerateRequest): Font[] {
  const seen = new Set<string>();
  const candidates: Font[] = [];

  for (const font of fontsSeed) {
    if (!seen.has(font.id)) {
      seen.add(font.id);
      candidates.push(font);
    }
  }

  let rest = allFonts.filter((f) => !seen.has(f.id));

  if (request.style?.length) {
    const requestedStyles: string[] = request.style;
    const styleMatched = rest.filter((f) => f.style.some((s) => requestedStyles.includes(s)));
    if (styleMatched.length > 0) rest = styleMatched;
  }

  const remainingSlots = MAX_CANDIDATE_FONTS - candidates.length;
  if (remainingSlots > 0) {
    const tokens = tokenizePrompt(request.prompt);
    const promptMatched = rest.filter((f) => fontMatchesPrompt(f, tokens));
    const matchedIds = new Set(promptMatched.map((f) => f.id));
    const unmatched = rest.filter((f) => !matchedIds.has(f.id));

    const picked = promptMatched.length >= remainingSlots
      ? roundRobinSample(promptMatched, (f) => f.category, remainingSlots)
      : [...promptMatched, ...roundRobinSample(unmatched, (f) => f.category, remainingSlots - promptMatched.length)];

    for (const font of picked) {
      if (!seen.has(font.id)) {
        seen.add(font.id);
        candidates.push(font);
      }
    }
  }

  return candidates;
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

async function callGemini(prompt: string): Promise<GeminiPaletteResponse> {
  const model = getGeminiJsonModel();
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

export async function generateProjectFromPrompt(
  request: AIGenerateRequest
): Promise<Omit<Project, "id" | "userId" | "createdAt" | "updatedAt">> {
  const candidateColors = selectCandidateColors(request);
  const candidateFonts = selectCandidateFonts(request);
  const candidateMoodboardImages = selectCandidateMoodboardImages(request);
  const prompt = buildGeneratePrompt(request, candidateColors, candidateFonts, candidateMoodboardImages);

  let raw: GeminiPaletteResponse;
  try {
    raw = await callGemini(prompt);
  } catch (firstError) {
    const reason = firstError instanceof Error ? firstError.message : String(firstError);
    const stricterPrompt = `${prompt}\n\nYour previous response was invalid: ${reason}. Return ONLY valid JSON matching the exact shape above, using real ids from the candidate lists.`;
    raw = await callGemini(stricterPrompt);
  }

  const colorById = new Map(candidateColors.map((c) => [c.id, c]));
  const resolvedColors = raw.colors.map(({ colorId, role }) => {
    const color = colorById.get(colorId);
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

  const typeScale = generateTypeScale(raw.baseSize ?? 16, raw.typeScaleRatio);
  const spacing = generateSpacingScale(raw.spacingBase ?? 4);
  const shadows = buildShadowScale(raw.shadowLevel ?? "subtle");
  const cornerRadius = buildRadiusScale(raw.cornerRadius ?? 8);

  const moodboardById = new Map(candidateMoodboardImages.map((m) => [m.id, m]));
  const moodboard = (raw.moodboardImageIds ?? [])
    .map((id) => moodboardById.get(id))
    .filter((image): image is MoodboardImage => Boolean(image));

  const reasoning: AIReasoning = raw.reasoning;

  return {
    name: raw.projectName,
    colors: resolvedColors,
    fonts: { primary: primaryFont, secondary: secondaryFont, accent: accentFont },
    typeScale,
    spacing,
    shadows,
    cornerRadius,
    moodboard: moodboard.length > 0 ? moodboard : undefined,
    aiGenerated: true,
    aiPrompt: request.prompt,
    aiReasoning: reasoning,
  };
}
