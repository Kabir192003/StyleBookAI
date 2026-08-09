/**
 * Pure code-generation for the Studio export drawer — no React, no side
 * effects. Given the current token state, formats it as a ready-to-paste
 * file in each supported target format. Independent from
 * lib/export/generators.ts (the saved-Project export pipeline) — see
 * docs/TECHNICAL_ARCHITECTURE.md for why these two aren't merged.
 */
import { SpacingScale, ShadowScale } from "@/types/designTokens";
import { ComponentName, ComponentTokenSet, DesignSystem, ThemeVariantTokens } from "@/types/designSystem";
import { TypeScale } from "@/types/theme";

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

export const EXPORT_TABS = ["CSS", "Tailwind", "JSON", "SwiftUI", "Figma", "Flutter", "React", "Style Guide"] as const;
export type ExportTab = (typeof EXPORT_TABS)[number];

export const EXPORT_FILES: Record<ExportTab, string> = {
  CSS: "tokens.css",
  Tailwind: "tailwind.config.js",
  JSON: "tokens.json",
  SwiftUI: "Color+Tokens.swift",
  Figma: "figma.tokens.json",
  Flutter: "app_theme.dart",
  React: "theme.ts",
  "Style Guide": "style-guide.md",
};

const COMPONENT_ORDER: ComponentName[] = [
  "button",
  "buttonSecondary",
  "input",
  "dropdown",
  "card",
  "navigation",
  "table",
  "modal",
  "alert",
  "badge",
];

function componentEntries(name: ComponentName, tokens: ComponentTokenSet): Array<{ key: string; hex: string }> {
  const entries: Array<{ key: string; hex: string }> = [
    { key: `${name}-bg`, hex: tokens.background },
    { key: `${name}-text`, hex: tokens.text },
  ];
  if (tokens.border) entries.push({ key: `${name}-border`, hex: tokens.border });
  (["hover", "active", "disabled", "focus"] as const).forEach((state) => {
    const override = tokens.states?.[state];
    if (!override) return;
    if (override.background) entries.push({ key: `${name}-bg-${state}`, hex: override.background });
    if (override.text) entries.push({ key: `${name}-text-${state}`, hex: override.text });
    if (override.border) entries.push({ key: `${name}-border-${state}`, hex: override.border });
  });
  return entries;
}

function variantEntries(variant: ThemeVariantTokens): Array<{ key: string; hex: string }> {
  const { colorRoles, components } = variant;
  const entries: Array<{ key: string; hex: string }> = [
    { key: "color-bg", hex: colorRoles.background },
    { key: "color-surface", hex: colorRoles.surface },
    { key: "color-text", hex: colorRoles.text },
    { key: "color-text-muted", hex: colorRoles.textMuted },
    { key: "color-border", hex: colorRoles.border },
  ];
  COMPONENT_ORDER.forEach((name) => {
    const tokens = components[name];
    if (tokens) entries.push(...componentEntries(name, tokens));
  });
  return entries;
}

export function generateExportCode(tab: ExportTab, s: StudioExportTokens): string {
  switch (tab) {
    case "CSS": {
      const lines: string[] = [
        ":root {",
        `  --color-accent: ${s.light.accent};`,
        `  --color-support: ${s.light.support};`,
        `  --color-surface: ${s.light.surface};`,
        `  --color-ink: ${s.light.ink};`,
        `  --color-muted: ${s.light.muted};`,
        "",
        `  --font-display: "${s.headFont}", serif;`,
        `  --font-body: "${s.bodyFont}", sans-serif;`,
        "",
        `  --radius: ${s.radius}px;`,
      ];
      if (s.typeScale) {
        lines.push("");
        (Object.entries(s.typeScale.sizes) as Array<[string, number]>).forEach(([key, size]) =>
          lines.push(`  --text-${key}: ${size}px;`)
        );
      }
      if (s.spacing) {
        lines.push("");
        s.spacing.steps.forEach((step, i) => lines.push(`  --space-${i + 1}: ${step}px;`));
      }
      if (s.shadows) {
        lines.push("");
        s.shadows.levels.forEach((level) => lines.push(`  --shadow-${level.name}: ${level.value};`));
      }
      if (s.designSystem) {
        lines.push("");
        variantEntries(s.designSystem.light).forEach(({ key, hex }) => lines.push(`  --ds-${key}: ${hex};`));
      }
      lines.push("}");

      lines.push("", '[data-theme="dark"] {');
      lines.push(`  --color-accent: ${s.dark.accent};`);
      lines.push(`  --color-support: ${s.dark.support};`);
      lines.push(`  --color-surface: ${s.dark.surface};`);
      lines.push(`  --color-ink: ${s.dark.ink};`);
      lines.push(`  --color-muted: ${s.dark.muted};`);
      if (s.designSystem?.dark) {
        variantEntries(s.designSystem.dark).forEach(({ key, hex }) => lines.push(`  --ds-${key}: ${hex};`));
      }
      lines.push("}");

      return lines.join("\n");
    }
    case "Tailwind": {
      const dsColors = s.designSystem
        ? variantEntries(s.designSystem.light).map(({ key, hex }) => `        'ds-${key}': '${hex}',`)
        : [];
      const dsDarkColors = s.designSystem?.dark
        ? variantEntries(s.designSystem.dark).map(({ key, hex }) => `        'ds-dark-${key}': '${hex}',`)
        : [];
      return `module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        accent: '${s.light.accent}',
        support: '${s.light.support}',
        surface: '${s.light.surface}',
        ink: '${s.light.ink}',
        muted: '${s.light.muted}',
        'dark-accent': '${s.dark.accent}',
        'dark-support': '${s.dark.support}',
        'dark-surface': '${s.dark.surface}',
        'dark-ink': '${s.dark.ink}',
        'dark-muted': '${s.dark.muted}',
${dsColors.join("\n")}
${dsDarkColors.join("\n")}
      },
      fontFamily: {
        display: ['${s.headFont}', 'serif'],
        body: ['${s.bodyFont}', 'sans-serif'],
      },
      borderRadius: { DEFAULT: '${s.radius}px' },${
        s.typeScale
          ? `
      fontSize: {
${(Object.entries(s.typeScale.sizes) as Array<[string, number]>).map(([key, size]) => `        '${key}': '${size}px',`).join("\n")}
      },`
          : ""
      }
    },
  },
};`;
    }
    case "JSON":
      return JSON.stringify(
        {
          name: s.name,
          light: s.light,
          dark: s.dark,
          type: { display: s.headFont, body: s.bodyFont, accent: s.accentFont },
          typeScale: s.typeScale,
          radius: `${s.radius}px`,
          spacing: s.spacing,
          shadows: s.shadows,
          designSystem: s.designSystem,
        },
        null,
        2
      );
    case "SwiftUI": {
      const swatch = (name: string, hex: string) => `    static let ${name} = Color(hex: "${hex.replace("#", "")}")`;
      return `import SwiftUI

extension Color {
    // Light
${swatch("accent", s.light.accent)}
${swatch("support", s.light.support)}
${swatch("surface", s.light.surface)}
${swatch("ink", s.light.ink)}
${swatch("muted", s.light.muted)}

    // Dark
${swatch("accentDark", s.dark.accent)}
${swatch("supportDark", s.dark.support)}
${swatch("surfaceDark", s.dark.surface)}
${swatch("inkDark", s.dark.ink)}
${swatch("mutedDark", s.dark.muted)}
}
${
  s.typeScale
    ? `
enum AppFontSize {
${(Object.entries(s.typeScale.sizes) as Array<[string, number]>).map(([key, size]) => `    static let ${key.replace(/^(\d)/, "size$1")}: CGFloat = ${size}`).join("\n")}
}
`
    : ""
}`;
    }
    case "Figma":
      return JSON.stringify(
        {
          [s.name]: {
            color: {
              light: {
                accent: { value: s.light.accent, type: "color" },
                support: { value: s.light.support, type: "color" },
                surface: { value: s.light.surface, type: "color" },
                ink: { value: s.light.ink, type: "color" },
                muted: { value: s.light.muted, type: "color" },
              },
              dark: {
                accent: { value: s.dark.accent, type: "color" },
                support: { value: s.dark.support, type: "color" },
                surface: { value: s.dark.surface, type: "color" },
                ink: { value: s.dark.ink, type: "color" },
                muted: { value: s.dark.muted, type: "color" },
              },
            },
            radius: { value: `${s.radius}px`, type: "borderRadius" },
            ...(s.typeScale
              ? {
                  fontSize: Object.fromEntries(
                    Object.entries(s.typeScale.sizes).map(([key, size]) => [
                      key,
                      { value: `${size}px`, type: "fontSizes" },
                    ])
                  ),
                }
              : {}),
          },
        },
        null,
        2
      );
    case "Flutter": {
      const colorConst = (name: string, hex: string) =>
        `  static const ${name} = Color(0xFF${hex.replace("#", "").padStart(6, "0").toUpperCase()});`;
      return `import 'package:flutter/material.dart';

class AppColors {
${colorConst("accent", s.light.accent)}
${colorConst("support", s.light.support)}
${colorConst("surface", s.light.surface)}
${colorConst("ink", s.light.ink)}
${colorConst("muted", s.light.muted)}

${colorConst("accentDark", s.dark.accent)}
${colorConst("supportDark", s.dark.support)}
${colorConst("surfaceDark", s.dark.surface)}
${colorConst("inkDark", s.dark.ink)}
${colorConst("mutedDark", s.dark.muted)}
}

class AppRadius {
  static const double base = ${s.radius};
}
${
  s.typeScale
    ? `
class AppFontSize {
${Object.entries(s.typeScale.sizes)
  .map(([key, size]) => `  static const double ${key.replace(/^(\d)/, "size$1")} = ${size};`)
  .join("\n")}
}
`
    : ""
}${
  s.spacing
    ? `
class AppSpacing {
${s.spacing.steps.map((step, i) => `  static const double s${i + 1} = ${step};`).join("\n")}
}
`
    : ""
}
final appLightTheme = ThemeData(
  brightness: Brightness.light,
  scaffoldBackgroundColor: AppColors.surface,
  colorScheme: ColorScheme.light(primary: AppColors.accent, secondary: AppColors.support),
  fontFamily: '${s.bodyFont}',
);

final appDarkTheme = ThemeData(
  brightness: Brightness.dark,
  scaffoldBackgroundColor: AppColors.surfaceDark,
  colorScheme: ColorScheme.dark(primary: AppColors.accentDark, secondary: AppColors.supportDark),
  fontFamily: '${s.bodyFont}',
);
`;
    }
    case "React": {
      const componentsBlock = s.designSystem
        ? `  components: {\n${COMPONENT_ORDER.filter((name) => s.designSystem!.light.components[name])
            .map((name) => {
              const t = s.designSystem!.light.components[name]!;
              return `    ${name}: { background: "${t.background}", text: "${t.text}"${t.border ? `, border: "${t.border}"` : ""} },`;
            })
            .join("\n")}\n  },\n`
        : "";
      return `export const theme = {
  name: ${JSON.stringify(s.name)},
  colors: {
    light: ${JSON.stringify(s.light, null, 2).replace(/\n/g, "\n    ")},
    dark: ${JSON.stringify(s.dark, null, 2).replace(/\n/g, "\n    ")},
  },
  fonts: { display: "${s.headFont}", body: "${s.bodyFont}"${s.accentFont ? `, accent: "${s.accentFont}"` : ""} },
  radius: ${s.radius},
${s.typeScale ? `  fontSize: ${JSON.stringify(s.typeScale.sizes)},\n` : ""}${s.spacing ? `  spacing: ${JSON.stringify(s.spacing.steps)},\n` : ""}${componentsBlock}} as const;
`;
    }
    case "Style Guide": {
      const lines: string[] = [`# ${s.name} — Style Guide`, "", "## Colors", "", "### Light", ""];
      (Object.entries(s.light) as Array<[string, string]>).forEach(([k, v]) => lines.push(`- **${k}**: \`${v}\``));
      lines.push("", "### Dark", "");
      (Object.entries(s.dark) as Array<[string, string]>).forEach(([k, v]) => lines.push(`- **${k}**: \`${v}\``));
      lines.push("", "## Typography", "", `- Display: ${s.headFont}`, `- Body: ${s.bodyFont}`);
      if (s.accentFont) lines.push(`- Accent: ${s.accentFont}`);
      lines.push("", "## Shape", "", `- Corner radius: ${s.radius}px`);
      if (s.typeScale) {
        lines.push("", "## Type scale", "", `Base: ${s.typeScale.baseSize}px · Ratio: ${s.typeScale.ratioName} (${s.typeScale.ratio})`, "");
        (Object.entries(s.typeScale.sizes) as Array<[string, number]>).forEach(([key, size]) =>
          lines.push(`- **${key}**: ${size}px`)
        );
      }
      if (s.spacing) {
        lines.push("", "## Spacing", "", `Base: ${s.spacing.base}px`, "");
        s.spacing.steps.forEach((step, i) => lines.push(`- Step ${i + 1}: ${step}px`));
      }
      if (s.shadows) {
        lines.push("", "## Shadows", "");
        s.shadows.levels.forEach((level) => lines.push(`- **${level.name}**: \`${level.value}\``));
      }
      if (s.designSystem) {
        lines.push("", "## Components", "");
        COMPONENT_ORDER.filter((name) => s.designSystem!.light.components[name]).forEach((name) => {
          const t = s.designSystem!.light.components[name]!;
          lines.push(`- **${name}**: background \`${t.background}\`, text \`${t.text}\`${t.border ? `, border \`${t.border}\`` : ""}`);
        });
      }
      if (s.designSystem?.accessibility) {
        lines.push("", `## Accessibility · WCAG ${s.designSystem.accessibility.level}`, "");
        s.designSystem.accessibility.notes.forEach((note) => lines.push(`- ${note}`));
      }
      if (s.designSystem?.iconStyle) {
        lines.push("", "## Icon style", "", `${s.designSystem.iconStyle.style} — ${s.designSystem.iconStyle.note}`);
      }
      if (s.designSystem?.breakpoints) {
        const bp = s.designSystem.breakpoints;
        lines.push("", "## Breakpoints", "", `sm ${bp.sm}px · md ${bp.md}px · lg ${bp.lg}px · xl ${bp.xl}px`);
      }
      return lines.join("\n");
    }
  }
}
