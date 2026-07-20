import { Font } from "@/types/font";
import { fontsSeed } from "./seed";

// As more collections are added (a full Google Fonts transform once
// GOOGLE_FONTS_API_KEY is set, additional curated sets), import and spread
// them here — same pattern as data/colors/index.ts.
export const allFonts: Font[] = [...fontsSeed];
