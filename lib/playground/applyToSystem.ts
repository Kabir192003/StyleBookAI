/**
 * "Apply to design system" — turning one playground experiment into a
 * change to Studio's canonical tokens, and, first, into an honest account
 * of what that change *is* (docs/DESIGN_PLAYGROUND.md §12).
 *
 * Pure functions, no React, no store access: the dialog in
 * components/playground/ApplyToSystemButton.tsx renders what this returns
 * and stages the payload it returns. Nothing here writes anything.
 *
 * ---------------------------------------------------------------------------
 * HOW THE WRITE ACTUALLY REACHES STUDIO
 * ---------------------------------------------------------------------------
 * Studio's `StudioState` is component-local `useState` inside
 * components/studio/StudioBuilder.tsx, not a store, and the playground is a
 * different route — so it cannot be written to directly, and lifting it into
 * Zustand would be a large refactor of a working 1,200-line component for no
 * gain. The codebase already has the mechanism for exactly this hand-off:
 * `useStudioImportStore.stage()` → navigate to `/studio` → StudioBuilder
 * consumes it and folds it into `StudioState` via `applyStudioImport`. That
 * is how Preview Lab's "Send to Studio" has always worked.
 *
 * Landing in `StudioState` is what buys two of the acceptance criteria for
 * free rather than by re-implementation: the Studio preview is a pure
 * function of that state, and so is the debounced-snapshot undo history —
 * so Apply is undoable in exactly one step, like any other Studio edit.
 *
 * ---------------------------------------------------------------------------
 * WHAT "CURRENT" MEANS IN THE DIFF
 * ---------------------------------------------------------------------------
 * The `base` passed in is the playground's base system
 * (lib/playground/baseSystem.ts), derived from the session's AI result —
 * the same upstream source Studio itself seeds from. It is therefore the
 * current system as of when Studio was last opened, and it will not reflect
 * token edits made in Studio since, which live only in that local state.
 * The dialog says so out loud rather than presenting a possibly-stale
 * "current" column as fact.
 */
import { synthesizeDesignSystemFromPalettes } from "@/lib/studio/deriveThemeVariant";
import type { PaletteTokens, StudioExportTokens } from "@/lib/studio/exportCode";
import type { DesignSystem } from "@/types/designSystem";
import type { StudioImportPayload } from "@/store/studioImportStore";
import { resolveExperimentTokens } from "./resolveExperiment";
import type { Experiment, PlaygroundRole, PlaygroundTypeRole } from "./types";

export type ApplyDiffGroup = "Palette" | "Typography" | "Shape" | "Component tokens";

export type ApplyDiffRow = {
  /** Stable key for React and for the "already reviewed this" reasoning. */
  id: string;
  group: ApplyDiffGroup;
  /** Human label, e.g. "Accent". */
  label: string;
  /** The custom property a designer would recognise, e.g. `--color-accent`. */
  token: string;
  kind: "color" | "font" | "number";
  current: string;
  next: string;
};

export type ApplyPlan = {
  /** Only rows that actually differ — an unchanged token is not a change. */
  rows: ApplyDiffRow[];
  /** Ready to `stage()`. Empty-ish when `rows` is empty; never apply then. */
  payload: StudioImportPayload;
  /**
   * Roles the user explicitly assigned that Studio's token system has no
   * home for. Listed in the dialog so an override can never disappear
   * silently — the user chose a colour for `success`, and being told it
   * won't travel is the difference between a tool and a trapdoor.
   */
  unmapped: string[];
  /**
   * True when the base system had no `designSystem` and applying will
   * introduce one (the same synthesis Studio's own "Enable component
   * tokens" action performs). Worth saying, because it is a structural
   * change to the project, not just a recoloured token.
   */
  enablesComponentTokens: boolean;
};

const PALETTE_LABELS: Array<{ key: keyof PaletteTokens; label: string; token: string }> = [
  { key: "accent", label: "Accent", token: "--color-accent" },
  { key: "support", label: "Support", token: "--color-support" },
  { key: "surface", label: "Surface", token: "--color-surface" },
  { key: "ink", label: "Ink / text", token: "--color-ink" },
  { key: "muted", label: "Muted", token: "--color-muted" },
];

const COLOR_ROLE_LABELS: Array<{ key: "background" | "surface" | "text" | "textMuted" | "border"; label: string; token: string }> = [
  { key: "background", label: "Page background", token: "--ds-color-bg" },
  { key: "surface", label: "Card surface", token: "--ds-color-surface" },
  { key: "text", label: "Body text", token: "--ds-color-text" },
  { key: "textMuted", label: "Muted text", token: "--ds-color-text-muted" },
  { key: "border", label: "Border", token: "--ds-color-border" },
];

/**
 * Playground roles with no destination in `StudioExportTokens` at all —
 * see the role→token table in lib/playground/resolveExperiment.ts. `accent`
 * is here because the palette's accent slot is already spoken for by
 * `primary`; the three status hues because the token system has never had
 * semantic status colours.
 */
const UNMAPPED_COLOR_ROLES: PlaygroundRole[] = ["accent", "success", "warning", "error"];

/** Type roles that collapse onto one of Studio's three font slots, and the
 *  ones that have nowhere to go. Mirrors resolveExperimentTokens' font picks
 *  exactly — if that changes, this must change with it or the diff lies. */
const UNMAPPED_TYPE_ROLES: PlaygroundTypeRole[] = ["subheading", "caption"];

function sameColor(a: string, b: string): boolean {
  // Case-insensitive: the palette carries "#F5F1E8" while a picker or a
  // pasted value may arrive lowercase, and a diff row reading
  // "#f5f1e8 → #F5F1E8" is noise that trains users to skip the dialog.
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function buildApplyPlan(base: StudioExportTokens, exp: Experiment): ApplyPlan {
  const resolved = resolveExperimentTokens(base, exp);
  const rows: ApplyDiffRow[] = [];

  PALETTE_LABELS.forEach(({ key, label, token }) => {
    if (sameColor(base.light[key], resolved.light[key])) return;
    rows.push({
      id: `palette.${key}`,
      group: "Palette",
      label,
      token,
      kind: "color",
      current: base.light[key],
      next: resolved.light[key],
    });
  });

  const fontRows: Array<[string, string, string, string | undefined, string | undefined]> = [
    ["headFont", "Display font", "--font-display", base.headFont, resolved.headFont],
    ["bodyFont", "Body font", "--font-body", base.bodyFont, resolved.bodyFont],
    ["accentFont", "Label font", "--font-accent", base.accentFont, resolved.accentFont],
  ];
  fontRows.forEach(([key, label, token, current, next]) => {
    if (!next || current === next) return;
    rows.push({
      id: `font.${key}`,
      group: "Typography",
      label,
      token,
      kind: "font",
      // A base with no accent font shows "unset" rather than an empty cell —
      // adding a token that didn't exist is still a change worth reading.
      current: current ?? "unset",
      next,
    });
  });

  if (resolved.radius !== base.radius) {
    rows.push({
      id: "shape.radius",
      group: "Shape",
      label: "Corner radius",
      token: "--radius",
      kind: "number",
      current: `${base.radius}px`,
      next: `${resolved.radius}px`,
    });
  }

  // Component tokens. `base.designSystem` is optional — a from-scratch manual
  // build has none — so compare against the same synthesis
  // resolveExperimentTokens itself falls back to, otherwise every row would
  // read as a change on a manual system even when nothing moved.
  const enablesComponentTokens = !base.designSystem;
  const baseDesignSystem: DesignSystem =
    base.designSystem ?? synthesizeDesignSystemFromPalettes(base.light, base.dark);
  const nextDesignSystem = resolved.designSystem;

  if (nextDesignSystem) {
    COLOR_ROLE_LABELS.forEach(({ key, label, token }) => {
      const current = baseDesignSystem.light.colorRoles[key];
      const next = nextDesignSystem.light.colorRoles[key];
      if (!current || !next || sameColor(current, next)) return;
      rows.push({ id: `ds.colorRoles.${key}`, group: "Component tokens", label, token, kind: "color", current, next });
    });

    ([
      ["button", "Primary button fill", "--ds-button-bg"],
      ["buttonSecondary", "Secondary button fill", "--ds-button-secondary-bg"],
    ] as const).forEach(([name, label, token]) => {
      const current = baseDesignSystem.light.components[name]?.background;
      const next = nextDesignSystem.light.components[name]?.background;
      if (!current || !next || sameColor(current, next)) return;
      rows.push({ id: `ds.${name}`, group: "Component tokens", label, token, kind: "color", current, next });
    });
  }

  const unmapped = [
    ...UNMAPPED_COLOR_ROLES.filter((role) => exp.colors[role]).map((role) => `${role} colour`),
    ...UNMAPPED_TYPE_ROLES.filter((role) => exp.fonts[role]).map((role) => `${role} font`),
  ];

  const payload: StudioImportPayload = {
    // Role-keyed, not positional: applyStudioImport now honours an explicit
    // role, so "support" lands on support even though it is second in this
    // array. See the two-mode note in lib/studio/applyImport.ts.
    colors: PALETTE_LABELS.map(({ key }) => ({ hex: resolved.light[key], role: key })),
    primaryFont: resolved.headFont,
    secondaryFont: resolved.bodyFont,
    accentFont: resolved.accentFont,
    radius: resolved.radius,
    // Carried only when the component-token rows are part of what the user
    // just read. Sending it silently on a system that shows no such rows
    // would apply changes the diff never disclosed.
    ...(nextDesignSystem && rows.some((r) => r.group === "Component tokens") ? { designSystem: nextDesignSystem } : {}),
  };

  return { rows, payload, unmapped, enablesComponentTokens };
}
