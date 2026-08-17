/**
 * "Whole canvas" export — one FigmaFrameNode per page, mirroring
 * ShowcaseContent.tsx section-for-section (navbar, hero, notice, stats,
 * features, tabs, pricing table, form, rollout, danger zone, footer) so a
 * canvas export actually matches what Studio's own preview shows, not a
 * partial slice of it.
 *
 * GeneratedContent's AISectionType templates (statRow/itemGrid/recordTable/
 * …) aren't mapped yet — that's the AI-generated content state, a separate
 * page tree from Showcase, and out of scope for this pass. Add one template
 * function + one dispatch case per section type when that coverage is
 * needed; nothing else in the pipeline has to change to support it.
 */
import type { StudioExportTokens } from "@/lib/studio/exportCode";
import { LAYOUT_MAP, resolveSpacing, resolveRadius } from "./layoutMap";
import { iconSvg } from "./icons";
import type { FigmaFrameNode, FigmaVariables } from "./types";

function text(
  name: string,
  characters: string,
  size: number,
  weight: number,
  fillVar: string,
  fontFamily: "display" | "body" = "body"
): FigmaFrameNode {
  return { kind: "text", name, text: { characters, size, weight, fontFamily, fillVar } };
}

function card(name: string, variables: FigmaVariables, children: FigmaFrameNode[], direction: "HORIZONTAL" | "VERTICAL" = "VERTICAL"): FigmaFrameNode {
  return {
    kind: "frame",
    name,
    layout: { direction, gap: resolveSpacing({ space: 2 }, variables.spacing), padding: [20, 20, 20, 20] },
    radius: resolveRadius("md", variables.radius),
    fill: { variable: "surface" },
    stroke: { paint: { variable: "muted" }, width: 1 },
    children,
  };
}

function button(name: string, label: string, variables: FigmaVariables, kind: "primary" | "outline" | "ghost" | "secondary" = "primary"): FigmaFrameNode {
  const fill: FigmaFrameNode["fill"] = kind === "primary" ? { variable: "accent" } : kind === "secondary" ? { variable: "support" } : undefined;
  return {
    kind: "frame",
    name,
    layout: { direction: "HORIZONTAL", gap: 8, padding: [9, 16, 9, 16], primaryAlign: "CENTER", counterAlign: "CENTER" },
    radius: resolveRadius("md", variables.radius),
    fill,
    stroke: kind === "outline" ? { paint: { variable: "muted" }, width: 1 } : undefined,
    children: [{ kind: "text", name: "label", text: { characters: label, size: variables.typeSize.sm ?? 14, weight: 600, fontFamily: "body", fillVar: fill ? undefined : "ink", fillHex: fill ? "#FFFFFF" : undefined } }],
  };
}

function sectionHeading(eyebrow: string, title: string, variables: FigmaVariables): FigmaFrameNode {
  return {
    kind: "frame",
    name: "heading",
    layout: { direction: "VERTICAL", gap: 6 },
    children: [
      text("eyebrow", eyebrow.toUpperCase(), variables.typeSize.xs ?? 12, 600, "muted"),
      text("title", title, variables.typeSize["2xl"] ?? 25, 700, "ink", "display"),
    ],
  };
}

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
      text("brand", systemName, variables.typeSize.lg ?? 21, 700, "ink", "display"),
      { kind: "frame", name: "actions", layout: { direction: "HORIZONTAL", gap: 12, counterAlign: "CENTER" }, children: [{ kind: "vector", name: "Search icon", iconSvg: iconSvg("Search") }] },
    ],
  };
}

function hero(systemName: string, variables: FigmaVariables): FigmaFrameNode {
  return {
    kind: "frame",
    name: "Hero",
    layout: { direction: "VERTICAL", gap: resolveSpacing({ space: 3 }, variables.spacing), padding: [64, 48, 32, 48] },
    fill: { variable: "surface" },
    children: [
      text("headline", `${systemName} ships itself`, variables.typeSize["4xl"] ?? 39, 700, "ink", "display"),
      text("subhead", "Every colour, typeface, and component in one place.", variables.typeSize.base ?? 16, 400, "muted"),
      {
        kind: "frame",
        name: "cta row",
        layout: { direction: "HORIZONTAL", gap: 12, counterAlign: "CENTER" },
        children: [button("Start free trial", "Start free trial", variables, "primary"), button("Book a walkthrough", "Book a walkthrough", variables, "outline")],
      },
    ],
  };
}

function notice(variables: FigmaVariables): FigmaFrameNode {
  return {
    kind: "frame",
    name: "Notice",
    layout: { direction: "HORIZONTAL", gap: 10, padding: [14, 48, 14, 48], counterAlign: "CENTER" },
    fill: { variable: "surface" },
    children: [
      { kind: "vector", name: "icon", iconSvg: iconSvg("Check") },
      {
        kind: "frame",
        name: "body",
        layout: { direction: "VERTICAL", gap: 2 },
        children: [
          text("title", "Dark variant derived automatically", variables.typeSize.sm ?? 14, 600, "ink"),
          text("text", "Every role below has a dark counterpart. You can override any of them before you publish.", variables.typeSize.xs ?? 12, 400, "muted"),
        ],
      },
    ],
  };
}

const STATS = [
  { value: "1,284", label: "Tokens under management" },
  { value: "37", label: "Products on the system" },
  { value: "99.2%", label: "Contrast checks passing" },
];

function statsGrid(variables: FigmaVariables): FigmaFrameNode {
  return {
    kind: "frame",
    name: "Stats",
    layout: { direction: "HORIZONTAL", gap: resolveSpacing({ space: 3 }, variables.spacing), padding: [0, 48, 0, 48] },
    children: STATS.map((stat) =>
      card(stat.label, variables, [text("value", stat.value, variables.typeSize["2xl"] ?? 25, 700, "ink", "display"), text("label", stat.label, variables.typeSize.xs ?? 12, 400, "muted")])
    ),
  };
}

const FEATURES = [
  { badge: "Foundations", title: "One source of truth", body: "Colour, type, spacing and shape live in a single system every surface reads from." },
  { badge: "Live", title: "Change once, everywhere", body: "Edit a token and watch every component that references it move in the same instant." },
  { badge: "Export", title: "Ships where you work", body: "CSS, Tailwind, SwiftUI, Flutter, Figma — generated from the same definitions you edited." },
];

function featuresGrid(variables: FigmaVariables): FigmaFrameNode {
  return {
    kind: "frame",
    name: "Features",
    layout: { direction: "VERTICAL", gap: resolveSpacing({ space: 4 }, variables.spacing), padding: [0, 48, 0, 48] },
    children: [
      sectionHeading("Why teams switch", "Everything the interface is made of", variables),
      {
        kind: "frame",
        name: "cards",
        layout: { direction: "HORIZONTAL", gap: resolveSpacing({ space: 3 }, variables.spacing) },
        children: FEATURES.map((f) =>
          card(f.title, variables, [
            text("badge", f.badge, variables.typeSize.xs ?? 12, 600, "accent"),
            text("title", f.title, variables.typeSize.lg ?? 18, 700, "ink", "display"),
            text("body", f.body, variables.typeSize.sm ?? 14, 400, "muted"),
          ])
        ),
      },
    ],
  };
}

function tabsSection(variables: FigmaVariables): FigmaFrameNode {
  return {
    kind: "frame",
    name: "Tabs",
    layout: { direction: "VERTICAL", gap: resolveSpacing({ space: 3 }, variables.spacing), padding: [0, 48, 0, 48] },
    children: [
      sectionHeading("Inside the product", "Built to be looked at closely", variables),
      {
        kind: "frame",
        name: "tablist",
        layout: { direction: "HORIZONTAL", gap: 2 },
        children: ["Overview", "Components", "Tokens", "Usage"].map((label, i) => ({
          kind: "frame",
          name: label,
          layout: { direction: "HORIZONTAL", padding: [10, 14, 10, 14] },
          fill: i === 0 ? { variable: "surface" } : undefined,
          radius: resolveRadius("sm", variables.radius),
          children: [text("label", label, variables.typeSize.sm ?? 14, 600, i === 0 ? "ink" : "muted")],
        })),
      },
    ],
  };
}

const PLANS = [
  { name: "Starter", seats: "Up to 3 editors", price: "£0", status: "Current" },
  { name: "Studio", seats: "Up to 20 editors", price: "£18", status: "Popular" },
  { name: "Enterprise", seats: "Unlimited editors", price: "Custom", status: "SSO" },
];

function pricingTable(variables: FigmaVariables): FigmaFrameNode {
  const cols = ["Plan", "Editors", "Status", "Price"];
  return {
    kind: "frame",
    name: "Pricing",
    layout: { direction: "VERTICAL", gap: resolveSpacing({ space: 3 }, variables.spacing), padding: [0, 48, 0, 48] },
    children: [
      sectionHeading("Pricing", "Plans that scale with the system", variables),
      {
        kind: "frame",
        name: "table",
        layout: { direction: "VERTICAL", gap: 10, padding: [16, 20, 16, 20] },
        radius: resolveRadius("md", variables.radius),
        fill: { variable: "surface" },
        stroke: { paint: { variable: "muted" }, width: 1 },
        children: [
          { kind: "frame", name: "header", layout: { direction: "HORIZONTAL", gap: 24 }, children: cols.map((c, i) => text(`h-${i}`, c, variables.typeSize.xs ?? 12, 700, "muted")) },
          ...PLANS.map((plan) => ({
            kind: "frame" as const,
            name: plan.name,
            layout: { direction: "HORIZONTAL" as const, gap: 24, counterAlign: "CENTER" as const },
            children: [text(`n-${plan.name}`, plan.name, variables.typeSize.sm ?? 14, 600, "ink"), text(`s-${plan.name}`, plan.seats, variables.typeSize.sm ?? 14, 400, "muted"), text(`st-${plan.name}`, plan.status, variables.typeSize.xs ?? 12, 600, "accent"), text(`p-${plan.name}`, plan.price, variables.typeSize.sm ?? 14, 700, "ink")],
          })),
        ],
      },
    ],
  };
}

function formSection(variables: FigmaVariables): FigmaFrameNode {
  return {
    kind: "frame",
    name: "Form",
    layout: { direction: "VERTICAL", gap: resolveSpacing({ space: 3 }, variables.spacing), padding: [0, 48, 0, 48] },
    children: [
      sectionHeading("Get started", "Request a walkthrough", variables),
      {
        kind: "frame",
        name: "row",
        layout: { direction: "HORIZONTAL", gap: resolveSpacing({ space: 3 }, variables.spacing) },
        children: [
          card("form", variables, [
            text("l-company", "Company", variables.typeSize.xs ?? 12, 600, "muted"),
            { kind: "frame", name: "company field", layout: { direction: "HORIZONTAL", padding: [10, 12, 10, 12] }, radius: resolveRadius("md", variables.radius), stroke: { paint: { variable: "muted" }, width: 1 }, children: [text("v", "Northwind Studio", variables.typeSize.sm ?? 14, 400, "ink")] },
            text("l-email", "Email", variables.typeSize.xs ?? 12, 600, "muted"),
            { kind: "frame", name: "email field", layout: { direction: "HORIZONTAL", padding: [10, 12, 10, 12] }, radius: resolveRadius("md", variables.radius), stroke: { paint: { variable: "muted" }, width: 1 }, children: [text("v", "you@company.com", variables.typeSize.sm ?? 14, 400, "muted")] },
            button("submit", "Save", variables, "primary"),
          ]),
          card("aside", variables, [
            text("title", "What to send me", variables.typeSize.sm ?? 14, 600, "ink"),
            text("opt-1", "☐ Product updates", variables.typeSize.sm ?? 14, 400, "muted"),
            text("opt-2", "☐ Design system tips", variables.typeSize.sm ?? 14, 400, "muted"),
            text("opt-3", "☐ Early access invites", variables.typeSize.sm ?? 14, 400, "muted"),
          ]),
        ],
      },
    ],
  };
}

function rolloutSection(variables: FigmaVariables): FigmaFrameNode {
  return {
    kind: "frame",
    name: "Rollout",
    layout: { direction: "VERTICAL", gap: resolveSpacing({ space: 3 }, variables.spacing), padding: [0, 48, 0, 48] },
    children: [
      sectionHeading("Rollout", "Where the migration stands", variables),
      {
        kind: "frame",
        name: "row",
        layout: { direction: "HORIZONTAL", gap: resolveSpacing({ space: 3 }, variables.spacing) },
        children: [
          card("progress", variables, [
            text("l1", "Component coverage", variables.typeSize.sm ?? 14, 600, "ink"),
            { kind: "frame", name: "bar", layout: { direction: "HORIZONTAL" }, height: 6, radius: resolveRadius("full", variables.radius), fill: { variable: "muted" }, children: [{ kind: "frame", name: "fill", width: 140, height: 6, radius: resolveRadius("full", variables.radius), fill: { variable: "accent" } }] },
          ]),
          card("testimonial", variables, [
            text("name", "Mariam Okonjo", variables.typeSize.sm ?? 14, 600, "ink"),
            text("role", "Principal designer · Lagos", variables.typeSize.xs ?? 12, 400, "muted"),
            text("quote", "We stopped arguing about hex codes in review — the system answers it.", variables.typeSize.sm ?? 14, 400, "muted"),
          ]),
        ],
      },
    ],
  };
}

function dangerZone(variables: FigmaVariables): FigmaFrameNode {
  return {
    kind: "frame",
    name: "Danger zone",
    layout: { direction: "VERTICAL", gap: resolveSpacing({ space: 3 }, variables.spacing), padding: [0, 48, 0, 48] },
    children: [
      sectionHeading("Workspace settings", "Irreversible things live here", variables),
      card("panel", variables, [
        text("text", "Deleting a design system removes every token, export and linked project.", variables.typeSize.sm ?? 14, 400, "muted"),
        { kind: "frame", name: "actions", layout: { direction: "HORIZONTAL", gap: 10 }, children: [button("delete", "Delete system", variables, "primary"), button("archive", "Archive instead", variables, "ghost")] },
      ]),
    ],
  };
}

function footer(systemName: string, variables: FigmaVariables): FigmaFrameNode {
  return {
    kind: "frame",
    name: "Footer",
    layout: { direction: "HORIZONTAL", gap: resolveSpacing({ space: 3 }, variables.spacing), padding: [20, 48, 32, 48], primaryAlign: "SPACE_BETWEEN", counterAlign: "CENTER" },
    children: [
      {
        kind: "frame",
        name: "swatches",
        layout: { direction: "HORIZONTAL", gap: 8 },
        children: ["accent", "support", "surface", "ink", "muted"].map((role) => ({ kind: "frame", name: role, width: 32, height: 24, radius: resolveRadius("sm", variables.radius), fill: { variable: role }, stroke: { paint: { variable: "muted" }, width: 1 } })),
      },
      text("credit", `${systemName} · every element on this page is a live component reading your tokens`, variables.typeSize.xs ?? 12, 400, "muted"),
    ],
  };
}

export function serializeShowcaseCanvas(s: StudioExportTokens, variables: FigmaVariables): FigmaFrameNode {
  return {
    kind: "frame",
    name: `${s.name} — Showcase`,
    layout: { direction: "VERTICAL", gap: resolveSpacing({ space: 6 }, variables.spacing) },
    fill: { variable: "surface" },
    children: [
      navbar(s.name, variables),
      hero(s.name, variables),
      notice(variables),
      statsGrid(variables),
      featuresGrid(variables),
      tabsSection(variables),
      pricingTable(variables),
      formSection(variables),
      rolloutSection(variables),
      dangerZone(variables),
      footer(s.name, variables),
    ],
  };
}
