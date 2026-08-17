/**
 * Covers the parts of the Figma export that are pure data.
 *
 * The DOM serializer (domSerializer.ts / captureCanvas.ts) is deliberately
 * not unit-tested here: it reads computed styles and measured rects, and
 * this suite runs in `environment: "node"` with no layout engine, so a jsdom
 * test would assert against zeroed rects and prove nothing about the real
 * output. It's verified in a real browser against the live canvas instead.
 */
import { describe, expect, it } from "vitest";
import { buildFigmaPayload } from "./serializePayload";
import { serializeVariables } from "./serializeVariables";
import type { CanvasCapture } from "./captureCanvas";
import type { StudioExportTokens } from "@/lib/studio/exportCode";
import { generateTypeScale } from "@/lib/typeScale/generateTypeScale";
import { generateSpacingScale } from "@/lib/designTokens/spacing";
import { buildShadowScale } from "@/lib/designTokens/shadows";

const tokens: StudioExportTokens = {
  name: "Northwind",
  light: { accent: "#222D52", support: "#C36B3E", surface: "#F5F1E8", ink: "#211E18", muted: "#8A8477" },
  dark: { accent: "#8B5CF6", support: "#C36B3E", surface: "#141110", ink: "#F2EBE0", muted: "#8A8477" },
  headFont: "Fraunces",
  bodyFont: "Archivo",
  radius: 10,
  typeScale: generateTypeScale(16, "Major Third"),
  spacing: generateSpacingScale(4),
  shadows: buildShadowScale("subtle"),
};

describe("serializeVariables", () => {
  it("carries every palette role with both light and dark values", () => {
    const vars = serializeVariables(tokens);
    expect(vars.color.accent).toEqual({ light: "#222D52", dark: "#8B5CF6" });
    expect(vars.color.surface).toEqual({ light: "#F5F1E8", dark: "#141110" });
    for (const role of ["accent", "support", "surface", "ink", "muted"]) {
      expect(vars.color[role]).toBeDefined();
    }
  });

  it("includes status colours, the spacing steps, the radius ramp and the type scale", () => {
    const vars = serializeVariables(tokens);
    expect(vars.color.success).toBeDefined();
    expect(vars.color.warning).toBeDefined();
    expect(vars.color.error).toBeDefined();
    expect(vars.spacing.length).toBeGreaterThan(0);
    expect(vars.radius.md).toBe(10);
    expect(vars.typeSize.base).toBe(16);
  });
});

describe("buildFigmaPayload", () => {
  const capture: CanvasCapture = {
    canvas: { kind: "frame", name: "Canvas", rect: { x: 0, y: 0, width: 900, height: 400 } },
    componentLibrary: [
      {
        componentName: "button",
        label: "Primary button",
        variant: "light",
        states: [{ state: "Default", node: { kind: "frame", name: "btn", rect: { x: 0, y: 0, width: 120, height: 40 } } }],
      },
    ],
    missing: ["Modal"],
  };

  it("stamps schemaVersion 2 and passes the capture through untouched", () => {
    const payload = buildFigmaPayload(tokens, capture);
    expect(payload.schemaVersion).toBe(2);
    expect(payload.meta.name).toBe("Northwind");
    expect(payload.canvas).toBe(capture.canvas);
    expect(payload.componentLibrary).toBe(capture.componentLibrary);
  });

  it("still emits variables when only the component library was captured", () => {
    const payload = buildFigmaPayload(tokens, { componentLibrary: capture.componentLibrary, missing: [] });
    expect(payload.canvas).toBeUndefined();
    expect(payload.variables.color.accent).toBeDefined();
  });
});
