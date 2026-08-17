/**
 * Hand-authored `.pg-*` class name → Figma Auto Layout properties.
 *
 * components/system/styles.ts never varies a component's *topology*
 * (display/flex-direction/align/justify) by design system — those are
 * always literal CSS keywords, only the magnitudes (gap/padding/radius) come
 * from tokens. That means the shape of every component is knowable once,
 * here, rather than measured per-export. Values below are transcribed
 * directly from styles.ts; `--space-N` references resolve through
 * `spacingPx()` against the live SpacingScale at serialize time rather than
 * being hardcoded, so a project's actual spacing base is respected.
 *
 * This table is NOT auto-generated from styles.ts — if a class's layout
 * rule changes there, this file needs a matching edit. Deliberately no
 * codegen for V1 (see the plan's "explicitly out of scope").
 */

export type SpacingRef = { space: number } | { px: number };

export type LayoutSpec = {
  direction: "HORIZONTAL" | "VERTICAL" | "NONE";
  gap?: SpacingRef;
  padding?: [SpacingRef, SpacingRef, SpacingRef, SpacingRef]; // top right bottom left
  primaryAlign?: "MIN" | "MAX" | "CENTER" | "SPACE_BETWEEN";
  counterAlign?: "MIN" | "MAX" | "CENTER" | "BASELINE";
  radius?: "full" | "sm" | "md" | number;
};

export const LAYOUT_MAP: Record<string, LayoutSpec> = {
  "pg-btn": {
    direction: "HORIZONTAL",
    gap: { px: 8 },
    padding: [{ px: 11 }, { px: 18 }, { px: 11 }, { px: 18 }],
    primaryAlign: "CENTER",
    counterAlign: "CENTER",
    radius: "md",
  },
  "pg-btn--sm": { direction: "HORIZONTAL", gap: { px: 6 }, padding: [{ px: 7 }, { px: 12 }, { px: 7 }, { px: 12 }] },
  "pg-btn--lg": { direction: "HORIZONTAL", padding: [{ px: 14 }, { px: 24 }, { px: 14 }, { px: 24 }] },
  "pg-field": { direction: "VERTICAL", gap: { px: 6 } },
  "pg-input": { direction: "HORIZONTAL", padding: [{ px: 10 }, { px: 12 }, { px: 10 }, { px: 12 }], radius: "md" },
  // pg-card itself carries no padding in styles.ts — only its .pg-card__body
  // child does. The component-library export renders one flat frame per
  // component rather than modeling the card/card__body split, so this entry
  // borrows __body's padding directly; without it the card frame hugs its
  // content with zero inset and doesn't read as a card at all.
  "pg-card": { direction: "VERTICAL", gap: { space: 2 }, padding: [{ space: 4 }, { space: 4 }, { space: 4 }, { space: 4 }], radius: "md" },
  "pg-card__body": { direction: "VERTICAL", gap: { space: 2 }, padding: [{ space: 4 }, { space: 4 }, { space: 4 }, { space: 4 }] },
  "pg-card__footer": {
    direction: "HORIZONTAL",
    gap: { space: 2 },
    padding: [{ space: 3 }, { space: 4 }, { space: 3 }, { space: 4 }],
    primaryAlign: "SPACE_BETWEEN",
    counterAlign: "CENTER",
  },
  "pg-navbar": {
    direction: "HORIZONTAL",
    gap: { space: 3 },
    padding: [{ space: 3 }, { space: 4 }, { space: 3 }, { space: 4 }],
    primaryAlign: "SPACE_BETWEEN",
    counterAlign: "CENTER",
    radius: "md",
  },
  "pg-navbar__links": { direction: "HORIZONTAL", gap: { px: 2 }, counterAlign: "CENTER" },
  "pg-navlink": { direction: "HORIZONTAL", padding: [{ px: 7 }, { px: 11 }, { px: 7 }, { px: 11 }], radius: "sm" },
  "pg-tablist": { direction: "HORIZONTAL", gap: { px: 2 } },
  "pg-tab": { direction: "HORIZONTAL", padding: [{ px: 10 }, { px: 14 }, { px: 10 }, { px: 14 }] },
  "pg-crumbs": { direction: "HORIZONTAL", gap: { px: 4 }, counterAlign: "CENTER" },
  "pg-crumb": { direction: "HORIZONTAL", padding: [{ px: 3 }, { px: 6 }, { px: 3 }, { px: 6 }], radius: "sm" },
  "pg-alert": { direction: "HORIZONTAL", gap: { space: 2 }, padding: [{ space: 3 }, { space: 3 }, { space: 3 }, { space: 3 }], radius: "md" },
  "pg-alert__body": { direction: "VERTICAL", gap: { px: 2 } },
  "pg-badge": {
    direction: "HORIZONTAL",
    gap: { px: 5 },
    padding: [{ px: 4 }, { px: 10 }, { px: 4 }, { px: 10 }],
    counterAlign: "CENTER",
    radius: "full",
  },
  "pg-select-wrap": { direction: "HORIZONTAL", counterAlign: "CENTER" },
  "pg-select": { direction: "HORIZONTAL", padding: [{ px: 6 }, { px: 10 }, { px: 6 }, { px: 10 }], radius: "sm" },
  "pg-row": { direction: "HORIZONTAL", gap: { space: 2 }, counterAlign: "CENTER" },
  "pg-grid": { direction: "HORIZONTAL", gap: { space: 3 } }, // auto-fit grid — serializer resolves an explicit column count (see serializeCanvas)
  "pg-table-wrap": {
    direction: "VERTICAL",
    padding: [{ space: 3 }, { space: 4 }, { space: 3 }, { space: 4 }],
    radius: "md",
  },
  "pg-modal": { direction: "VERTICAL", gap: { space: 2 }, padding: [{ px: 12 }, { px: 14 }, { px: 12 }, { px: 14 }], radius: "md" },
};

export function resolveSpacing(ref: SpacingRef, spacingSteps: number[]): number {
  if ("px" in ref) return ref.px;
  return spacingSteps[ref.space - 1] ?? ref.space * 4;
}

export function resolveRadius(spec: LayoutSpec["radius"], radius: { base: number; sm: number; md: number; full: number }): number {
  if (spec === undefined) return 0;
  if (spec === "full") return radius.full;
  if (spec === "sm") return radius.sm;
  if (spec === "md") return radius.md;
  return spec;
}
