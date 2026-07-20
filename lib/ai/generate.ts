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
import { allColors } from "@/data/colors";
import { allFonts } from "@/data/fonts";
import { AIGenerateRequest } from "@/types/ai";
import { AIReasoning, Project } from "@/types/project";
import { Color } from "@/types/color";

const MAX_CANDIDATE_COLORS = 120;

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
  const prompt = buildGeneratePrompt(request, candidateColors, allFonts);

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

  const fontById = new Map(allFonts.map((f) => [f.id, f]));
  const primaryFont = fontById.get(raw.primaryFontId);
  const secondaryFont = fontById.get(raw.secondaryFontId);
  const accentFont = raw.accentFontId ? fontById.get(raw.accentFontId) : undefined;

  if (!primaryFont || !secondaryFont) {
    throw new AIGenerationError("Gemini returned an unknown font id");
  }

  const typeScale = generateTypeScale(raw.baseSize ?? 16, raw.typeScaleRatio);
  const reasoning: AIReasoning = raw.reasoning;

  return {
    name: raw.projectName,
    colors: resolvedColors,
    fonts: { primary: primaryFont, secondary: secondaryFont, accent: accentFont },
    typeScale,
    aiGenerated: true,
    aiPrompt: request.prompt,
    aiReasoning: reasoning,
  };
}
