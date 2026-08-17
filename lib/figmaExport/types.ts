/**
 * The data contract between StyleBook and the StyleBook Figma plugin.
 *
 * Deliberately geometry-only and independent of every internal StyleBook
 * type (StudioExportTokens, DesignSystem, ComponentTokenSet, …) — the plugin
 * is a separate codebase with no access to this repo's types, so this shape
 * has to stand on its own.
 *
 * **schemaVersion 2**: nodes are now produced by walking the *real rendered
 * canvas DOM* (lib/figmaExport/domSerializer.ts) and reading computed
 * styles, rather than by hand-rebuilding the page server-side. That's why
 * this shape carries concrete measured geometry (rect, per-corner radii,
 * per-side strokes, real font family/line-height/letter-spacing) instead of
 * token references: the whole point is that what lands in Figma is exactly
 * what the browser painted, so the values have to be the resolved ones.
 */

export type FigmaColorVariable = { light: string; dark?: string };

export type FigmaVariables = {
  color: Record<string, FigmaColorVariable>;
  spacing: number[];
  radius: { base: number; sm: number; md: number; lg: number; full: number };
  typeSize: Record<string, number>;
};

export type FigmaAlign = "MIN" | "MAX" | "CENTER" | "SPACE_BETWEEN";

export type FigmaLayout = {
  direction: "HORIZONTAL" | "VERTICAL" | "NONE";
  gap?: number;
  padding?: [number, number, number, number]; // top, right, bottom, left
  primaryAlign?: FigmaAlign;
  counterAlign?: "MIN" | "MAX" | "CENTER" | "BASELINE";
  wrap?: boolean;
};

/** Resolved RGBA, 0–255 channels and 0–1 alpha — never a token reference.
 *  See the header: fidelity requires the value the browser actually painted. */
export type FigmaColor = { r: number; g: number; b: number; a: number };

export type FigmaStroke = {
  color: FigmaColor;
  /** Per-side weights, matching CSS border-*-width. Uniform borders just
   *  repeat the same number; Figma supports both. */
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type FigmaShadow = {
  color: FigmaColor;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  inset: boolean;
};

export type FigmaTextStyle = {
  characters: string;
  fontFamily: string;
  fontWeight: number;
  italic: boolean;
  fontSize: number;
  lineHeight: number | null; // px; null means "auto"
  letterSpacing: number; // px
  color: FigmaColor;
  align: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
  /** CSS text-transform, applied to `characters` already — kept for naming
   *  fidelity only, since Figma's textCase would double-apply it. */
  transformed: boolean;
  decoration: "NONE" | "UNDERLINE" | "STRIKETHROUGH";
};

export type FigmaFrameNode = {
  kind: "frame" | "text" | "vector";
  name: string;
  /** Measured layout box, relative to the parent's padding box. Always
   *  present — the plugin uses it for fixed sizing and, when the parent has
   *  no auto-layout, for absolute placement. */
  rect: { x: number; y: number; width: number; height: number };
  layout?: FigmaLayout;
  /** True when this node's parent had no auto-layout, so the plugin must
   *  position it explicitly rather than letting a layout flow it. */
  absolute?: boolean;
  radius?: { tl: number; tr: number; br: number; bl: number };
  fill?: FigmaColor;
  stroke?: FigmaStroke;
  shadows?: FigmaShadow[];
  opacity?: number;
  clipsContent?: boolean;
  text?: FigmaTextStyle;
  iconSvg?: string; // raw <svg> markup lifted straight out of the DOM
  children?: FigmaFrameNode[];
};

export type FigmaComponentState = "Default" | "Hover" | "Active" | "Disabled" | "Focus";

export type FigmaComponentSet = {
  componentName: string;
  label: string;
  variant: "light" | "dark";
  states: Array<{ state: FigmaComponentState; node: FigmaFrameNode }>;
};

export type FigmaExportPayload = {
  schemaVersion: 2;
  meta: { name: string; generatedAt: string };
  variables: FigmaVariables;
  componentLibrary?: FigmaComponentSet[];
  canvas?: FigmaFrameNode;
};
