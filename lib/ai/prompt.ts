/**
 * Prompt builder for POST /api/ai/generate.
 *
 * Gemini is only ever allowed to pick from a candidate list of real colors
 * and fonts we hand it — it returns ids, never invents hex codes or font
 * families. Keeps the JSON contract in prose form here so schema.ts and
 * this file are the two places that define "what Gemini must return."
 */
import { Color } from "@/types/color";
import { Font } from "@/types/font";
import { MoodboardImage } from "@/types/designTokens";
import { AIGenerateRequest } from "@/types/ai";
import { TYPE_SCALE_RATIOS } from "@/lib/typeScale/generateTypeScale";

function describeColor(c: Color): string {
  return `${c.id} | ${c.name} | ${c.hex} | family:${c.family} | mood:${c.mood.join(",")}`;
}

function describeFont(f: Font): string {
  return `${f.id} | ${f.family} | ${f.category} | mood:${f.mood.join(",")} | useCase:${f.useCase.join(",")}`;
}

function describeMoodboardImage(m: MoodboardImage): string {
  return `${m.id} | mood:${m.mood.join(",")} | ${m.alt}`;
}

export function buildGeneratePrompt(
  request: AIGenerateRequest,
  candidateColors: Color[],
  candidateFonts: Font[],
  candidateMoodboardImages: MoodboardImage[]
): string {
  const ratioNames = Object.keys(TYPE_SCALE_RATIOS).join(", ");

  return `You are StyleBook's design assistant. A user described a brand and you
must assemble a color palette, a font pairing, and a type scale for it,
using ONLY the candidate colors and fonts listed below — never invent a
hex code or a font family that isn't in these lists.

Brand description: "${request.prompt}"
${request.style?.length ? `Preferred style keywords: ${request.style.join(", ")}` : ""}
${request.colorPreferences?.length ? `Color preferences: ${request.colorPreferences.join(", ")}` : ""}
${request.avoid?.length ? `Avoid: ${request.avoid.join(", ")}` : ""}

Candidate colors (id | name | hex | family | mood):
${candidateColors.map(describeColor).join("\n")}

Candidate fonts (id | family | category | mood | useCase):
${candidateFonts.map(describeFont).join("\n")}

Candidate moodboard images (id | mood | description):
${candidateMoodboardImages.map(describeMoodboardImage).join("\n")}

Valid type scale ratio names: ${ratioNames}
Valid spacing bases: 4, 8
Valid shadow levels: none, subtle, dramatic
Valid corner radius values: 4, 8, 12, 20

Respond with JSON ONLY, matching exactly this shape:
{
  "projectName": string (short, evocative, <= 60 chars),
  "colors": [ { "colorId": string (must be one of the candidate ids above), "role": string (e.g. "primary", "background", "accent", "text") }, ... 5 to 7 entries ],
  "primaryFontId": string (must be one of the candidate font ids, useCase includes "heading" or "body"),
  "secondaryFontId": string (must be one of the candidate font ids, different from primaryFontId),
  "accentFontId": string (optional, one of the candidate font ids),
  "typeScaleRatio": string (must be exactly one of the valid ratio names above),
  "baseSize": number (optional, 12-24, defaults to 16 if omitted),
  "spacingBase": number (must be exactly 4 or 8 — pick 4 for a tighter/compact feel, 8 for a more spacious/airy feel),
  "shadowLevel": string (must be exactly one of the valid shadow levels — "none" for flat/brutalist brands, "subtle" for minimal/professional, "dramatic" for bold/luxury),
  "cornerRadius": number (must be exactly one of the valid corner radius values — lower for sharp/serious brands, higher for soft/friendly brands),
  "moodboardImageIds": [ string, string ] (2 to 3 of the candidate moodboard image ids above whose mood best matches the brand),
  "reasoning": {
    "palette": string (plain language, why these colors together),
    "fonts": string (plain language, why this pairing),
    "typeScale": string (plain language, why this ratio fits the brand),
    "overall": string (plain language, the overall design direction)
  }
}

Do not include markdown formatting, code fences, or any text outside the JSON object.`;
}
