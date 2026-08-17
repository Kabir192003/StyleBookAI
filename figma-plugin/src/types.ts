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
  fillContainer?: boolean;
};

export type FigmaPaint = { variable: string } | { hex: string };

export type FigmaFrameNode = {
  kind: "frame" | "text" | "vector";
  name: string;
  layout?: FigmaLayout;
  width?: number;
  height?: number;
  radius?: number | { variable: string };
  fill?: FigmaPaint;
  stroke?: { paint: FigmaPaint; width: number };
  opacity?: number;
  text?: { characters: string; sizeVar?: string; size?: number; weight: number; fontFamily: string; fillVar?: string; fillHex?: string };
  iconSvg?: string;
  absolute?: { x: number; y: number };
  children?: FigmaFrameNode[];
};

export type FigmaComponentState = "Default" | "Hover" | "Active" | "Disabled" | "Focus";

export type FigmaComponentSet = {
  componentName: string;
  variant: "light" | "dark";
  states: Array<{ state: FigmaComponentState; node: FigmaFrameNode }>;
};

export type FigmaExportPayload = {
  schemaVersion: 1;
  meta: { name: string; generatedAt: string };
  variables: FigmaVariables;
  componentLibrary?: FigmaComponentSet[];
  canvas?: FigmaFrameNode;
};
