/**
 * Pure code-generation for the Studio export drawer — no React, no side
 * effects. Given the current token state, formats it as a ready-to-paste
 * file in each supported target format.
 *
 * The token flattening and the DTCG/Figma JSON writers now live in
 * lib/export/designTokens.ts, shared with lib/export/generators.ts (the
 * saved-Project export API). The two pipelines had drifted far enough that
 * the same system exported from the Studio drawer and from /api/export
 * disagreed about which tokens even existed — dark palette, component
 * states and the type scale were present in one and missing from the
 * other. Anything that both pipelines need belongs in the shared module,
 * not here; this file only owns the Studio-specific target languages.
 */
import { SpacingScale, ShadowScale } from "@/types/designTokens";
import { DesignSystem } from "@/types/designSystem";
import { TypeScale } from "@/types/theme";
import {
  COMPONENT_ORDER,
  COMPONENT_STATES,
  NormalizedSystem,
  SEMANTIC_TYPE_ROLES,
  TYPE_SCALE_KEYS,
  parseBoxShadow,
  slugify,
  themeVariantEntries,
  toDtcgJson,
  toReadableJson,
  toTokensStudioJson,
} from "@/lib/export/designTokens";

export type PaletteTokens = {
  accent: string;
  support: string;
  surface: string;
  ink: string;
  muted: string;
};

export type StudioExportTokens = {
  name: string;
  light: PaletteTokens;
  dark: PaletteTokens;
  headFont: string;
  bodyFont: string;
  accentFont?: string;
  radius: number;
  typeScale?: TypeScale;
  spacing?: SpacingScale;
  shadows?: ShadowScale;
  designSystem?: DesignSystem;
};

const PALETTE_ROLES: Array<keyof PaletteTokens> = ["accent", "support", "surface", "ink", "muted"];

/**
 * Bridges the drawer's token shape onto the shared normalised model. The
 * Studio palette doubles as the brand palette (it *is* the five hues the
 * user picked), while `light`/`dark` carry the same five per mode — that's
 * the distinction the old exports collapsed, which is why dark mode kept
 * vanishing from JSON.
 */
export function toNormalizedSystem(s: StudioExportTokens): NormalizedSystem {
  const asNamed = (palette: PaletteTokens) => PALETTE_ROLES.map((role) => ({ name: role, hex: palette[role] }));
  return {
    name: s.name,
    brand: asNamed(s.light),
    light: asNamed(s.light),
    dark: asNamed(s.dark),
    fonts: { display: s.headFont, body: s.bodyFont, accent: s.accentFont },
    radius: s.radius,
    typeScale: s.typeScale,
    spacing: s.spacing,
    shadows: s.shadows,
    designSystem: s.designSystem,
  };
}

export const EXPORT_TABS = [
  "CSS",
  "Tailwind",
  "Design Tokens",
  "Figma",
  "SwiftUI",
  "Flutter",
  "React",
  "JSON",
  "Style Guide",
] as const;
export type ExportTab = (typeof EXPORT_TABS)[number];

/** Generic filenames — see `exportFileName()` for the per-project ones. */
export const EXPORT_FILES: Record<ExportTab, string> = {
  CSS: "tokens.css",
  Tailwind: "tailwind.config.js",
  "Design Tokens": "tokens.json",
  Figma: "figma.tokens.json",
  SwiftUI: "Color+Tokens.swift",
  Flutter: "app_theme.dart",
  React: "theme.ts",
  JSON: "system.json",
  "Style Guide": "style-guide.md",
};

/**
 * MIME types for the download path. Previously nothing in the drawer
 * downloaded at all (copy-to-clipboard only), and the one place that did
 * download — the dashboard — blobbed everything as `text/plain`, so a
 * `.json` file arrived typed as plain text and some tools refused it.
 */
export const EXPORT_MIME: Record<ExportTab, string> = {
  CSS: "text/css;charset=utf-8",
  Tailwind: "text/javascript;charset=utf-8",
  "Design Tokens": "application/json;charset=utf-8",
  Figma: "application/json;charset=utf-8",
  SwiftUI: "text/plain;charset=utf-8",
  Flutter: "text/plain;charset=utf-8",
  React: "text/plain;charset=utf-8",
  JSON: "application/json;charset=utf-8",
  "Style Guide": "text/markdown;charset=utf-8",
};

/**
 * One line of UI copy per tab. The drawer shows this so a user can tell
 * the two JSON downloads apart — "Design Tokens" is the one that imports
 * into Figma, "JSON" is the readable dump. Getting that wrong at a demo
 * means watching someone import the wrong file and see nothing appear.
 */
export const EXPORT_HINTS: Record<ExportTab, string> = {
  CSS: "Custom properties for :root, with a [data-theme=\"dark\"] override block.",
  Tailwind: "Drop-in tailwind.config.js — colors, fonts, type scale, spacing, shadows, screens.",
  "Design Tokens": "W3C DTCG format. Import into Figma via Tokens Studio or the Design Tokens plugin.",
  Figma: "Tokens Studio token sets — light and dark wired up as swappable themes.",
  SwiftUI: "Color, font-size, spacing and radius constants for an iOS target.",
  Flutter: "AppColors / AppTheme with light and dark ThemeData.",
  React: "A typed theme object for styled-components, Emotion, or plain props.",
  JSON: "Human-readable dump of the whole system. Not an importable token file.",
  "Style Guide": "Markdown documentation of every token, for a README or handoff doc.",
};

export function exportFileName(tab: ExportTab, systemName: string): string {
  const slug = slugify(systemName) || "stylebook";
  switch (tab) {
    case "CSS":
      return `${slug}.tokens.css`;
    case "Tailwind":
      return `tailwind.config.js`;
    case "Design Tokens":
      return `${slug}.tokens.json`;
    case "Figma":
      return `${slug}.figma.tokens.json`;
    case "SwiftUI":
      return `AppTokens.swift`;
    case "Flutter":
      return `app_theme.dart`;
    case "React":
      return `theme.ts`;
    case "JSON":
      return `${slug}.json`;
    case "Style Guide":
      return `${slug}-style-guide.md`;
  }
}

export type GenerateExportCodeOptions = {
  // Overrides the CSS tab's root selector (":root") — used by the Studio
  // live-preview canvas to inject the same generated CSS into the host
  // document scoped under a wrapper attribute, instead of the real page's
  // own :root custom properties. Ignored by every other tab/export target.
  scopeSelector?: string;
};

function swiftIdent(key: string): string {
  // Swift identifiers can't start with a digit, and the type scale has
  // keys like "2xl". Prefixing beats dropping the token.
  return key.replace(/^(\d)/, "size$1").replace(/[^A-Za-z0-9_]/g, "");
}

function dartIdent(key: string): string {
  return key.replace(/^(\d)/, "s$1").replace(/[^A-Za-z0-9_]/g, "");
}

function dartColor(hex: string): string {
  const body = hex.replace("#", "");
  // Dart's Color wants 0xAARRGGBB. An 8-digit CSS hex is #RRGGBBAA, so the
  // alpha has to move from the back to the front — concatenating blind
  // produced colours that were transparent instead of tinted.
  if (body.length === 8) return `0x${(body.slice(6, 8) + body.slice(0, 6)).toUpperCase()}`;
  return `0xFF${body.padStart(6, "0").toUpperCase()}`;
}

export function generateExportCode(tab: ExportTab, s: StudioExportTokens, options?: GenerateExportCodeOptions): string {
  const system = toNormalizedSystem(s);
  const ds = s.designSystem;

  switch (tab) {
    case "CSS": {
      const rootSelector = options?.scopeSelector ?? ":root";
      const darkSelector = options?.scopeSelector ? `${options.scopeSelector}[data-theme="dark"]` : '[data-theme="dark"]';
      const lines: string[] = [
        `${rootSelector} {`,
        `  --color-accent: ${s.light.accent};`,
        `  --color-support: ${s.light.support};`,
        `  --color-surface: ${s.light.surface};`,
        `  --color-ink: ${s.light.ink};`,
        `  --color-muted: ${s.light.muted};`,
        "",
        `  --font-display: "${s.headFont}", serif;`,
        `  --font-body: "${s.bodyFont}", sans-serif;`,
      ];
      // The accent face is a real, separately-chosen font in the Studio and
      // was simply absent from the CSS export — the one format most people
      // paste straight into a project.
      if (s.accentFont) lines.push(`  --font-accent: "${s.accentFont}", sans-serif;`);
      lines.push("", `  --radius: ${s.radius}px;`);

      if (s.typeScale) {
        lines.push("", `  /* Type scale — base ${s.typeScale.baseSize}px, ratio ${s.typeScale.ratioName} (${s.typeScale.ratio}) */`);
        TYPE_SCALE_KEYS.forEach((key) => lines.push(`  --text-${key}: ${s.typeScale!.sizes[key]}px;`));
        // Semantic aliases, so a developer doesn't have to guess which
        // scale step is an H1. Same mapping the theme pages and the PDF use.
        lines.push("");
        SEMANTIC_TYPE_ROLES.forEach(({ role, size }) => lines.push(`  --text-${role}: var(--text-${size});`));
      }
      if (s.spacing) {
        lines.push("", `  /* Spacing — ${s.spacing.base}px base */`);
        s.spacing.steps.forEach((step, i) => lines.push(`  --space-${i + 1}: ${step}px;`));
      }
      if (s.shadows) {
        lines.push("");
        s.shadows.levels.forEach((level) => lines.push(`  --shadow-${level.name}: ${level.value};`));
        lines.push(`  --shadow: var(--shadow-${s.shadows.recommended});`);
      }
      if (ds) {
        lines.push("");
        themeVariantEntries(ds.light).forEach(({ key, hex }) => lines.push(`  --ds-${key}: ${hex};`));
      }
      if (ds?.grid) {
        lines.push("", `  --grid-columns: ${ds.grid.columns};`, `  --grid-gutter: ${ds.grid.gutter}px;`, `  --grid-max-width: ${ds.grid.maxWidth}px;`);
      }
      if (ds?.breakpoints) {
        // Emitted as custom properties *and* as a comment: custom properties
        // can't be used inside a media query, so the comment is the only
        // usable form for the thing developers actually reach for.
        const bp = ds.breakpoints;
        lines.push("", `  --breakpoint-sm: ${bp.sm}px;`, `  --breakpoint-md: ${bp.md}px;`, `  --breakpoint-lg: ${bp.lg}px;`, `  --breakpoint-xl: ${bp.xl}px;`);
      }
      if (ds?.iconStyle?.strokeWidth !== undefined) {
        lines.push("", `  --icon-stroke-width: ${ds.iconStyle.strokeWidth}px;`);
      }
      lines.push("}");

      lines.push("", `${darkSelector} {`);
      lines.push(`  --color-accent: ${s.dark.accent};`);
      lines.push(`  --color-support: ${s.dark.support};`);
      lines.push(`  --color-surface: ${s.dark.surface};`);
      lines.push(`  --color-ink: ${s.dark.ink};`);
      lines.push(`  --color-muted: ${s.dark.muted};`);
      if (ds?.dark) {
        themeVariantEntries(ds.dark).forEach(({ key, hex }) => lines.push(`  --ds-${key}: ${hex};`));
      }
      lines.push("}");

      if (ds?.breakpoints) {
        const bp = ds.breakpoints;
        lines.push("", `/* Breakpoints: sm ${bp.sm}px · md ${bp.md}px · lg ${bp.lg}px · xl ${bp.xl}px */`);
      }
      if (ds?.iconStyle) {
        lines.push(`/* Icons: ${ds.iconStyle.style}${ds.iconStyle.strokeWidth ? `, ${ds.iconStyle.strokeWidth}px stroke` : ""} — ${ds.iconStyle.note} */`);
      }
      if (ds?.accessibility) {
        lines.push(`/* Accessibility target: WCAG ${ds.accessibility.level} */`);
        ds.accessibility.notes.forEach((note) => lines.push(`/* - ${note} */`));
      }

      return lines.join("\n");
    }

    case "Tailwind": {
      const colorLines = [
        `        accent: '${s.light.accent}',`,
        `        support: '${s.light.support}',`,
        `        surface: '${s.light.surface}',`,
        `        ink: '${s.light.ink}',`,
        `        muted: '${s.light.muted}',`,
        `        'dark-accent': '${s.dark.accent}',`,
        `        'dark-support': '${s.dark.support}',`,
        `        'dark-surface': '${s.dark.surface}',`,
        `        'dark-ink': '${s.dark.ink}',`,
        `        'dark-muted': '${s.dark.muted}',`,
        ...(ds ? themeVariantEntries(ds.light).map(({ key, hex }) => `        'ds-${key}': '${hex}',`) : []),
        ...(ds?.dark ? themeVariantEntries(ds.dark).map(({ key, hex }) => `        'ds-dark-${key}': '${hex}',`) : []),
      ].join("\n");

      const blocks: string[] = [];
      if (s.typeScale) {
        blocks.push(`      fontSize: {
${TYPE_SCALE_KEYS.map((key) => `        '${key}': '${s.typeScale!.sizes[key]}px',`).join("\n")}
      },`);
      }
      // Spacing and shadows were generated by the app and then thrown away
      // by this format — the Tailwind config is the export most likely to
      // be the *only* artefact a developer keeps, so it has to be complete.
      if (s.spacing) {
        blocks.push(`      spacing: {
${s.spacing.steps.map((step, i) => `        '${i + 1}': '${step}px',`).join("\n")}
      },`);
      }
      if (s.shadows) {
        blocks.push(`      boxShadow: {
${s.shadows.levels.map((level) => `        '${level.name}': '${level.value}',`).join("\n")}
        DEFAULT: '${s.shadows.levels.find((l) => l.name === s.shadows!.recommended)?.value ?? "none"}',
      },`);
      }
      if (ds?.breakpoints) {
        blocks.push(`      screens: {
        sm: '${ds.breakpoints.sm}px',
        md: '${ds.breakpoints.md}px',
        lg: '${ds.breakpoints.lg}px',
        xl: '${ds.breakpoints.xl}px',
      },`);
      }
      if (ds?.grid) {
        blocks.push(`      maxWidth: { container: '${ds.grid.maxWidth}px' },
      gap: { gutter: '${ds.grid.gutter}px' },
      gridTemplateColumns: { layout: 'repeat(${ds.grid.columns}, minmax(0, 1fr))' },`);
      }

      return `/** Generated from "${s.name}" by StyleBook AI. */
module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
${colorLines}
      },
      fontFamily: {
        display: ['${s.headFont}', 'serif'],
        body: ['${s.bodyFont}', 'sans-serif'],${s.accentFont ? `\n        accent: ['${s.accentFont}', 'sans-serif'],` : ""}
      },
      borderRadius: { DEFAULT: '${s.radius}px' },
${blocks.join("\n")}
    },
  },
};`;
    }

    case "Design Tokens":
      return toDtcgJson(system);

    case "Figma":
      return toTokensStudioJson(system);

    case "JSON":
      return toReadableJson(system);

    case "SwiftUI": {
      const swatch = (name: string, hex: string) => `    static let ${name} = Color(hex: "${hex.replace("#", "")}")`;
      const sections: string[] = [
        "import SwiftUI",
        "",
        `// ${s.name} — generated by StyleBook AI.`,
        "",
        "extension Color {",
        "    // Palette — light",
        ...PALETTE_ROLES.map((role) => swatch(role, s.light[role])),
        "",
        "    // Palette — dark",
        ...PALETTE_ROLES.map((role) => swatch(`${role}Dark`, s.dark[role])),
      ];

      // Role and component colours only ever reached the CSS/Tailwind
      // targets. An iOS developer handed the old file got five hues and no
      // idea what a button should look like.
      if (ds) {
        sections.push("", "    // Roles & components — light");
        themeVariantEntries(ds.light).forEach(({ key, hex }) =>
          sections.push(swatch(swiftIdent(key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())), hex))
        );
      }
      if (ds?.dark) {
        sections.push("", "    // Roles & components — dark");
        themeVariantEntries(ds.dark).forEach(({ key, hex }) =>
          sections.push(swatch(`${swiftIdent(key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()))}Dark`, hex))
        );
      }
      sections.push("}");

      if (s.typeScale) {
        sections.push(
          "",
          "enum AppFontSize {",
          ...TYPE_SCALE_KEYS.map((key) => `    static let ${swiftIdent(key)}: CGFloat = ${s.typeScale!.sizes[key]}`),
          "",
          ...SEMANTIC_TYPE_ROLES.map(({ role, size }) => `    static let ${role}: CGFloat = ${s.typeScale!.sizes[size]}`),
          "}"
        );
      }
      if (s.spacing) {
        sections.push(
          "",
          "enum AppSpacing {",
          ...s.spacing.steps.map((step, i) => `    static let s${i + 1}: CGFloat = ${step}`),
          "}"
        );
      }
      sections.push("", "enum AppRadius {", `    static let base: CGFloat = ${s.radius}`, "}");
      if (s.shadows) {
        // SwiftUI has no multi-layer shadow primitive, so each layer becomes
        // its own radius/offset triple that can be stacked with `.shadow()`.
        // Emitted as 8-digit RGBA hex because shadow colours are always
        // partly transparent — the receiving `Color(hex:)` initializer must
        // handle the alpha pair, or the shadows land fully opaque.
        sections.push("", "enum AppShadow {");
        s.shadows.levels.forEach((level) => {
          const layers = parseBoxShadow(level.value);
          if (layers.length === 0) {
            sections.push(`    // ${level.name}: no shadow`);
            return;
          }
          layers.forEach((layer, i) => {
            const suffix = layers.length > 1 ? `Layer${i + 1}` : "";
            sections.push(
              `    static let ${swiftIdent(level.name)}${suffix} = (color: Color(hex: "${layer.color.replace("#", "")}"), radius: CGFloat(${parseFloat(layer.blur) || 0}), x: CGFloat(${parseFloat(layer.offsetX) || 0}), y: CGFloat(${parseFloat(layer.offsetY) || 0}))`
            );
          });
        });
        sections.push("}");
      }
      if (ds?.breakpoints) {
        const bp = ds.breakpoints;
        sections.push(
          "",
          "enum AppBreakpoint {",
          `    static let sm: CGFloat = ${bp.sm}`,
          `    static let md: CGFloat = ${bp.md}`,
          `    static let lg: CGFloat = ${bp.lg}`,
          `    static let xl: CGFloat = ${bp.xl}`,
          "}"
        );
      }
      if (ds?.accessibility) {
        sections.push("", `// Accessibility target: WCAG ${ds.accessibility.level}`, ...ds.accessibility.notes.map((n) => `// - ${n}`));
      }
      return sections.join("\n");
    }

    case "Flutter": {
      const colorConst = (name: string, hex: string) => `  static const ${name} = Color(${dartColor(hex)});`;
      const sections: string[] = [
        "import 'package:flutter/material.dart';",
        "",
        `// ${s.name} — generated by StyleBook AI.`,
        "",
        "class AppColors {",
        ...PALETTE_ROLES.map((role) => colorConst(role, s.light[role])),
        "",
        ...PALETTE_ROLES.map((role) => colorConst(`${role}Dark`, s.dark[role])),
      ];
      if (ds) {
        sections.push("");
        themeVariantEntries(ds.light).forEach(({ key, hex }) =>
          sections.push(colorConst(dartIdent(key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())), hex))
        );
      }
      if (ds?.dark) {
        sections.push("");
        themeVariantEntries(ds.dark).forEach(({ key, hex }) =>
          sections.push(colorConst(`${dartIdent(key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()))}Dark`, hex))
        );
      }
      sections.push("}", "", "class AppRadius {", `  static const double base = ${s.radius};`, "}");

      if (s.typeScale) {
        sections.push(
          "",
          "class AppFontSize {",
          ...TYPE_SCALE_KEYS.map((key) => `  static const double ${dartIdent(key)} = ${s.typeScale!.sizes[key]};`),
          "",
          ...SEMANTIC_TYPE_ROLES.map(({ role, size }) => `  static const double ${role} = ${s.typeScale!.sizes[size]};`),
          "}"
        );
      }
      if (s.spacing) {
        sections.push(
          "",
          "class AppSpacing {",
          ...s.spacing.steps.map((step, i) => `  static const double s${i + 1} = ${step};`),
          "}"
        );
      }
      if (s.shadows) {
        sections.push("", "class AppShadow {");
        s.shadows.levels.forEach((level) => {
          const layers = parseBoxShadow(level.value);
          const body = layers
            .map(
              (layer) =>
                `    BoxShadow(color: Color(${dartColor(layer.color)}), offset: Offset(${parseFloat(layer.offsetX) || 0}, ${parseFloat(layer.offsetY) || 0}), blurRadius: ${parseFloat(layer.blur) || 0}, spreadRadius: ${parseFloat(layer.spread) || 0}),`
            )
            .join("\n");
          sections.push(`  static const List<BoxShadow> ${dartIdent(level.name)} = <BoxShadow>[${body ? `\n${body}\n  ` : ""}];`);
        });
        sections.push("}");
      }
      if (ds?.breakpoints) {
        const bp = ds.breakpoints;
        sections.push(
          "",
          "class AppBreakpoint {",
          `  static const double sm = ${bp.sm};`,
          `  static const double md = ${bp.md};`,
          `  static const double lg = ${bp.lg};`,
          `  static const double xl = ${bp.xl};`,
          "}"
        );
      }
      if (ds?.grid) {
        sections.push(
          "",
          "class AppGrid {",
          `  static const int columns = ${ds.grid.columns};`,
          `  static const double gutter = ${ds.grid.gutter};`,
          `  static const double maxWidth = ${ds.grid.maxWidth};`,
          "}"
        );
      }

      sections.push(
        "",
        "final appLightTheme = ThemeData(",
        "  brightness: Brightness.light,",
        "  scaffoldBackgroundColor: AppColors.surface,",
        "  colorScheme: const ColorScheme.light(primary: AppColors.accent, secondary: AppColors.support),",
        `  fontFamily: '${s.bodyFont}',`,
        ");",
        "",
        "final appDarkTheme = ThemeData(",
        "  brightness: Brightness.dark,",
        "  scaffoldBackgroundColor: AppColors.surfaceDark,",
        "  colorScheme: const ColorScheme.dark(primary: AppColors.accentDark, secondary: AppColors.supportDark),",
        `  fontFamily: '${s.bodyFont}',`,
        ");"
      );

      if (ds?.accessibility) {
        sections.push("", `// Accessibility target: WCAG ${ds.accessibility.level}`, ...ds.accessibility.notes.map((n) => `// - ${n}`));
      }
      return sections.join("\n");
    }

    case "React": {
      // Built as a plain object and serialised, rather than hand-written
      // string concatenation. The old version listed component background
      // and text only, silently dropping every state and the entire dark
      // variant; a serialised object can't drift out of sync with the data
      // the same way a template literal can.
      const themeObject: Record<string, unknown> = {
        name: s.name,
        colors: {
          light: s.light,
          dark: s.dark,
          ...(ds
            ? {
                roles: { light: ds.light.colorRoles, ...(ds.dark ? { dark: ds.dark.colorRoles } : {}) },
                components: {
                  light: Object.fromEntries(
                    COMPONENT_ORDER.filter((n) => ds.light.components[n]).map((n) => [n, ds.light.components[n]])
                  ),
                  ...(ds.dark
                    ? {
                        dark: Object.fromEntries(
                          COMPONENT_ORDER.filter((n) => ds.dark!.components[n]).map((n) => [n, ds.dark!.components[n]])
                        ),
                      }
                    : {}),
                },
              }
            : {}),
        },
        fonts: { display: s.headFont, body: s.bodyFont, ...(s.accentFont ? { accent: s.accentFont } : {}) },
        radius: s.radius,
        ...(s.typeScale
          ? {
              fontSize: s.typeScale.sizes,
              typeScale: { base: s.typeScale.baseSize, ratio: s.typeScale.ratio, ratioName: s.typeScale.ratioName },
              text: Object.fromEntries(SEMANTIC_TYPE_ROLES.map(({ role, size }) => [role, s.typeScale!.sizes[size]])),
            }
          : {}),
        ...(s.spacing ? { spacing: s.spacing.steps, spacingBase: s.spacing.base } : {}),
        ...(s.shadows
          ? {
              shadows: Object.fromEntries(s.shadows.levels.map((l) => [l.name, l.value])),
              shadowRecommended: s.shadows.recommended,
            }
          : {}),
        ...(ds?.breakpoints ? { breakpoints: ds.breakpoints } : {}),
        ...(ds?.grid ? { grid: ds.grid } : {}),
        ...(ds?.iconStyle ? { iconStyle: ds.iconStyle } : {}),
        ...(ds?.accessibility ? { accessibility: ds.accessibility } : {}),
      };

      return `/** ${s.name} — generated by StyleBook AI. */
export const theme = ${JSON.stringify(themeObject, null, 2)} as const;

export type Theme = typeof theme;
`;
    }

    case "Style Guide": {
      const lines: string[] = [
        `# ${s.name} — Style Guide`,
        "",
        `_Generated by StyleBook AI._`,
        "",
        "## Colors",
        "",
        "### Light palette",
        "",
      ];
      PALETTE_ROLES.forEach((role) => lines.push(`- **${role}**: \`${s.light[role]}\``));
      lines.push("", "### Dark palette", "");
      PALETTE_ROLES.forEach((role) => lines.push(`- **${role}**: \`${s.dark[role]}\``));

      if (ds) {
        const roleBlock = (title: string, variant: DesignSystem["light"]) => {
          lines.push("", `### ${title} roles`, "");
          lines.push(`- **background**: \`${variant.colorRoles.background}\``);
          lines.push(`- **surface**: \`${variant.colorRoles.surface}\``);
          lines.push(`- **text**: \`${variant.colorRoles.text}\``);
          lines.push(`- **text muted**: \`${variant.colorRoles.textMuted}\``);
          lines.push(`- **border**: \`${variant.colorRoles.border}\``);
        };
        roleBlock("Light", ds.light);
        if (ds.dark) roleBlock("Dark", ds.dark);
      }

      lines.push("", "## Typography", "", `- Display: ${s.headFont}`, `- Body: ${s.bodyFont}`);
      if (s.accentFont) lines.push(`- Accent: ${s.accentFont}`);

      if (s.typeScale) {
        lines.push(
          "",
          "### Type scale",
          "",
          `Base ${s.typeScale.baseSize}px · Ratio ${s.typeScale.ratioName} (${s.typeScale.ratio})`,
          "",
          "| Step | Size |",
          "| --- | --- |"
        );
        TYPE_SCALE_KEYS.forEach((key) => lines.push(`| \`${key}\` | ${s.typeScale!.sizes[key]}px |`));
        lines.push("", "### Semantic sizes", "", "| Role | Step | Size |", "| --- | --- | --- |");
        SEMANTIC_TYPE_ROLES.forEach(({ role, size }) =>
          lines.push(`| ${role} | \`${size}\` | ${s.typeScale!.sizes[size]}px |`)
        );
      }

      lines.push("", "## Shape", "", `- Corner radius: ${s.radius}px`);

      if (s.spacing) {
        lines.push("", "## Spacing", "", `Base ${s.spacing.base}px`, "");
        s.spacing.steps.forEach((step, i) => lines.push(`- Step ${i + 1}: ${step}px`));
      }
      if (s.shadows) {
        lines.push("", "## Shadows", "");
        s.shadows.levels.forEach((level) =>
          lines.push(`- **${level.name}**${level.name === s.shadows!.recommended ? " (recommended)" : ""}: \`${level.value}\``)
        );
      }

      if (ds) {
        lines.push("", "## Components", "");
        COMPONENT_ORDER.filter((name) => ds.light.components[name]).forEach((name) => {
          const t = ds.light.components[name]!;
          lines.push(`### ${name}`, "");
          lines.push(`- background \`${t.background}\` · text \`${t.text}\`${t.border ? ` · border \`${t.border}\`` : ""}`);
          // States were generated and then never documented anywhere a
          // human could read them — the markdown guide is the handoff doc,
          // so it has to carry hover/active/disabled/focus too.
          COMPONENT_STATES.forEach((state) => {
            const override = t.states?.[state];
            if (!override) return;
            const parts = [
              override.background ? `background \`${override.background}\`` : null,
              override.text ? `text \`${override.text}\`` : null,
              override.border ? `border \`${override.border}\`` : null,
            ].filter(Boolean);
            lines.push(`- _${state}_: ${parts.join(" · ")}`);
          });
          const darkTokens = ds.dark?.components[name];
          if (darkTokens) {
            lines.push(`- _dark_: background \`${darkTokens.background}\` · text \`${darkTokens.text}\`${darkTokens.border ? ` · border \`${darkTokens.border}\`` : ""}`);
          }
          lines.push("");
        });
      }

      if (ds?.grid) {
        lines.push("", "## Grid", "", `${ds.grid.columns} columns · ${ds.grid.gutter}px gutter · ${ds.grid.maxWidth}px max width`);
      }
      if (ds?.breakpoints) {
        const bp = ds.breakpoints;
        lines.push("", "## Breakpoints", "", `sm ${bp.sm}px · md ${bp.md}px · lg ${bp.lg}px · xl ${bp.xl}px`);
      }
      if (ds?.iconStyle) {
        lines.push(
          "",
          "## Icon style",
          "",
          `${ds.iconStyle.style}${ds.iconStyle.strokeWidth ? ` · ${ds.iconStyle.strokeWidth}px stroke` : ""} — ${ds.iconStyle.note}`
        );
      }
      if (ds?.accessibility) {
        lines.push("", `## Accessibility · WCAG ${ds.accessibility.level}`, "");
        ds.accessibility.notes.forEach((note) => lines.push(`- ${note}`));
      }

      return lines.join("\n");
    }
  }
}
