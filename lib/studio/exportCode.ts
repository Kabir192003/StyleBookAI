/**
 * Pure code-generation for the Studio export drawer — no React, no side
 * effects. Given the current token state, formats it as a ready-to-paste
 * file in each supported target format.
 */
export type StudioTokens = {
  name: string;
  accent: string;
  support: string;
  surface: string;
  ink: string;
  muted: string;
  headFont: string;
  bodyFont: string;
  radius: number;
};

export const EXPORT_TABS = ["CSS", "Tailwind", "JSON", "SwiftUI", "Figma"] as const;
export type ExportTab = (typeof EXPORT_TABS)[number];

export const EXPORT_FILES: Record<ExportTab, string> = {
  CSS: "tokens.css",
  Tailwind: "tailwind.config.js",
  JSON: "tokens.json",
  SwiftUI: "Color+Tokens.swift",
  Figma: "figma.tokens.json",
};

export function generateExportCode(tab: ExportTab, s: StudioTokens): string {
  switch (tab) {
    case "CSS":
      return `:root {
  --color-accent: ${s.accent};
  --color-support: ${s.support};
  --color-surface: ${s.surface};
  --color-ink: ${s.ink};
  --color-muted: ${s.muted};

  --font-display: "${s.headFont}", serif;
  --font-body: "${s.bodyFont}", sans-serif;

  --radius: ${s.radius}px;
}`;
    case "Tailwind":
      return `module.exports = {
  theme: {
    extend: {
      colors: {
        accent: '${s.accent}',
        support: '${s.support}',
        surface: '${s.surface}',
        ink: '${s.ink}',
        muted: '${s.muted}',
      },
      fontFamily: {
        display: ['${s.headFont}', 'serif'],
        body: ['${s.bodyFont}', 'sans-serif'],
      },
      borderRadius: { DEFAULT: '${s.radius}px' },
    },
  },
};`;
    case "JSON":
      return JSON.stringify(
        {
          name: s.name,
          color: { accent: s.accent, support: s.support, surface: s.surface, ink: s.ink, muted: s.muted },
          type: { display: s.headFont, body: s.bodyFont },
          radius: `${s.radius}px`,
        },
        null,
        2
      );
    case "SwiftUI": {
      const swatch = (name: string, hex: string) => `    static let ${name} = Color(hex: "${hex.replace("#", "")}")`;
      return `import SwiftUI

extension Color {
${swatch("accent", s.accent)}
${swatch("support", s.support)}
${swatch("surface", s.surface)}
${swatch("ink", s.ink)}
${swatch("muted", s.muted)}
}`;
    }
    case "Figma":
      return JSON.stringify(
        {
          [s.name]: {
            color: {
              accent: { value: s.accent, type: "color" },
              support: { value: s.support, type: "color" },
              surface: { value: s.surface, type: "color" },
              ink: { value: s.ink, type: "color" },
              muted: { value: s.muted, type: "color" },
            },
            radius: { value: `${s.radius}px`, type: "borderRadius" },
          },
        },
        null,
        2
      );
  }
}
