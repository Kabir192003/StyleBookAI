/**
 * /browse/themes — Theme Gallery
 *
 * Spec: docs/PRODUCT_AND_UX.md §2 (Browse libraries)
 * Ported from Dhanshri's Lovable design ("Design Browse Hub") into real
 * data and this repo's conventions — see docs/CONTEXT.md.
 */
import { allThemes } from "@/data/themes";
import { ThemeGrid } from "@/components/themes/ThemeGrid";

export default function BrowseThemesPage() {
  return <ThemeGrid themes={allThemes} />;
}
