import { describe, expect, it } from "vitest";
import { toDtcgJson, toTokensStudioJson, type NormalizedSystem } from "./designTokens";

// Deliberately not any real project's name/values — a synthetic system
// proves these checks hold generically, not just for one brand's data.
const system: NormalizedSystem = {
  name: "Voltaic Grid",
  brand: [
    { name: "accent", hex: "#3355FF" },
    { name: "support", hex: "#DCE0F0" },
    { name: "surface", hex: "#FFFFFF" },
    { name: "ink", hex: "#0B0F1A" },
    { name: "muted", hex: "#5C6478" },
  ],
  light: [
    { name: "accent", hex: "#3355FF" },
    { name: "support", hex: "#DCE0F0" },
    { name: "surface", hex: "#FFFFFF" },
    { name: "ink", hex: "#0B0F1A" },
    { name: "muted", hex: "#5C6478" },
  ],
  dark: [
    { name: "accent", hex: "#6E85FF" },
    { name: "support", hex: "#22D3EE" },
    { name: "surface", hex: "#141926" },
    { name: "ink", hex: "#F2F4FF" },
    { name: "muted", hex: "#8890A6" },
  ],
  fonts: { display: "Space Grotesk", body: "IBM Plex Sans" },
  radius: 10,
  radiusOptions: [4, 8, 10, 12, 20],
  typeScale: {
    baseSize: 16,
    ratio: 1.25,
    ratioName: "major third",
    sizes: {
      xs: 12.8,
      sm: 14.31,
      base: 16,
      lg: 20,
      xl: 25,
      "2xl": 31.25,
      "3xl": 39.06,
      "4xl": 48.83,
      "5xl": 61.04,
      "6xl": 76.29,
    },
  } as NormalizedSystem["typeScale"],
  spacing: { base: 4, steps: [4, 8, 12, 16, 24, 32, 48, 64] } as NormalizedSystem["spacing"],
  shadows: {
    recommended: "dramatic",
    levels: [
      { name: "none", value: "none" },
      { name: "subtle", value: "0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" },
      { name: "dramatic", value: "0 8px 30px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.06)" },
    ],
  } as NormalizedSystem["shadows"],
  designSystem: {
    light: {
      colorRoles: {
        background: "#F5F6FA",
        surface: "#FFFFFF",
        text: "#0B0F1A",
        textMuted: "#5C6478",
        border: "#E2E5EE",
      },
      components: { button: { background: "#3355FF", text: "#FFFFFF" } },
    },
    dark: {
      colorRoles: {
        background: "#0B0F1A",
        surface: "#141926",
        text: "#F2F4FF",
        textMuted: "#8890A6",
        border: "#242B3D",
      },
      components: { button: { background: "#6E85FF", text: "#0B0F1A" } },
    },
  } as NormalizedSystem["designSystem"],
};

describe("toDtcgJson (the plain \"Design Tokens\" export)", () => {
  // Every Tokens Studio-specific fix in this file is gated behind options
  // only toTokensStudioJson sets — this is the check that catches a fix
  // accidentally leaking into the plain export.
  it("never uses bare (unprefixed) value/type keys", () => {
    const json = toDtcgJson(system);
    expect(json.match(/[^$]"value"/)).toBeNull();
    expect(json.match(/[^$]"type"/)).toBeNull();
  });

  it("keeps fontWeight numeric and singularly typed", () => {
    const plain = JSON.parse(toDtcgJson(system));
    expect(plain.fontWeight.$type).toBe("fontWeight");
    expect(plain.fontWeight.bold.$value).toBe(700);
  });

  it("keeps spacing typed as dimension", () => {
    const plain = JSON.parse(toDtcgJson(system));
    expect(plain.spacing.$type).toBe("dimension");
  });
});

describe("toTokensStudioJson", () => {
  const figma = JSON.parse(toTokensStudioJson(system));

  it("is a flat object — no global/light/dark/$metadata/$themes wrapper", () => {
    expect(Object.keys(figma)).toEqual([
      "color",
      "font",
      "fontWeight",
      "fontSize",
      "typography",
      "spacing",
      "radius",
      "shadow",
    ]);
  });

  // The dialect deliberately splits by group, matched against a reference
  // export confirmed to import correctly in Tokens Studio: color/font/
  // typography/radius stay native value/type; fontWeight/fontSize/spacing/
  // shadow stay $-prefixed. Getting this backwards for any one group is
  // exactly the bug this test exists to catch.
  it("keeps color/font/typography/radius in the native value/type dialect", () => {
    expect(figma.color.brand.accent).toEqual({ value: "#3355ff", type: "color" });
    expect(figma.font.display).toEqual({ value: "Space Grotesk", type: "fontFamilies" });
    expect(figma.radius.base).toMatchObject({ value: "10px", type: "borderRadius" });
    expect(figma.typography.h3.type).toBe("typography");
  });

  it("keeps fontWeight/fontSize/spacing/shadow in the $-prefixed dialect", () => {
    expect(figma.fontWeight.bold).toEqual({ $value: 700, $type: "number" });
    expect(figma.fontSize.base).toEqual({ $value: "16px", $type: "dimension" });
    expect(figma.spacing["1"]).toEqual({ $value: "4px", $type: "dimension" });
    expect(figma.shadow.none.$type).toBe("boxShadow");
  });

  it("resolves colours for brand, and for light/dark role and component groups", () => {
    expect(figma.color.light.role.background).toEqual({ value: "#f5f6fa", type: "color" });
    // The fixture's dark button background exactly matches the dark
    // palette's accent hex, so it collapses to a reference rather than
    // repeating the literal — the deliberate reference-collapse rule
    // (colorTokenOrRef), not something this test should fight.
    expect(figma.color.dark.component.button.background).toEqual({ value: "{palette.accent}", type: "color" });
  });

  it("emits a radius entry per radiusOption, not just base", () => {
    const keys = Object.keys(figma.radius);
    expect(keys).toContain("base");
    expect(keys).toContain("step-4");
    expect(keys).toContain("step-20");
    expect(keys.length).toBeGreaterThan(1);
  });

  it("resolves typography's fontFamily/fontWeight to literal values, and fontSize to a resolved number plus a fontSizeToken pointer", () => {
    const h3 = figma.typography.h3.value;
    expect(h3.fontFamily).toBe("Space Grotesk");
    expect(h3.fontWeight).toBe("Semi Bold");
    expect(h3.fontSize).toBe(25);
    expect(h3.fontSizeToken).toBe("fontSize.xl");
  });

  it("collapses a single-layer shadow to a bare object, keeps multi-layer as an array", () => {
    expect(Array.isArray(figma.shadow.none.$value)).toBe(false);
    expect(Array.isArray(figma.shadow.subtle.$value)).toBe(true);
    expect(figma.shadow.subtle.$value.length).toBe(2);
  });

  it("uses Tokens Studio's x/y field names for shadow layers, not offsetX/offsetY", () => {
    const layer = figma.shadow.subtle.$value[0];
    expect(layer).toHaveProperty("x");
    expect(layer).toHaveProperty("y");
    expect(layer).not.toHaveProperty("offsetX");
  });
});
