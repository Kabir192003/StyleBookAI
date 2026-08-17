/**
 * Mirrors lib/figmaExport/types.ts in the main StyleBook repo.
 *
 * Duplicated on purpose, not imported across the repo boundary: this plugin
 * is a separate, separately-built/shipped project (Figma plugins bundle
 * their own dependency graph), so it has no access to the Next.js app's
 * TypeScript project. If the payload shape changes, update both this file
 * and lib/figmaExport/types.ts together — schemaVersion exists specifically
 * so a mismatch fails loudly (see code.ts) instead of silently.
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
  padding?: [number, number, number, number];
  primaryAlign?: FigmaAlign;
  counterAlign?: "MIN" | "MAX" | "CENTER" | "BASELINE";
  wrap?: boolean;
};

export type FigmaColor = { r: number; g: number; b: number; a: number };

export type FigmaStroke = {
  color: FigmaColor;
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
  lineHeight: number | null;
  letterSpacing: number;
  color: FigmaColor;
  align: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
  transformed: boolean;
  decoration: "NONE" | "UNDERLINE" | "STRIKETHROUGH";
};

export type FigmaFrameNode = {
  kind: "frame" | "text" | "vector";
  name: string;
  rect: { x: number; y: number; width: number; height: number };
  layout?: FigmaLayout;
  absolute?: boolean;
  radius?: { tl: number; tr: number; br: number; bl: number };
  fill?: FigmaColor;
  stroke?: FigmaStroke;
  shadows?: FigmaShadow[];
  opacity?: number;
  clipsContent?: boolean;
  text?: FigmaTextStyle;
  iconSvg?: string;
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
