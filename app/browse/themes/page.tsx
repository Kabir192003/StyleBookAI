import { allThemes } from "@/data/themes";
import { ThemeGrid } from "@/components/themes/ThemeGrid";

export default function BrowseThemesPage() {
  return <ThemeGrid themes={allThemes} />;
}
