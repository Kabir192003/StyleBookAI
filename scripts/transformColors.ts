// One-time transform script: pulls Tailwind's built-in color palette (no
// API call, it's a local npm package), reshapes it into the Color type,
// and writes the committed static file data/colors/tailwind.ts — no
// network request happens when a user visits the site.
// Run once after `npm install`: npm run transform:colors
import fs from "fs";
import path from "path";
// Requires `tailwindcss` to be installed (already in package.json deps).
import tailwindColors from "tailwindcss/colors";
import { buildColor } from "../lib/colors/colorUtils";
import { Color, ColorFamily } from "../types/color";

// Tailwind ships several deprecated aliases (lightBlue, warmGray, trueGray,
// coolGray, blueGray) alongside their replacements (sky, stone, neutral,
// gray, slate) — same hex values under a second key. Without excluding
// them the library shipped ~55 exact-duplicate swatches, tagged "neutral"
// regardless of what they actually were, since FAMILY_MAP has no entry for
// the old names.
const SKIP_KEYS = new Set([
  "inherit", "current", "transparent", "black", "white",
  "lightBlue", "warmGray", "trueGray", "coolGray", "blueGray",
]);

const FAMILY_MAP: Record<string, ColorFamily> = {
  slate: "neutral",
  gray: "neutral",
  zinc: "neutral",
  neutral: "neutral",
  stone: "neutral",
  red: "red",
  orange: "orange",
  amber: "orange",
  yellow: "yellow",
  lime: "green",
  green: "green",
  emerald: "green",
  teal: "teal",
  cyan: "teal",
  sky: "blue",
  blue: "blue",
  indigo: "blue",
  violet: "purple",
  purple: "purple",
  fuchsia: "pink",
  pink: "pink",
  rose: "pink",
};

// One clause of real character per family — same job HUES[].personality
// does in generateCuratedColors.ts. Only used mid-ramp (see BAND_BY_TIER
// below); a near-white tint calling itself "confident and saturated" would
// be describing a swatch that isn't actually confident or saturated.
const FAMILY_PERSONALITY: Record<string, string> = {
  slate: "a blue-leaning grey, cool and a little corporate",
  gray: "the most neutral grey Tailwind ships, no undertone pulling it warm or cool",
  zinc: "grey with a faint metallic coolness, closer to brushed steel than stone",
  neutral: "true, undertone-free grey, the one to reach for when even slate reads too blue",
  stone: "grey warmed by brown, closer to concrete or driftwood than to ink",
  red: "a direct, unhedged red, the colour of stop signs and underlines",
  orange: "citrus-bright and hard to ignore, warmer than red and louder than yellow",
  amber: "the colour of resin and traffic lights caught mid-change, warm without tipping into red",
  yellow: "sharp and attention-grabbing, the most purely 'yellow' yellow in the set",
  lime: "yellow pulled hard toward green, electric and a little synthetic",
  green: "a working, grass-toned green, neither too yellow nor too blue",
  emerald: "jewel-bright and a touch luxurious, the most 'premium' green here",
  teal: "balanced exactly between blue and green, neither cold nor warm",
  cyan: "bright and screen-lit, closer to a monitor's blue than to the sea",
  sky: "open and unclouded, blue in its most literal, daytime form",
  blue: "a confident, dependable blue with no real hesitation in it",
  indigo: "blue pushed toward violet, a little more serious than plain blue",
  violet: "balanced between blue and red, purple in its most classic form",
  purple: "fuller and warmer than violet, purple with real body to it",
  fuchsia: "hot and unmissable, pink pushed hard toward purple",
  pink: "warm and a little playful, pink at its most straightforward",
  rose: "pink softened with red, warmer and a touch more grown-up than plain pink",
};

function titleCase(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Every Tailwind shade (50–950) maps onto one of these tier words so no
// color ever ships as a bare number like "Red 750" — same light-to-dark
// vocabulary the curated library uses (see scripts/generateCuratedColors.ts),
// so a shade's name alone hints at where it sits on the ramp.
const TIER_BY_SHADE: Record<string, { word: string; ending: string }> = {
  "50": { word: "Whisper", ending: "so faint it nearly disappears into the page" },
  "100": { word: "Pale", ending: "soft enough to sit behind content without competing with it" },
  "200": { word: "Soft", ending: "gentle and easy on the eye, good for large surfaces" },
  "300": { word: "Light", ending: "clear and approachable, sits comfortably as a secondary tone" },
  "400": { word: "Fair", ending: "even-toned and easygoing, a dependable UI colour" },
  "500": { word: "True", ending: "the colour in its truest, most balanced form" },
  "600": { word: "Bold", ending: "confident and saturated, built to anchor a single focal point" },
  "700": { word: "Rich", ending: "deep and full-bodied, reads as premium rather than loud" },
  "800": { word: "Deep", ending: "dark and weighty, good for grounding a palette" },
  "900": { word: "Shadow", ending: "dark and a little moody, sits closer to black than to its own family" },
  "950": { word: "Midnight", ending: "as dark as the family gets, nearly swallowed by black" },
};

type TierBand = "tint" | "mid" | "saturated" | "dark";

const BAND_BY_SHADE: Record<string, TierBand> = {
  "50": "tint", "100": "tint", "200": "tint",
  "300": "mid", "400": "mid", "500": "mid",
  "600": "saturated", "700": "saturated",
  "800": "dark", "900": "dark", "950": "dark",
};

// Several sentence shapes per band, rotated by (family + shade) index so two
// swatches likely seen side by side — say, Slate 50 and Gray 50 — don't open
// with the identical clause the way the old single-template version did.
const NOTE_TEMPLATES: Record<TierBand, string[]> = {
  tint: [
    "%NAME% holds just a trace of %FAMILY%, %ENDING%.",
    "%NAME% is %FAMILY% thinned almost to paper: %ENDING%.",
    "Almost more paper than %FAMILY%, %NAME% is %ENDING%.",
  ],
  mid: [
    "%NAME% is %PERSONALITY%, %ENDING%.",
    "%NAME%: %PERSONALITY%. At this step it's %ENDING%.",
    "This is %FAMILY% at working strength, %PERSONALITY%, %ENDING%.",
  ],
  saturated: [
    "%NAME% runs %FAMILY% close to full strength, %ENDING%.",
    "%NAME% is %PERSONALITY%, dialled up until it's %ENDING%.",
    "%FAMILY% with nothing held back: %NAME% is %ENDING%.",
  ],
  dark: [
    "%NAME% takes %FAMILY% down into the dark, %ENDING%.",
    "%NAME% is %FAMILY% at its heaviest: %ENDING%.",
    "Deep in the %FAMILY% range, %NAME% is %ENDING%.",
  ],
};

function generateNote(familyKey: string, shade: string, rotation: number): string {
  const tier = TIER_BY_SHADE[shade] ?? { word: "True", ending: "a dependable, versatile shade" };
  const band = BAND_BY_SHADE[shade] ?? "mid";
  const templates = NOTE_TEMPLATES[band];
  const name = `${tier.word} ${titleCase(familyKey)}`;
  const personality = FAMILY_PERSONALITY[familyKey] ?? "a working, reliable colour";
  return templates[rotation % templates.length]
    .replace("%NAME%", name)
    .replace(/%FAMILY%/g, familyKey.toLowerCase())
    .replace("%PERSONALITY%", personality)
    .replace("%ENDING%", tier.ending);
}

function buildTailwindColors(): Color[] {
  const out: Color[] = [];
  let familyIndex = 0;

  for (const [familyKey, shades] of Object.entries(tailwindColors)) {
    if (SKIP_KEYS.has(familyKey) || typeof shades !== "object") continue;
    const family = FAMILY_MAP[familyKey] ?? "neutral";
    familyIndex += 1;

    for (const [shadeIndex, [shade, hex]] of Object.entries(shades as Record<string, string>).entries()) {
      if (typeof hex !== "string") continue;
      const shadeNum = Number(shade);
      const id = `tw-${familyKey}-${shade}`;
      const tier = TIER_BY_SHADE[shade] ?? { word: "True", ending: "a dependable, versatile shade" };

      out.push(
        buildColor({
          id,
          name: `${tier.word} ${titleCase(familyKey)}`,
          hex,
          family,
          mood: shadeNum >= 600 ? ["moody"] : shadeNum <= 200 ? ["calm"] : ["energetic"],
          style: shadeNum <= 200 ? ["pastel"] : shadeNum >= 700 ? ["bold"] : ["modern"],
          collection: "tailwind",
          isPro: shadeNum % 200 === 0, // arbitrary placeholder gating, adjust later
          note: generateNote(familyKey, shade, familyIndex + shadeIndex),
        })
      );
    }
  }

  return out;
}

function main() {
  const colors = buildTailwindColors();
  const outDir = path.join(__dirname, "../data/colors");
  fs.mkdirSync(outDir, { recursive: true });

  const fileContents = `// AUTO-GENERATED by scripts/transformColors.ts — do not edit by hand.
import { Color } from "@/types/color";

export const tailwindColors: Color[] = ${JSON.stringify(colors, null, 2)};
`;

  fs.writeFileSync(path.join(outDir, "tailwind.ts"), fileContents);
  console.log(`Wrote ${colors.length} Tailwind colours to data/colors/tailwind.ts`);
}

main();
