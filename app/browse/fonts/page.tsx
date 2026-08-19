import { allFonts } from "@/data/fonts";
import { FontGrid } from "@/components/fonts/FontGrid";

export default function BrowseFontsPage() {
  return <FontGrid fonts={allFonts} />;
}
