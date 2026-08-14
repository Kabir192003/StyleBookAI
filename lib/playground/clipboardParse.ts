/**
 * Clipboard → playground tray parsing (docs/DESIGN_PLAYGROUND.md, batch P3).
 *
 * Pure functions, no React, no `navigator`. The dialog that calls these
 * (components/playground/controls/ClipboardImportDialog.tsx) owns the async,
 * permission-fragile part — reading `navigator.clipboard.readText()` and the
 * in-app `useClipboardStore` — and hands the resulting *string* here. Keeping
 * the parsing side effect-free is what makes it checkable without a browser,
 * and it is the only reason the "detect → preview → select → add" flow can be
 * reasoned about at all: detection never mutates anything.
 *
 * Colour conversion goes through `colord` (already a dependency, already used
 * by components/studio/PreviewLab.tsx). This file deliberately contains no
 * hand-rolled rgb→hex maths — a second, subtly different converter in the
 * codebase is exactly the bug that shows up as "the hex I pasted isn't the hex
 * I got".
 */
import { colord } from "colord";

/** Minimal shape the font matcher needs. Deliberately not `Font` from
 *  `@/types`: the parser must be usable with a hand-written 3-entry
 *  catalogue in a test, without pulling in ~1,950 records of font data. */
export type FontCatalogueEntry = { family: string; category: string };

export type DetectedColor = {
  /** Stable within one detection run; used as the checkbox key. */
  key: string;
  /** Normalised, uppercase, 6-digit. */
  hex: string;
  /** Exactly what appeared in the source text, e.g. `rgb(34, 45, 82)`. */
  raw: string;
  /** True when the source carried an alpha channel we flattened away —
   *  surfaced in the UI so a user isn't silently handed an opaque colour. */
  alphaDropped: boolean;
  /** Whether the checkbox starts ticked. See `suggestedFor` notes below. */
  suggested: boolean;
};

export type FontConfidence =
  /** Appeared inside a `font-family:` declaration — unambiguous. */
  | "declared"
  /** Appeared inside quotes, e.g. `"DM Sans"` — near-unambiguous. */
  | "quoted"
  /** Bare words in prose that happen to match a real family name. */
  | "bare";

export type DetectedFont = {
  key: string;
  family: string;
  category: string;
  raw: string;
  confidence: FontConfidence;
  suggested: boolean;
};

export type ClipboardDetection = {
  colors: DetectedColor[];
  fonts: DetectedFont[];
};

// Hex must be bounded on both sides or `#AABBCCDD` would also yield a
// `#AABBCC` match at the same offset. The trailing lookahead rejects a 7th
// hex digit rather than truncating.
const HEX_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/g;
const FUNCTIONAL_RE = /\b(?:rgba?|hsla?)\(\s*[^()]{1,80}\)/gi;
const FONT_FAMILY_DECL_RE = /font-family\s*:\s*([^;{}\n]+)/gi;
const QUOTED_RE = /["'“”‘’]([^"'“”‘’\n]{2,48})["'“”‘’]/g;

/**
 * Generic CSS family keywords and the system-stack members that show up in
 * every real `font-family` declaration. They are dropped before the
 * catalogue lookup rather than after, because a couple of them (`system-ui`,
 * `Helvetica`) do have near-namesakes in the Google catalogue and would
 * otherwise be "detected" from a stack the user never chose.
 */
const CSS_GENERIC_FAMILIES = new Set(
  [
    "serif",
    "sans-serif",
    "monospace",
    "cursive",
    "fantasy",
    "system-ui",
    "ui-serif",
    "ui-sans-serif",
    "ui-monospace",
    "ui-rounded",
    "-apple-system",
    "blinkmacsystemfont",
    "segoe ui",
    "helvetica",
    "helvetica neue",
    "arial",
    "inherit",
    "initial",
    "unset",
    "var",
  ].map((s) => s.toLowerCase())
);

function normaliseHex(value: string): { hex: string; alphaDropped: boolean } | null {
  const parsed = colord(value);
  if (!parsed.isValid()) return null;
  const alpha = parsed.alpha();
  // Alpha is flattened, not preserved: every downstream consumer of a role
  // value (`getContrastRatio`, `hexToRgb` in lib/colors/colorUtils.ts, the
  // `--pg-on-*` pick in resolveExperiment.ts) parses a 6-digit hex with
  // `parseInt(…, 16)`. An 8-digit value would silently produce nonsense
  // luminance rather than an error, so it must not reach the tray.
  return { hex: parsed.alpha(1).toHex().toUpperCase(), alphaDropped: alpha < 1 };
}

/**
 * Every colour literal in a blob of text, de-duplicated by resolved hex.
 * First spelling wins, so the `raw` shown in the confirmation list is the
 * one the user will recognise from what they copied.
 */
export function parseColorsFromText(text: string): DetectedColor[] {
  const found = new Map<string, DetectedColor>();

  const consider = (raw: string) => {
    const normalised = normaliseHex(raw);
    if (!normalised) return;
    if (found.has(normalised.hex)) return;
    found.set(normalised.hex, {
      key: `color:${normalised.hex}`,
      hex: normalised.hex,
      raw: raw.trim(),
      alphaDropped: normalised.alphaDropped,
      // Colour literals are unambiguous — a `#3F51B5` in the source text is
      // never an accident of prose the way a bare font name can be — so they
      // start ticked. The user still has to press "Add selected".
      suggested: true,
    });
  };

  for (const match of text.matchAll(HEX_RE)) consider(match[0]);
  for (const match of text.matchAll(FUNCTIONAL_RE)) consider(match[0]);

  return Array.from(found.values());
}

/** Splits catalogue families into a lookup keyed on the lowercased family. */
function catalogueIndex(catalogue: FontCatalogueEntry[]): Map<string, FontCatalogueEntry> {
  const index = new Map<string, FontCatalogueEntry>();
  for (const entry of catalogue) {
    const key = entry.family.toLowerCase();
    if (!index.has(key)) index.set(key, entry);
  }
  return index;
}

/**
 * Word n-grams, in the shape a font family takes. Split on everything that
 * can't appear inside a family name — digits and `+` stay because real
 * families use them (`Baloo Bhai 2`, `M PLUS 1p`).
 */
function wordNgrams(text: string, maxWords: number): string[] {
  const words = text.split(/[^A-Za-z0-9+]+/).filter(Boolean);
  const grams: string[] = [];
  for (let i = 0; i < words.length; i++) {
    for (let n = 1; n <= maxWords && i + n <= words.length; n++) {
      grams.push(words.slice(i, i + n).join(" "));
    }
  }
  return grams;
}

// Longest real Google family is 5 words ("Are You Serious", "Sofia Sans
// Extra Condensed"); 5 covers the catalogue with room to spare and keeps the
// n-gram set at 5x the word count rather than quadratic.
const MAX_FAMILY_WORDS = 5;

/**
 * Font families in a blob of text, matched against the real catalogue.
 *
 * Three passes of decreasing certainty, because "is this word a font name?"
 * has no honest yes/no answer — `Play`, `Share`, `Cabin` and `Oxygen` are all
 * genuine Google families and all ordinary English words. Rather than guess,
 * the parser reports *how* it found each one and lets the confirmation dialog
 * present the weak matches unticked:
 *
 *   1. inside a `font-family:` declaration  -> "declared", ticked
 *   2. inside quotes                        -> "quoted", ticked
 *   3. bare words matching a family exactly -> "bare"; ticked only when the
 *      name is more than one word, since a multi-word coincidence
 *      ("Playfair Display" appearing by chance in prose) effectively
 *      doesn't happen while a single-word one constantly does.
 *
 * The bare pass is case-*sensitive* on purpose: `Cabin` in a sentence about
 * cabins is capitalised only at the start of a sentence, whereas somebody
 * listing fonts writes them as they appear in the catalogue. It costs the
 * lowercase spelling "dm sans" — which the quoted pass still catches — and
 * buys a dramatically lower false-positive rate on prose.
 */
export function parseFontsFromText(text: string, catalogue: FontCatalogueEntry[]): DetectedFont[] {
  const index = catalogueIndex(catalogue);
  const found = new Map<string, DetectedFont>();

  const consider = (candidate: string, confidence: FontConfidence) => {
    const cleaned = candidate.trim().replace(/^["'“”‘’]|["'“”‘’]$/g, "").trim();
    if (!cleaned || CSS_GENERIC_FAMILIES.has(cleaned.toLowerCase())) return;
    const entry = index.get(cleaned.toLowerCase());
    if (!entry) return;
    // A family found by a stronger pass is never downgraded by a later one.
    const existing = found.get(entry.family);
    if (existing) return;
    found.set(entry.family, {
      key: `font:${entry.family}`,
      family: entry.family,
      category: entry.category,
      raw: cleaned,
      confidence,
      suggested: confidence !== "bare" || entry.family.includes(" "),
    });
  };

  for (const decl of text.matchAll(FONT_FAMILY_DECL_RE)) {
    decl[1].split(",").forEach((part) => consider(part, "declared"));
  }
  for (const quoted of text.matchAll(QUOTED_RE)) consider(quoted[1], "quoted");
  for (const gram of wordNgrams(text, MAX_FAMILY_WORDS)) {
    const entry = index.get(gram.toLowerCase());
    // Case-sensitive gate — see the doc comment.
    if (entry && entry.family === gram) consider(gram, "bare");
  }

  return Array.from(found.values());
}

export function parseClipboardText(text: string, catalogue: FontCatalogueEntry[]): ClipboardDetection {
  if (!text || !text.trim()) return { colors: [], fonts: [] };
  return {
    colors: parseColorsFromText(text),
    fonts: parseFontsFromText(text, catalogue),
  };
}

/**
 * Drops anything already sitting in the tray. Runs *before* the dialog
 * renders its checkbox list rather than at add-time, so the user is never
 * shown a choice that would have been a no-op — and the dialog can say
 * "3 already in your tray" instead of silently swallowing them.
 */
export function excludeExisting(
  detection: ClipboardDetection,
  existing: { hexes: string[]; families: string[] }
): { detection: ClipboardDetection; skippedColors: number; skippedFonts: number } {
  const hexes = new Set(existing.hexes.map((h) => h.toUpperCase()));
  const families = new Set(existing.families.map((f) => f.toLowerCase()));
  const colors = detection.colors.filter((c) => !hexes.has(c.hex));
  const fonts = detection.fonts.filter((f) => !families.has(f.family.toLowerCase()));
  return {
    detection: { colors, fonts },
    skippedColors: detection.colors.length - colors.length,
    skippedFonts: detection.fonts.length - fonts.length,
  };
}
