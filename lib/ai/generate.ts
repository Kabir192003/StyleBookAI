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

// Kept small — a larger candidate list means a bigger prompt, which means
// a slower Gemini round-trip, which risks the serverless function timeout
// (see maxDuration in app/api/ai/generate/route.ts).
const MAX_CANDIDATE_COLORS = 60;
const MAX_CANDIDATE_FONTS = 40;

export class AIGenerationError extends Error {}

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

  return pool.slice(0, MAX_CANDIDATE_COLORS);
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

  for (const font of rest) {
    if (candidates.length >= MAX_CANDIDATE_FONTS) break;
    if (!seen.has(font.id)) {
      seen.add(font.id);
      candidates.push(font);
    }
  }

  return candidates;
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
  const prompt = buildGeneratePrompt(request, candidateColors, candidateFonts, moodboardImages);

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

  const moodboardById = new Map(moodboardImages.map((m) => [m.id, m]));
  const moodboard = (raw.moodboardImageIds ?? [])
    .map((id) => moodboardById.get(id))
    .filter((image): image is (typeof moodboardImages)[number] => Boolean(image));

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
