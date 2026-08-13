/**
 * One-time transform script.
 *
 * Pulls the full Google Fonts catalog via the Web Fonts Developer API
 * (requires GOOGLE_FONTS_API_KEY — dev-time only, the running app never
 * calls this API) and reshapes each entry into the Font type, writing a
 * static .ts file to /data/fonts/. Mirrors scripts/transformColors.ts.
 *
 * Google's API gives real facts (family, category, weights) but no
 * qualitative data — mood/style/useCase/note are derived from category
 * with a small heuristic table below, the same "real but templated"
 * approach data/colors/tailwind.ts uses for its auto-generated notes.
 * The 36 fonts in data/fonts/seed.ts are hand-curated with real pairing
 * data and bespoke notes; this file doesn't touch or duplicate those.
 *
 * Run once, whenever the catalog should be refreshed:
 *   npx tsx scripts/transformFonts.ts
 */
import fs from "fs";
import path from "path";
import { Font, FontCategory, FontUseCase } from "../types/font";

// Minimal .env.local loader — avoids adding a dotenv dependency for a
// one-off dev script. next dev loads .env.local itself at runtime; this
// script runs outside Next, so it needs to load it manually.
function loadEnvLocal() {
  const envPath = path.join(__dirname, "../.env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  }
}
loadEnvLocal();

type GoogleFontAxis = { tag: string; start: number; end: number };

type GoogleFont = {
  family: string;
  variants: string[];
  category: string;
  axes?: GoogleFontAxis[];
};

type GoogleFontsResponse = {
  items: GoogleFont[];
};

/**
 * Families that aren't typefaces you can read — icon and symbol fonts whose
 * glyphs are pictograms, plus emoji faces.
 *
 * A UX review found "Material Icons" sitting in the library at position 39
 * catalogued as a *monospace* face (Google's API genuinely reports it that
 * way) and previewed with the standard "AaBbCcDdEeFf 0123456789" proof
 * string, which renders as a row of unrelated pictograms. There are nine
 * Material Icons/Symbols variants plus the Noto symbol and emoji faces in
 * the catalog, so this is filtered at the source rather than patched in the
 * browse UI — anything that can't set a sentence has no business in a type
 * library, and a future re-run must not quietly bring them back.
 *
 * Matching is anchored (prefix or whole-name), never a bare substring: a
 * naive /icon/i also catches the perfectly legitimate script face
 * "Niconne", and /symbol/i would be one letter away from doing similar.
 */
const NON_READING_FAMILY_PATTERNS: RegExp[] = [
  /^Material Icons\b/i, // Material Icons, ...Outlined, ...Round, ...Sharp, ...Two Tone
  /^Material Symbols\b/i, // Material Symbols Outlined / Rounded / Sharp
  /^Noto (Color )?Emoji$/i,
  /^Noto Emoji\b/i,
  /^Noto Sans Symbols/i, // "Noto Sans Symbols", "Noto Sans Symbols 2"
  /^Noto Sans Math$/i,
  /^Noto Music$/i,
  /^Redacted( Script)?$/i, // greeked placeholder blocks, not letterforms
  /\bIcons?$/i, // any future "… Icons" family
];

function isNonReadingFamily(family: string): boolean {
  return NON_READING_FAMILY_PATTERNS.some((pattern) => pattern.test(family));
}

const CATEGORY_PROFILE: Record<
  FontCategory,
  { mood: string[]; style: string[]; useCase: FontUseCase[] }
> = {
  "sans-serif": { mood: ["clean", "neutral", "modern"], style: ["minimal", "modern"], useCase: ["body", "heading"] },
  serif: { mood: ["elegant", "classic", "warm"], style: ["vintage", "modern"], useCase: ["heading", "body"] },
  display: { mood: ["bold", "expressive", "energetic"], style: ["bold", "modern"], useCase: ["heading", "accent"] },
  handwriting: { mood: ["playful", "warm", "personal"], style: ["vintage", "pastel"], useCase: ["accent"] },
  monospace: { mood: ["tech", "neutral", "precise"], style: ["minimal", "modern"], useCase: ["code", "accent"] },
  variable: { mood: ["modern", "flexible"], style: ["minimal", "modern"], useCase: ["body", "heading"] },
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extractWeights(variants: string[]): string[] {
  const weights = new Set<string>();
  for (const v of variants) {
    if (v === "regular") weights.add("400");
    else if (v === "italic") continue;
    else if (/^\d+$/.test(v)) weights.add(v);
    // skip "700italic" etc — Font.variants tracks weight, not style axis
  }
  return Array.from(weights).sort((a, b) => Number(a) - Number(b));
}

/**
 * Note copy for the auto-generated half of the library.
 *
 * The seed set in data/fonts/seed.ts has hand-written notes; the ~1,900
 * catalog entries can't. But the previous single template produced the
 * *identical* sentence shape for every one of them — a UX review measured
 * the cliff exactly, at the point the seed set runs out — while the site
 * described the library as curated. Nobody can hand-write 1,900 notes, so
 * these are built from the metadata that genuinely exists (category, the
 * weight range, the variable-axis flag, and the naming conventions Google
 * families follow) and are honest about being catalog entries rather than
 * pretending to editorial judgement nobody made.
 */
const CATEGORY_OPENERS: Record<FontCategory, string[]> = {
  "sans-serif": [
    "a workhorse sans with no ornament, built to stay out of the way of what it's setting",
    "a neutral sans-serif with clean letterforms that read easily at interface sizes",
    "unfussy sans-serif, the safe end of the catalog, good for body text and UI labels alike",
  ],
  serif: [
    "a serif face whose finishing strokes give long passages a familiar, book-like rhythm",
    "serif letterforms with the traditional contrast that reads as considered rather than casual",
    "a serif built for reading, with bracketed strokes that keep long text from feeling flat",
  ],
  display: [
    "a display face for headlines at size, where its personality is the point; it will fight you as body text",
    "display type, drawn for a few words set large rather than paragraphs",
    "built for impact at large sizes; pair it with something quieter underneath",
  ],
  handwriting: [
    "a handwriting face, informal and personal, best kept to a short phrase",
    "script letterforms imitating a pen, charming in small doses and illegible in bulk",
    "handwritten in feel, good for a signature line or a callout but not for anything long",
  ],
  monospace: [
    "a monospaced face where every character takes the same width, which is what makes code line up",
    "fixed-width by design, the go-to for code blocks, terminals, and tabular figures",
    "monospaced and mechanical by nature, increasingly used for small technical labels in UI",
  ],
  variable: [
    "a variable face whose weight is a continuous axis rather than a fixed set of cuts",
    "variable by design: one file covering a whole range of weights, interpolated on demand",
    "a single variable file covering a full weight range without extra downloads",
  ],
};

/** Naming conventions Google families follow that say something real. */
const NAME_SIGNALS: { pattern: RegExp; clause: string }[] = [
  { pattern: /\bCondensed\b/i, clause: "The condensed widths fit more into a narrow measure" },
  { pattern: /\bExpanded\b|\bExtended\b/i, clause: "The extended widths want room to breathe" },
  { pattern: /\bSlab\b/i, clause: "Slab serifs give it a sturdier, more mechanical footing than a text serif" },
  { pattern: /\bMono\b/i, clause: "Fixed-width, so it holds alignment in code and tables" },
  { pattern: /\bDisplay\b/i, clause: "The display cut is drawn for large sizes specifically" },
  { pattern: /\bText\b/i, clause: "The text cut is optimised for small sizes and long passages" },
  { pattern: /^Noto\b/i, clause: "Part of Google's Noto project, which aims at coverage of every writing system" },
  { pattern: /\bJP$|\bKR$|\bSC$|\bTC$|\bHK$|\bArabic\b|\bDevanagari\b|\bThai\b|\bHebrew\b/i, clause: "Carries the extended script coverage its name implies, which makes it a large download" },
];

function describeWeights(variants: string[], isVariable: boolean): string {
  const lightest = variants[0];
  const heaviest = variants[variants.length - 1];

  // Why this distinction exists: a UX review flagged Noto Sans, Noto Sans
  // JP and Roboto Condensed as "implausibly" offering 9 weights. Checked
  // against the Google Fonts API (`capability=VF`), all three are variable
  // fonts with a continuous wght axis of 100–900 — the count was accurate
  // but read as a copied default, because "9 weights" describes a family
  // with nine separately drawn cuts, which these are not. Saying "a
  // variable weight axis" is both true and no longer suspicious.
  if (isVariable) {
    return `a continuous variable weight axis from ${lightest} to ${heaviest}`;
  }
  if (variants.length === 1) {
    return `a single weight (${lightest})`;
  }
  return `${variants.length} weights, ${lightest} through ${heaviest}`;
}

function buildNote(
  family: string,
  category: FontCategory,
  variants: string[],
  isVariable: boolean,
  rotation: number
): string {
  const openers = CATEGORY_OPENERS[category];
  const opener = openers[rotation % openers.length];
  // Skip a name signal that only repeats what the opener just said —
  // "Roboto Mono — fixed-width by design… Fixed-width, so it holds…".
  const signal = NAME_SIGNALS.find(
    (s) => s.pattern.test(family) && !(category === "monospace" && /Mono/i.test(s.pattern.source))
  );

  const parts = [`${family} — ${opener}.`];
  if (signal) parts.push(`${signal.clause}.`);
  parts.push(`Google Fonts lists ${describeWeights(variants, isVariable)}.`);
  return parts.join(" ");
}

function toFont(g: GoogleFont, rotation: number): Font | null {
  const category = g.category as FontCategory;
  const profile = CATEGORY_PROFILE[category];
  if (!profile) return null; // skip anything outside our known categories
  if (isNonReadingFamily(g.family)) return null; // icon/symbol/emoji faces — see above

  const variants = extractWeights(g.variants);
  if (variants.length === 0) return null;

  const isVariable = Boolean(g.axes?.some((axis) => axis.tag === "wght" && axis.end > axis.start));

  return {
    id: `gf-${slugify(g.family)}`,
    family: g.family,
    category,
    variants,
    mood: profile.mood,
    style: profile.style,
    era: "contemporary",
    useCase: profile.useCase,
    googleFontsId: g.family,
    isPro: false,
    pairsWith: [],
    note: buildNote(g.family, category, variants, isVariable, rotation),
  };
}

async function main() {
  const apiKey = process.env.GOOGLE_FONTS_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_FONTS_API_KEY is not set in .env.local");
    process.exit(1);
  }

  // Two calls, on purpose. The default response enumerates the static
  // instances Google will actually serve (`variants: 100…900`) but never
  // says whether they come from one variable file; `capability=VF` reports
  // the axes but collapses variants to "regular,italic". Weight *counts*
  // come from the first, the variable flag from the second — see
  // describeWeights() for why the distinction had to be made.
  const base = `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`;
  const [res, vfRes] = await Promise.all([fetch(base), fetch(`${base}&capability=VF`)]);
  if (!res.ok) {
    console.error(`Google Fonts API request failed: ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  if (!vfRes.ok) {
    console.error(`Google Fonts variable-axis request failed: ${vfRes.status} ${vfRes.statusText}`);
    process.exit(1);
  }

  const data = (await res.json()) as GoogleFontsResponse;
  const vfData = (await vfRes.json()) as GoogleFontsResponse;
  const axesByFamily = new Map(vfData.items.map((item) => [item.family, item.axes ?? []]));

  const fonts = data.items
    .map((item, index) => toFont({ ...item, axes: axesByFamily.get(item.family) }, index))
    .filter((f): f is Font => f !== null);

  const skipped = data.items.filter((item) => isNonReadingFamily(item.family)).map((item) => item.family);
  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} icon/symbol/emoji families: ${skipped.join(", ")}`);
  }

  const outDir = path.join(__dirname, "../data/fonts");
  fs.mkdirSync(outDir, { recursive: true });

  const fileContents = `// AUTO-GENERATED by scripts/transformFonts.ts — do not edit by hand.
// Full Google Fonts catalog. See data/fonts/seed.ts for the hand-curated
// set with real pairing data and bespoke editorial notes.
import { Font } from "@/types/font";

export const googleFonts: Font[] = ${JSON.stringify(fonts, null, 2)};
`;

  fs.writeFileSync(path.join(outDir, "google.ts"), fileContents);
  console.log(`Wrote ${fonts.length} Google Fonts to data/fonts/google.ts`);
}

main();
