/**
 * Where the playground's swatch and font trays get their contents from
 * (docs/DESIGN_PLAYGROUND.md §3, §5).
 *
 * Tray identity is derived from the *value*, never from a counter or a
 * random id: `store/playgroundStore.ts`'s `addSwatches`/`addFonts` de-dupe on
 * `id`, so `#222D52` arriving from the generated system, then again from a
 * paste, then again from the custom picker has to collapse to one chip. A
 * counter-based id would put three identical navy squares in the tray and
 * make the "already in your tray" message in the import dialog a lie.
 */
import type { StudioExportTokens } from "@/lib/studio/exportCode";
import type { PlaygroundFont, PlaygroundSwatch } from "./types";

/** `#222d52` and `#222D52` are the same swatch. */
export function swatchId(hex: string): string {
  return `sw-${hex.trim().toUpperCase()}`;
}

export function fontId(family: string): string {
  return `fnt-${family.trim().toLowerCase().replace(/\s+/g, "-")}`;
}

export function makeSwatch(hex: string, name: string, origin: PlaygroundSwatch["origin"]): PlaygroundSwatch {
  const normalised = hex.trim().toUpperCase();
  return { id: swatchId(normalised), hex: normalised, name, origin };
}

export function makeFont(family: string, category: string, origin: PlaygroundFont["origin"]): PlaygroundFont {
  return { id: fontId(family), family, category, origin };
}

/**
 * The colours of the system the experiments are overriding: the five palette
 * slots, plus whatever distinct role colours the design system carries on top
 * of them (an AI-generated system's `border` and `textMuted` are frequently
 * not any of the five).
 *
 * Ordered palette-first because that is the order a user thinks about their
 * own brand in; the derived role colours are the tail.
 */
export function systemSwatches(base: StudioExportTokens): PlaygroundSwatch[] {
  const named: Array<[string, string]> = [
    [base.light.accent, "Accent"],
    [base.light.support, "Support"],
    [base.light.surface, "Surface"],
    [base.light.ink, "Ink"],
    [base.light.muted, "Muted"],
  ];

  const roles = base.designSystem?.light.colorRoles;
  if (roles) {
    named.push(
      [roles.background, "Background"],
      [roles.surface, "Surface role"],
      [roles.text, "Text"],
      [roles.textMuted, "Text muted"],
      [roles.border, "Border"]
    );
  }

  const seen = new Set<string>();
  const swatches: PlaygroundSwatch[] = [];
  named.forEach(([hex, name]) => {
    // Guard the shape as well as the duplicate: `colorRoles` comes from a
    // model response on the AI path, and a non-hex value there would render
    // as an invisible chip rather than an obvious error.
    if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    const key = hex.toUpperCase();
    if (seen.has(key)) return;
    seen.add(key);
    swatches.push(makeSwatch(key, name, "system"));
  });
  return swatches;
}

/** The faces the base system already uses, so the font tray is never empty. */
export function systemFonts(base: StudioExportTokens, categoryOf: (family: string) => string): PlaygroundFont[] {
  const families = [base.headFont, base.bodyFont, base.accentFont].filter((f): f is string => Boolean(f));
  const seen = new Set<string>();
  return families.reduce<PlaygroundFont[]>((acc, family) => {
    const key = family.toLowerCase();
    if (seen.has(key)) return acc;
    seen.add(key);
    acc.push(makeFont(family, categoryOf(family), "system"));
    return acc;
  }, []);
}
