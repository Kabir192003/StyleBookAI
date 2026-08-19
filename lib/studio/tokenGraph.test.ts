import { describe, expect, it } from "vitest";
import {
  isColorRef,
  resolveColor,
  resolvePalette,
  unlinkPrimitiveFromPalette,
  type PrimitiveColor,
} from "./tokenGraph";

const primitives: PrimitiveColor[] = [
  { id: "p1", name: "Brand Navy", hex: "#222D52" },
  { id: "p2", name: "Warm Clay", hex: "#C36B3E" },
];

describe("isColorRef", () => {
  it("treats a plain hex string as not a reference", () => {
    expect(isColorRef("#222D52")).toBe(false);
  });

  it("treats a { primitiveId } object as a reference", () => {
    expect(isColorRef({ primitiveId: "p1" })).toBe(true);
  });
});

describe("resolveColor", () => {
  it("returns a literal hex value unchanged", () => {
    expect(resolveColor("#3355FF", primitives)).toBe("#3355FF");
  });

  it("resolves a linked primitive to its current hex", () => {
    expect(resolveColor({ primitiveId: "p1" }, primitives)).toBe("#222D52");
  });

  it("falls back to black for a primitiveId that no longer exists", () => {
    expect(resolveColor({ primitiveId: "missing" }, primitives)).toBe("#000000");
  });
});

describe("resolvePalette", () => {
  it("resolves every role in a mixed literal/linked palette", () => {
    const palette = {
      accent: { primitiveId: "p1" },
      support: { primitiveId: "p2" },
      surface: "#FFFFFF",
      ink: "#0B0F1A",
      muted: "#5C6478",
    };
    expect(resolvePalette(palette, primitives)).toEqual({
      accent: "#222D52",
      support: "#C36B3E",
      surface: "#FFFFFF",
      ink: "#0B0F1A",
      muted: "#5C6478",
    });
  });

  it("reflects a primitive's new hex without re-linking the role", () => {
    const palette = { accent: { primitiveId: "p1" } };
    const before = resolvePalette(palette, primitives);
    const updated = primitives.map((p) => (p.id === "p1" ? { ...p, hex: "#FF0000" } : p));
    const after = resolvePalette(palette, updated);
    expect(before.accent).toBe("#222D52");
    expect(after.accent).toBe("#FF0000");
  });
});

describe("unlinkPrimitiveFromPalette", () => {
  it("freezes a role to its last-resolved hex when its primitive is deleted", () => {
    const palette = { accent: { primitiveId: "p1" }, surface: "#FFFFFF" };
    const next = unlinkPrimitiveFromPalette(palette, "p1", primitives);
    expect(next.accent).toBe("#222D52");
    expect(next.surface).toBe("#FFFFFF");
  });

  it("leaves roles linked to a different primitive untouched", () => {
    const palette = { accent: { primitiveId: "p1" }, support: { primitiveId: "p2" } };
    const next = unlinkPrimitiveFromPalette(palette, "p1", primitives);
    expect(isColorRef(next.support)).toBe(true);
  });
});
