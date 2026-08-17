/**
 * Builds FigmaVariables from a StudioExportTokens — reuses the same numeric
 * source of truth every other export target already reads
 * (toNormalizedSystem/generateExportCode), rather than re-deriving colors,
 * spacing, or type sizes independently. This module owns *reshaping* those
 * values into the plugin's data contract, not computing new ones.
 */
import type { StudioExportTokens } from "@/lib/studio/exportCode";
import { toNormalizedSystem } from "@/lib/studio/exportCode";
import { buildNamedRadiusScale } from "@/lib/ai/radiusScale";
import { SEMANTIC_TYPE_ROLES, TYPE_SCALE_KEYS } from "@/lib/export/designTokens";
import { STATUS_DEFAULTS } from "@/lib/studio/roleProperties";
import type { FigmaVariables } from "./types";

export function serializeVariables(s: StudioExportTokens): FigmaVariables {
  const system = toNormalizedSystem(s);
  const namedByRole = (variant: typeof system.light) => Object.fromEntries(variant.map((c) => [c.name, c.hex]));
  const light = namedByRole(system.light);
  const dark = namedByRole(system.dark);

  const color: FigmaVariables["color"] = {};
  for (const role of ["accent", "support", "surface", "ink", "muted"] as const) {
    color[role] = { light: light[role], dark: dark[role] };
  }
  for (const [name, hex] of Object.entries(STATUS_DEFAULTS)) {
    color[name] = { light: hex, dark: hex };
  }

  const ramp = buildNamedRadiusScale(s.radius);

  return {
    color,
    spacing: s.spacing?.steps ?? [],
    radius: { base: s.radius, sm: ramp.sm, md: ramp.md, lg: ramp.lg, full: ramp.full },
    typeSize: s.typeScale
      ? Object.fromEntries([
          ...TYPE_SCALE_KEYS.map((key) => [key, s.typeScale!.sizes[key]]),
          ...SEMANTIC_TYPE_ROLES.map(({ role, size }) => [role, s.typeScale!.sizes[size]]),
        ])
      : {},
  };
}
