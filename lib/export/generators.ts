/**
 * Text-format export generators — CSS custom properties, SCSS variables,
 * a Tailwind config fragment, and raw JSON. PNG/PDF export stays
 * client-side via html-to-image (see docs/TECHNICAL_ARCHITECTURE.md),
 * this file only covers the code-snippet formats.
 */
import { Color } from "@/types/color";
import { Font } from "@/types/font";
import { TypeScale } from "@/types/theme";

export type ExportableProject = {
  name: string;
  colors: Array<Color & { role?: string }>;
  fonts: { primary: Font; secondary: Font; accent?: Font };
  typeScale: TypeScale;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function colorVarName(color: Color & { role?: string }, index: number): string {
  return slugify(color.role || color.name || `color-${index + 1}`);
}

function fontStack(font: Font): string {
  const fallback = font.category === "monospace" ? "monospace" : font.category === "serif" ? "serif" : "sans-serif";
  return `'${font.family}', ${fallback}`;
}

const TYPE_SCALE_KEYS: Array<keyof TypeScale["sizes"]> = [
  "xs",
  "sm",
  "base",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
];

export function toCssVariables(project: ExportableProject): string {
  const lines: string[] = [":root {"];

  project.colors.forEach((color, index) => {
    lines.push(`  --color-${colorVarName(color, index)}: ${color.hex};`);
  });

  lines.push(`  --font-primary: ${fontStack(project.fonts.primary)};`);
  lines.push(`  --font-secondary: ${fontStack(project.fonts.secondary)};`);
  if (project.fonts.accent) {
    lines.push(`  --font-accent: ${fontStack(project.fonts.accent)};`);
  }

  TYPE_SCALE_KEYS.forEach((key) => {
    lines.push(`  --text-${key}: ${project.typeScale.sizes[key]}px;`);
  });

  lines.push("}");
  return lines.join("\n");
}

export function toScssVariables(project: ExportableProject): string {
  const lines: string[] = [];

  project.colors.forEach((color, index) => {
    lines.push(`$color-${colorVarName(color, index)}: ${color.hex};`);
  });

  lines.push(`$font-primary: ${fontStack(project.fonts.primary)};`);
  lines.push(`$font-secondary: ${fontStack(project.fonts.secondary)};`);
  if (project.fonts.accent) {
    lines.push(`$font-accent: ${fontStack(project.fonts.accent)};`);
  }

  TYPE_SCALE_KEYS.forEach((key) => {
    lines.push(`$text-${key}: ${project.typeScale.sizes[key]}px;`);
  });

  return lines.join("\n");
}

export function toTailwindConfig(project: ExportableProject): string {
  const colorEntries = project.colors
    .map((color, index) => `        '${colorVarName(color, index)}': '${color.hex}',`)
    .join("\n");

  const fontFamilyEntries = [
    `        primary: [${JSON.stringify(project.fonts.primary.family)}],`,
    `        secondary: [${JSON.stringify(project.fonts.secondary.family)}],`,
    project.fonts.accent
      ? `        accent: [${JSON.stringify(project.fonts.accent.family)}],`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const fontSizeEntries = TYPE_SCALE_KEYS.map(
    (key) => `        '${key}': '${project.typeScale.sizes[key]}px',`
  ).join("\n");

  return `/** Generated from "${project.name}" by StyleBook */
module.exports = {
  theme: {
    extend: {
      colors: {
${colorEntries}
      },
      fontFamily: {
${fontFamilyEntries}
      },
      fontSize: {
${fontSizeEntries}
      },
    },
  },
};
`;
}

export function toJson(project: ExportableProject): string {
  return JSON.stringify(project, null, 2);
}

export type ExportFormat = "css" | "scss" | "tailwind" | "json";

export function generateExport(project: ExportableProject, format: ExportFormat): string {
  switch (format) {
    case "css":
      return toCssVariables(project);
    case "scss":
      return toScssVariables(project);
    case "tailwind":
      return toTailwindConfig(project);
    case "json":
      return toJson(project);
  }
}
