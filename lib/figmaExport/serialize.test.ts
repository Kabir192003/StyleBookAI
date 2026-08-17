import { describe, expect, it } from "vitest";
import { serializeFigmaExport } from "./serializePayload";
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

describe("serializeFigmaExport", () => {
  it("produces variables for every palette role and status color", () => {
    const payload = serializeFigmaExport(tokens, { componentLibrary: false, canvas: false });
    expect(payload.schemaVersion).toBe(1);
    expect(payload.variables.color.accent).toEqual({ light: "#222D52", dark: "#8B5CF6" });
    expect(payload.variables.color.success).toBeDefined();
    expect(payload.variables.spacing.length).toBeGreaterThan(0);
    expect(payload.variables.radius.md).toBe(10);
  });

  it("derives a full component library with all 10 components, both variants", () => {
    const payload = serializeFigmaExport(tokens, { componentLibrary: true, canvas: false });
    expect(payload.componentLibrary).toBeDefined();
    const names = new Set(payload.componentLibrary!.map((s) => s.componentName));
    expect(names).toEqual(
      new Set(["button", "buttonSecondary", "input", "dropdown", "card", "navigation", "table", "modal", "alert", "badge"])
    );
    const variants = new Set(payload.componentLibrary!.map((s) => s.variant));
    expect(variants).toEqual(new Set(["light", "dark"]));
  });

  it("gives button all four states, card zero non-default states", () => {
    const payload = serializeFigmaExport(tokens, { componentLibrary: true, canvas: false });
    const button = payload.componentLibrary!.find((s) => s.componentName === "button" && s.variant === "light")!;
    expect(button.states.map((s) => s.state).sort()).toEqual(["Active", "Default", "Disabled", "Focus", "Hover"]);

    const card = payload.componentLibrary!.find((s) => s.componentName === "card" && s.variant === "light")!;
    expect(card.states.map((s) => s.state)).toEqual(["Default"]);
  });

  it("builds a canvas frame with a navbar and hero", () => {
    const payload = serializeFigmaExport(tokens, { componentLibrary: false, canvas: true });
    expect(payload.canvas?.children?.map((c) => c.name)).toEqual(["Navbar", "Hero"]);
  });

  it("gives every non-default button state a visually distinct fill or ring when nothing was hand-customized", () => {
    const payload = serializeFigmaExport(tokens, { componentLibrary: true, canvas: false });
    const button = payload.componentLibrary!.find((s) => s.componentName === "button" && s.variant === "light")!;
    const byState = Object.fromEntries(button.states.map((s) => [s.state, s.node]));

    const defaultFill = byState.Default.fill;
    expect(byState.Hover.fill).not.toEqual(defaultFill);
    expect(byState.Active.fill).not.toEqual(defaultFill);
    expect(byState.Active.fill).not.toEqual(byState.Hover.fill);
    expect(byState.Disabled.opacity).toBeLessThan(1);
    expect(byState.Focus.stroke?.width).toBe(2);
  });

  it("gives card, dropdown, and table real multi-part content instead of a single generic label", () => {
    const payload = serializeFigmaExport(tokens, { componentLibrary: true, canvas: false });
    const byName = (name: string) => payload.componentLibrary!.find((s) => s.componentName === name && s.variant === "light")!;

    expect(byName("card").states[0].node.children!.length).toBeGreaterThan(1);
    expect(byName("dropdown").states[0].node.children!.some((c) => c.kind === "vector")).toBe(true);
    expect(byName("table").states[0].node.children!.length).toBeGreaterThan(1);
  });
});
