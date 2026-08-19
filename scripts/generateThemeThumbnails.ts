// One-time generator: writes a 4-swatch SVG thumbnail per theme in
// data/themes/seed.ts to public/themes/<slug>.svg, so `thumbnail` points at
// a real file instead of a broken link until real design renders replace them.
// Run: npx tsx scripts/generateThemeThumbnails.ts
import fs from "fs";
import path from "path";
import { themesSeed } from "../data/themes/seed";

function svgFor(roles: { background: string; primary: string; secondary: string; accent: string }): string {
  return `<svg width="400" height="240" viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="240" fill="${roles.background}"/>
  <rect x="0" y="0" width="100" height="240" fill="${roles.primary}"/>
  <rect x="100" y="0" width="100" height="240" fill="${roles.secondary}"/>
  <rect x="200" y="0" width="100" height="240" fill="${roles.accent}"/>
</svg>
`;
}

function main() {
  const outDir = path.join(__dirname, "../public/themes");
  fs.mkdirSync(outDir, { recursive: true });

  for (const theme of themesSeed) {
    const svg = svgFor(theme.colorRoles);
    fs.writeFileSync(path.join(outDir, `${theme.slug}.svg`), svg);
  }

  console.log(`Wrote ${themesSeed.length} theme thumbnails to public/themes/`);
}

main();
