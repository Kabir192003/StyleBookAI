/**
 * Prompt builder for POST /api/ai/generate.
 *
 * Gemini should prefer picking from the candidate colors/fonts list below
 * (they carry real editorial metadata — name, family, mood, a written
 * note), but for colors it may return an exact hex directly when the user
 * asked for a specific value the candidates can't approximate — see the
 * colorId/hex contract below and lib/ai/generate.ts's resolution logic.
 * Fonts are still id-only; Gemini never invents a font family. Keeps the
 * JSON contract in prose form here so schema.ts and this file are the two
 * places that define "what Gemini must return."
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

const DESIGN_SYSTEM_CONTRACT = `
The user also wants a full design system, not just a palette. Include a
"designSystem" object in your response with this shape:
{
  "light": {
    "colorRoles": { "background": hex, "surface": hex, "text": hex, "textMuted": hex, "border": hex },
    "components": {
      // include only the components the brief actually calls for — button
      // is the only one you must always include if designSystem is present
      "button": ComponentTokenSet, "buttonSecondary": ComponentTokenSet,
      "input": ComponentTokenSet, "dropdown": ComponentTokenSet, "card": ComponentTokenSet,
      "navigation": ComponentTokenSet, "table": ComponentTokenSet, "modal": ComponentTokenSet,
      "alert": ComponentTokenSet, "badge": ComponentTokenSet
    }
  },
  "dark": { same shape as "light" — only include if the brief asks for a dark theme },
  "accessibility": { "level": "AA" or "AAA", "notes": [ string, ... specific, e.g. "Primary button text on accent background passes WCAG AA (4.6:1)." ] },
  "iconStyle": { "style": "line" | "solid" | "duotone", "strokeWidth": number (optional, 0.5-4), "note": string },
  "grid": { "columns": integer 1-24, "gutter": number px, "maxWidth": number px },
  "breakpoints": { "sm": number px, "md": number px, "lg": number px, "xl": number px }
}
ComponentTokenSet shape: { "background": hex, "text": hex, "border": hex (optional), "states": { "hover": {background/text/border hex, all optional}, "active": {...}, "disabled": {...}, "focus": {...} } } — only include the states that meaningfully differ from the default.
Every hex value in designSystem must be a real hex string like "#4B5FD1" — you may reuse hexes from your chosen palette or introduce complementary ones; you are not restricted to the candidate list for these.`;

export function buildGeneratePrompt(
  request: AIGenerateRequest,
  candidateColors: Color[],
  candidateFonts: Font[],
  candidateMoodboardImages: MoodboardImage[]
): string {
  const ratioNames = Object.keys(TYPE_SCALE_RATIOS).join(", ");

  return `You are StyleBook's design assistant. A user described a brand and you
must assemble a color palette, a font pairing, and a type scale for it.

For colors: prefer the candidate list below when a close match exists — those
carry real editorial metadata (name, family, mood, a written note) the app
displays elsewhere, so a good approximate match beats an arbitrary hex. But if
the user gives an exact hex code or names a very specific brand color the
candidates can't approximate, return that literal hex instead of guessing —
see the colorId/hex contract in the JSON shape below. Never invent a font
family that isn't in the candidate font list.

If the brand description states an exact number of colors (e.g. "5-6 hex
codes", "a palette of 3", "10 colors") or an exact number of fonts (up to 3:
primary/secondary/optional accent), return exactly that many instead of the
default 5-7 colors / 2 fonts.

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
  "colors": [ { "role": string (e.g. "primary", "background", "accent", "text"), "colorId": string (one of the candidate ids above — omit if using "hex" instead), "hex": string (a literal hex like "#4B5FD1" — omit if using "colorId" instead; use this only when the candidates can't satisfy an exact request), "name": string (optional, only when using "hex" — a short name for the custom color) }, ... 5 to 7 entries by default, or the exact count requested ],
  "primaryFontId": string (must be one of the candidate font ids, useCase includes "heading" or "body"),
  "secondaryFontId": string (must be one of the candidate font ids, different from primaryFontId),
  "accentFontId": string (optional, one of the candidate font ids),
  "typeScaleRatio": string (must be exactly one of the valid ratio names above),
  "baseSize": number (optional, 12-24, defaults to 16 if omitted),
  "spacingBase": number (must be exactly 4 or 8 — pick 4 for a tighter/compact feel, 8 for a more spacious/airy feel),
  "shadowLevel": string (must be exactly one of the valid shadow levels — "none" for flat/brutalist brands, "subtle" for minimal/professional, "dramatic" for bold/luxury),
  "cornerRadius": number (must be exactly one of the valid corner radius values — lower for sharp/serious brands, higher for soft/friendly brands),
  "moodboardImageIds": [ string, string ] (2 to 3 of the candidate moodboard image ids above whose mood best matches the brand),
  ${request.includeDesignSystem ? `"designSystem": DesignSystem (see the detailed shape below — REQUIRED since the user asked for a full design system),` : ""}
  "reasoning": {
    "palette": string (plain language, why these colors together),
    "fonts": string (plain language, why this pairing),
    "typeScale": string (plain language, why this ratio fits the brand),
    "overall": string (plain language, the overall design direction)
  }
}
${request.includeDesignSystem ? DESIGN_SYSTEM_CONTRACT : ""}

Do not include markdown formatting, code fences, or any text outside the JSON object.`;
}
