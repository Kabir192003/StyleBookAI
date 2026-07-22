/**
 * Text-format export generators — CSS custom properties, SCSS variables,
 * a Tailwind config fragment, and raw JSON. PNG/PDF export stays
 * client-side via html-to-image (see docs/TECHNICAL_ARCHITECTURE.md),
 * this file only covers the code-snippet formats.
 */
import { Color } from "@/types/color";
import { Font } from "@/types/font";
import { TypeScale } from "@/types/theme";
import { SpacingScale, ShadowScale, CornerRadiusScale } from "@/types/designTokens";
import { ComponentName, ComponentTokenSet, DesignSystem, ThemeVariantTokens } from "@/types/designSystem";

export type ExportableProject = {
  name: string;
  colors: Array<Color & { role?: string }>;
  fonts: { primary: Font; secondary: Font; accent?: Font };
  typeScale: TypeScale;
  spacing?: SpacingScale;
  shadows?: ShadowScale;
  cornerRadius?: CornerRadiusScale;
  designSystem?: DesignSystem;
};

const COMPONENT_STATE_NAMES = ["hover", "active", "disabled", "focus"] as const;

// One entry per (property, suffix) pair to emit for a component's base +
// state tokens — used by both the CSS/SCSS var writer and the Tailwind
// color-entry writer so the two stay in sync.
function componentTokenEntries(
  name: ComponentName,
  tokens: ComponentTokenSet
): Array<{ key: string; hex: string }> {
  const entries: Array<{ key: string; hex: string }> = [
    { key: `${name}-bg`, hex: tokens.background },
    { key: `${name}-text`, hex: tokens.text },
  ];
  if (tokens.border) entries.push({ key: `${name}-border`, hex: tokens.border });

  for (const state of COMPONENT_STATE_NAMES) {
    const override = tokens.states?.[state];
    if (!override) continue;
    if (override.background) entries.push({ key: `${name}-bg-${state}`, hex: override.background });
    if (override.text) entries.push({ key: `${name}-text-${state}`, hex: override.text });
    if (override.border) entries.push({ key: `${name}-border-${state}`, hex: override.border });
  }

  return entries;
}

function themeVariantEntries(variant: ThemeVariantTokens): Array<{ key: string; hex: string }> {
  const { colorRoles, components } = variant;
  const entries: Array<{ key: string; hex: string }> = [
    { key: "color-bg", hex: colorRoles.background },
    { key: "color-surface", hex: colorRoles.surface },
    { key: "color-text", hex: colorRoles.text },
    { key: "color-text-muted", hex: colorRoles.textMuted },
    { key: "color-border", hex: colorRoles.border },
  ];
  (Object.keys(components) as ComponentName[]).forEach((name) => {
    const tokens = components[name];
    if (tokens) entries.push(...componentTokenEntries(name, tokens));
  });
  return entries;
}

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

  if (project.spacing) {
    project.spacing.steps.forEach((step, index) => {
      lines.push(`  --space-${index + 1}: ${step}px;`);
    });
  }

  if (project.shadows) {
    project.shadows.levels.forEach((level) => {
      lines.push(`  --shadow-${level.name}: ${level.value};`);
    });
  }

  if (project.cornerRadius) {
    lines.push(`  --radius: ${project.cornerRadius.recommended}px;`);
  }

  if (project.designSystem) {
    themeVariantEntries(project.designSystem.light).forEach(({ key, hex }) => {
      lines.push(`  --ds-${key}: ${hex};`);
    });
    if (project.designSystem.grid) {
      const { columns, gutter, maxWidth } = project.designSystem.grid;
      lines.push(`  --ds-grid-columns: ${columns};`);
      lines.push(`  --ds-grid-gutter: ${gutter}px;`);
      lines.push(`  --ds-grid-max-width: ${maxWidth}px;`);
    }
  }

  lines.push("}");

  if (project.designSystem?.dark) {
    lines.push("");
    lines.push('[data-theme="dark"] {');
    themeVariantEntries(project.designSystem.dark).forEach(({ key, hex }) => {
      lines.push(`  --ds-${key}: ${hex};`);
    });
    lines.push("}");
  }

  if (project.designSystem?.breakpoints) {
    const { sm, md, lg, xl } = project.designSystem.breakpoints;
    lines.push("");
    lines.push(`/* Breakpoints: sm ${sm}px, md ${md}px, lg ${lg}px, xl ${xl}px */`);
  }

  if (project.designSystem?.iconStyle) {
    const { style, strokeWidth, note } = project.designSystem.iconStyle;
    lines.push(`/* Icon style: ${style}${strokeWidth ? `, ${strokeWidth}px stroke` : ""} — ${note} */`);
  }

  if (project.designSystem?.accessibility) {
    const { level, notes } = project.designSystem.accessibility;
    lines.push(`/* Accessibility target: WCAG ${level} */`);
    notes.forEach((note) => lines.push(`/* - ${note} */`));
  }

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

  if (project.spacing) {
    project.spacing.steps.forEach((step, index) => {
      lines.push(`$space-${index + 1}: ${step}px;`);
    });
  }

  if (project.shadows) {
    project.shadows.levels.forEach((level) => {
      lines.push(`$shadow-${level.name}: ${level.value};`);
    });
  }

  if (project.cornerRadius) {
    lines.push(`$radius: ${project.cornerRadius.recommended}px;`);
  }

  if (project.designSystem) {
    themeVariantEntries(project.designSystem.light).forEach(({ key, hex }) => {
      lines.push(`$ds-${key}: ${hex};`);
    });
    if (project.designSystem.grid) {
      const { columns, gutter, maxWidth } = project.designSystem.grid;
      lines.push(`$ds-grid-columns: ${columns};`);
      lines.push(`$ds-grid-gutter: ${gutter}px;`);
      lines.push(`$ds-grid-max-width: ${maxWidth}px;`);
    }
    if (project.designSystem.dark) {
      // SCSS variables don't cascade like CSS custom properties, so the
      // dark variant gets its own prefix rather than an override block.
      themeVariantEntries(project.designSystem.dark).forEach(({ key, hex }) => {
        lines.push(`$ds-dark-${key}: ${hex};`);
      });
    }
    if (project.designSystem.breakpoints) {
      const { sm, md, lg, xl } = project.designSystem.breakpoints;
      lines.push(`// Breakpoints: sm ${sm}px, md ${md}px, lg ${lg}px, xl ${xl}px`);
    }
  }

  return lines.join("\n");
}

export function toTailwindConfig(project: ExportableProject): string {
  const colorEntries = [
    ...project.colors.map((color, index) => `'${colorVarName(color, index)}': '${color.hex}'`),
    ...(project.designSystem
      ? themeVariantEntries(project.designSystem.light).map(({ key, hex }) => `'ds-${key}': '${hex}'`)
      : []),
    ...(project.designSystem?.dark
      ? themeVariantEntries(project.designSystem.dark).map(({ key, hex }) => `'ds-dark-${key}': '${hex}'`)
      : []),
  ]
    .map((entry) => `        ${entry},`)
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

  const screensBlock = project.designSystem?.breakpoints
    ? `      screens: {
        sm: '${project.designSystem.breakpoints.sm}px',
        md: '${project.designSystem.breakpoints.md}px',
        lg: '${project.designSystem.breakpoints.lg}px',
        xl: '${project.designSystem.breakpoints.xl}px',
      },
`
    : "";

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
${screensBlock}    },
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
