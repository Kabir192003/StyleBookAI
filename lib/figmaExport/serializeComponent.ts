/**
 * ComponentTokenSet + APPLICABLE_STATES → FigmaComponentSet.
 *
 * Reuses the exact same "which states are real" source of truth Studio's
 * own inspector already uses (APPLICABLE_STATES), and the exact same
 * default-vs-override resolution ColorField/ComponentEditor use
 * (`override.field ?? tokens.field`) — a Figma variant must show the same
 * value the Studio canvas's Preview toggle already shows for that state, not
 * an independently-computed approximation, WHEN a literal override exists.
 *
 * Most components never have one, though: `deriveThemeVariantFromPalette()`
 * (used for every project that hasn't had its states hand-edited in the
 * inspector) produces no `.states` at all — the real hover/active look in
 * the actual app comes from color-mix() formulas baked into
 * components/system/styles.ts, computed live in CSS, never stored as data.
 * `deriveStateFallback()` below reproduces that same mix-toward-ink
 * convention (see styles.ts's `.pg-btn--primary:hover`/`:active` rules for
 * the reference percentages) using the same `mix()` helper
 * deriveThemeVariant.ts/roleProperties.ts already use for border/dark-mode
 * derivation — so a Figma variant set is never five visually identical
 * states just because nothing was ever hand-customized.
 *
 * Falls back to deriveThemeVariantFromPalette/deriveDarkThemeVariantFromLight
 * when a project has no designSystem yet (a fresh manual build never gets
 * one until Studio's "enable component tokens" action) — the same functions
 * Studio itself uses to seed one, so a component-library export never
 * requires the user to have opted into anything extra first.
 */
import type { ComponentName, ComponentTokenSet, ThemeVariantTokens } from "@/types/designSystem";
import type { StudioExportTokens } from "@/lib/studio/exportCode";
import { APPLICABLE_STATES, COMPONENT_LABELS } from "@/lib/studio/componentSelection";
import { deriveThemeVariantFromPalette, deriveDarkThemeVariantFromLight, mix } from "@/lib/studio/deriveThemeVariant";
import { LAYOUT_MAP, resolveSpacing, resolveRadius } from "./layoutMap";
import { iconSvg } from "./icons";
import type { FigmaComponentSet, FigmaComponentState, FigmaFrameNode, FigmaVariables } from "./types";

const STATE_LABEL: Record<Exclude<FigmaComponentState, "Default">, "hover" | "active" | "disabled" | "focus"> = {
  Hover: "hover",
  Active: "active",
  Disabled: "disabled",
  Focus: "focus",
};

const CLASS_BY_COMPONENT: Record<ComponentName, string> = {
  button: "pg-btn",
  buttonSecondary: "pg-btn",
  input: "pg-input",
  dropdown: "pg-select",
  card: "pg-card",
  navigation: "pg-navbar",
  table: "pg-table-wrap",
  modal: "pg-modal",
  alert: "pg-alert",
  badge: "pg-badge",
};

function resolvedThemeVariants(s: StudioExportTokens): { light: ThemeVariantTokens; dark: ThemeVariantTokens } {
  if (s.designSystem?.dark) return { light: s.designSystem.light, dark: s.designSystem.dark };
  const light = s.designSystem?.light ?? deriveThemeVariantFromPalette(s.light);
  const dark = deriveDarkThemeVariantFromLight(light);
  return { light, dark };
}

function text(name: string, characters: string, size: number, weight: number, fillHex: string, fontFamily: "display" | "body" = "body"): FigmaFrameNode {
  return { kind: "text", name, text: { characters, size, weight, fontFamily, fillHex } };
}

/** Per-component real content — this is what actually makes a "card" read as
 *  a card and a "dropdown" read as a dropdown, instead of every component
 *  being the same generic colored-box-with-a-label placeholder. */
function contentFor(name: ComponentName, tokens: ComponentTokenSet, variables: FigmaVariables): FigmaFrameNode[] {
  const sm = variables.typeSize.sm ?? 14;
  const xs = variables.typeSize.xs ?? 12;
  const lg = variables.typeSize.lg ?? 18;

  switch (name) {
    case "button":
    case "buttonSecondary":
      return [text("label", COMPONENT_LABELS[name], sm, 600, tokens.text)];

    case "input":
      return [text("placeholder", "Email address", sm, 400, tokens.text)];

    case "dropdown":
      return [
        text("value", "Select an option", sm, 400, tokens.text),
        { kind: "vector", name: "chevron", iconSvg: iconSvg("ChevronDown") },
      ];

    case "badge":
      return [text("label", "New", xs, 600, tokens.text)];

    case "navigation":
      return ["Overview", "Library", "Studio", "Team"].map((label, i) =>
        text(`link-${i}`, label, sm, 500, tokens.text)
      );

    case "alert":
      return [
        { kind: "vector", name: "icon", iconSvg: iconSvg("Bell") },
        {
          kind: "frame",
          name: "body",
          layout: { direction: "VERTICAL", gap: 2 },
          children: [text("title", "Heads up", sm, 600, tokens.text), text("message", "Your export finished successfully.", xs, 400, tokens.text)],
        },
      ];

    case "card":
      return [
        text("eyebrow", "FEATURED", xs, 600, tokens.text),
        text("title", "Plan ahead", lg, 700, tokens.text, "display"),
        text("body", "Everything your team needs to ship a consistent system.", sm, 400, tokens.text),
        {
          kind: "frame",
          name: "footer",
          layout: { direction: "HORIZONTAL", gap: 8, primaryAlign: "SPACE_BETWEEN", counterAlign: "CENTER" },
          children: [text("price", "$29/mo", sm, 700, tokens.text), text("cta", "Choose plan →", xs, 600, tokens.text)],
        },
      ];

    case "table":
      return [
        {
          kind: "frame",
          name: "header row",
          layout: { direction: "HORIZONTAL", gap: 24 },
          children: ["Name", "Status", "Updated"].map((h, i) => text(`h-${i}`, h, xs, 700, tokens.text)),
        },
        ...[
          ["Northwind", "Active", "2h ago"],
          ["Aperture", "Draft", "1d ago"],
        ].map((row, r) => ({
          kind: "frame" as const,
          name: `row-${r}`,
          layout: { direction: "HORIZONTAL" as const, gap: 24 },
          children: row.map((cell, i) => text(`cell-${r}-${i}`, cell, sm, 400, tokens.text)),
        })),
      ];

    case "modal":
      return [
        text("title", "Confirm changes", sm, 700, tokens.text, "display"),
        text("body", "This will update every project that references this token.", xs, 400, tokens.text),
        {
          kind: "frame",
          name: "footer",
          layout: { direction: "HORIZONTAL", gap: 8, primaryAlign: "MAX" },
          children: [text("cancel", "Cancel", xs, 600, tokens.text), text("confirm", "Confirm", xs, 600, tokens.text)],
        },
      ];
  }
}

function tokenSetToFrame(name: ComponentName, tokens: ComponentTokenSet, variables: FigmaVariables, focusRing?: string): FigmaFrameNode {
  const cls = CLASS_BY_COMPONENT[name];
  const spec = LAYOUT_MAP[cls] ?? { direction: "VERTICAL" as const };

  return {
    kind: "frame",
    name: COMPONENT_LABELS[name],
    layout: {
      direction: spec.direction,
      gap: spec.gap ? resolveSpacing(spec.gap, variables.spacing) : undefined,
      padding: spec.padding ? (spec.padding.map((p) => resolveSpacing(p, variables.spacing)) as [number, number, number, number]) : undefined,
      primaryAlign: spec.primaryAlign,
      counterAlign: spec.counterAlign,
    },
    radius: resolveRadius(spec.radius, variables.radius),
    fill: { hex: tokens.background },
    stroke: focusRing ? { paint: { hex: focusRing }, width: 2 } : tokens.border ? { paint: { hex: tokens.border }, width: 1 } : undefined,
    children: contentFor(name, tokens, variables),
  };
}

/** Literal override wins when the design system actually authored one
 *  (matches ColorField's `override.field ?? tokens.field`); otherwise
 *  derives the same mix-toward-ink look the real CSS falls back to, so
 *  Hover/Active are never pixel-identical to Default by default.
 *
 *  Mixes toward `ink` (the design system's text/ink role) — NOT
 *  `tokens.text`. For a primary button, `tokens.text` is the on-accent
 *  colour (often near-white), so mixing toward it made hover *lighter* and
 *  washed-out; the real CSS (`.pg-btn--primary:hover`'s
 *  `color-mix(in srgb, var(--pgc-primary) 85%, var(--pgc-ink))`) always
 *  mixes toward the app's ink role, which darkens on a light theme and
 *  lightens on a dark one exactly the way a hover state should read.
 *  Simplification: styles.ts actually varies the mix target per component
 *  (outline/navigation mix toward accent, secondary toward surface) — this
 *  uses ink uniformly, which is correct for button/buttonSecondary/badge and
 *  a reasonable approximation elsewhere, not an exhaustive per-component
 *  match. */
function resolveStateTokens(tokens: ComponentTokenSet, state: Exclude<FigmaComponentState, "Default">, ink: string): ComponentTokenSet {
  const override = tokens.states?.[STATE_LABEL[state]];
  if (override) {
    return { background: override.background ?? tokens.background, text: override.text ?? tokens.text, border: override.border ?? tokens.border };
  }
  switch (state) {
    case "Hover":
      return { ...tokens, background: mix(tokens.background, ink, 0.15) };
    case "Active":
      return { ...tokens, background: mix(tokens.background, ink, 0.28) };
    case "Disabled":
      return tokens; // opacity handled separately — real disabled state is a fade, not a recolor
    case "Focus":
      return tokens; // fill unchanged; a focus ring is added instead (see focusRing param on tokenSetToFrame)
  }
}

const OPACITY_BY_STATE: Partial<Record<FigmaComponentState, number>> = { Disabled: 0.45 };

export function serializeComponent(
  name: ComponentName,
  s: StudioExportTokens,
  variables: FigmaVariables,
  variant: "light" | "dark"
): FigmaComponentSet | null {
  const variants = resolvedThemeVariants(s);
  const tokens = variants[variant].components[name];
  if (!tokens) return null;
  const ink = variants[variant].colorRoles.text;
  const accent = variables.color.accent?.[variant] ?? "#222D52";

  const applicable = APPLICABLE_STATES[name];
  const states: FigmaComponentSet["states"] = [{ state: "Default", node: tokenSetToFrame(name, tokens, variables) }];
  for (const stateName of ["Hover", "Active", "Disabled", "Focus"] as const) {
    if (!applicable.includes(STATE_LABEL[stateName])) continue;
    const resolved = resolveStateTokens(tokens, stateName, ink);
    const node = tokenSetToFrame(name, resolved, variables, stateName === "Focus" ? accent : undefined);
    const opacity = OPACITY_BY_STATE[stateName];
    if (opacity !== undefined) node.opacity = opacity;
    states.push({ state: stateName, node });
  }

  return { componentName: name, variant, states };
}

export function serializeComponentLibrary(s: StudioExportTokens, variables: FigmaVariables): FigmaComponentSet[] {
  const names = Object.keys(COMPONENT_LABELS) as ComponentName[];
  const sets: FigmaComponentSet[] = [];
  for (const name of names) {
    for (const variant of ["light", "dark"] as const) {
      const set = serializeComponent(name, s, variables, variant);
      if (set) sets.push(set);
    }
  }
  return sets;
}
