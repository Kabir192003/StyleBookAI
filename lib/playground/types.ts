/**
 * Data model for the Design Playground (docs/DESIGN_PLAYGROUND.md — this
 * file is the authoritative copy of the shapes in that spec; the state
 * batch, the component batch and the apply/persist batch all code against
 * it).
 *
 * The one rule worth restating here, because breaking it is what the spec
 * calls out as requirement 19: an `Experiment` stores **overrides only**.
 * There is no second token schema. Rendering resolves
 * `base StudioExportTokens ⊕ experiment overrides` back into a
 * StudioExportTokens (lib/playground/resolveExperiment.ts) and hands that
 * to `generateExportCode` — the same function the Export drawer and
 * components/studio/LivePreviewSection.tsx already use. If a role ever
 * needs a value that has no home in StudioExportTokens, it goes out as an
 * extra `--pg-*` custom property from resolveExperiment, not as a new
 * parallel token type here.
 */

export type PlaygroundRole =
  | "background"
  | "surface"
  | "primary"
  | "secondary"
  | "accent"
  | "text"
  | "muted"
  | "border"
  | "success"
  | "warning"
  | "error";

export type PlaygroundTypeRole =
  | "display"
  | "heading"
  | "subheading"
  | "body"
  | "label"
  | "button"
  | "caption";

/** A colour available to drop into a role. Sourced from the generated system,
 *  the in-app clipboard, a pasted string, or the custom picker. */
export type PlaygroundSwatch = {
  id: string;
  hex: string;
  name: string;
  origin: "system" | "clipboard" | "custom" | "pasted";
};

export type PlaygroundFont = {
  id: string;
  family: string;
  category: string;
  origin: "system" | "clipboard" | "custom" | "pasted";
};

export type Experiment = {
  id: string;
  name: string;
  /** Role -> hex. Partial: unassigned roles fall back to the base system. */
  colors: Partial<Record<PlaygroundRole, string>>;
  /** Type role -> font family. Partial, same fallback rule. */
  fonts: Partial<Record<PlaygroundTypeRole, string>>;
  radius?: number;
  /** Which component groups this card shows. Empty = the default set. */
  visibleGroups?: string[];
};

export type PlaygroundState = {
  experiments: Experiment[];
  swatches: PlaygroundSwatch[];
  fonts: PlaygroundFont[];
};

// Iteration order for any UI that lists every role — declared once here so
// the P3 role-assignment tray, the contrast readout and the resolver can't
// drift into three different orderings of the same eleven roles.
export const PLAYGROUND_ROLES: PlaygroundRole[] = [
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
];

export const PLAYGROUND_TYPE_ROLES: PlaygroundTypeRole[] = [
  "display",
  "heading",
  "subheading",
  "body",
  "label",
  "button",
  "caption",
];
