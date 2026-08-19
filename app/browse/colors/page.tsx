import { allColors } from "@/data/colors";
import { ColorGrid } from "@/components/colors/ColorGrid";

export default function BrowseColorsPage() {
  return <ColorGrid colors={allColors} />;
}
