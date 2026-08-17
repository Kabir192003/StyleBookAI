/**
 * ComponentTokenSet + APPLICABLE_STATES → FigmaComponentSet.
 *
 * Reuses the exact same "which states are real" source of truth Studio's
 * own inspector already uses (APPLICABLE_STATES), and the exact same
 * default-vs-override resolution ColorField/ComponentEditor use
 * (`override.field ?? tokens.field`) — a Figma variant must show the same
 * value the Studio canvas's Preview toggle already shows for that state, not
 * an independently-computed approximation.
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
import { deriveThemeVariantFromPalette, deriveDarkThemeVariantFromLight } from "@/lib/studio/deriveThemeVariant";
import { LAYOUT_MAP, resolveSpacing, resolveRadius } from "./layoutMap";
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

function tokenSetToFrame(name: ComponentName, tokens: ComponentTokenSet, variables: FigmaVariables): FigmaFrameNode {
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
    stroke: tokens.border ? { paint: { hex: tokens.border }, width: 1 } : undefined,
    children: [
      {
        kind: "text",
        name: "label",
        text: {
          characters: COMPONENT_LABELS[name],
          size: variables.typeSize.sm ?? 14,
          weight: 600,
          fontFamily: "body",
          fillHex: tokens.text,
        },
      },
    ],
  };
}

function stateOverride(tokens: ComponentTokenSet, state: Exclude<FigmaComponentState, "Default">): ComponentTokenSet {
  const override = tokens.states?.[STATE_LABEL[state]];
  if (!override) return tokens;
  return {
    background: override.background ?? tokens.background,
    text: override.text ?? tokens.text,
    border: override.border ?? tokens.border,
  };
}

export function serializeComponent(
  name: ComponentName,
  s: StudioExportTokens,
  variables: FigmaVariables,
  variant: "light" | "dark"
): FigmaComponentSet | null {
  const variants = resolvedThemeVariants(s);
  const tokens = variants[variant].components[name];
  if (!tokens) return null;

  const applicable = APPLICABLE_STATES[name];
  const states: FigmaComponentSet["states"] = [{ state: "Default", node: tokenSetToFrame(name, tokens, variables) }];
  for (const stateName of ["Hover", "Active", "Disabled", "Focus"] as const) {
    if (!applicable.includes(STATE_LABEL[stateName])) continue;
    states.push({ state: stateName, node: tokenSetToFrame(name, stateOverride(tokens, stateName), variables) });
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
