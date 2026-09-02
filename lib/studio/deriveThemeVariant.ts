// Derives a full ThemeVariantTokens from Studio's 5-token palette:
//   background/surface -> surface, text -> ink, textMuted -> muted,
//   border -> ink mixed 12% into surface, button -> accent, buttonSecondary -> support
import { PaletteTokens } from "./exportCode";
import { ComponentTokenSet, ComponentTokens, DesignSystem, ThemeVariantTokens } from "@/types/designSystem";
import { getContrastRatio } from "@/lib/colors/colorUtils";
import {
  AA_LARGE_TEXT,
  AA_NORMAL_TEXT,
  ensureContrast,
  fromHsl,
  hueOf,
  lightnessOf,
  normalizeHex,
  readableInkOn,
  saturationOf,
} from "@/lib/colors/contrast";
import {
  BrandPalette,
  adaptAccentForDark,
  brandRampHue,
  deriveDarkPaletteFromLight,
  deriveDarkSurfaceRamp,
  liftForDarkState,
} from "@/lib/colors/deriveDarkPalette";

function onColor(hex: string): string {
  return getContrastRatio(hex, "#FBF8F2") >= getContrastRatio(hex, "#141110") ? "#FBF8F2" : "#141110";
}

// Blends `mixHex` into `baseHex` at `amount` (0-1) — a plain hex mix, the
// data-side equivalent of the CSS `color-mix()` calls used elsewhere in
// Studio's live preview (border tones, muted overlays), since a saved
// design-system value has to be a real hex, not a CSS function. Exported so
// roleProperties.ts can derive a border the same way, live, without a second
// implementation of the same blend.
export function mix(baseHex: string, mixHex: string, amount: number): string {
  const b = parseInt(baseHex.replace("#", ""), 16);
  const m = parseInt(mixHex.replace("#", ""), 16);
  const channel = (shift: number) => {
    const bc = (b >> shift) & 255;
    const mc = (m >> shift) & 255;
    return Math.round(bc + (mc - bc) * amount);
  };
  const r = channel(16);
  const g = channel(8);
  const bch = channel(0);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bch).toString(16).slice(1)}`;
}

// Every `ComponentName` gets a token set, not just the two buttons — a canvas
// whose inspector opens on whatever the user clicks needs all ten to have
// something to edit. The neutral components (input, card, table, modal,
// dropdown, navigation) derive from surface/ink/border rather than the brand
// colours, because that's what they actually are; the dark-variant derivation
// downstream keys off exactly that distinction (see BRAND_FILL_SATURATION
// below) to decide which fills keep their hue into dark mode.
export function deriveThemeVariantFromPalette(palette: PaletteTokens): ThemeVariantTokens {
  const border = mix(palette.surface, palette.ink, 0.12);
  const neutral = { background: palette.surface, text: palette.ink, border };

  return {
    colorRoles: {
      background: palette.surface,
      surface: palette.surface,
      text: palette.ink,
      textMuted: palette.muted,
      border,
    },
    components: {
      button: { background: palette.accent, text: onColor(palette.accent) },
      buttonSecondary: { background: palette.support, text: onColor(palette.support) },
      input: neutral,
      dropdown: neutral,
      card: neutral,
      modal: neutral,
      navigation: neutral,
      table: { background: mix(palette.surface, palette.ink, 0.04), text: palette.ink, border },
      alert: { background: mix(palette.surface, palette.support, 0.12), text: palette.ink, border },
      badge: { background: palette.support, text: onColor(palette.support) },
    },
  };
}

// --- Dark-variant derivation ---
// Everything below derives dark mode deterministically from *this brand's*
// light tokens, so there's no code path that falls back to a stock dark
// palette. The colour maths lives in lib/colors/deriveDarkPalette.ts; this
// file does the ThemeVariantTokens-shaped plumbing (component sets and states).

// Above this saturation a component background is a deliberate brand fill
// (a button, a badge) and must keep its hue into dark mode. Below it, it is
// a neutral surface (a card, an input) and belongs on the dark surface ramp.
const BRAND_FILL_SATURATION = 0.18;

export function brandPaletteFromThemeVariant(light: ThemeVariantTokens): BrandPalette {
  return {
    // The button fill is the closest thing a ThemeVariantTokens has to an
    // accent — deriveThemeVariantFromPalette() above puts the accent exactly
    // there, so this round-trips cleanly for Studio-authored systems.
    accent: light.components.button?.background ?? light.colorRoles.text,
    support: light.components.buttonSecondary?.background ?? light.components.badge?.background ?? light.colorRoles.border,
    surface: light.colorRoles.surface,
    ink: light.colorRoles.text,
    muted: light.colorRoles.textMuted,
  };
}

function darkComponentBackground(lightBackground: string, palette: BrandPalette, darkSurface: string): string {
  const saturation = saturationOf(lightBackground);
  const lightness = lightnessOf(lightBackground);

  // A brand fill keeps its identity: same hue, re-lit for a dark page.
  if (saturation >= BRAND_FILL_SATURATION && lightness > 0.08 && lightness < 0.92) {
    return adaptAccentForDark(lightBackground, darkSurface);
  }

  // A neutral surface becomes an *elevated* dark surface. Elevation is taken
  // from how far the light token sat from its own page background, so a card
  // that was subtly raised in light mode stays subtly raised in dark mode
  // rather than collapsing into the page.
  const { hue, saturation: rampSaturation } = brandRampHue(palette);
  const elevation = Math.min(0.09, Math.abs(lightness - lightnessOf(palette.surface)) * 0.35 + 0.025);
  return fromHsl(hue, Math.min(rampSaturation * 0.45, 0.16), lightnessOf(darkSurface) + elevation);
}

function darkComponentText(lightText: string, darkBackground: string): string {
  // A coloured label (a link, a badge word-mark) keeps its hue; a plain
  // black/white label becomes the brand-tinted ink for that background.
  if (saturationOf(lightText) >= BRAND_FILL_SATURATION) {
    const candidate = fromHsl(hueOf(lightText), Math.min(saturationOf(lightText), 0.6), 0.78);
    return ensureContrast(candidate, darkBackground, AA_NORMAL_TEXT).hex;
  }
  return readableInkOn(darkBackground, AA_NORMAL_TEXT);
}

function darkComponentBorder(darkBackground: string, palette: BrandPalette): string {
  const { hue, saturation } = brandRampHue(palette);
  const candidate = fromHsl(hue, Math.min(saturation * 0.5, 0.18), Math.min(0.34, lightnessOf(darkBackground) + 0.14));
  // Non-text UI boundary: WCAG SC 1.4.11 asks 3:1, but a border that is
  // decorative rather than the only cue for a control is held to a softer
  // floor here and re-measured (and raised if it matters) by
  // lib/ai/validateTokens.ts, which knows which component it belongs to.
  return ensureContrast(candidate, darkBackground, 1.6).hex;
}

function darkComponentSet(light: ComponentTokenSet, palette: BrandPalette, darkSurface: string): ComponentTokenSet {
  const background = darkComponentBackground(light.background, palette, darkSurface);
  const text = darkComponentText(light.text, background);
  const border = light.border ? darkComponentBorder(background, palette) : undefined;

  const states = light.states
    ? (Object.fromEntries(
        Object.entries(light.states).map(([stateName, override]) => {
          if (!override) return [stateName, override];
          // States are re-derived from the *dark* base rather than remapped
          // from the light state, because the direction of a state change
          // flips: hover lightens on a dark UI and darkens on a light one.
          if (stateName === "hover") {
            return [stateName, { background: liftForDarkState(background, 0.07), text }];
          }
          if (stateName === "active") {
            return [stateName, { background: liftForDarkState(background, 0.12), text }];
          }
          if (stateName === "disabled") {
            const flat = fromHsl(hueOf(background), Math.min(saturationOf(background), 0.08), lightnessOf(darkSurface) + 0.06);
            return [stateName, { background: flat, text: ensureContrast(readableInkOn(flat), flat, AA_LARGE_TEXT).hex }];
          }
          // focus — the ring colour is the brand accent, which is the one
          // thing a focus state must not lose.
          return [
            stateName,
            { border: adaptAccentForDark(palette.accent, background, AA_LARGE_TEXT) },
          ];
        })
      ) as ComponentTokenSet["states"])
    : undefined;

  return { background, text, ...(border ? { border } : {}), ...(states ? { states } : {}) };
}

/**
 * Builds a complete dark ThemeVariantTokens from a brand's light one.
 * Every output hex is a function of the input hexes — there are no literal
 * brand colours in this file, which is what makes a stock-palette regression
 * impossible rather than merely unlikely.
 */
export function deriveDarkThemeVariantFromLight(light: ThemeVariantTokens): ThemeVariantTokens {
  const palette = brandPaletteFromThemeVariant(light);
  const ramp = deriveDarkSurfaceRamp(palette);
  const darkPalette = deriveDarkPaletteFromLight(palette);

  const components: ComponentTokens = {};
  (Object.keys(light.components) as Array<keyof ComponentTokens>).forEach((name) => {
    const set = light.components[name];
    if (set) components[name] = darkComponentSet(set, palette, ramp.surface);
  });

  // A design system with no button at all would leave the dark preview with
  // nothing to press — seed one from the derived accent so dark mode is
  // never a strictly poorer surface than light mode.
  if (!components.button) {
    components.button = {
      background: darkPalette.accent,
      text: readableInkOn(darkPalette.accent, AA_NORMAL_TEXT),
    };
  }

  return {
    colorRoles: {
      background: ramp.background,
      surface: ramp.surface,
      text: darkPalette.ink,
      textMuted: darkPalette.muted,
      border: ramp.border,
    },
    components,
  };
}

/**
 * PaletteTokens-shaped entry point for the same derivation — Studio speaks in
 * accent/support/surface/ink/muted, so this is the shape a caller seeding a
 * dark palette from a light one wants. Normalised on the way out so the
 * values compare cleanly against catalog hexes.
 */
export function deriveDarkPaletteTokens(light: PaletteTokens): PaletteTokens {
  const derived = deriveDarkPaletteFromLight({
    accent: normalizeHex(light.accent),
    support: normalizeHex(light.support),
    surface: normalizeHex(light.surface),
    ink: normalizeHex(light.ink),
    muted: normalizeHex(light.muted),
  });
  return derived;
}

// Powers Studio's "Enable component tokens" action — lets a from-scratch
// manual build opt into the same advanced design-system surface
// (DesignSystemGallery: per-component tokens, accessibility, icon style,
// grid, breakpoints) that previously only ever existed on AI-seeded
// projects, with sensible starting defaults rather than an empty shell.
export function synthesizeDesignSystemFromPalettes(light: PaletteTokens, dark: PaletteTokens): DesignSystem {
  return {
    light: deriveThemeVariantFromPalette(light),
    dark: deriveThemeVariantFromPalette(dark),
    accessibility: {
      level: "AA",
      notes: ["Starter accessibility target — replace with real contrast findings for the components you add."],
    },
    iconStyle: { style: "line", strokeWidth: 1.5, note: "Default starting point — adjust to match your brand." },
    grid: { columns: 12, gutter: 24, maxWidth: 1200 },
    breakpoints: { sm: 640, md: 768, lg: 1024, xl: 1280 },
  };
}
