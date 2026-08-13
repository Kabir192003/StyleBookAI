/**
 * Generates the curated color library — the hand-named half of the color
 * wall (the other half is Tailwind's palette, see transformColors.ts).
 *
 * Every named hue below (Crimson, Sage, Cobalt, ...) gets the same
 * 20-step lightness/saturation ramp, so browsing one hue feels like
 * sliding a lightness control from near-white to near-black rather than
 * jumping between a handful of fixed swatches. Run once, output committed:
 *   npx tsx scripts/generateCuratedColors.ts
 */
import fs from "fs";
import path from "path";
import { buildColor } from "../lib/colors/colorUtils";
import { Color, ColorFamily, ColorMood, ColorStyle } from "../types/color";

type Hue = {
  name: string;
  family: ColorFamily;
  hue: number; // 0-360
  satBase: number; // 0-100, the hue's natural saturation ceiling
  personality: string; // one clause, no trailing period — used mid-sentence
};

// 84 named hues across every ColorFamily bucket. Hue degrees and base
// saturation are hand-picked, not derived — small overlaps between
// neighbors (e.g. Crimson/Ruby) are intentional, the way Tailwind's own
// red/rose/pink overlap.
const HUES: Hue[] = [
  // red
  { name: "Crimson", family: "red", hue: 350, satBase: 68, personality: "a deep, deliberate red that reads as conviction rather than alarm" },
  { name: "Scarlet", family: "red", hue: 5, satBase: 78, personality: "a brighter, hotter red built for moments that need urgency" },
  { name: "Cherry", family: "red", hue: 355, satBase: 72, personality: "glossy and a little sweet, the red of lacquer and candy shells" },
  { name: "Ruby", family: "red", hue: 345, satBase: 65, personality: "jewel-toned and a touch luxurious, red with weight behind it" },
  { name: "Brick", family: "red", hue: 10, satBase: 55, personality: "an earthbound red, more clay than fire" },
  { name: "Garnet", family: "red", hue: 340, satBase: 60, personality: "a wine-dark red that leans toward mystery" },
  { name: "Rosewood", family: "red", hue: 348, satBase: 45, personality: "red softened by brown, warm and grounded" },
  { name: "Vermilion", family: "red", hue: 12, satBase: 82, personality: "the hottest red on the wheel, halfway to orange and unapologetic" },
  { name: "Carmine", family: "red", hue: 352, satBase: 70, personality: "an old-world pigment red, formal and a little theatrical" },
  // orange
  { name: "Coral", family: "orange", hue: 16, satBase: 68, personality: "warm and a little playful, the colour of a sunset that hasn't faded yet" },
  { name: "Tangerine", family: "orange", hue: 28, satBase: 80, personality: "citrus-bright and confident, hard to ignore on a page" },
  { name: "Amber", family: "orange", hue: 38, satBase: 72, personality: "the colour of resin and late-afternoon light, warm without being loud" },
  { name: "Copper", family: "orange", hue: 24, satBase: 55, personality: "metallic-warm, an orange with weight and a little shine" },
  { name: "Terracotta", family: "orange", hue: 18, satBase: 48, personality: "sun-baked clay, an orange that reads as material rather than pigment" },
  { name: "Peach", family: "orange", hue: 22, satBase: 58, personality: "soft and fruit-toned, orange with its edges rounded off" },
  { name: "Marigold", family: "orange", hue: 42, satBase: 75, personality: "cheerful and saturated, an orange that leans toward festival rather than warning" },
  { name: "Rust", family: "orange", hue: 20, satBase: 50, personality: "oxidized and weathered, orange that's been outside a while" },
  { name: "Papaya", family: "orange", hue: 30, satBase: 65, personality: "tropical and a little sweet, an orange with fruit in its name for a reason" },
  // yellow
  { name: "Honey", family: "yellow", hue: 45, satBase: 65, personality: "warm and viscous-looking, yellow with amber undertones" },
  { name: "Mustard", family: "yellow", hue: 50, satBase: 55, personality: "an olive-leaning yellow that reads as vintage rather than bright" },
  { name: "Gold", family: "yellow", hue: 48, satBase: 70, personality: "a little metallic and a lot confident, yellow dressed up for the occasion" },
  { name: "Lemon", family: "yellow", hue: 55, satBase: 78, personality: "sharp and citrus-clean, the most purely 'yellow' yellow on the wheel" },
  { name: "Saffron", family: "yellow", hue: 42, satBase: 72, personality: "spiced and slightly orange, a yellow with a story attached" },
  { name: "Wheat", family: "yellow", hue: 46, satBase: 40, personality: "sun-dried and quiet, yellow that's mostly given way to neutral" },
  { name: "Butter", family: "yellow", hue: 52, satBase: 45, personality: "soft and rounded, a yellow built for comfort rather than attention" },
  { name: "Canary", family: "yellow", hue: 58, satBase: 82, personality: "high-voltage and unmistakable, the loudest yellow in the family" },
  // green
  { name: "Sage", family: "green", hue: 100, satBase: 30, personality: "quiet and grey-leaning, a green that reads as calm rather than growth" },
  { name: "Fern", family: "green", hue: 120, satBase: 45, personality: "a woodland green with real depth, neither bright nor dull" },
  { name: "Emerald", family: "green", hue: 150, satBase: 60, personality: "jewel-bright and a little luxurious, the most 'premium' green on the wheel" },
  { name: "Moss", family: "green", hue: 90, satBase: 35, personality: "damp and earthbound, green pulled toward brown" },
  { name: "Mint", family: "green", hue: 155, satBase: 40, personality: "cool and fresh, a green with a foot in blue" },
  { name: "Olive", family: "green", hue: 70, satBase: 35, personality: "muted and a little military, green tipped toward yellow" },
  { name: "Jade", family: "green", hue: 145, satBase: 50, personality: "polished and stone-like, a green that feels carved rather than grown" },
  { name: "Pine", family: "green", hue: 135, satBase: 42, personality: "deep and coniferous, a serious, all-weather green" },
  { name: "Basil", family: "green", hue: 110, satBase: 48, personality: "herbal and vivid, a green that smells like something" },
  // teal
  { name: "Teal", family: "teal", hue: 180, satBase: 55, personality: "balanced exactly between blue and green, neither cold nor warm" },
  { name: "Lagoon", family: "teal", hue: 175, satBase: 48, personality: "shallow-water bright, teal with a tropical lift" },
  { name: "Aqua", family: "teal", hue: 185, satBase: 60, personality: "clean and swimming-pool clear, the brightest teal here" },
  { name: "Seafoam", family: "teal", hue: 170, satBase: 32, personality: "pale and diffuse, teal thinned almost to mist" },
  { name: "Turquoise", family: "teal", hue: 178, satBase: 65, personality: "gem-toned and a little luxurious, teal with jewelry in mind" },
  { name: "Spruce", family: "teal", hue: 165, satBase: 38, personality: "dark and forested, teal pulled toward evergreen" },
  { name: "Marine", family: "teal", hue: 190, satBase: 45, personality: "deep-water serious, a teal built for depth rather than shallows" },
  // blue
  { name: "Sky", family: "blue", hue: 200, satBase: 55, personality: "open and unclouded, the most literal blue on the wheel" },
  { name: "Azure", family: "blue", hue: 210, satBase: 65, personality: "clear and saturated, a confident, cloudless blue" },
  { name: "Cobalt", family: "blue", hue: 220, satBase: 72, personality: "pigment-rich and a little electric, blue with real intensity" },
  { name: "Denim", family: "blue", hue: 215, satBase: 40, personality: "worn-in and textile-soft, blue that feels like fabric" },
  { name: "Sapphire", family: "blue", hue: 230, satBase: 68, personality: "jewel-toned and formal, a blue built for occasions" },
  { name: "Steel", family: "blue", hue: 205, satBase: 25, personality: "industrial and grey-leaning, blue stripped down to structure" },
  { name: "Navy", family: "blue", hue: 225, satBase: 50, personality: "dependable and a little nautical, the blue of uniforms and ink" },
  { name: "Periwinkle", family: "blue", hue: 235, satBase: 45, personality: "soft and violet-leaning, blue with a little whimsy in it" },
  { name: "Cerulean", family: "blue", hue: 195, satBase: 58, personality: "painterly and precise, the blue of clear afternoon sky in a landscape" },
  // purple
  { name: "Violet", family: "purple", hue: 270, satBase: 60, personality: "balanced between blue and red, purple in its most classic form" },
  { name: "Lavender", family: "purple", hue: 260, satBase: 30, personality: "soft and floral, purple thinned into something gentle" },
  { name: "Plum", family: "purple", hue: 285, satBase: 45, personality: "fruit-dark and a little dramatic, purple with real body to it" },
  { name: "Orchid", family: "purple", hue: 280, satBase: 55, personality: "delicate and a little exotic, purple leaning pink" },
  { name: "Amethyst", family: "purple", hue: 275, satBase: 50, personality: "gem-toned and luxurious, purple cut and polished" },
  { name: "Iris", family: "purple", hue: 265, satBase: 58, personality: "botanical and saturated, a purple with real presence" },
  { name: "Grape", family: "purple", hue: 290, satBase: 52, personality: "deep and fruit-toned, purple pulled toward red" },
  { name: "Mauve", family: "purple", hue: 255, satBase: 22, personality: "dusty and understated, purple that's given up most of its saturation" },
  // pink
  { name: "Rose", family: "pink", hue: 340, satBase: 50, personality: "classic and romantic, pink with a little red for warmth" },
  { name: "Magenta", family: "pink", hue: 320, satBase: 75, personality: "electric and unmissable, the boldest pink on the wheel" },
  { name: "Fuchsia", family: "pink", hue: 310, satBase: 70, personality: "hot and a little theatrical, pink pushed toward purple" },
  { name: "Bubblegum", family: "pink", hue: 330, satBase: 55, personality: "playful and confectionery, pink at its most literal" },
  { name: "Peony", family: "pink", hue: 335, satBase: 48, personality: "full and floral, pink with real softness in its center" },
  { name: "Salmon", family: "pink", hue: 8, satBase: 55, personality: "warm and a little coral, pink that's drifted toward orange" },
  { name: "Flamingo", family: "pink", hue: 325, satBase: 60, personality: "bright and tropical, pink built to stand out" },
  { name: "Berry", family: "pink", hue: 300, satBase: 45, personality: "dark and fruit-dense, pink pulled almost to purple" },
  // brown
  { name: "Umber", family: "brown", hue: 30, satBase: 32, personality: "a raw-pigment brown, earthy and unrefined" },
  { name: "Sienna", family: "brown", hue: 20, satBase: 40, personality: "warm and reddish, a brown with real fire underneath" },
  { name: "Mocha", family: "brown", hue: 25, satBase: 28, personality: "soft and coffee-toned, brown built for comfort" },
  { name: "Chestnut", family: "brown", hue: 15, satBase: 35, personality: "rich and reddish-dark, the brown of polished wood" },
  { name: "Walnut", family: "brown", hue: 28, satBase: 25, personality: "deep and furniture-toned, a serious, grounded brown" },
  { name: "Cocoa", family: "brown", hue: 22, satBase: 30, personality: "warm and a little sweet, brown with dessert in mind" },
  { name: "Espresso", family: "brown", hue: 18, satBase: 22, personality: "dark and roasted, brown pushed almost to black" },
  { name: "Camel", family: "brown", hue: 35, satBase: 38, personality: "warm and textile-soft, the brown of coats and upholstery" },
  { name: "Sand", family: "brown", hue: 40, satBase: 28, personality: "pale and mineral, brown thinned toward beige" },
  // neutral
  { name: "Fog", family: "neutral", hue: 210, satBase: 6, personality: "cool and diffuse, grey with barely a hint of blue" },
  { name: "Ash", family: "neutral", hue: 30, satBase: 5, personality: "warm and soft, grey with a whisper of brown" },
  { name: "Stone", family: "neutral", hue: 40, satBase: 7, personality: "mineral and dependable, the most literal neutral here" },
  { name: "Charcoal", family: "neutral", hue: 220, satBase: 8, personality: "dark and cool, a grey built for serious UI" },
  { name: "Pearl", family: "neutral", hue: 45, satBase: 4, personality: "faintly luminous, a warm-white neutral" },
  { name: "Graphite", family: "neutral", hue: 210, satBase: 9, personality: "dense and cool, grey with real weight" },
  { name: "Linen", family: "neutral", hue: 35, satBase: 6, personality: "textile-soft and warm, the neutral of unbleached fabric" },
  { name: "Ivory", family: "neutral", hue: 50, satBase: 5, personality: "warm and gentle, a neutral that's almost but not quite white" },
];

// The 20-step ramp every hue is run through — a lightness/saturation
// curve plus fixed mood/style/note vocabulary per step, so the same tier
// index means the same thing across every hue (Whisper is always the
// palest, Midnight always the darkest).
type Tier = {
  word: string;
  l: number; // target lightness 0-100
  satMul: number; // multiplier applied to the hue's satBase
  mood: ColorMood[];
  style: ColorStyle[];
  isPro: boolean;
  noteEnding: string;
};

const TIERS: Tier[] = [
  { word: "Whisper", l: 97, satMul: 0.08, mood: ["calm"], style: ["pastel"], isPro: false, noteEnding: "so faint it nearly disappears into the page" },
  { word: "Ghost", l: 94, satMul: 0.12, mood: ["calm"], style: ["pastel"], isPro: false, noteEnding: "barely there, a hint of colour and nothing more" },
  { word: "Pale", l: 90, satMul: 0.18, mood: ["calm"], style: ["pastel"], isPro: false, noteEnding: "soft enough to sit behind content without competing with it" },
  { word: "Soft", l: 85, satMul: 0.28, mood: ["calm"], style: ["pastel"], isPro: false, noteEnding: "gentle and easy on the eye, good for large surfaces" },
  { word: "Blush", l: 79, satMul: 0.38, mood: ["calm", "playful"], style: ["pastel"], isPro: false, noteEnding: "warm with the faintest flush of colour" },
  { word: "Pastel", l: 73, satMul: 0.45, mood: ["calm", "playful"], style: ["pastel"], isPro: false, noteEnding: "light and a little sweet, works best with a confident accent nearby" },
  { word: "Light", l: 66, satMul: 0.55, mood: [], style: ["modern"], isPro: false, noteEnding: "clear and approachable, sits comfortably as a secondary tone" },
  { word: "Fair", l: 60, satMul: 0.65, mood: [], style: ["modern"], isPro: false, noteEnding: "even-toned and easygoing, a dependable background choice" },
  { word: "True", l: 54, satMul: 0.85, mood: [], style: ["modern"], isPro: false, noteEnding: "the colour in its truest, most balanced form" },
  { word: "Vivid", l: 50, satMul: 1.0, mood: ["energetic"], style: ["neon"], isPro: true, noteEnding: "turned all the way up — use it sparingly and let it do the talking" },
  { word: "Bright", l: 47, satMul: 0.95, mood: ["energetic"], style: ["neon"], isPro: false, noteEnding: "punchy and high-energy, hard to look away from" },
  { word: "Bold", l: 43, satMul: 0.9, mood: ["energetic"], style: ["bold"], isPro: false, noteEnding: "confident and saturated, built to anchor a single focal point" },
  { word: "Rich", l: 37, satMul: 0.85, mood: [], style: ["bold"], isPro: true, noteEnding: "deep and full-bodied, reads as premium rather than loud" },
  { word: "Deep", l: 30, satMul: 0.75, mood: ["moody"], style: ["bold"], isPro: true, noteEnding: "dark and weighty, good for grounding a palette" },
  { word: "Dusky", l: 42, satMul: 0.35, mood: ["moody"], style: ["muted"], isPro: false, noteEnding: "the saturation pulled back until it feels a little worn-in" },
  { word: "Smoky", l: 36, satMul: 0.28, mood: ["moody"], style: ["muted"], isPro: false, noteEnding: "muted almost to grey, sophisticated rather than dull" },
  { word: "Muted", l: 48, satMul: 0.22, mood: [], style: ["muted"], isPro: false, noteEnding: "quiet and understated, easy to live with at scale" },
  { word: "Dusty", l: 55, satMul: 0.18, mood: [], style: ["muted"], isPro: false, noteEnding: "soft-spoken and a little faded, like weathered fabric" },
  { word: "Shadow", l: 20, satMul: 0.4, mood: ["moody"], style: ["bold"], isPro: false, noteEnding: "dark and a little moody, sits closer to black than to its own family" },
  { word: "Midnight", l: 11, satMul: 0.3, mood: ["moody"], style: ["bold"], isPro: true, noteEnding: "as dark as the family gets, nearly swallowed by black" },
];

// Families that read as warm vs cool — layered onto every tier's mood
// list (neutral gets neither; brown gets "earthy" instead of "warm").
const TEMPERATURE: Partial<Record<ColorFamily, ColorMood>> = {
  red: "warm",
  orange: "warm",
  yellow: "warm",
  pink: "warm",
  brown: "earthy",
  green: "cool",
  teal: "cool",
  blue: "cool",
  purple: "cool",
};

const LUXE_TIERS = new Set(["Rich", "Deep", "Midnight"]);
const LUXE_FAMILIES = new Set<ColorFamily>(["purple", "red", "brown"]);

/**
 * Note copy — see buildNote() below.
 *
 * The first version of this file glued the hue's `personality` onto every
 * one of its 20 tiers verbatim, which a UX review caught twice over: every
 * Scarlet in the library opened with the identical clause, *and* the clause
 * was often flatly untrue of the swatch it sat under — "Whisper Crimson is
 * a deep, deliberate red" describes a near-white tint as if it were the
 * darkest step on the ramp. A `personality` written for a hue at full
 * strength only holds around the middle of the ramp, so it's now used only
 * there; the pale, saturated, muted, and dark bands get sentences written
 * for what those steps actually look like.
 */
type TierBand = "tint" | "mid" | "saturated" | "muted" | "dark";

const BAND_BY_TIER: Record<string, TierBand> = {
  Whisper: "tint",
  Ghost: "tint",
  Pale: "tint",
  Soft: "tint",
  Blush: "tint",
  Pastel: "tint",
  Light: "mid",
  Fair: "mid",
  True: "mid",
  Vivid: "saturated",
  Bright: "saturated",
  Bold: "saturated",
  Dusky: "muted",
  Smoky: "muted",
  Muted: "muted",
  Dusty: "muted",
  Rich: "dark",
  Deep: "dark",
  Shadow: "dark",
  Midnight: "dark",
};

/**
 * Sentence shapes per band. Several per band, rotated by (hue + tier)
 * index, so two swatches a user is likely to see side by side — adjacent
 * tiers of one hue, or the same tier across neighbouring hues — don't open
 * the same way. `%NAME%`, `%HUE%`, `%PERSONALITY%` and `%ENDING%` are
 * substituted; `%ENDING%` is the tier's own clause, which already varies.
 */
const NOTE_TEMPLATES: Record<TierBand, string[]> = {
  tint: [
    "%NAME% holds just a trace of %HUE% — %ENDING%.",
    "%NAME% is %HUE% thinned almost to paper: %ENDING%.",
    "Almost more paper than %HUE% — %NAME% is %ENDING%.",
  ],
  mid: [
    "%NAME% is %PERSONALITY% — %ENDING%.",
    "%NAME%: %PERSONALITY%. At this step it's %ENDING%.",
    "This is %HUE% at working strength — %PERSONALITY% — %ENDING%.",
  ],
  saturated: [
    "%NAME% runs %HUE% close to full strength — %ENDING%.",
    "%NAME% is %PERSONALITY%, dialled up until it's %ENDING%.",
    "%HUE% with nothing held back: %NAME% is %ENDING%.",
  ],
  muted: [
    "%NAME% is %HUE% with the volume turned down — %ENDING%.",
    "The %HUE% is still there in %NAME%, just softened: %ENDING%.",
    "%NAME% trades saturation for restraint — %ENDING%.",
  ],
  dark: [
    "%NAME% takes %HUE% down into the dark — %ENDING%.",
    "%NAME% is %HUE% at its heaviest: %ENDING%.",
    "Deep in the %HUE% range, %NAME% is %ENDING%.",
  ],
};

function buildNote(hueDef: Hue, tier: Tier, name: string, rotation: number): string {
  const band = BAND_BY_TIER[tier.word] ?? "mid";
  const templates = NOTE_TEMPLATES[band];
  return templates[rotation % templates.length]
    .replace("%NAME%", name)
    .replace("%HUE%", hueDef.name.toLowerCase())
    .replace("%PERSONALITY%", hueDef.personality)
    .replace("%ENDING%", tier.noteEnding);
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (n: number) =>
    Math.round(f(n) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(0)}${toHex(8)}${toHex(4)}`;
}

function buildCuratedColors(): Color[] {
  const out: Color[] = [];

  for (const [hueIndex, hueDef] of HUES.entries()) {
    for (const [tierIndex, tier] of TIERS.entries()) {
      const sat = Math.max(2, Math.min(95, Math.round(hueDef.satBase * tier.satMul)));
      const hex = hslToHex(hueDef.hue, sat, tier.l);

      const mood: ColorMood[] = [...tier.mood];
      const temp = TEMPERATURE[hueDef.family];
      if (temp) mood.push(temp);
      if (LUXE_TIERS.has(tier.word) && LUXE_FAMILIES.has(hueDef.family)) mood.push("luxurious");

      const style: ColorStyle[] = hueDef.family === "neutral" && tier.l >= 40 ? ["minimal"] : [...tier.style];

      const name = tier.word === "True" ? hueDef.name : `${tier.word} ${hueDef.name}`;
      const id = `curated-${slugify(hueDef.name)}-${slugify(tier.word)}`;

      out.push(
        buildColor({
          id,
          name,
          hex,
          family: hueDef.family,
          mood: Array.from(new Set(mood)),
          style: Array.from(new Set(style)),
          collection: "curated",
          isPro: tier.isPro,
          note: buildNote(hueDef, tier, name, hueIndex + tierIndex),
        })
      );
    }
  }

  return out;
}

function main() {
  const colors = buildCuratedColors();
  const outDir = path.join(__dirname, "../data/colors");
  fs.mkdirSync(outDir, { recursive: true });

  // 1680 inline object literals blows past TypeScript's union-complexity
  // limit when checked against Color[] element-by-element (TS2590) — the
  // Tailwind file stays a literal array since 297 entries is fine, but at
  // this size the data has to come in as an opaque JSON string, parsed and
  // cast once, so the type checker never inspects each literal.
  const fileContents = `// AUTO-GENERATED by scripts/generateCuratedColors.ts — do not edit by hand.
import { Color } from "@/types/color";

// Kept as JSON.parse of a string (not a literal array) — a literal array
// this large trips "TS2590: Expression produces a union type that is too
// complex to represent" when checked against Color[].
export const curatedColors = JSON.parse(${JSON.stringify(JSON.stringify(colors))}) as Color[];
`;

  fs.writeFileSync(path.join(outDir, "curated.ts"), fileContents);
  console.log(`Wrote ${colors.length} curated colours (${HUES.length} hues x ${TIERS.length} tiers) to data/colors/curated.ts`);
}

main();
