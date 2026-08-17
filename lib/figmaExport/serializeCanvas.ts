/**
 * "Whole canvas" export — one FigmaFrameNode per page, built from the same
 * ShowcaseContent/GeneratedContent structure Studio itself renders.
 *
 * V1 coverage is deliberately partial and honest about it: the navbar and
 * hero (present in both content states, and the most immediately useful
 * "see it land in Figma" slice) are fully mapped. GeneratedContent's other
 * eleven AISectionType templates (statRow/itemGrid/recordTable/…) aren't
 * implemented yet — sections outside this list are skipped, not crashed on,
 * matching GeneratedContent's own "unknown type renders null" fail-soft
 * pattern. Add one template function + one dispatch case per section type
 * as canvas-export coverage grows; nothing else in the pipeline needs to
 * change to support that.
 */
import type { StudioExportTokens } from "@/lib/studio/exportCode";
import { deriveThemeVariantFromPalette } from "@/lib/studio/deriveThemeVariant";
import { LAYOUT_MAP, resolveSpacing, resolveRadius } from "./layoutMap";
import { iconSvg } from "./icons";
import type { FigmaFrameNode, FigmaVariables } from "./types";

function navbar(systemName: string, variables: FigmaVariables): FigmaFrameNode {
  const spec = LAYOUT_MAP["pg-navbar"];
  return {
    kind: "frame",
    name: "Navbar",
    layout: {
      direction: "HORIZONTAL",
      gap: resolveSpacing(spec.gap!, variables.spacing),
      padding: spec.padding!.map((p) => resolveSpacing(p, variables.spacing)) as [number, number, number, number],
      primaryAlign: "SPACE_BETWEEN",
      counterAlign: "CENTER",
    },
    radius: resolveRadius(spec.radius, variables.radius),
    fill: { variable: "surface" },
    children: [
      {
        kind: "text",
        name: "brand",
        text: { characters: systemName, size: variables.typeSize.lg ?? 21, weight: 700, fontFamily: "display", fillVar: "ink" },
      },
      {
        kind: "frame",
        name: "actions",
        layout: { direction: "HORIZONTAL", gap: 12, counterAlign: "CENTER" },
        children: [{ kind: "vector", name: "Search icon", iconSvg: iconSvg("Search") }],
      },
    ],
  };
}

function hero(systemName: string, variables: FigmaVariables): FigmaFrameNode {
  return {
    kind: "frame",
    name: "Hero",
    layout: { direction: "VERTICAL", gap: resolveSpacing({ space: 3 }, variables.spacing), padding: [64, 48, 64, 48] },
    fill: { variable: "surface" },
    children: [
      {
        kind: "text",
        name: "headline",
        text: { characters: `${systemName} ships itself`, size: variables.typeSize["4xl"] ?? 39, weight: 700, fontFamily: "display", fillVar: "ink" },
      },
      {
        kind: "text",
        name: "subhead",
        text: {
          characters: "Every colour, typeface, and component in one place.",
          size: variables.typeSize.base ?? 16,
          weight: 400,
          fontFamily: "body",
          fillVar: "muted",
        },
      },
      {
        kind: "frame",
        name: "cta row",
        layout: { direction: "HORIZONTAL", gap: 12, counterAlign: "CENTER" },
        children: [
          {
            kind: "frame",
            name: "Start free trial",
            layout: {
              direction: "HORIZONTAL",
              gap: 8,
              padding: [11, 18, 11, 18],
              primaryAlign: "CENTER",
              counterAlign: "CENTER",
            },
            radius: resolveRadius("md", variables.radius),
            fill: { variable: "accent" },
            children: [
              { kind: "text", name: "label", text: { characters: "Start free trial", size: variables.typeSize.sm ?? 14, weight: 600, fontFamily: "body", fillHex: "#FFFFFF" } },
              { kind: "vector", name: "icon", iconSvg: iconSvg("ArrowRight") },
            ],
          },
          {
            kind: "frame",
            name: "Book a walkthrough",
            layout: { direction: "HORIZONTAL", gap: 8, padding: [11, 18, 11, 18], primaryAlign: "CENTER", counterAlign: "CENTER" },
            radius: resolveRadius("md", variables.radius),
            stroke: { paint: { variable: "muted" }, width: 1 },
            children: [{ kind: "text", name: "label", text: { characters: "Book a walkthrough", size: variables.typeSize.sm ?? 14, weight: 600, fontFamily: "body", fillVar: "ink" } }],
          },
        ],
      },
    ],
  };
}

export function serializeShowcaseCanvas(s: StudioExportTokens, variables: FigmaVariables): FigmaFrameNode {
  void deriveThemeVariantFromPalette; // reserved: card/stat/feature sections read component tokens once those templates exist
  return {
    kind: "frame",
    name: `${s.name} — Showcase`,
    layout: { direction: "VERTICAL", gap: 0 },
    fill: { variable: "surface" },
    children: [navbar(s.name, variables), hero(s.name, variables)],
  };
}
