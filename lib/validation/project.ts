/**
 * Zod schema for POST/PUT /api/projects payloads — mirrors types/project.ts,
 * types/color.ts, types/font.ts, types/theme.ts. Kept as one file since it's
 * one concern (validating a Project payload at the API boundary).
 */
import { z } from "zod";

const ColorFamilySchema = z.enum([
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
  "brown",
  "neutral",
]);

const ColorMoodSchema = z.enum([
  "calm",
  "energetic",
  "warm",
  "cool",
  "luxurious",
  "playful",
  "earthy",
  "moody",
]);

const ColorStyleSchema = z.enum([
  "minimal",
  "bold",
  "vintage",
  "modern",
  "pastel",
  "neon",
  "muted",
]);

const ColorSchema = z.object({
  id: z.string(),
  name: z.string(),
  hex: z.string(),
  rgb: z.object({ r: z.number(), g: z.number(), b: z.number() }),
  hsl: z.object({ h: z.number(), s: z.number(), l: z.number() }),
  family: ColorFamilySchema,
  mood: z.array(ColorMoodSchema),
  style: z.array(ColorStyleSchema),
  collection: z.string(),
  isPro: z.boolean(),
  note: z.string(),
  role: z.string().optional(),
});

const FontCategorySchema = z.enum([
  "sans-serif",
  "serif",
  "display",
  "monospace",
  "handwriting",
  "variable",
]);

const FontUseCaseSchema = z.enum(["heading", "body", "accent", "code"]);

const FontSchema = z.object({
  id: z.string(),
  family: z.string(),
  category: FontCategorySchema,
  variants: z.array(z.string()),
  mood: z.array(z.string()),
  style: z.array(z.string()),
  era: z.string(),
  useCase: z.array(FontUseCaseSchema),
  googleFontsId: z.string(),
  isPro: z.boolean(),
  pairsWith: z.array(z.string()),
  note: z.string(),
});

const TypeScaleSchema = z.object({
  baseSize: z.number(),
  ratio: z.number(),
  ratioName: z.string(),
  sizes: z.object({
    xs: z.number(),
    sm: z.number(),
    base: z.number(),
    lg: z.number(),
    xl: z.number(),
    "2xl": z.number(),
    "3xl": z.number(),
    "4xl": z.number(),
    "5xl": z.number(),
    "6xl": z.number(),
  }),
});

const AIReasoningSchema = z.object({
  palette: z.string(),
  fonts: z.string(),
  typeScale: z.string(),
  overall: z.string(),
});

const SpacingScaleSchema = z.object({
  base: z.number(),
  steps: z.array(z.number()),
});

const ShadowScaleSchema = z.object({
  levels: z.array(z.object({ name: z.enum(["none", "subtle", "dramatic"]), value: z.string() })),
  recommended: z.enum(["none", "subtle", "dramatic"]),
});

const CornerRadiusScaleSchema = z.object({
  options: z.array(z.number()),
  recommended: z.number(),
});

const MoodboardImageSchema = z.object({
  id: z.string(),
  src: z.string(),
  alt: z.string(),
  mood: z.array(z.string()),
});

export const ProjectInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500).optional(),
  colors: z.array(ColorSchema).min(1).max(12),
  fonts: z.object({
    primary: FontSchema,
    secondary: FontSchema,
    accent: FontSchema.optional(),
  }),
  typeScale: TypeScaleSchema,
  spacing: SpacingScaleSchema.optional(),
  shadows: ShadowScaleSchema.optional(),
  cornerRadius: CornerRadiusScaleSchema.optional(),
  moodboard: z.array(MoodboardImageSchema).optional(),
  theme: z
    .object({ id: z.string(), slug: z.string(), name: z.string() })
    .optional(),
  aiGenerated: z.boolean().optional().default(false),
  aiPrompt: z.string().optional(),
  aiReasoning: AIReasoningSchema.optional(),
});

export type ProjectInput = z.infer<typeof ProjectInputSchema>;

// PUT allows partial updates — same shape, nothing required.
export const ProjectUpdateSchema = ProjectInputSchema.partial();
