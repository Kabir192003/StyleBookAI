/**
 * /browse/colors — Color Library
 *
 * Spec: docs/PRODUCT_AND_UX.md §2 (Browse libraries)
 * Ported from Dhanshri's Lovable design ("Design Browse Hub") into real
 * data and this repo's conventions — see docs/CONTEXT.md.
 */
import { allColors } from "@/data/colors";
import { ColorGrid } from "@/components/colors/ColorGrid";

export default function BrowseColorsPage() {
  return <ColorGrid colors={allColors} />;
}
