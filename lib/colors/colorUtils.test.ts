import { describe, expect, it } from "vitest";
import { getContrastRatio, getWcagLevel } from "./colorUtils";

describe("getContrastRatio", () => {
  it("returns 21:1 for black on white, the WCAG reference maximum", () => {
    expect(getContrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
  });

  it("returns 1:1 for a colour against itself", () => {
    expect(getContrastRatio("#3355FF", "#3355FF")).toBeCloseTo(1, 5);
  });

  it("is symmetric — order of the two colours doesn't matter", () => {
    const a = getContrastRatio("#222D52", "#F5F1E8");
    const b = getContrastRatio("#F5F1E8", "#222D52");
    expect(a).toBeCloseTo(b, 10);
  });
});

describe("getWcagLevel", () => {
  it("classifies known ratio thresholds correctly", () => {
    expect(getWcagLevel(21)).toBe("AAA");
    expect(getWcagLevel(7)).toBe("AAA");
    expect(getWcagLevel(6.99)).toBe("AA");
    expect(getWcagLevel(4.5)).toBe("AA");
    expect(getWcagLevel(4.49)).toBe("Fail");
    expect(getWcagLevel(1)).toBe("Fail");
  });
});
