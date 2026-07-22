/**
 * Synthesizes a full Color object around an arbitrary hex the AI returns
 * directly (instead of picking a catalog id) — see lib/ai/generate.ts. Every
 * consumer downstream (export generators, Project.colors, the AI results
 * strip) expects a real Color shape, so this derives family/mood/style from
 * HSL rather than introducing a second, partial color type.
 */
import { Color, ColorFamily, ColorMood, ColorStyle } from "@/types/color";
import { buildColor } from "./colorUtils";

function deriveFamily(h: number, s: number, l: number): ColorFamily {
  if (s < 12 || l > 96 || l < 4) return "neutral";
  // Desaturated warm hues at low-mid lightness read as brown rather than
  // red/orange (a "muddy" red/orange, not a vivid one).
  if ((h < 40 || h >= 345) && s < 55 && l > 15 && l < 55) return "brown";
  if (h < 15 || h >= 345) return "red";
  if (h < 45) return "orange";
  if (h < 65) return "yellow";
  if (h < 165) return "green";
  if (h < 195) return "teal";
  if (h < 255) return "blue";
  if (h < 290) return "purple";
  return "pink"; // 290-345
}

function deriveMood(h: number, s: number, l: number): ColorMood[] {
  const moods: ColorMood[] = [];
  if (s > 70 && l < 60) moods.push("energetic");
  if (s < 30) moods.push("calm");
  if (l > 80) moods.push("playful");
  if (l < 30) moods.push("luxurious");
  if (h < 70 || h > 320) moods.push("warm");
  else if (h > 150 && h < 260) moods.push("cool");
  if (moods.length === 0) moods.push("calm");
  return Array.from(new Set(moods)).slice(0, 3);
}

function deriveStyle(h: number, s: number, l: number): ColorStyle[] {
  const styles: ColorStyle[] = [];
  if (s > 85 && l > 45 && l < 65) styles.push("neon");
  if (l > 85) styles.push("pastel");
  if (s < 25) styles.push("muted");
  if (s > 60 && l < 50) styles.push("bold");
  if (styles.length === 0) styles.push("modern");
  return Array.from(new Set(styles)).slice(0, 2);
}

export function synthesizeColorFromHex(hex: string, name?: string): Color {
  const cleanHex = (hex.startsWith("#") ? hex : `#${hex}`).toLowerCase();
  const partial = buildColor({
    id: `ai-${cleanHex.replace("#", "")}`,
    name: name ?? `Custom ${cleanHex.toUpperCase()}`,
    hex: cleanHex,
    family: "neutral", // placeholder, overwritten below once hsl is known
    mood: [],
    style: [],
    collection: "ai-generated",
    isPro: false,
    note: "A custom shade generated for this brand — not yet part of the curated library.",
  });

  const { h, s, l } = partial.hsl;
  return {
    ...partial,
    family: deriveFamily(h, s, l),
    mood: deriveMood(h, s, l),
    style: deriveStyle(h, s, l),
  };
}
