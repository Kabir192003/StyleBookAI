/**
 * Lookups over the real font catalogue (`data/fonts`), built once at module
 * load.
 *
 * The clipboard parser has to check candidate words against ~1,950 families,
 * and the font tray has to answer "what category is this family?" for every
 * chip it renders. Both are `O(1)` here and `O(n)` if done with `.find()` at
 * render time — with a tray redraw on every keystroke of the font search
 * that difference is the difference between a responsive filter and a
 * janky one.
 */
import { allFonts } from "@/data/fonts";
import type { Font } from "@/types/font";
import type { FontCatalogueEntry } from "./clipboardParse";

export const FONT_BY_FAMILY: Map<string, Font> = new Map(allFonts.map((f) => [f.family.toLowerCase(), f]));

/** The shape `parseFontsFromText` wants — family + category, nothing else. */
export const FONT_CATALOGUE_ENTRIES: FontCatalogueEntry[] = allFonts.map((f) => ({
  family: f.family,
  category: f.category,
}));

/**
 * `sans-serif` for anything we can't place. A family that isn't in the
 * catalogue can still reach the tray — an AI-generated system may name a
 * face `data/fonts` doesn't carry — and guessing `serif` for those would
 * misdescribe the majority case.
 */
export function fontCategoryOf(family: string): string {
  return FONT_BY_FAMILY.get(family.toLowerCase())?.category ?? "sans-serif";
}

/** The CSS generic to end a preview stack with, so an unloaded face still
 *  falls back to something of roughly the right shape. */
export function genericFor(category: string): string {
  if (category === "serif" || category === "display") return "serif";
  if (category === "monospace") return "monospace";
  if (category === "handwriting") return "cursive";
  return "sans-serif";
}

export function previewStack(family: string, category?: string): string {
  return `"${family}", ${genericFor(category ?? fontCategoryOf(family))}`;
}
