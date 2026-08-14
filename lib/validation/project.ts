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

// Mirrors types/designSystem.ts — see lib/ai/schema.ts for the AI-response
// version of this same shape.
const HEX_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const hexSchema = z.string().regex(HEX_REGEX);

const ComponentStateOverrideSchema = z.object({
  background: hexSchema.optional(),
  text: hexSchema.optional(),
  border: hexSchema.optional(),
});

const ComponentTokenSetSchema = z.object({
  background: hexSchema,
  text: hexSchema,
  border: hexSchema.optional(),
  states: z
    .object({
      hover: ComponentStateOverrideSchema.optional(),
      active: ComponentStateOverrideSchema.optional(),
      disabled: ComponentStateOverrideSchema.optional(),
      focus: ComponentStateOverrideSchema.optional(),
    })
    .optional(),
});

const ComponentTokensSchema = z.object({
  button: ComponentTokenSetSchema.optional(),
  buttonSecondary: ComponentTokenSetSchema.optional(),
  input: ComponentTokenSetSchema.optional(),
  dropdown: ComponentTokenSetSchema.optional(),
  card: ComponentTokenSetSchema.optional(),
  navigation: ComponentTokenSetSchema.optional(),
  table: ComponentTokenSetSchema.optional(),
  modal: ComponentTokenSetSchema.optional(),
  alert: ComponentTokenSetSchema.optional(),
  badge: ComponentTokenSetSchema.optional(),
});

const ThemeVariantTokensSchema = z.object({
  colorRoles: z.object({
    background: hexSchema,
    surface: hexSchema,
    text: hexSchema,
    textMuted: hexSchema,
    border: hexSchema,
  }),
  components: ComponentTokensSchema,
});

const DesignSystemSchema = z.object({
  light: ThemeVariantTokensSchema,
  dark: ThemeVariantTokensSchema.optional(),
  accessibility: z
    .object({ level: z.enum(["AA", "AAA"]), notes: z.array(z.string()) })
    .optional(),
  iconStyle: z
    .object({
      style: z.enum(["line", "solid", "duotone"]),
      strokeWidth: z.number().optional(),
      note: z.string(),
    })
    .optional(),
  grid: z
    .object({ columns: z.number(), gutter: z.number(), maxWidth: z.number() })
    .optional(),
  breakpoints: z
    .object({ sm: z.number(), md: z.number(), lg: z.number(), xl: z.number() })
    .optional(),
});

// Mirrors lib/studio/tokenGraph.ts's ColorValue — a literal hex (today's
// behavior) or a reference to a colorPrimitives entry by id.
const ColorValueSchema = z.union([hexSchema, z.object({ primitiveId: z.string() })]);

const PrimitiveColorSchema = z.object({
  id: z.string(),
  name: z.string(),
  hex: hexSchema,
});

const EditablePaletteTokensSchema = z.object({
  accent: ColorValueSchema,
  support: ColorValueSchema,
  surface: ColorValueSchema,
  ink: ColorValueSchema,
  muted: ColorValueSchema,
});

// A block's arranged position/size in the Studio live-preview canvas.
// Mirrors lib/studio/livePreviewBlocks.ts's PreviewLayoutItem.
const PreviewLayoutItemSchema = z.object({
  id: z.string(),
  visible: z.boolean(),
  width: z.number().nullable(),
});

// Mirrors lib/playground/types.ts. The role maps are validated as partial
// records keyed by the literal role names rather than as a free-form
// `z.record(z.string(), …)`: a typo'd role would otherwise validate happily,
// save, and then resolve to nothing on reload — a failure with no error
// message anywhere, which is exactly the class of bug this schema exists to
// catch at the API boundary.
const PlaygroundRoleSchema = z.enum([
  "background",
  "surface",
  "primary",
  "secondary",
  "accent",
  "text",
  "muted",
  "border",
  "success",
  "warning",
  "error",
]);

const PlaygroundTypeRoleSchema = z.enum([
  "display",
  "heading",
  "subheading",
  "body",
  "label",
  "button",
  "caption",
]);

const PlaygroundOriginSchema = z.enum(["system", "clipboard", "custom", "pasted"]);

const ExperimentSchema = z.object({
  id: z.string(),
  name: z.string(),
  colors: z.record(PlaygroundRoleSchema, hexSchema),
  fonts: z.record(PlaygroundTypeRoleSchema, z.string()),
  radius: z.number().optional(),
  visibleGroups: z.array(z.string()).optional(),
});

const PlaygroundStateSchema = z.object({
  experiments: z.array(ExperimentSchema),
  swatches: z.array(
    z.object({ id: z.string(), hex: hexSchema, name: z.string(), origin: PlaygroundOriginSchema })
  ),
  fonts: z.array(
    z.object({ id: z.string(), family: z.string(), category: z.string(), origin: PlaygroundOriginSchema })
  ),
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
  designSystem: DesignSystemSchema.optional(),
  colorPrimitives: z.array(PrimitiveColorSchema).optional(),
  studioPaletteLinks: z
    .object({ light: EditablePaletteTokensSchema, dark: EditablePaletteTokensSchema })
    .optional(),
  previewLayout: z.array(PreviewLayoutItemSchema).optional(),
  playground: PlaygroundStateSchema.optional(),
  context: z.enum(["saas", "ecommerce", "government", "editorial", "generic"]).optional(),
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
