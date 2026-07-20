/**
 * Zod schemas for POST /api/ai/generate — both the inbound request and the
 * raw shape we require back from Gemini. Keep AIGenerateRequestSchema in
 * sync with types/ai.ts's AIGenerateRequest.
 */
import { z } from "zod";

const colorStyleValues = [
  "minimal",
  "bold",
  "vintage",
  "modern",
  "pastel",
  "neon",
  "muted",
] as const;

export const AIGenerateRequestSchema = z.object({
  prompt: z.string().trim().min(3, "prompt is required").max(500),
  style: z.array(z.enum(colorStyleValues)).optional(),
  colorPreferences: z.array(z.string()).max(10).optional(),
  avoid: z.array(z.string()).max(10).optional(),
});

// Raw shape we instruct Gemini to return. IDs are resolved against
// allColors / allFonts after parsing — Gemini never invents hex codes
// or font families directly, only picks existing ids.
export const GeminiPaletteResponseSchema = z.object({
  projectName: z.string().min(1).max(60),
  colors: z
    .array(
      z.object({
        colorId: z.string().min(1),
        role: z.string().min(1),
      })
    )
    .min(5)
    .max(7),
  primaryFontId: z.string().min(1),
  secondaryFontId: z.string().min(1),
  accentFontId: z.string().min(1).optional(),
  typeScaleRatio: z.string().min(1),
  baseSize: z.number().min(12).max(24).optional(),
  spacingBase: z.union([z.literal(4), z.literal(8)]).optional(),
  shadowLevel: z.enum(["none", "subtle", "dramatic"]).optional(),
  cornerRadius: z.union([z.literal(4), z.literal(8), z.literal(12), z.literal(20)]).optional(),
  moodboardImageIds: z.array(z.string().min(1)).min(2).max(3).optional(),
  reasoning: z.object({
    palette: z.string().min(1),
    fonts: z.string().min(1),
    typeScale: z.string().min(1),
    overall: z.string().min(1),
  }),
});

export type GeminiPaletteResponse = z.infer<typeof GeminiPaletteResponseSchema>;
