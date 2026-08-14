/**
 * The one place that knows how to turn *everything the app can generate*
 * into a W3C Design Tokens Community Group (DTCG) token tree.
 *
 * Why this file exists at all: there were two export pipelines
 * (lib/studio/exportCode.ts for the Studio drawer, lib/export/generators.ts
 * for the saved-Project API) and they had drifted — the API one silently
 * dropped the dark palette, the type scale beyond a bare px list, and every
 * component state, while the Studio one emitted an ad-hoc `{value, type}`
 * shape that no Figma plugin has ever understood. Both now normalise into
 * `NormalizedSystem` here and share one DTCG writer, so a fix lands in both
 * pipelines instead of one.
 *
 * Format target: the DTCG *second editors' draft* value grammar —
 * colours as `#rrggbb[aa]` hex strings, dimensions as `"16px"` strings,
 * composite `shadow`/`typography` objects. That is deliberately NOT the
 * newest draft (which changed dimension to `{value, unit}` and colour to
 * `{colorSpace, components}`): the string grammar is what Tokens Studio and
 * the Figma "Design Tokens" plugins actually parse today, and an import
 * that a real designer can run at the expo is the entire point of this
 * export. See docs at second-editors-draft.tr.designtokens.org/format/.
 */
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
 * `explicitType` exists because of a real Tokens Studio import bug, found by
 * testing an actual export in Tokens Studio v2.11.12: every colour token
 * came in as a broken `?` swatch, even the flat top-level ones. The DTCG
 * spec says a group's `$type` is inherited by every descendant that doesn't
 * set its own — and that is exactly what `toDtcgJson`'s plain output relies
 * on, one `$type: "color"` on the outer `color` group covering `palette.*`,
 * `role.*`, and `component.<name>.<state>.*` several levels down. Tokens
 * Studio's importer does not walk that far: it resolves `$type` from a
 * group only for its *direct* children, so `color.palette.accent` (two
 * levels down) and `color.component.button.hover.background` (four levels
 * down) never see it and get treated as untyped, unresolvable values.
 *
 * The fix is to stamp `$type: "color"` on every leaf instead of relying on
 * inheritance — legal per spec either way, and it can't go wrong regardless
 * of how deep an importer is willing to look. Scoped to a flag rather than
 * made the default so `toDtcgJson` (generic DTCG importers, which do
 * implement the inheritance rule) stays byte-for-byte unchanged; only
 * `toTokensStudioJson` sets it.
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
 * already emitted earlier in the same token set — if so, it points at that
 * token with a `{group.token}` reference instead of repeating the literal
 * hex.
 *
 * This is intentionally an exact-match check, not a "closest" one. A
 * component colour is frequently a WCAG-contrast-adjusted variant of a
 * primitive — hue preserved, lightness moved — and referencing the
 * unadjusted primitive in that case would make Tokens Studio resolve the
 * component back to a colour that no longer passes the ratio it was
 * corrected for. Only a byte-identical hex is safe to collapse into a
 * reference; everything else stays a literal, which is already correct.
 */
function colorTokenOrRef(
  hex: string,
  candidates: Map<string, string>,
  description?: string,
  explicitType = false
): TokenNode {
  const resolved = toHexColor(hex);
  // Gated on the same flag as the $type stamp, not just reusing whatever
  // `candidates` happens to hold: this function is called unconditionally
  // from componentGroup/variantColorGroup, including from the plain
  // `toDtcgJson` path where `explicitType` is false. Without this guard the
  // plain "Design Tokens" tab would start emitting `{role.surface}`-style
  // references too — exactly the kind of change to the normal export this
  // fix must not make.
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
   * Emit only the tokens that belong to one mode, with the mode's own
   * `color` group hoisted to the top level. Used to build Tokens Studio
   * token *sets* (one set per mode) — inside a set, `color.accent` must
   * resolve without a `light.`/`dark.` prefix or the plugin can't swap
   * modes by enabling a different set.
   */
  mode?: "light" | "dark";
  /** Drop the non-colour token groups (they live in the shared `global` set). */
  colorsOnly?: boolean;
  /**
   * Tokens Studio speaks a different typography dialect than plain DTCG:
   * font family/weight tokens use the plugin's own `fontFamilies`/
   * `fontWeights` types (not the spec's singular `fontFamily`/`fontWeight`),
   * and a `typography` composite is expected to *reference* those tokens
   * with `{group.token}` syntax rather than repeat their values inline —
   * that's what lets editing "Body" in the Fonts panel move every text
   * style that uses it. Only `toTokensStudioJson` sets this; the plain
   * `toDtcgJson` output stays spec-literal, since that's the file aimed at
   * generic DTCG importers rather than Tokens Studio specifically.
   */
  tokensStudioTypography?: boolean;
  /**
   * Stamp `$type: "color"` on every colour leaf instead of relying on the
   * outer `color` group's `$type` to cascade down through `palette.*`,
   * `role.*` and `component.*.*` — see the comment on `colorToken` for why
   * that cascade doesn't survive Tokens Studio's importer. Also turns on
   * reference-over-duplicate for `role`/`component` colours that exactly
   * match an already-emitted primitive (see `colorTokenOrRef`). Only
   * `toTokensStudioJson` sets this, for the same reason as
   * `tokensStudioTypography` above.
   */
  explicitColorType?: boolean;
};

/**
 * Named weight tokens, derived from whichever numeric weights
 * SEMANTIC_TYPE_ROLES actually uses — not a generic 100–900 ladder. A
 * fixed ladder would define nine tokens and use three of them, and (worse)
 * if a role's weight ever changed to a value the ladder didn't cover, a
 * typography token would reference a name that doesn't exist. Deriving the
 * set from the roles themselves makes that class of bug structurally
 * impossible: every weight a role needs has a token, because the token was
 * created *from* that need.
 */
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

/**
 * Confirms every `{group.token}` reference the typography composite just
 * wrote actually resolves inside the tree we're about to emit. Throws
 * rather than emitting — a dangling reference is a bug in this file, not a
 * recoverable input problem, and the whole point of asking is that nobody
 * wants to find out from an import that silently shows "{fontFamilies.
 * heading}" as literal text instead of the font name.
 */
function validateTypographyReferences(tree: TokenNode, fontFamilyKey: string, fontWeightKey: string): void {
  const typography = tree.typography as TokenNode | undefined;
  if (!typography) return;
  const families = tree[fontFamilyKey] as TokenNode | undefined;
  const weights = tree[fontWeightKey] as TokenNode | undefined;
  const refPattern = /^\{([^.]+)\.([^}]+)\}$/;

  for (const [role, node] of Object.entries(typography)) {
    if (role.startsWith("$")) continue;
    const value = (node as TokenNode).$value as TokenNode;
    for (const field of ["fontFamily", "fontWeight"] as const) {
      const raw = value[field];
      if (typeof raw !== "string" || !raw.startsWith("{")) continue;
      const match = refPattern.exec(raw);
      if (!match) throw new Error(`Typography token "${role}" has a malformed reference: "${raw}".`);
      const [, group, token] = match;
      const groupNode = group === fontFamilyKey ? families : group === fontWeightKey ? weights : undefined;
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
  // Tokens Studio wants `fontFamilies`/`fontWeights` (its own plural types)
  // with the typography composite *referencing* them via `{group.token}`,
  // so editing a font in the Fonts panel moves every text style built on it.
  // Plain DTCG importers expect the spec's singular `fontFamily`/`fontWeight`
  // with literal values instead — two different dialects, picked by
  // `options.tokensStudioTypography` rather than by which function was
  // called, since both still share every other group in this tree.
  const fontFamilyKey = options.tokensStudioTypography ? "fontFamilies" : "font";
  const fontWeightKey = options.tokensStudioTypography ? "fontWeights" : "fontWeight";

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
    ...Object.fromEntries(weightsUsed.map((weight) => [weightTokenName(weight), { $value: weight }])),
  };

  if (system.typeScale) {
    const scale = system.typeScale;
    tree.fontSize = {
      $type: "dimension",
      $description: `Modular scale — base ${scale.baseSize}px, ratio ${scale.ratioName} (${scale.ratio}).`,
      ...Object.fromEntries(TYPE_SCALE_KEYS.map((key) => [key, dimensionToken(scale.sizes[key])])),
    };

    // Composite typography tokens: a Figma import turns each of these into
    // one text style. Emitting only raw fontSize dimensions (what the old
    // Figma tab did) left the importer with numbers and no text styles.
    tree.typography = {
      $type: "typography",
      ...Object.fromEntries(
        SEMANTIC_TYPE_ROLES.map(({ role, size, weight, face }) => [
          role,
          {
            $value: {
              fontFamily: options.tokensStudioTypography ? `{${fontFamilyKey}.${face}}` : system.fonts[face],
              fontSize: toDimension(scale.sizes[size]),
              fontWeight: options.tokensStudioTypography ? `{${fontWeightKey}.${weightTokenName(weight)}}` : weight,
              lineHeight: face === "display" ? "1.1" : "1.6",
              letterSpacing: face === "display" ? "-0.02em" : "0em",
            },
            $description: `${role} — scale step "${size}".`,
          },
        ])
      ),
    };

    // A reference the composite just built has to resolve, or Tokens Studio
    // either drops the text style or renders it with a literal "{…}" string
    // as the font name — a failure a human only notices by opening Figma.
    // Checked here, at generation time, so a bad reference is an export-time
    // error instead of an import-time mystery.
    if (options.tokensStudioTypography) validateTypographyReferences(tree, fontFamilyKey, fontWeightKey);
  }

  /* ---------- space & shape ---------- */
  if (system.spacing) {
    tree.spacing = {
      $type: "dimension",
      $description: `Spacing scale on a ${system.spacing.base}px base unit.`,
      ...Object.fromEntries(system.spacing.steps.map((step, i) => [String(i + 1), dimensionToken(step)])),
    };
  }

  tree.radius = {
    $type: "dimension",
    base: dimensionToken(system.radius, "The recommended corner radius for this system."),
    ...(system.radiusOptions
      ? Object.fromEntries(system.radiusOptions.map((option) => [`step-${option}`, dimensionToken(option)]))
      : {}),
  };

  if (system.shadows) {
    tree.shadow = {
      $type: "shadow",
      $description: `Recommended level: ${system.shadows.recommended}.`,
      ...Object.fromEntries(
        system.shadows.levels.map((level) => {
          const layers = parseBoxShadow(level.value);
          // A shadow token needs a value even for the "none" level —
          // omitting it would make the exported set disagree with the CSS
          // export, which does emit `--shadow-none: none`. A fully
          // transparent zero-shadow is the importable spelling of "none".
          const value =
            layers.length === 0
              ? { color: "#00000000", offsetX: "0px", offsetY: "0px", blur: "0px", spread: "0px" }
              : layers.length === 1
                ? layers[0]
                : layers;
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
 * Tokens Studio single-file shape: one top-level key per *token set*, plus
 * `$metadata.tokenSetOrder` and a `$themes` array wiring the sets into
 * selectable themes. This is what makes light/dark import as real, swappable
 * modes rather than two unrelated colour groups — the plain DTCG tree above
 * can only nest them, which the plugin reads as `color.light.*` literal
 * names.
 */
export function toTokensStudioJson(system: NormalizedSystem): string {
  const hasDark = system.dark.length > 0 || Boolean(system.designSystem?.dark);

  const global = toDtcgTokens(system, { tokensStudioTypography: true, explicitColorType: true });
  // The mode-specific colour tokens live in their own sets, so strip them
  // from `global` — leaving them in would give every colour two competing
  // definitions and the plugin resolves the duplicate unpredictably.
  delete (global as TokenNode).color;
  if (system.brand.length > 0) {
    global.color = {
      $type: "color",
      brand: Object.fromEntries(
        system.brand.map((c) => [c.name, colorToken(c.hex, c.description, true)])
      ),
    };
  }

  const file: TokenNode = { global };

  const lightSet = toDtcgTokens(system, { mode: "light", colorsOnly: true, explicitColorType: true });
  if (lightSet.color) file.light = lightSet;
  if (hasDark) {
    const darkSet = toDtcgTokens(system, { mode: "dark", colorsOnly: true, explicitColorType: true });
    if (darkSet.color) file.dark = darkSet;
  }

  const setOrder = Object.keys(file);
  const themes = (["light", "dark"] as const)
    .filter((mode) => setOrder.includes(mode))
    .map((mode) => ({
      id: `${slugify(system.name)}-${mode}`,
      name: mode === "light" ? "Light" : "Dark",
      group: slugify(system.name),
      selectedTokenSets: {
        global: "source",
        [mode]: "enabled",
      },
      $figmaStyleReferences: {},
      $figmaVariableReferences: {},
    }));

  file.$metadata = { tokenSetOrder: setOrder };
  file.$themes = themes;

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
