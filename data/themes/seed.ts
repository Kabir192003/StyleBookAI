/**
 * Real, hand-curated theme seed set — one theme per ThemeCategory, composed
 * entirely from real entries in data/colors and data/fonts (never invented
 * hex codes or font names), mirroring the pattern used elsewhere in data/.
 * `thumbnail` points at a generated swatch SVG in public/themes/ — see
 * scripts/generateThemeThumbnails.ts.
 */
import { allColors } from "@/data/colors";
import { allFonts } from "@/data/fonts";
import { Theme, ThemeCategory } from "@/types/theme";
import { generateTypeScale } from "@/lib/typeScale/generateTypeScale";

function color(id: string) {
  const found = allColors.find((c) => c.id === id);
  if (!found) throw new Error(`data/themes/seed.ts: unknown color id "${id}"`);
  return found;
}

function font(id: string) {
  const found = allFonts.find((f) => f.id === id);
  if (!found) throw new Error(`data/themes/seed.ts: unknown font id "${id}"`);
  return found;
}

type ThemeSeedInput = {
  slug: string;
  name: string;
  category: ThemeCategory;
  tags: string[];
  description: string;
  colorIds: string[];
  colorRoles: Theme["colorRoles"];
  primaryFontId: string;
  secondaryFontId: string;
  accentFontId?: string;
  baseSize?: number;
  ratioName?: string;
  isPro?: boolean;
};

function buildTheme(input: ThemeSeedInput): Theme {
  return {
    id: `theme-${input.slug}`,
    slug: input.slug,
    name: input.name,
    category: input.category,
    tags: input.tags,
    description: input.description,
    colors: input.colorIds.map(color),
    colorRoles: input.colorRoles,
    primaryFont: font(input.primaryFontId),
    secondaryFont: font(input.secondaryFontId),
    accentFont: input.accentFontId ? font(input.accentFontId) : undefined,
    typeScale: generateTypeScale(input.baseSize ?? 16, input.ratioName ?? "Major Third"),
    isPro: input.isPro ?? false,
    thumbnail: `/themes/${input.slug}.svg`,
  };
}

export const themesSeed: Theme[] = [
  buildTheme({
    slug: "quiet-minimal",
    name: "Quiet Minimal",
    category: "minimal",
    tags: ["clean", "neutral", "saas"],
    description: "A restrained slate-and-white system for interfaces that want the content to do the talking.",
    colorIds: ["tw-slate-900", "tw-slate-500", "tw-slate-200", "tw-slate-50"],
    colorRoles: {
      primary: "#0f172a",
      secondary: "#64748b",
      accent: "#3b82f6",
      background: "#ffffff",
      surface: "#f8fafc",
      text: "#0f172a",
      textMuted: "#64748b",
    },
    primaryFontId: "inter",
    secondaryFontId: "ibm-plex-sans",
    ratioName: "Minor Third",
  }),
  buildTheme({
    slug: "signal-bold",
    name: "Signal Bold",
    category: "bold",
    tags: ["confident", "high-contrast", "cta-driven"],
    description: "Near-black paired with a hot rose accent — built to demand a click, not to be ignored.",
    colorIds: ["tw-slate-900", "tw-rose-500", "tw-rose-600", "tw-slate-50"],
    colorRoles: {
      primary: "#0f172a",
      secondary: "#334155",
      accent: "#f43f5e",
      background: "#ffffff",
      surface: "#f1f5f9",
      text: "#0f172a",
      textMuted: "#475569",
    },
    primaryFontId: "archivo",
    secondaryFontId: "work-sans",
    accentFontId: "bebas-neue",
    ratioName: "Perfect Fourth",
  }),
  buildTheme({
    slug: "gilded-velvet",
    name: "Gilded Velvet",
    category: "luxury",
    tags: ["premium", "editorial", "fashion"],
    description: "Deep violet and warm amber gold on near-black — the register of a fashion house, not a startup.",
    colorIds: ["tw-violet-900", "tw-violet-600", "tw-amber-400", "tw-slate-950"],
    colorRoles: {
      primary: "#4c1d95",
      secondary: "#7c3aed",
      accent: "#fbbf24",
      background: "#020617",
      surface: "#1e293b",
      text: "#f8fafc",
      textMuted: "#a78bfa",
    },
    primaryFontId: "playfair-display",
    secondaryFontId: "ibm-plex-sans",
    ratioName: "Golden Ratio",
    isPro: true,
  }),
  buildTheme({
    slug: "sunshine-play",
    name: "Sunshine Play",
    category: "playful",
    tags: ["kids", "friendly", "energetic"],
    description: "Amber, pink, and lime together — built for a brand that doesn't take itself too seriously.",
    colorIds: ["tw-amber-400", "tw-pink-400", "tw-lime-400", "tw-amber-50"],
    colorRoles: {
      primary: "#fbbf24",
      secondary: "#f472b6",
      accent: "#a3e635",
      background: "#fffbeb",
      surface: "#ffffff",
      text: "#78350f",
      textMuted: "#d97706",
    },
    primaryFontId: "poppins",
    secondaryFontId: "nunito",
    accentFontId: "caveat",
    ratioName: "Major Second",
  }),
  buildTheme({
    slug: "clay-and-fern",
    name: "Clay & Fern",
    category: "earthy",
    tags: ["natural", "warm", "wellness"],
    description: "Warm stone neutrals grounded with emerald and amber — feels grown, not manufactured.",
    colorIds: ["tw-stone-700", "tw-emerald-700", "tw-amber-600", "tw-stone-50"],
    colorRoles: {
      primary: "#44403c",
      secondary: "#047857",
      accent: "#d97706",
      background: "#fafaf9",
      surface: "#f5f5f4",
      text: "#292524",
      textMuted: "#78716c",
    },
    primaryFontId: "lora",
    secondaryFontId: "work-sans",
    ratioName: "Minor Third",
  }),
  buildTheme({
    slug: "night-terminal",
    name: "Night Terminal",
    category: "tech",
    tags: ["dev-tool", "dark-mode", "product"],
    description: "Near-black with sky and emerald signal colors — the palette of a dashboard you trust at 2am.",
    colorIds: ["tw-slate-950", "tw-sky-500", "tw-emerald-500", "tw-slate-800"],
    colorRoles: {
      primary: "#0ea5e9",
      secondary: "#10b981",
      accent: "#38bdf8",
      background: "#020617",
      surface: "#1e293b",
      text: "#f8fafc",
      textMuted: "#94a3b8",
    },
    primaryFontId: "space-grotesk",
    secondaryFontId: "ibm-plex-sans",
    accentFontId: "jetbrains-mono",
    ratioName: "Perfect Fourth",
  }),
  buildTheme({
    slug: "quiet-elegance",
    name: "Quiet Elegance",
    category: "elegant",
    tags: ["refined", "hospitality", "muted"],
    description: "Muted stone and dusty rose — quietly expensive rather than loudly luxurious.",
    colorIds: ["tw-stone-800", "tw-rose-400", "tw-stone-200", "tw-stone-50"],
    colorRoles: {
      primary: "#292524",
      secondary: "#fb7185",
      accent: "#a8a29e",
      background: "#fafaf9",
      surface: "#f5f5f4",
      text: "#1c1917",
      textMuted: "#78716c",
    },
    primaryFontId: "cormorant-garamond",
    secondaryFontId: "manrope",
    ratioName: "Perfect Fifth",
  }),
  buildTheme({
    slug: "diner-retro",
    name: "Diner Retro",
    category: "retro",
    tags: ["nostalgic", "70s", "signage"],
    description: "Burnt orange, teal, and mustard yellow — a palette straight off a 1970s diner menu.",
    colorIds: ["tw-orange-600", "tw-teal-600", "tw-yellow-400", "tw-orange-50"],
    colorRoles: {
      primary: "#ea580c",
      secondary: "#0d9488",
      accent: "#facc15",
      background: "#fff7ed",
      surface: "#ffedd5",
      text: "#7c2d12",
      textMuted: "#c2410c",
    },
    primaryFontId: "bebas-neue",
    secondaryFontId: "roboto-slab",
    ratioName: "Major Third",
  }),
  buildTheme({
    slug: "afterhours-neon",
    name: "Afterhours Neon",
    category: "neon",
    tags: ["nightlife", "loud", "digital"],
    description: "Fuchsia and cyan burning against near-black — built for a screen in a dark room.",
    colorIds: ["tw-slate-950", "tw-fuchsia-500", "tw-cyan-400", "tw-fuchsia-600"],
    colorRoles: {
      primary: "#d946ef",
      secondary: "#22d3ee",
      accent: "#c026d3",
      background: "#020617",
      surface: "#18181b",
      text: "#fafafa",
      textMuted: "#a78bfa",
    },
    primaryFontId: "unbounded",
    secondaryFontId: "inter",
    accentFontId: "space-mono",
    ratioName: "Augmented Fourth",
  }),
  buildTheme({
    slug: "salt-air",
    name: "Salt Air",
    category: "coastal",
    tags: ["beach", "airy", "travel"],
    description: "Sky blue and teal over warm sand neutrals — open water on a clear day.",
    colorIds: ["tw-sky-500", "tw-teal-400", "tw-stone-100", "tw-sky-50"],
    colorRoles: {
      primary: "#0ea5e9",
      secondary: "#2dd4bf",
      accent: "#f59e0b",
      background: "#f0fdfa",
      surface: "#ffffff",
      text: "#134e4a",
      textMuted: "#0d9488",
    },
    primaryFontId: "dm-sans",
    secondaryFontId: "lora",
    ratioName: "Minor Third",
  }),
  buildTheme({
    slug: "broadsheet",
    name: "Broadsheet",
    category: "editorial",
    tags: ["magazine", "long-form", "print-inspired"],
    description: "High-contrast ink-on-paper neutrals with a single crimson accent — reads like a printed masthead.",
    colorIds: ["tw-slate-900", "tw-rose-600", "tw-slate-100", "tw-slate-50"],
    colorRoles: {
      primary: "#0f172a",
      secondary: "#e11d48",
      accent: "#e11d48",
      background: "#fafaf9",
      surface: "#f1f5f9",
      text: "#0f172a",
      textMuted: "#475569",
    },
    primaryFontId: "fraunces",
    secondaryFontId: "source-serif-4",
    ratioName: "Perfect Fifth",
  }),
  buildTheme({
    slug: "raw-concrete",
    name: "Raw Concrete",
    category: "brutalist",
    tags: ["stark", "structural", "unpolished"],
    description: "Flat black, white, and a single warning-yellow accent — function over polish, on purpose.",
    colorIds: ["tw-zinc-950", "tw-yellow-400", "tw-zinc-100", "tw-zinc-50"],
    colorRoles: {
      primary: "#09090b",
      secondary: "#27272a",
      accent: "#facc15",
      background: "#fafafa",
      surface: "#f4f4f5",
      text: "#09090b",
      textMuted: "#52525b",
    },
    primaryFontId: "roboto",
    secondaryFontId: "roboto-slab",
    accentFontId: "space-mono",
    ratioName: "Perfect Fourth",
  }),
];
