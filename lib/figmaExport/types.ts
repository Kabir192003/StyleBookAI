/**
 * The data contract between StyleBook and the StyleBook Figma plugin.
 *
 * Deliberately geometry-only and independent of every internal StyleBook
 * type (StudioExportTokens, DesignSystem, ComponentTokenSet, …) — the plugin
 * is a separate codebase with no access to this repo's types, so this shape
 * has to stand on its own. Serializers in this directory translate the real
 * token/component data into this shape; nothing downstream of it should ever
 * need to reach back into types/designSystem.ts or lib/studio/exportCode.ts.
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
  fillContainer?: boolean; // this node grows on the primary axis instead of hugging content
};

export type FigmaPaint = { variable: string } | { hex: string };

export type FigmaFrameNode = {
  kind: "frame" | "text" | "vector";
  name: string;
  layout?: FigmaLayout;
  width?: number; // fixed width; omitted means "hug contents"
  height?: number;
  radius?: number | { variable: string };
  fill?: FigmaPaint;
  stroke?: { paint: FigmaPaint; width: number };
  opacity?: number;
  text?: { characters: string; sizeVar?: string; size?: number; weight: number; fontFamily: string; fillVar?: string; fillHex?: string };
  iconSvg?: string; // raw SVG markup, embedded directly so the plugin needs no icon library of its own
  absolute?: { x: number; y: number }; // set only for overlay children (modal backdrop contents, toast) — plugin sets layoutPositioning: "ABSOLUTE"
  children?: FigmaFrameNode[];
};

export type FigmaComponentState = "Default" | "Hover" | "Active" | "Disabled" | "Focus";

export type FigmaComponentSet = {
  componentName: string; // ComponentName from types/designSystem.ts, kept as a plain string here on purpose (see header comment)
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
