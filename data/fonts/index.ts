import { Font } from "@/types/font";
import { fontsSeed } from "./seed";
import { googleFonts } from "./google";

// fontsSeed is hand-curated (real pairing data, bespoke notes) — those
// entries win over the auto-generated googleFonts set wherever the same
// real font appears in both, so we don't ship a worse duplicate.
const seedFamilies = new Set(fontsSeed.map((f) => f.family.toLowerCase()));
const dedupedGoogleFonts = googleFonts.filter((f) => !seedFamilies.has(f.family.toLowerCase()));

export const allFonts: Font[] = [...fontsSeed, ...dedupedGoogleFonts];
