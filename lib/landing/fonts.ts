/**
 * Curated typeface family used only by the landing page's typography
 * moments (hero word-morph, the "Style changes everything." scene). Kept
 * separate from any future app-wide font system so swapping the landing
 * page's type personalities never touches product UI typography.
 */
import {
  Sora,
  Fraunces,
  Archivo,
  Inter,
  Unbounded,
  IBM_Plex_Mono,
} from "next/font/google";

export const geometricSans = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-geometric-sans",
  display: "swap",
});

export const editorialSerif = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-editorial-serif",
  display: "swap",
});

export const grotesk = Archivo({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-grotesk",
  display: "swap",
});

export const humanistSans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-humanist-sans",
  display: "swap",
});

export const expressiveDisplay = Unbounded({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-expressive-display",
  display: "swap",
});

// Used for URL bars, token values, hex codes — the "engineering" voice.
export const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-plex",
  display: "swap",
});

export const landingFontVariables = [
  geometricSans.variable,
  editorialSerif.variable,
  grotesk.variable,
  humanistSans.variable,
  expressiveDisplay.variable,
  monoFont.variable,
].join(" ");

// Order matters: this is the cycle used by the hero's type-morph word and
// the typography scene's phrase transformation.
export const typePersonalities = [
  { label: "Geometric", className: "font-geometric-sans" },
  { label: "Editorial", className: "font-editorial-serif italic" },
  { label: "Grotesk", className: "font-grotesk" },
  { label: "Humanist", className: "font-humanist-sans" },
  { label: "Expressive", className: "font-expressive-display" },
] as const;
