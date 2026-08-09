/**
 * Zod schemas for POST /api/ai/generate — both the inbound request and the
 * raw shape we require back from Gemini. Keep AIGenerateRequestSchema in
 * sync with types/ai.ts's AIGenerateRequest, and the designSystem* schemas
 * in sync with types/designSystem.ts.
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

const HEX_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const hexSchema = z.string().regex(HEX_REGEX, "must be a hex color like #4B5FD1");

export const AIGenerateRequestSchema = z.object({
  // Raised from 500 — detailed/comprehensive design-system prompts (see
  // includeDesignSystem below) routinely run several hundred to a few
  // thousand characters.
  prompt: z.string().trim().min(3, "prompt is required").max(4000),
  style: z.array(z.enum(colorStyleValues)).optional(),
  colorPreferences: z.array(z.string()).max(10).optional(),
  avoid: z.array(z.string()).max(10).optional(),
  includeDesignSystem: z.boolean().optional(),
});

// Raw shape we instruct Gemini to return. Each color is either a candidate
// `colorId` (existing catalog pick, preferred when a close match exists) or
// a literal `hex` (used when the user asked for an exact color Gemini
// can't approximate from the library — resolved via
// lib/colors/deriveColorMetadata.ts instead of a catalog lookup). Fonts are
// still id-only — Gemini never invents a font family.
const colorEntrySchema = z
  .object({
    role: z.string().min(1),
    colorId: z.string().min(1).optional(),
    hex: hexSchema.optional(),
    name: z.string().min(1).max(60).optional(),
  })
  .refine((c) => Boolean(c.colorId || c.hex), {
    message: "each color needs a colorId or a hex value",
  });

const componentStateOverrideSchema = z.object({
  background: hexSchema.optional(),
  text: hexSchema.optional(),
  border: hexSchema.optional(),
});

const componentTokenSetSchema = z.object({
  background: hexSchema,
  text: hexSchema,
  border: hexSchema.optional(),
  states: z
    .object({
      hover: componentStateOverrideSchema.optional(),
      active: componentStateOverrideSchema.optional(),
      disabled: componentStateOverrideSchema.optional(),
      focus: componentStateOverrideSchema.optional(),
    })
    .optional(),
});

const componentTokensSchema = z.object({
  button: componentTokenSetSchema.optional(),
  buttonSecondary: componentTokenSetSchema.optional(),
  input: componentTokenSetSchema.optional(),
  dropdown: componentTokenSetSchema.optional(),
  card: componentTokenSetSchema.optional(),
  navigation: componentTokenSetSchema.optional(),
  table: componentTokenSetSchema.optional(),
  modal: componentTokenSetSchema.optional(),
  alert: componentTokenSetSchema.optional(),
  badge: componentTokenSetSchema.optional(),
});

const themeVariantTokensSchema = z.object({
  colorRoles: z.object({
    background: hexSchema,
    surface: hexSchema,
    text: hexSchema,
    textMuted: hexSchema,
    border: hexSchema,
  }),
  components: componentTokensSchema,
});

// Only requested (and only sent to the model) when the caller sets
// includeDesignSystem — keeps a plain "give me a palette" request small.
const designSystemSchema = z.object({
  light: themeVariantTokensSchema,
  dark: themeVariantTokensSchema.optional(),
  accessibility: z
    .object({
      level: z.enum(["AA", "AAA"]),
      notes: z.array(z.string().min(1)).min(1).max(20),
    })
    .optional(),
  iconStyle: z
    .object({
      style: z.enum(["line", "solid", "duotone"]),
      strokeWidth: z.number().min(0.5).max(4).optional(),
      note: z.string().min(1),
    })
    .optional(),
  grid: z
    .object({
      columns: z.number().int().min(1).max(24),
      gutter: z.number().min(0).max(64),
      maxWidth: z.number().min(320).max(2560),
    })
    .optional(),
  breakpoints: z
    .object({
      sm: z.number().min(200).max(2000),
      md: z.number().min(200).max(2000),
      lg: z.number().min(200).max(2000),
      xl: z.number().min(200).max(2000),
    })
    .optional(),
});

const contextValues = ["saas", "ecommerce", "government", "editorial", "generic"] as const;

// Content for the live mock preview (components/ai/LivePreviewMock.tsx) —
// the model writes real copy for the described business instead of the
// app filling in a generic template. See the mockup contract in
// prompt.ts for the instructions that produce this.
const mockupCardSchema = z.object({
  title: z.string().min(1).max(60),
  subtitle: z.string().min(1).max(80),
  meta: z.string().max(40).optional(),
  cta: z.string().min(1).max(30),
});

const mockupSchema = z.object({
  siteLabel: z.string().min(1).max(40),
  navItems: z.array(z.string().min(1).max(24)).min(3).max(5),
  hero: z.object({
    eyebrow: z.string().max(40).optional(),
    headline: z.string().min(1).max(90),
    subheadline: z.string().min(1).max(160),
    primaryCta: z.string().min(1).max(30),
    secondaryCta: z.string().max(30).optional(),
  }),
  cards: z.array(mockupCardSchema).min(2).max(4),
  footerNote: z.string().max(80).optional(),
});

export const GeminiPaletteResponseSchema = z.object({
  projectName: z.string().min(1).max(60),
  // Drives which mock preview layout the AI results page renders — see
  // components/ai/PromptInput.tsx. Defaults to "generic" if the model omits
  // it (older prompt versions / retries).
  context: z.enum(contextValues).optional(),
  // Widened from a fixed 5-7 so an explicit count in the prompt ("5-6 hex
  // codes", "a palette of 3") can actually be honored — see the count
  // instruction in lib/ai/prompt.ts.
  colors: z.array(colorEntrySchema).min(2).max(12),
  primaryFontId: z.string().min(1),
  secondaryFontId: z.string().min(1),
  accentFontId: z.string().min(1).optional(),
  typeScaleRatio: z.string().min(1),
  baseSize: z.number().min(12).max(24).optional(),
  spacingBase: z.union([z.literal(4), z.literal(8)]).optional(),
  shadowLevel: z.enum(["none", "subtle", "dramatic"]).optional(),
  cornerRadius: z.union([z.literal(4), z.literal(8), z.literal(12), z.literal(20)]).optional(),
  moodboardImageIds: z.array(z.string().min(1)).min(2).max(3).optional(),
  designSystem: designSystemSchema.optional(),
  mockup: mockupSchema,
  reasoning: z.object({
    palette: z.string().min(1),
    fonts: z.string().min(1),
    typeScale: z.string().min(1),
    overall: z.string().min(1),
  }),
});

export type GeminiPaletteResponse = z.infer<typeof GeminiPaletteResponseSchema>;
export type GeminiColorEntry = z.infer<typeof colorEntrySchema>;
