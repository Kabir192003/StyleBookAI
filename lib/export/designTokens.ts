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

function colorToken(hex: string, description?: string): TokenNode {
  return { $value: toHexColor(hex), ...(description ? { $description: description } : {}) };
}

function dimensionToken(value: number | string, description?: string): TokenNode {
  return { $value: toDimension(value), ...(description ? { $description: description } : {}) };
}

function componentGroup(name: ComponentName, tokens: ComponentTokenSet): TokenNode {
  const group: TokenNode = {
    background: colorToken(tokens.background),
    text: colorToken(tokens.text),
  };
  if (tokens.border) group.border = colorToken(tokens.border);

  // Every interaction state the generator produced gets its own subgroup.
  // These used to survive only in CSS/Tailwind and were dropped from every
  // JSON export, so a designer importing into Figma got a button with no
  // hover — the first thing anyone checks.
  for (const state of COMPONENT_STATES) {
    const override = tokens.states?.[state];
    if (!override) continue;
    const stateGroup: TokenNode = {};
    if (override.background) stateGroup.background = colorToken(override.background);
    if (override.text) stateGroup.text = colorToken(override.text);
    if (override.border) stateGroup.border = colorToken(override.border);
    if (Object.keys(stateGroup).length > 0) group[state] = stateGroup;
  }

  return group;
}

function variantColorGroup(variant: ThemeVariantTokens, palette: NamedColor[]): TokenNode {
  const group: TokenNode = {};

  if (palette.length > 0) {
    group.palette = Object.fromEntries(palette.map((c) => [c.name, colorToken(c.hex, c.description)]));
  }

  group.role = {
    background: colorToken(variant.colorRoles.background),
    surface: colorToken(variant.colorRoles.surface),
    text: colorToken(variant.colorRoles.text),
    "text-muted": colorToken(variant.colorRoles.textMuted),
    border: colorToken(variant.colorRoles.border),
  };

  const components: TokenNode = {};
  for (const name of COMPONENT_ORDER) {
    const tokens = variant.components[name];
    if (tokens) components[slugify(name)] = componentGroup(name, tokens);
  }
  if (Object.keys(components).length > 0) group.component = components;

  return group;
}

/** A mode group built from a bare palette, for systems with no designSystem. */
function paletteOnlyGroup(palette: NamedColor[]): TokenNode {
  return { palette: Object.fromEntries(palette.map((c) => [c.name, colorToken(c.hex, c.description)])) };
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
};

function modeColorGroup(system: NormalizedSystem, mode: "light" | "dark"): TokenNode | null {
  const variant = mode === "light" ? system.designSystem?.light : system.designSystem?.dark;
  const palette = mode === "light" ? system.light : system.dark;
  if (variant) return variantColorGroup(variant, palette);
  if (palette.length > 0) return paletteOnlyGroup(palette);
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

  if (options.mode) {
    const modeGroup = modeColorGroup(system, options.mode);
    if (modeGroup) Object.assign(color, modeGroup);
  } else {
    if (system.brand.length > 0) {
      color.brand = Object.fromEntries(system.brand.map((c) => [c.name, colorToken(c.hex, c.description)]));
    }
    const light = modeColorGroup(system, "light");
    if (light) color.light = light;
    const dark = modeColorGroup(system, "dark");
    if (dark) color.dark = dark;
  }

  if (Object.keys(color).length > 1) tree.color = color;
  if (options.colorsOnly) return tree;

  /* ---------- type ---------- */
  tree.font = {
    $type: "fontFamily",
    display: { $value: system.fonts.display },
    body: { $value: system.fonts.body },
    ...(system.fonts.accent ? { accent: { $value: system.fonts.accent } } : {}),
  };

  // Real weights, not a generic 100–900 ladder: these are the weights the
  // app itself renders display and body copy at (see the style-guide PDF
  // and the curated theme pages), so an importer gets a system that
  // matches the previews the user just approved.
  tree.fontWeight = {
    $type: "fontWeight",
    display: { $value: 700, $description: "Weight used for display and heading faces." },
    body: { $value: 400, $description: "Weight used for body copy." },
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
              fontFamily: face === "display" ? system.fonts.display : system.fonts.body,
              fontSize: toDimension(scale.sizes[size]),
              fontWeight: weight,
              lineHeight: face === "display" ? "1.1" : "1.6",
              letterSpacing: face === "display" ? "-0.02em" : "0em",
            },
            $description: `${role} — scale step "${size}".`,
          },
        ])
      ),
    };
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

  const global = toDtcgTokens(system);
  // The mode-specific colour tokens live in their own sets, so strip them
  // from `global` — leaving them in would give every colour two competing
  // definitions and the plugin resolves the duplicate unpredictably.
  delete (global as TokenNode).color;
  if (system.brand.length > 0) {
    global.color = {
      $type: "color",
      brand: Object.fromEntries(system.brand.map((c) => [c.name, colorToken(c.hex, c.description)])),
    };
  }

  const file: TokenNode = { global };

  const lightSet = toDtcgTokens(system, { mode: "light", colorsOnly: true });
  if (lightSet.color) file.light = lightSet;
  if (hasDark) {
    const darkSet = toDtcgTokens(system, { mode: "dark", colorsOnly: true });
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
