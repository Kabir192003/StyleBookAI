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
  // 4000 chars, not the tighter limit you'd expect — detailed design-system
  // prompts (see includeDesignSystem below) routinely run long.
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
  // Required of the model by lib/ai/prompt.ts's contract, but parsed leniently
  // here — rejecting the whole response over a missing dark variant would be
  // pointless, since lib/ai/generate.ts always ends up with one anyway,
  // deriving it from the light tokens (deriveDarkThemeVariantFromLight) when
  // the model omits one or returns one that fails the quality gate in
  // lib/colors/deriveDarkPalette.ts.
  dark: themeVariantTokensSchema.optional(),
  accessibility: z
    .object({
      level: z.enum(["AA", "AAA"]),
      // Optional because lib/ai/validateTokens.ts overwrites these wholesale
      // with measured ratios — the model's own compliance claims aren't trusted.
      notes: z.array(z.string().min(1)).max(20).optional(),
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

/* ---------------------------------------------------------------------- *
 * UI structure — what the generated mockup is actually made of.
 *
 * The model picks an ordered list of *sections* from a fixed vocabulary and
 * fills each with content. It never emits a colour, font, radius, spacing or
 * shadow: those come from the design system the same request produced, so a
 * generated page is guaranteed to be on-token by construction rather than by
 * asking the model nicely.
 *
 * A fixed vocabulary is what makes "any reasonable context" work without a
 * hard-coded list of contexts. The variety comes from *composition* — a
 * fintech dashboard is statRow + recordTable + progressList, a music app is
 * itemGrid + mediaBar + feed, a university portal is schedule + progressList
 * + feed — not from inventing new primitives per industry.
 * ---------------------------------------------------------------------- */

const ctaSchema = z.string().min(1).max(30);
const shortText = z.string().min(1).max(60);

const sectionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hero"),
    eyebrow: z.string().max(40).optional(),
    headline: z.string().min(1).max(90),
    subheadline: z.string().min(1).max(180),
    primaryCta: ctaSchema,
    secondaryCta: z.string().max(30).optional(),
  }),
  z.object({
    type: z.literal("searchBar"),
    title: z.string().max(60).optional(),
    placeholder: z.string().min(1).max(60),
    filters: z.array(shortText).max(6).optional(),
    submitLabel: ctaSchema,
  }),
  z.object({
    type: z.literal("statRow"),
    title: z.string().max(60).optional(),
    items: z.array(z.object({ value: z.string().min(1).max(16), label: shortText })).min(2).max(4),
  }),
  z.object({
    type: z.literal("itemGrid"),
    title: z.string().max(60).optional(),
    lead: z.string().max(160).optional(),
    items: z
      .array(
        z.object({
          title: z.string().min(1).max(60),
          subtitle: z.string().max(90).optional(),
          meta: z.string().max(40).optional(),
          badge: z.string().max(20).optional(),
          cta: z.string().max(30).optional(),
        })
      )
      .min(2)
      .max(6),
  }),
  z.object({
    type: z.literal("recordTable"),
    title: z.string().max(60).optional(),
    columns: z.array(shortText).min(2).max(5),
    rows: z.array(z.array(z.string().max(40)).min(2).max(5)).min(2).max(6),
    rowAction: z.string().max(20).optional(),
  }),
  z.object({
    type: z.literal("detailPanel"),
    title: z.string().min(1).max(60),
    subtitle: z.string().max(90).optional(),
    fields: z.array(z.object({ key: shortText, value: z.string().min(1).max(60) })).min(2).max(8),
    primaryCta: ctaSchema.optional(),
  }),
  z.object({
    type: z.literal("formPanel"),
    title: z.string().min(1).max(60),
    lead: z.string().max(160).optional(),
    fields: z
      .array(
        z.object({
          label: shortText,
          // Deliberately a small set: every one maps to a real component in
          // components/system. A free-form type would let the model ask for
          // inputs the library cannot render.
          kind: z.enum(["text", "email", "textarea", "select", "checkbox", "radio", "toggle"]),
          placeholder: z.string().max(60).optional(),
          options: z.array(shortText).max(5).optional(),
        })
      )
      .min(2)
      .max(6),
    submitLabel: ctaSchema,
  }),
  z.object({
    type: z.literal("schedule"),
    title: z.string().max(60).optional(),
    slots: z
      .array(
        z.object({
          time: z.string().min(1).max(24),
          title: z.string().min(1).max(60),
          meta: z.string().max(40).optional(),
          status: z.string().max(20).optional(),
        })
      )
      .min(2)
      .max(6),
  }),
  z.object({
    type: z.literal("mediaBar"),
    title: z.string().min(1).max(60),
    subtitle: z.string().max(60).optional(),
    meta: z.string().max(30).optional(),
    primaryAction: ctaSchema.optional(),
  }),
  z.object({
    type: z.literal("progressList"),
    title: z.string().max(60).optional(),
    items: z
      .array(
        z.object({
          label: shortText,
          percent: z.number().int().min(0).max(100),
          caption: z.string().max(40).optional(),
        })
      )
      .min(2)
      .max(5),
  }),
  z.object({
    type: z.literal("feed"),
    title: z.string().max(60).optional(),
    items: z
      .array(
        z.object({
          title: z.string().min(1).max(70),
          body: z.string().max(160).optional(),
          meta: z.string().max(40).optional(),
          tone: z.enum(["info", "success", "warning", "error"]).optional(),
        })
      )
      .min(2)
      .max(5),
  }),
  z.object({
    type: z.literal("footer"),
    note: z.string().max(90).optional(),
    links: z.array(shortText).max(6).optional(),
  }),
]);

export type AISection = z.infer<typeof sectionSchema>;
export type AISectionType = AISection["type"];

export const AI_SECTION_TYPES: AISectionType[] = [
  "hero",
  "searchBar",
  "statRow",
  "itemGrid",
  "recordTable",
  "detailPanel",
  "formPanel",
  "schedule",
  "mediaBar",
  "progressList",
  "feed",
  "footer",
];

// `sections` is intentionally `unknown[]` here, validated per-entry by
// `parseSections` below — this rides along with the palette, fonts and design
// system in one model response, so one malformed section shouldn't fail the
// whole parse and throw away an otherwise-good result.
const uiStructureSchema = z.object({
  appName: z.string().min(1).max(40),
  tagline: z.string().max(90).optional(),
  navItems: z.array(z.string().min(1).max(24)).min(3).max(6),
  sections: z.array(z.unknown()).min(1).max(8),
});

export type AIUiStructure = Omit<z.infer<typeof uiStructureSchema>, "sections"> & { sections: AISection[] };

/** Validates each section on its own, silently dropping the ones that fail. */
export function parseSections(raw: unknown[]): AISection[] {
  const out: AISection[] = [];
  for (const entry of raw) {
    const parsed = sectionSchema.safeParse(entry);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

export const GeminiPaletteResponseSchema = z.object({
  projectName: z.string().min(1).max(60),
  // Drives which mock preview layout the AI results page renders — see
  // components/ai/PromptInput.tsx. Defaults to "generic" if the model omits
  // it (older prompt versions / retries).
  context: z.enum(contextValues).optional(),
  // 2-12 rather than a fixed 5-7, so an explicit count in the prompt ("a
  // palette of 3") can be honored — see lib/ai/prompt.ts's count instruction.
  colors: z.array(colorEntrySchema).min(2).max(12),
  primaryFontId: z.string().min(1),
  secondaryFontId: z.string().min(1),
  accentFontId: z.string().min(1).optional(),
  typeScaleRatio: z.string().min(1),
  baseSize: z.number().min(12).max(24).optional(),
  spacingBase: z.union([z.literal(4), z.literal(8)]).optional(),
  shadowLevel: z.enum(["none", "subtle", "dramatic"]).optional(),
  // Any integer 0-24, including 0 (hard corners) — snapped to the nearest
  // supported base by snapRadiusBase() in lib/ai/radiusScale.ts, which then
  // derives the full sm/md/lg/pill ramp.
  cornerRadius: z.number().int().min(0).max(24).optional(),
  moodboardImageIds: z.array(z.string().min(1)).min(2).max(3).optional(),
  designSystem: designSystemSchema.optional(),
  mockup: mockupSchema,
  // Optional so a response from the older prompt (or a retry that drops it)
  // still yields a usable design system; the canvas falls back to the default
  // showcase when it is absent.
  uiStructure: uiStructureSchema.optional(),
  reasoning: z.object({
    palette: z.string().min(1),
    fonts: z.string().min(1),
    typeScale: z.string().min(1),
    overall: z.string().min(1),
  }),
});

export type GeminiPaletteResponse = z.infer<typeof GeminiPaletteResponseSchema>;
export type GeminiColorEntry = z.infer<typeof colorEntrySchema>;
