// The one place that knows how to turn everything the app can generate into a
// W3C Design Tokens Community Group (DTCG) token tree. Both export pipelines
// (lib/studio/exportCode.ts and lib/export/generators.ts) normalise into
// `NormalizedSystem` here and share one DTCG writer, so a fix lands in both
// instead of drifting between an ad-hoc Studio shape and an API shape that
// silently dropped the dark palette and component states.
//
// Format target: the DTCG *second editors' draft* value grammar — colours as
// `#rrggbb[aa]` hex strings, dimensions as `"16px"` strings, composite
// `shadow`/`typography` objects — not the newest draft's `{value, unit}` /
// `{colorSpace, components}` shapes, because the string grammar is what
// Tokens Studio and the Figma "Design Tokens" plugins actually parse today.
import { SpacingScale, ShadowScale } from "@/types/designTokens";
import { ComponentName, ComponentTokenSet, DesignSystem, ThemeVariantTokens } from "@/types/designSystem";
import { TypeScale } from "@/types/theme";

/* ------------------------------------------------------------------ *
 * Normalised input model
 * ------------------------------------------------------------------ */

export type NamedColor = {
  /** Already-slugified token name, e.g. "accent", "brand-primary". */
  name: string;
  hex: string;
  /** Real editorial metadata only — never a restated token name. */
  description?: string;
};

/**
 * The union of everything either pipeline can hand us. Every field past
 * `name`/`fonts` is optional because a hand-assembled Studio project may
 * have no design system, and a saved Project may have no light/dark
 * palette pair — the writers below skip empty groups rather than emitting
 * hollow ones, which is what makes the same DTCG writer safe for both.
 */
export type NormalizedSystem = {
  name: string;
  /** Mode-independent brand hues (Studio's palette, or a Project's colors). */
  brand: NamedColor[];
  /** Light-mode palette roles, when the source distinguishes modes. */
  light: NamedColor[];
  /** Dark-mode palette roles. The single most-dropped thing pre-fix. */
  dark: NamedColor[];
  fonts: { display: string; body: string; accent?: string };
  radius: number;
  /** The full radius ladder when the generator produced options, not just the pick. */
  radiusOptions?: number[];
  typeScale?: TypeScale;
  spacing?: SpacingScale;
  shadows?: ShadowScale;
  designSystem?: DesignSystem;
};

export const TYPE_SCALE_KEYS: Array<keyof TypeScale["sizes"]> = [
  "xs",
  "sm",
  "base",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
];

/**
 * The app's own canonical semantic mapping, lifted verbatim from the
 * curated theme pages (app/browse/themes/[slug]/page.tsx renders
 * "H1 4xl · H2 2xl · Body base · Caption xs"). Exports used to invent
 * their own mapping or omit it entirely, so a PDF handed to a developer
 * never said which scale step was a heading. Keeping one list means the
 * DTCG typography tokens, the markdown guide, and the PDF all agree.
 */
export const SEMANTIC_TYPE_ROLES: Array<{
  role: string;
  size: keyof TypeScale["sizes"];
  weight: number;
  face: "display" | "body";
}> = [
  { role: "display", size: "6xl", weight: 700, face: "display" },
  { role: "h1", size: "4xl", weight: 700, face: "display" },
  { role: "h2", size: "2xl", weight: 700, face: "display" },
  { role: "h3", size: "xl", weight: 600, face: "display" },
  { role: "body", size: "base", weight: 400, face: "body" },
  { role: "caption", size: "xs", weight: 400, face: "body" },
];

export const COMPONENT_ORDER: ComponentName[] = [
  "button",
  "buttonSecondary",
  "input",
  "dropdown",
  "card",
  "navigation",
  "table",
  "modal",
  "alert",
  "badge",
];

export const COMPONENT_STATES = ["hover", "active", "disabled", "focus"] as const;

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "token"
  );
}

/* ------------------------------------------------------------------ *
 * Value coercion — DTCG is strict about these, and a wrong shape is a
 * silent import failure rather than a visible error, so parse properly.
 * ------------------------------------------------------------------ */

/**
 * DTCG colour values must be a hex triplet or quartet with a leading `#`.
 * The app stores plain hex almost everywhere, but shadow CSS carries
 * `rgba(0,0,0,0.12)` — feeding that straight through produced tokens that
 * Tokens Studio drops on import, which is exactly the "exports don't
 * reflect what's generated" complaint.
 */
export function toHexColor(input: string): string {
  const value = input.trim();

  const rgb = value.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const parts = rgb[1].split(/[,\s/]+/).filter(Boolean);
    const [r, g, b] = parts.slice(0, 3).map((p) => {
      const n = p.endsWith("%") ? (parseFloat(p) / 100) * 255 : parseFloat(p);
      return Math.max(0, Math.min(255, Math.round(Number.isFinite(n) ? n : 0)));
    });
    const alphaRaw = parts[3];
    const alpha = alphaRaw === undefined ? 1 : alphaRaw.endsWith("%") ? parseFloat(alphaRaw) / 100 : parseFloat(alphaRaw);
    const hex = `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
    if (!Number.isFinite(alpha) || alpha >= 1) return hex;
    return `${hex}${Math.max(0, Math.min(255, Math.round(alpha * 255))).toString(16).padStart(2, "0")}`;
  }

  if (value.startsWith("#")) {
    const body = value.slice(1);
    // Expand #abc / #abcd shorthand — DTCG allows only 6- or 8-digit forms.
    if (body.length === 3 || body.length === 4) {
      return `#${body
        .split("")
        .map((c) => c + c)
        .join("")}`.toLowerCase();
    }
    return `#${body}`.toLowerCase();
  }

  // Anything else (a CSS keyword, or a value we failed to parse) is passed
  // through unchanged rather than silently blanked: a visibly-odd token in
  // the file is debuggable, a `#000000` we invented is not.
  return value;
}

/** DTCG dimensions are a number plus `px` or `rem`. Bare `0` is not valid. */
export function toDimension(value: number | string): string {
  if (typeof value === "number") return `${value}px`;
  const trimmed = value.trim();
  if (/^-?[\d.]+$/.test(trimmed)) return `${trimmed}px`;
  return trimmed;
}

export type ShadowLayer = {
  color: string;
  offsetX: string;
  offsetY: string;
  blur: string;
  spread: string;
  inset?: boolean;
};

/**
 * Splits a CSS `box-shadow` value into DTCG shadow layers.
 *
 * Splitting on a naive `,` would shred `rgba(0, 0, 0, 0.12)` into four
 * garbage layers — the app's own shadow scale is written exactly that way
 * (lib/designTokens/shadows.ts), so this depth-aware split is load-bearing,
 * not defensive coding.
 */
export function parseBoxShadow(value: string): ShadowLayer[] {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "none") return [];

  const layers: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of trimmed) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      layers.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  layers.push(current);

  return layers
    .map((layer) => layer.trim())
    .filter(Boolean)
    .map((layer) => {
      const inset = /(^|\s)inset(\s|$)/.test(layer);
      const withoutInset = layer.replace(/(^|\s)inset(\s|$)/, " ").trim();

      // Pull the colour out first (functional notation or hex), so what
      // remains is unambiguously the length list.
      const colorMatch = withoutInset.match(/(rgba?\([^)]*\)|hsla?\([^)]*\)|#[0-9a-fA-F]{3,8})/);
      const color = colorMatch ? toHexColor(colorMatch[0]) : "#00000040";
      const lengths = (colorMatch ? withoutInset.replace(colorMatch[0], " ") : withoutInset)
        .trim()
        .split(/\s+/)
        .filter(Boolean);

      return {
        color,
        offsetX: toDimension(lengths[0] ?? "0"),
        offsetY: toDimension(lengths[1] ?? "0"),
        blur: toDimension(lengths[2] ?? "0"),
        spread: toDimension(lengths[3] ?? "0"),
        ...(inset ? { inset: true } : {}),
      };
    });
}

// Tokens Studio's own field names for a boxShadow layer: `x`/`y`, not DTCG's
// `offsetX`/`offsetY`, and a required `type` in place of DTCG's `inset`
// boolean — a shadow written with DTCG's names isn't a recognised Tokens
// Studio value, which is why "Create Styles" produced no Effect Styles even
// though the token looked complete on import.
export type TokensStudioShadowLayer = {
  color: string;
  type: "dropShadow" | "innerShadow";
  x: string;
  y: string;
  blur: string;
  spread: string;
};

function toTokensStudioShadowLayer(layer: ShadowLayer): TokensStudioShadowLayer {
  return {
    color: layer.color,
    type: layer.inset ? "innerShadow" : "dropShadow",
    x: layer.offsetX,
    y: layer.offsetY,
    blur: layer.blur,
    spread: layer.spread,
  };
}

/**
 * How far a box-shadow paints outside the element that owns it, in px.
 * Used by the PDF style guide to reserve room around each shadow swatch —
 * without it the "dramatic" level (a 30px blur at an 8px Y offset) painted
 * past its own card and got clipped by the page raster edge, showing up as
 * a grey smudge trailing into blank space.
 */
export function shadowOverflowPx(value: string): number {
  return parseBoxShadow(value).reduce((max, layer) => {
    const num = (dim: string) => {
      const parsed = parseFloat(dim);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const reach =
      Math.max(Math.abs(num(layer.offsetX)), Math.abs(num(layer.offsetY))) + num(layer.blur) + num(layer.spread);
    return Math.max(max, reach);
  }, 0);
}

/* ------------------------------------------------------------------ *
 * DTCG writers
 * ------------------------------------------------------------------ */

type TokenNode = Record<string, unknown>;

/**
 * `explicitType` works around a real Tokens Studio import bug: the DTCG spec
 * says a group's `$type` is inherited by every descendant that doesn't set
 * its own, but Tokens Studio's importer only resolves `$type` for a group's
 * *direct* children — so a nested token like `color.palette.accent` or
 * `color.component.button.hover.background` came in as a broken, untyped `?`
 * swatch. Stamping `$type: "color"` on every leaf instead of relying on
 * inheritance fixes it (legal per spec either way). Scoped to a flag, not the
 * default, so `toDtcgJson` (generic DTCG importers, which do implement
 * inheritance) stays unchanged; only `toTokensStudioJson` sets it.
 */
function colorToken(hex: string, description?: string, explicitType = false): TokenNode {
  return {
    ...(explicitType ? { $type: "color" as const } : {}),
    $value: toHexColor(hex),
    ...(description ? { $description: description } : {}),
  };
}

/**
 * Same as `colorToken`, but first checks whether this exact colour was
 * already emitted earlier in the same token set — if so, points at it with a
 * `{group.token}` reference instead of repeating the literal hex.
 *
 * Deliberately an exact-match check, not "closest": a component colour is
 * often a contrast-adjusted variant of a primitive (hue preserved, lightness
 * moved), and referencing the unadjusted primitive would make Tokens Studio
 * resolve it back to a colour that no longer passes the ratio it was
 * corrected for.
 */
function colorTokenOrRef(
  hex: string,
  candidates: Map<string, string>,
  description?: string,
  explicitType = false
): TokenNode {
  const resolved = toHexColor(hex);
  // Gated on the same flag as the $type stamp: this function runs
  // unconditionally from componentGroup/variantColorGroup, including from the
  // plain toDtcgJson path — without the guard, the plain "Design Tokens" tab
  // would start emitting `{role.surface}`-style references too.
  const ref = explicitType ? candidates.get(resolved.toLowerCase()) : undefined;
  return {
    ...(explicitType ? { $type: "color" as const } : {}),
    $value: ref ? `{${ref}}` : resolved,
    ...(description ? { $description: description } : {}),
  };
}

function dimensionToken(value: number | string, description?: string): TokenNode {
  return { $value: toDimension(value), ...(description ? { $description: description } : {}) };
}

function componentGroup(
  name: ComponentName,
  tokens: ComponentTokenSet,
  candidates: Map<string, string>,
  explicitType: boolean
): TokenNode {
  const group: TokenNode = {
    background: colorTokenOrRef(tokens.background, candidates, undefined, explicitType),
    text: colorTokenOrRef(tokens.text, candidates, undefined, explicitType),
  };
  if (tokens.border) group.border = colorTokenOrRef(tokens.border, candidates, undefined, explicitType);

  // Every interaction state the generator produced gets its own subgroup.
  // These used to survive only in CSS/Tailwind and were dropped from every
  // JSON export, so a designer importing into Figma got a button with no
  // hover — the first thing anyone checks.
  for (const state of COMPONENT_STATES) {
    const override = tokens.states?.[state];
    if (!override) continue;
    const stateGroup: TokenNode = {};
    if (override.background) stateGroup.background = colorTokenOrRef(override.background, candidates, undefined, explicitType);
    if (override.text) stateGroup.text = colorTokenOrRef(override.text, candidates, undefined, explicitType);
    if (override.border) stateGroup.border = colorTokenOrRef(override.border, candidates, undefined, explicitType);
    if (Object.keys(stateGroup).length > 0) group[state] = stateGroup;
  }

  return group;
}

function variantColorGroup(variant: ThemeVariantTokens, palette: NamedColor[], explicitType = false): TokenNode {
  const group: TokenNode = {};
  // hex (lowercase) -> the reference path a later token in this same set can
  // point at, e.g. "palette.accent" or "role.surface". Populated as each
  // group is built, so `component` (built last) can reference anything
  // `palette` or `role` (built first) already defined — never the reverse,
  // which is what keeps this a DAG instead of something that could cycle.
  const candidates = new Map<string, string>();

  if (palette.length > 0) {
    group.palette = {};
    for (const c of palette) {
      (group.palette as TokenNode)[c.name] = colorToken(c.hex, c.description, explicitType);
      candidates.set(toHexColor(c.hex).toLowerCase(), `palette.${c.name}`);
    }
  }

  const roleEntries: Array<[string, string]> = [
    ["background", variant.colorRoles.background],
    ["surface", variant.colorRoles.surface],
    ["text", variant.colorRoles.text],
    ["text-muted", variant.colorRoles.textMuted],
    ["border", variant.colorRoles.border],
  ];
  group.role = {};
  for (const [key, hex] of roleEntries) {
    (group.role as TokenNode)[key] = colorTokenOrRef(hex, candidates, undefined, explicitType);
    // Registered even when this role itself just resolved to a reference —
    // a component matching "role.surface" should still point at "role.surface"
    // by name, not have to know it secretly aliases "palette.surface" too.
    if (!candidates.has(toHexColor(hex).toLowerCase())) candidates.set(toHexColor(hex).toLowerCase(), `role.${key}`);
  }

  const components: TokenNode = {};
  for (const name of COMPONENT_ORDER) {
    const tokens = variant.components[name];
    if (tokens) components[slugify(name)] = componentGroup(name, tokens, candidates, explicitType);
  }
  if (Object.keys(components).length > 0) group.component = components;

  return group;
}

/** A mode group built from a bare palette, for systems with no designSystem. */
function paletteOnlyGroup(palette: NamedColor[], explicitType = false): TokenNode {
  return {
    palette: Object.fromEntries(palette.map((c) => [c.name, colorToken(c.hex, c.description, explicitType)])),
  };
}

export type DtcgOptions = {
  /**
   * Emit only the tokens for one mode, with that mode's `color` group hoisted
   * to the top level — builds a Tokens Studio token *set* per mode, where
   * `color.accent` must resolve without a `light.`/`dark.` prefix or the
   * plugin can't swap modes by enabling a different set.
   */
  mode?: "light" | "dark";
  /** Drop the non-colour token groups (they live in the shared `global` set). */
  colorsOnly?: boolean;
  /**
   * Tokens Studio's typography dialect: font family/weight tokens use its own
   * `fontFamilies`/`fontWeights` types (not DTCG's singular forms), and a
   * `typography` composite references those tokens with `{group.token}`
   * syntax instead of repeating values inline, so editing "Body" in the Fonts
   * panel moves every text style built on it. Only `toTokensStudioJson` sets
   * this; plain `toDtcgJson` stays spec-literal.
   */
  tokensStudioTypography?: boolean;
  /**
   * Stamp `$type: "color"` on every colour leaf instead of relying on
   * inheritance from the outer `color` group (see `colorToken`'s comment for
   * why that cascade doesn't survive Tokens Studio's importer), and turn on
   * reference-over-duplicate for role/component colours that exactly match an
   * already-emitted primitive (see `colorTokenOrRef`). Only
   * `toTokensStudioJson` sets this.
   */
  explicitColorType?: boolean;
  /**
   * Tokens Studio's UI groups tokens by category (Color, Font Family, Box
   * Shadow, …) keyed off each group's `$type` using its own vocabulary, not
   * DTCG's generic `dimension` — without this, font-size/spacing/radius/
   * shadow tokens import with working values but surface under no category at
   * all. Renames only the group-level `$type` for those four groups
   * (fontSize -> "fontSizes", spacing -> "spacing", radius -> "borderRadius",
   * shadow -> "boxShadow"); values and references are untouched. `color` has
   * its own flag above since it needs a leaf-level fix, not a renamed group.
   * Only `toTokensStudioJson` sets this.
   */
  nativeValueTypes?: boolean;
};

// Named weight tokens, derived from whichever numeric weights
// SEMANTIC_TYPE_ROLES actually uses rather than a generic 100-900 ladder — so
// a typography token can never reference a weight name that doesn't exist.
const FONT_WEIGHT_NAMES: Record<number, string> = {
  100: "thin",
  200: "extralight",
  300: "light",
  400: "regular",
  500: "medium",
  600: "semibold",
  700: "bold",
  800: "extrabold",
  900: "black",
};

function weightTokenName(weight: number): string {
  return FONT_WEIGHT_NAMES[weight] ?? `w${weight}`;
}

// Figma matches a font's *style* by name ("Regular", "Semi Bold", "Bold"),
// never by the CSS numeric weight. Standard Google Fonts style naming, so
// this holds for any generated family.
const FIGMA_WEIGHT_STYLE_NAMES: Record<number, string> = {
  100: "Thin",
  200: "Extra Light",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "Semi Bold",
  700: "Bold",
  800: "Extra Bold",
  900: "Black",
};

function figmaWeightStyleName(weight: number): string {
  return FIGMA_WEIGHT_STYLE_NAMES[weight] ?? String(weight);
}

// Confirms every `{group.token}` reference the typography composite just
// wrote actually resolves inside the tree about to be emitted. Throws rather
// than emitting a dangling reference — better to fail here than have it show
// up as literal "{fontFamilies.heading}" text after a Figma import.
function validateTypographyReferences(tree: TokenNode, fontFamilyKey: string, fontWeightKey: string): void {
  const typography = tree.typography as TokenNode | undefined;
  if (!typography) return;
  const families = tree[fontFamilyKey] as TokenNode | undefined;
  const weights = tree[fontWeightKey] as TokenNode | undefined;
  const fontSizes = tree.fontSize as TokenNode | undefined;
  const refPattern = /^\{([^.]+)\.([^}]+)\}$/;

  for (const [role, node] of Object.entries(typography)) {
    if (role.startsWith("$")) continue;
    const value = (node as TokenNode).$value as TokenNode;
    // fontFamily/fontWeight are written as literal resolved values now (see
    // the comment at the typography composite below for why), so neither
    // will ever start with "{" and this loop is a no-op for them — kept in
    // the field list anyway so a future change back to referencing either
    // one is still checked automatically. fontSize is the one field that
    // *is* still a reference in the Tokens Studio dialect.
    for (const field of ["fontFamily", "fontWeight", "fontSize"] as const) {
      const raw = value[field];
      if (typeof raw !== "string" || !raw.startsWith("{")) continue;
      const match = refPattern.exec(raw);
      if (!match) throw new Error(`Typography token "${role}" has a malformed reference: "${raw}".`);
      const [, group, token] = match;
      const groupNode =
        group === fontFamilyKey ? families : group === fontWeightKey ? weights : group === "fontSize" ? fontSizes : undefined;
      if (!groupNode || !(token in groupNode)) {
        throw new Error(
          `Typography token "${role}" references "${raw}", which does not exist in "${group}". ` +
            `Available: ${groupNode ? Object.keys(groupNode).join(", ") : "(group not found)"}.`
        );
      }
    }
  }
}

function modeColorGroup(system: NormalizedSystem, mode: "light" | "dark", explicitType = false): TokenNode | null {
  const variant = mode === "light" ? system.designSystem?.light : system.designSystem?.dark;
  const palette = mode === "light" ? system.light : system.dark;
  if (variant) return variantColorGroup(variant, palette, explicitType);
  if (palette.length > 0) return paletteOnlyGroup(palette, explicitType);
  return null;
}

/**
 * Builds the DTCG token tree. `$type` is declared once per group and
 * inherited by the tokens inside it (spec: a group's `$type` applies to
 * every descendant that doesn't set its own), which keeps the file small
 * and readable while still being fully typed for importers.
 */
export function toDtcgTokens(system: NormalizedSystem, options: DtcgOptions = {}): TokenNode {
  const tree: TokenNode = {};
  const ds = system.designSystem;

  /* ---------- colour ---------- */
  const color: TokenNode = { $type: "color" };

  const explicitColorType = Boolean(options.explicitColorType);

  if (options.mode) {
    const modeGroup = modeColorGroup(system, options.mode, explicitColorType);
    if (modeGroup) Object.assign(color, modeGroup);
  } else {
    if (system.brand.length > 0) {
      color.brand = Object.fromEntries(
        system.brand.map((c) => [c.name, colorToken(c.hex, c.description, explicitColorType)])
      );
    }
    const light = modeColorGroup(system, "light", explicitColorType);
    if (light) color.light = light;
    const dark = modeColorGroup(system, "dark", explicitColorType);
    if (dark) color.dark = dark;
  }

  if (Object.keys(color).length > 1) tree.color = color;
  if (options.colorsOnly) return tree;

  /* ---------- type ---------- */
  // Group *names* are "font"/"fontWeight" in both dialects — matched against
  // a known-working reference export (independently generated, confirmed to
  // import as real Tokens Studio sets and produce real Figma variables).
  // Only each group's own `$type` differs: the DTCG spec's singular
  // "fontFamily"/"fontWeight" for the plain tab, Tokens Studio's own plural
  // "fontFamilies"/"fontWeights" for that dialect.
  const fontFamilyKey = "font";
  const fontWeightKey = "fontWeight";

  tree[fontFamilyKey] = {
    $type: options.tokensStudioTypography ? "fontFamilies" : "fontFamily",
    display: { $value: system.fonts.display },
    body: { $value: system.fonts.body },
    ...(system.fonts.accent ? { accent: { $value: system.fonts.accent } } : {}),
  };

  // Named by the weight itself (see weightTokenName above), and only for
  // weights a role in SEMANTIC_TYPE_ROLES actually uses — h3 renders at 600,
  // distinct from display/h1/h2's 700, so a two-entry display/body map (the
  // old shape) had no token 600 could point to at all.
  const weightsUsed = Array.from(new Set(SEMANTIC_TYPE_ROLES.map((r) => r.weight))).sort((a, b) => a - b);
  tree[fontWeightKey] = {
    $type: options.tokensStudioTypography ? "fontWeights" : "fontWeight",
    // Figma matches a font's *style* by name ("Bold"), never by CSS numeric
    // weight. The plain DTCG tab keeps the spec-correct number.
    ...Object.fromEntries(
      weightsUsed.map((weight) => [
        weightTokenName(weight),
        { $value: options.tokensStudioTypography ? figmaWeightStyleName(weight) : weight },
      ])
    ),
  };

  if (system.typeScale) {
    const scale = system.typeScale;
    tree.fontSize = {
      $type: options.nativeValueTypes ? "fontSizes" : "dimension",
      $description: `Modular scale — base ${scale.baseSize}px, ratio ${scale.ratioName} (${scale.ratio}).`,
      ...Object.fromEntries(TYPE_SCALE_KEYS.map((key) => [key, dimensionToken(scale.sizes[key])])),
    };

    // Composite typography tokens: a Figma import turns each of these into
    // one text style; raw fontSize dimensions alone import as numbers with no
    // text styles.
    //
    // fontFamily/fontWeight are literal resolved values in *either* dialect,
    // not `{group.token}` references — a real Tokens Studio run showed Text
    // Style creation fails with a reference here, because Figma has no
    // bindable Variable property for a text style's font to resolve into.
    // fontSize stays a reference (`{fontSize.<step>}`): Figma *can* bind a
    // Number Variable to it.
    //
    // lineHeight/letterSpacing keep their dialect split — plain DTCG allows a
    // unitless lineHeight ratio and `em` letter-spacing, but Tokens Studio/
    // Figma read a bare "1.1" as pixels and have no `em` unit at all (1em ==
    // 100%, per Tokens Studio's own docs). Only `toTokensStudioJson` sets
    // `tokensStudioTypography` to switch dialects.
    const lineHeightRatio = { display: 1.1, body: 1.6 } as const;
    const letterSpacingEm = { display: -0.02, body: 0 } as const;
    const asPercent = (n: number) => `${Math.round(n * 1000) / 10}%`;

    tree.typography = {
      $type: "typography",
      ...Object.fromEntries(
        SEMANTIC_TYPE_ROLES.map(({ role, size, weight, face }) => [
          role,
          {
            $value: {
              fontFamily: system.fonts[face],
              fontSize: options.tokensStudioTypography ? `{fontSize.${size}}` : toDimension(scale.sizes[size]),
              fontWeight: options.tokensStudioTypography ? figmaWeightStyleName(weight) : weight,
              lineHeight: options.tokensStudioTypography
                ? asPercent(lineHeightRatio[face])
                : String(lineHeightRatio[face]),
              letterSpacing: options.tokensStudioTypography
                ? asPercent(letterSpacingEm[face])
                : `${letterSpacingEm[face]}em`,
            },
            $description: `${role} — scale step "${size}".`,
          },
        ])
      ),
    };

    // A bad reference here would otherwise only surface after opening Figma —
    // checked at generation time so it's an export-time error instead.
    if (options.tokensStudioTypography) validateTypographyReferences(tree, fontFamilyKey, fontWeightKey);
  }

  /* ---------- space & shape ---------- */
  if (system.spacing) {
    tree.spacing = {
      // "dimension", not "spacing" — a spacing token typed "spacing" doesn't
      // surface as a Number Variable in Tokens Studio at all; "dimension" is
      // what it actually recognises here (same type radius/breakpoint use).
      $type: "dimension",
      $description: `Spacing scale on a ${system.spacing.base}px base unit.`,
      ...Object.fromEntries(system.spacing.steps.map((step, i) => [String(i + 1), dimensionToken(step)])),
    };
  }

  tree.radius = {
    $type: options.nativeValueTypes ? "borderRadius" : "dimension",
    base: dimensionToken(system.radius, "The recommended corner radius for this system."),
    ...(system.radiusOptions
      ? Object.fromEntries(system.radiusOptions.map((option) => [`step-${option}`, dimensionToken(option)]))
      : {}),
  };

  if (system.shadows) {
    tree.shadow = {
      $type: options.nativeValueTypes ? "boxShadow" : "shadow",
      $description: `Recommended level: ${system.shadows.recommended}.`,
      ...Object.fromEntries(
        system.shadows.levels.map((level) => {
          const layers = parseBoxShadow(level.value);
          // A shadow token needs a value even for "none" — a fully
          // transparent zero-shadow is the importable spelling of it.
          const zero: ShadowLayer = { color: "#00000000", offsetX: "0px", offsetY: "0px", blur: "0px", spread: "0px" };
          const resolved = layers.length === 0 ? [zero] : layers;
          const toLayer = (l: ShadowLayer): ShadowLayer | TokensStudioShadowLayer =>
            options.nativeValueTypes ? toTokensStudioShadowLayer(l) : l;
          // Single-vs-array collapse differs by dialect: the plain "Design
          // Tokens" tab keeps a lone layer as a bare object (DTCG allows
          // either shape); Tokens Studio's own boxShadow value is always an
          // array, even for one layer.
          const value = options.nativeValueTypes
            ? resolved.map(toLayer)
            : resolved.length === 1
              ? toLayer(resolved[0])
              : resolved.map(toLayer);
          return [level.name, { $value: value }];
        })
      ),
    };
  }

  /* ---------- layout ---------- */
  if (ds?.breakpoints) {
    tree.breakpoint = {
      $type: "dimension",
      sm: dimensionToken(ds.breakpoints.sm),
      md: dimensionToken(ds.breakpoints.md),
      lg: dimensionToken(ds.breakpoints.lg),
      xl: dimensionToken(ds.breakpoints.xl),
    };
  }

  if (ds?.grid) {
    tree.grid = {
      columns: { $type: "number", $value: ds.grid.columns },
      gutter: { $type: "dimension", ...dimensionToken(ds.grid.gutter) },
      "max-width": { $type: "dimension", ...dimensionToken(ds.grid.maxWidth) },
    };
  }

  // Icon style carries one genuinely numeric token (stroke width); the
  // qualitative part ("line", "duotone", the rationale note) has no token
  // type, so it rides on the group description and on $extensions below.
  // A group with only a description and no tokens is legal but useless in
  // an importer's tree, so the group only appears when there's a width.
  if (ds?.iconStyle?.strokeWidth !== undefined) {
    tree.icon = {
      $description: `${ds.iconStyle.style} icons — ${ds.iconStyle.note}`,
      "stroke-width": { $type: "dimension", ...dimensionToken(ds.iconStyle.strokeWidth) },
    };
  }

  /* ---------- file-level metadata ---------- */
  const notes: string[] = [`${system.name} — generated by StyleBook AI.`];
  if (ds?.accessibility) {
    notes.push(`Accessibility target: WCAG ${ds.accessibility.level}. ${ds.accessibility.notes.join(" ")}`);
  }
  if (ds?.iconStyle) notes.push(`Icon style: ${ds.iconStyle.style} — ${ds.iconStyle.note}`);
  tree.$description = notes.join(" ");

  // `$extensions` is the spec-sanctioned home for data that has no token
  // type — accessibility prose, the icon vocabulary, which groups are
  // modes. Importers ignore it; humans and our own re-import don't.
  tree.$extensions = {
    "com.stylebook.ai": {
      generator: "StyleBook AI",
      system: system.name,
      modes: ["light", ...(system.dark.length > 0 || ds?.dark ? ["dark"] : [])],
      ...(ds?.accessibility ? { accessibility: ds.accessibility } : {}),
      ...(ds?.iconStyle ? { iconStyle: ds.iconStyle } : {}),
      ...(ds?.grid ? { grid: ds.grid } : {}),
      ...(ds?.breakpoints ? { breakpoints: ds.breakpoints } : {}),
    },
  };

  return tree;
}

export function toDtcgJson(system: NormalizedSystem): string {
  return JSON.stringify(toDtcgTokens(system), null, 2);
}

/**
 * Tokens Studio's own token *sets* (the top-level `global`/`light`/`dark`
 * structure) predate the DTCG spec and use a different, native schema:
 * literal `value`/`type` keys, no `$`, and a group's type never cascades to
 * its children the way DTCG's does. A tree built only from `$value`/`$type`
 * has no `value` key anywhere, so Tokens Studio's set JSON view shows it as
 * empty (`{}`) even though the right categories appear in the main UI.
 *
 * This renames rather than dual-writes: `$value` -> `value`, `$description`
 * -> `description`, and `$type` is resolved by walking the same
 * group-inheritance rule DTCG defines, then written as `type`. `$extensions`
 * and the tree-root `$description` (StyleBook's own bookkeeping, read by
 * nothing in Figma) are dropped rather than renamed.
 *
 * `toDtcgTokens` and `toDtcgJson`'s output are untouched — this runs only
 * here, as a final pass over the tree Tokens Studio's set JSON view renders.
 */
function toNativeTokenSet(node: TokenNode, inheritedType?: unknown, isRoot = false): TokenNode {
  const type = "$type" in node ? node.$type : inheritedType;
  const out: TokenNode = {};

  for (const [key, value] of Object.entries(node)) {
    if (key === "$type" || key === "$extensions") continue;
    if (key === "$value") continue; // becomes `out.value` below, verbatim, never walked
    if (key === "$description") {
      // Per-token/per-group descriptions (radius.base, each typography role,
      // …) are real content the reference export keeps. The tree-root
      // description (file-level prose, only ever present on `global`) has no
      // counterpart in the reference at all, so it alone is dropped.
      if (!isRoot) out.description = value;
      continue;
    }
    out[key] =
      value && typeof value === "object" && !Array.isArray(value)
        ? toNativeTokenSet(value as TokenNode, type, false)
        : value;
  }

  if ("$value" in node) {
    out.value = node.$value;
    if (type !== undefined) out.type = type;
  }

  return out;
}

/**
 * Tokens Studio single-file shape: a *flat* object whose top-level keys are
 * the token groups themselves (`color`, `font`, `fontWeight`, `fontSize`,
 * `typography`, `spacing`, `radius`, `shadow`, `breakpoint`, `grid`, `icon`) —
 * no `global`/`light`/`dark` wrapper, no `$metadata`/`$themes`.
 *
 * The dialect splits by group rather than being uniformly native: `color`,
 * `font`, `typography`, `radius`, `breakpoint` and `grid` stay native
 * `value`/`type` (no `$`); `fontWeight`, `fontSize`, `spacing`, `shadow` and
 * `icon` keep `$value`/`$type`.
 *
 * Two shape changes confined to this function: `fontWeight` here is a
 * separate numeric token (`$value: 700, $type: "number"`), while the Figma
 * style-name string ("Bold") still lives inline on each `typography`
 * composite's own `fontWeight` field, which is what Figma's Text Style
 * creation actually reads. And each `typography` composite's `fontSize` is
 * the resolved pixel number (not `"57.22px"` or `{fontSize.6xl}`), with a
 * sibling `fontSizeToken` field recording which `fontSize` entry it came
 * from, for external tooling rather than as a Tokens Studio alias.
 *
 * All groups are still built from `toDtcgTokens`'s shared logic — this
 * function only decides, group by group, whether to native-convert
 * (`toNativeTokenSet`) or keep the `$`-prefixed shape.
 */
export function toTokensStudioJson(system: NormalizedSystem): string {
  const tree = toDtcgTokens(system, {
    tokensStudioTypography: true,
    explicitColorType: true,
    nativeValueTypes: true,
  });
  const ds = system.designSystem;

  // fontWeight: a plain Number Variable, decoupled from the Figma style-name
  // string typography still uses inline (see the comment above).
  const weightsUsed = Array.from(new Set(SEMANTIC_TYPE_ROLES.map((r) => r.weight))).sort((a, b) => a - b);
  const dollarFontWeight: TokenNode = Object.fromEntries(
    weightsUsed.map((weight) => [weightTokenName(weight), { $value: weight, $type: "number" }])
  );

  // fontSize: same values `toDtcgTokens` already computed, kept $-prefixed.
  const dollarFontSize: TokenNode = system.typeScale
    ? Object.fromEntries(
        TYPE_SCALE_KEYS.map((key) => [key, { $value: toDimension(system.typeScale!.sizes[key]), $type: "dimension" }])
      )
    : {};

  // typography: rewrite fontSize from a `{fontSize.step}` alias to the
  // resolved pixel number, plus the sibling `fontSizeToken` lookup string.
  if (tree.typography && system.typeScale) {
    for (const semantic of SEMANTIC_TYPE_ROLES) {
      const entry = (tree.typography as TokenNode)[semantic.role] as TokenNode | undefined;
      if (!entry) continue;
      const value = entry.$value as TokenNode;
      value.fontSize = system.typeScale.sizes[semantic.size];
      value.fontSizeToken = `fontSize.${semantic.size}`;
    }
  }

  // spacing: same values `toDtcgTokens` already computed, kept $-prefixed.
  const dollarSpacing: TokenNode = system.spacing
    ? Object.fromEntries(system.spacing.steps.map((step, i) => [String(i + 1), { $value: toDimension(step), $type: "dimension" }]))
    : {};

  // shadow: single-vs-array collapse reverts to the plain-DTCG rule (bare
  // object for one layer, array for two or more) for this dialect, kept
  // $-prefixed with Tokens Studio's own x/y/blur/spread field names.
  const dollarShadow: TokenNode = {};
  if (system.shadows) {
    const zero: ShadowLayer = { color: "#00000000", offsetX: "0px", offsetY: "0px", blur: "0px", spread: "0px" };
    for (const level of system.shadows.levels) {
      const layers = parseBoxShadow(level.value);
      const resolved = (layers.length === 0 ? [zero] : layers).map(toTokensStudioShadowLayer);
      dollarShadow[level.name] = { $value: resolved.length === 1 ? resolved[0] : resolved, $type: "boxShadow" };
    }
  }

  // icon: adds a `style` token (Tokens Studio "string" type) alongside the
  // stroke width, camelCased to `strokeWidth` rather than `stroke-width`.
  const dollarIcon: TokenNode = {};
  if (ds?.iconStyle) {
    dollarIcon.style = { $value: ds.iconStyle.style, $type: "string" };
    if (ds.iconStyle.strokeWidth !== undefined) {
      dollarIcon.strokeWidth = { $value: toDimension(ds.iconStyle.strokeWidth), $type: "dimension" };
    }
  }

  const file: TokenNode = {};
  if (tree.color) file.color = toNativeTokenSet(tree.color as TokenNode, undefined, true);
  if (tree.font) file.font = toNativeTokenSet(tree.font as TokenNode, undefined, true);
  if (Object.keys(dollarFontWeight).length > 0) file.fontWeight = dollarFontWeight;
  if (Object.keys(dollarFontSize).length > 0) file.fontSize = dollarFontSize;
  if (tree.typography) file.typography = toNativeTokenSet(tree.typography as TokenNode, undefined, true);
  if (Object.keys(dollarSpacing).length > 0) file.spacing = dollarSpacing;
  if (tree.radius) file.radius = toNativeTokenSet(tree.radius as TokenNode, undefined, true);
  if (Object.keys(dollarShadow).length > 0) file.shadow = dollarShadow;
  if (tree.breakpoint) file.breakpoint = toNativeTokenSet(tree.breakpoint as TokenNode, undefined, true);
  if (tree.grid) file.grid = toNativeTokenSet(tree.grid as TokenNode, undefined, true);
  if (Object.keys(dollarIcon).length > 0) file.icon = dollarIcon;

  return JSON.stringify(file, null, 2);
}

/**
 * The app-shaped JSON: a lossless dump of the normalised system for people
 * who want to diff it, re-import it into StyleBook, or script against it.
 * Kept alongside the DTCG output rather than instead of it — the DTCG file
 * is optimised for tools, this one for reading.
 */
export function toReadableJson(system: NormalizedSystem): string {
  return JSON.stringify(
    {
      name: system.name,
      fonts: system.fonts,
      radius: `${system.radius}px`,
      radiusOptions: system.radiusOptions,
      brand: system.brand,
      light: system.light,
      dark: system.dark,
      typeScale: system.typeScale,
      semanticType: system.typeScale
        ? Object.fromEntries(
            SEMANTIC_TYPE_ROLES.map(({ role, size }) => [role, `${system.typeScale!.sizes[size]}px`])
          )
        : undefined,
      spacing: system.spacing,
      shadows: system.shadows,
      designSystem: system.designSystem,
    },
    null,
    2
  );
}

/* ------------------------------------------------------------------ *
 * Flat key/value views — shared by the CSS, SCSS, Tailwind and native
 * writers in both pipelines so a token added here shows up everywhere.
 * ------------------------------------------------------------------ */

export type FlatEntry = { key: string; hex: string };

function componentFlatEntries(name: ComponentName, tokens: ComponentTokenSet): FlatEntry[] {
  const entries: FlatEntry[] = [
    { key: `${name}-bg`, hex: tokens.background },
    { key: `${name}-text`, hex: tokens.text },
  ];
  if (tokens.border) entries.push({ key: `${name}-border`, hex: tokens.border });
  for (const state of COMPONENT_STATES) {
    const override = tokens.states?.[state];
    if (!override) continue;
    if (override.background) entries.push({ key: `${name}-bg-${state}`, hex: override.background });
    if (override.text) entries.push({ key: `${name}-text-${state}`, hex: override.text });
    if (override.border) entries.push({ key: `${name}-border-${state}`, hex: override.border });
  }
  return entries;
}

/**
 * Flattens one theme variant into `key: hex` pairs. Iterates COMPONENT_ORDER
 * rather than `Object.keys(components)` so the emitted order is stable
 * across exports — two exports of the same system used to diff as changed
 * purely because object key order followed whatever the AI returned.
 */
export function themeVariantEntries(variant: ThemeVariantTokens): FlatEntry[] {
  const entries: FlatEntry[] = [
    { key: "color-bg", hex: variant.colorRoles.background },
    { key: "color-surface", hex: variant.colorRoles.surface },
    { key: "color-text", hex: variant.colorRoles.text },
    { key: "color-text-muted", hex: variant.colorRoles.textMuted },
    { key: "color-border", hex: variant.colorRoles.border },
  ];
  for (const name of COMPONENT_ORDER) {
    const tokens = variant.components[name];
    if (tokens) entries.push(...componentFlatEntries(name, tokens));
  }
  return entries;
}
