/**
 * Text-format export generators for the saved-Project API
 * (POST /api/export) — CSS custom properties, SCSS variables, a Tailwind
 * config fragment, a W3C DTCG token file, a Tokens Studio file, and a
 * readable JSON dump. The PDF style guide is a separate, fully client-side
 * export (lib/export/pdfStyleGuide.ts, rasterized with html-to-image) —
 * this file only covers the code-snippet formats.
 *
 * The token flattening and every JSON writer now come from
 * lib/export/designTokens.ts, which the Studio drawer
 * (lib/studio/exportCode.ts) uses too. Before that, this file kept its own
 * copy of `themeVariantEntries` and its `toJson` just re-serialised the
 * incoming request body — so the API's "JSON export" was whatever the
 * client happened to post, in whatever key order, with no token types at
 * all and nothing a design tool could import.
 */
import { Color } from "@/types/color";
import { Font } from "@/types/font";
import { TypeScale } from "@/types/theme";
import { SpacingScale, ShadowScale, CornerRadiusScale } from "@/types/designTokens";
import { DesignSystem } from "@/types/designSystem";
import {
  NormalizedSystem,
  SEMANTIC_TYPE_ROLES,
  TYPE_SCALE_KEYS,
  slugify,
  themeVariantEntries,
  toDtcgJson,
  toReadableJson,
  toTokensStudioJson,
} from "@/lib/export/designTokens";

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

function colorVarName(color: Color & { role?: string }, index: number): string {
  return slugify(color.role || color.name || `color-${index + 1}`);
}

function fontStack(font: Font): string {
  const fallback = font.category === "monospace" ? "monospace" : font.category === "serif" ? "serif" : "sans-serif";
  return `'${font.family}', ${fallback}`;
}

/**
 * Maps a saved Project onto the shared normalised model. A Project has no
 * light/dark *palette* pair the way the Studio does — its mode information
 * lives entirely in `designSystem.light`/`.dark` — so the palette arrays
 * stay empty and the DTCG writer builds its mode groups from the design
 * system instead. That branch is why the writer treats every group as
 * optional.
 */
export function toNormalizedSystem(project: ExportableProject): NormalizedSystem {
  return {
    name: project.name,
    brand: project.colors.map((color, index) => ({
      name: colorVarName(color, index),
      hex: color.hex,
      // Only carry real editorial metadata — a Color's `name` restated as a
      // description is noise, but a curated color's own note is not.
      description: color.role && color.name && color.role !== color.name ? color.name : undefined,
    })),
    light: [],
    dark: [],
    fonts: {
      display: project.fonts.primary.family,
      body: project.fonts.secondary.family,
      accent: project.fonts.accent?.family,
    },
    radius: project.cornerRadius?.recommended ?? 8,
    radiusOptions: project.cornerRadius?.options,
    typeScale: project.typeScale,
    spacing: project.spacing,
    shadows: project.shadows,
    designSystem: project.designSystem,
  };
}

export function toCssVariables(project: ExportableProject): string {
  const lines: string[] = [`/** Generated from "${project.name}" by StyleBook AI. */`, ":root {"];

  project.colors.forEach((color, index) => {
    lines.push(`  --color-${colorVarName(color, index)}: ${color.hex};`);
  });

  lines.push(`  --font-primary: ${fontStack(project.fonts.primary)};`);
  lines.push(`  --font-secondary: ${fontStack(project.fonts.secondary)};`);
  if (project.fonts.accent) {
    lines.push(`  --font-accent: ${fontStack(project.fonts.accent)};`);
  }

  lines.push("");
  lines.push(
    `  /* Type scale — base ${project.typeScale.baseSize}px, ratio ${project.typeScale.ratioName} (${project.typeScale.ratio}) */`
  );
  TYPE_SCALE_KEYS.forEach((key) => {
    lines.push(`  --text-${key}: ${project.typeScale.sizes[key]}px;`);
  });
  // Semantic aliases so the export states which step is a heading — the
  // same H1/H2/Body/Caption mapping the curated theme pages use. Without
  // them a developer receiving this file has ten numbers and no guidance.
  lines.push("");
  SEMANTIC_TYPE_ROLES.forEach(({ role, size }) => lines.push(`  --text-${role}: var(--text-${size});`));

  if (project.spacing) {
    lines.push("");
    project.spacing.steps.forEach((step, index) => {
      lines.push(`  --space-${index + 1}: ${step}px;`);
    });
  }

  if (project.shadows) {
    lines.push("");
    project.shadows.levels.forEach((level) => {
      lines.push(`  --shadow-${level.name}: ${level.value};`);
    });
    lines.push(`  --shadow: var(--shadow-${project.shadows.recommended});`);
  }

  if (project.cornerRadius) {
    lines.push("");
    lines.push(`  --radius: ${project.cornerRadius.recommended}px;`);
    project.cornerRadius.options.forEach((option) => lines.push(`  --radius-${option}: ${option}px;`));
  }

  if (project.designSystem) {
    lines.push("");
    themeVariantEntries(project.designSystem.light).forEach(({ key, hex }) => {
      lines.push(`  --ds-${key}: ${hex};`);
    });
    if (project.designSystem.grid) {
      const { columns, gutter, maxWidth } = project.designSystem.grid;
      lines.push(`  --ds-grid-columns: ${columns};`);
      lines.push(`  --ds-grid-gutter: ${gutter}px;`);
      lines.push(`  --ds-grid-max-width: ${maxWidth}px;`);
    }
    if (project.designSystem.breakpoints) {
      const { sm, md, lg, xl } = project.designSystem.breakpoints;
      lines.push(`  --breakpoint-sm: ${sm}px;`);
      lines.push(`  --breakpoint-md: ${md}px;`);
      lines.push(`  --breakpoint-lg: ${lg}px;`);
      lines.push(`  --breakpoint-xl: ${xl}px;`);
    }
    if (project.designSystem.iconStyle?.strokeWidth !== undefined) {
      lines.push(`  --icon-stroke-width: ${project.designSystem.iconStyle.strokeWidth}px;`);
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
    // Repeated as a comment because a custom property can't be used inside
    // a media query condition — the var above is only useful for JS.
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
  const lines: string[] = [`/// Generated from "${project.name}" by StyleBook AI.`];

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
  SEMANTIC_TYPE_ROLES.forEach(({ role, size }) => lines.push(`$text-${role}: $text-${size};`));

  if (project.spacing) {
    project.spacing.steps.forEach((step, index) => {
      lines.push(`$space-${index + 1}: ${step}px;`);
    });
  }

  if (project.shadows) {
    project.shadows.levels.forEach((level) => {
      lines.push(`$shadow-${level.name}: ${level.value};`);
    });
    lines.push(`$shadow: $shadow-${project.shadows.recommended};`);
  }

  if (project.cornerRadius) {
    lines.push(`$radius: ${project.cornerRadius.recommended}px;`);
    project.cornerRadius.options.forEach((option) => lines.push(`$radius-${option}: ${option}px;`));
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
      lines.push(`$breakpoint-sm: ${sm}px;`);
      lines.push(`$breakpoint-md: ${md}px;`);
      lines.push(`$breakpoint-lg: ${lg}px;`);
      lines.push(`$breakpoint-xl: ${xl}px;`);
    }
    if (project.designSystem.iconStyle) {
      const { style, strokeWidth, note } = project.designSystem.iconStyle;
      if (strokeWidth !== undefined) lines.push(`$icon-stroke-width: ${strokeWidth}px;`);
      lines.push(`// Icon style: ${style} — ${note}`);
    }
    if (project.designSystem.accessibility) {
      const { level, notes } = project.designSystem.accessibility;
      lines.push(`// Accessibility target: WCAG ${level}`);
      notes.forEach((note) => lines.push(`// - ${note}`));
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
    project.fonts.accent ? `        accent: [${JSON.stringify(project.fonts.accent.family)}],` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const fontSizeEntries = TYPE_SCALE_KEYS.map(
    (key) => `        '${key}': '${project.typeScale.sizes[key]}px',`
  ).join("\n");

  const blocks: string[] = [];
  // Spacing, shadows and radius were generated by the app and then dropped
  // on the floor by this format. A Tailwind config that omits them is a
  // config the developer has to finish by hand from the PDF.
  if (project.spacing) {
    blocks.push(`      spacing: {
${project.spacing.steps.map((step, i) => `        '${i + 1}': '${step}px',`).join("\n")}
      },`);
  }
  if (project.shadows) {
    blocks.push(`      boxShadow: {
${project.shadows.levels.map((level) => `        '${level.name}': '${level.value}',`).join("\n")}
        DEFAULT: '${project.shadows.levels.find((l) => l.name === project.shadows!.recommended)?.value ?? "none"}',
      },`);
  }
  if (project.cornerRadius) {
    blocks.push(`      borderRadius: {
        DEFAULT: '${project.cornerRadius.recommended}px',
${project.cornerRadius.options.map((option) => `        '${option}': '${option}px',`).join("\n")}
      },`);
  }
  if (project.designSystem?.breakpoints) {
    blocks.push(`      screens: {
        sm: '${project.designSystem.breakpoints.sm}px',
        md: '${project.designSystem.breakpoints.md}px',
        lg: '${project.designSystem.breakpoints.lg}px',
        xl: '${project.designSystem.breakpoints.xl}px',
      },`);
  }
  if (project.designSystem?.grid) {
    const { columns, gutter, maxWidth } = project.designSystem.grid;
    blocks.push(`      maxWidth: { container: '${maxWidth}px' },
      gap: { gutter: '${gutter}px' },
      gridTemplateColumns: { layout: 'repeat(${columns}, minmax(0, 1fr))' },`);
  }

  return `/** Generated from "${project.name}" by StyleBook AI. */
module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
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
${blocks.join("\n")}
    },
  },
};
`;
}

/**
 * The primary JSON export: a W3C DTCG token file, importable by the Figma
 * Design Tokens / Tokens Studio plugins. This used to be
 * `JSON.stringify(project)` — the request body echoed back — which is not
 * an interchange format at all.
 */
export function toJson(project: ExportableProject): string {
  return toDtcgJson(toNormalizedSystem(project));
}

export function toFigmaTokens(project: ExportableProject): string {
  return toTokensStudioJson(toNormalizedSystem(project));
}

export function toReadableJsonExport(project: ExportableProject): string {
  return toReadableJson(toNormalizedSystem(project));
}

export type ExportFormat = "css" | "scss" | "tailwind" | "json" | "figma" | "json-readable";

/**
 * Filename extension and MIME type per format, so the route can serve a
 * real download instead of leaving every caller to guess. The dashboard
 * previously hard-coded `text/plain` for all four formats.
 */
export const EXPORT_FORMAT_META: Record<ExportFormat, { ext: string; contentType: string; label: string }> = {
  css: { ext: "css", contentType: "text/css;charset=utf-8", label: "CSS variables" },
  scss: { ext: "scss", contentType: "text/x-scss;charset=utf-8", label: "SCSS variables" },
  tailwind: { ext: "js", contentType: "text/javascript;charset=utf-8", label: "Tailwind config" },
  json: { ext: "tokens.json", contentType: "application/json;charset=utf-8", label: "Design tokens (W3C DTCG)" },
  figma: { ext: "figma.tokens.json", contentType: "application/json;charset=utf-8", label: "Figma / Tokens Studio" },
  "json-readable": { ext: "json", contentType: "application/json;charset=utf-8", label: "Readable JSON" },
};

export function exportFileName(project: { name: string }, format: ExportFormat): string {
  return `${slugify(project.name) || "stylebook"}.${EXPORT_FORMAT_META[format].ext}`;
}

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
    case "figma":
      return toFigmaTokens(project);
    case "json-readable":
      return toReadableJsonExport(project);
  }
}
