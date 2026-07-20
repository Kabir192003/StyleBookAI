/**
 * /browse/fonts — Font Library
 *
 * Spec: docs/PRODUCT_AND_UX.md §2 (Browse libraries)
 * Ported from Dhanshri's Lovable design ("Design Browse Hub") into real
 * data and this repo's conventions — see docs/CONTEXT.md.
 */
import { allFonts } from "@/data/fonts";
import { FontGrid } from "@/components/fonts/FontGrid";

export default function BrowseFontsPage() {
  return <FontGrid fonts={allFonts} />;
}
