/**
 * The *effective* value of every playground role, for the UI that has to
 * show it (the role grid's swatch chips, the contrast readout).
 *
 * Why this reads the generated CSS instead of re-deriving from the base
 * tokens: the fallback chain in `extraPropertyBlock`
 * (lib/playground/resolveExperiment.ts) is nine layers deep and full of
 * deliberate special cases — `surface` borrowing `background`, `accent`
 * falling through to `support`, the status hues defaulting to
 * PLAYGROUND_STATUS_DEFAULTS, `label` collapsing onto `accentFont`. A second
 * implementation of that chain in this file would agree with the rendered
 * card right up until somebody edited one of the two, and the symptom would
 * be a contrast readout quoting numbers for colours that aren't on screen.
 *
 * Parsing the `--pg-*` declarations out of the exact string the card injects
 * makes disagreement impossible by construction, and costs one regex pass
 * over a ~2kB string that is already memoised per card. `resolveExperiment.ts`
 * is owned by another batch, so exporting the chain from there was not an
 * option for this one either.
 */
import type { PlaygroundRole, PlaygroundTypeRole } from "./types";
import { PLAYGROUND_ROLES, PLAYGROUND_TYPE_ROLES } from "./types";

/** Roles that get an auto-derived readable foreground in the `--pg-on-*` set. */
export const PLAYGROUND_ON_ROLES = [
  "primary",
  "secondary",
  "accent",
  "success",
  "warning",
  "error",
  "surface",
] as const;

export type PlaygroundOnRole = (typeof PLAYGROUND_ON_ROLES)[number];

export type ResolvedRoleValues = {
  colors: Record<PlaygroundRole, string>;
  /** Readable foreground for each filled role, as picked by resolveExperiment. */
  on: Record<PlaygroundOnRole, string>;
  /** Family name only — the `--pg-font-*` stack minus its quotes and generic. */
  fonts: Record<PlaygroundTypeRole, string>;
};

const DECLARATION_RE = /--pg-([a-z-]+)\s*:\s*([^;]+);/g;

// A role that fails to parse means the `--pg-*` contract in
// resolveExperiment.ts changed underneath this file. Black is a deliberately
// conspicuous stand-in: it keeps the readout rendering (and correctly
// flagging a broken pair) instead of throwing inside a card.
const MISSING_COLOR = "#000000";

/** `"DM Sans", sans-serif` -> `DM Sans`. */
function familyFromStack(stack: string): string {
  const first = stack.split(",")[0] ?? "";
  return first.trim().replace(/^["']|["']$/g, "");
}

export function parseRoleValues(css: string): ResolvedRoleValues {
  const declarations = new Map<string, string>();
  for (const match of css.matchAll(DECLARATION_RE)) {
    // Last write wins, matching the cascade: `extraPropertyBlock` is emitted
    // after the token export at identical specificity precisely so it does.
    declarations.set(match[1], match[2].trim());
  }

  const colors = {} as Record<PlaygroundRole, string>;
  PLAYGROUND_ROLES.forEach((role) => {
    colors[role] = declarations.get(role) ?? MISSING_COLOR;
  });

  const on = {} as Record<PlaygroundOnRole, string>;
  PLAYGROUND_ON_ROLES.forEach((role) => {
    on[role] = declarations.get(`on-${role}`) ?? MISSING_COLOR;
  });

  const fonts = {} as Record<PlaygroundTypeRole, string>;
  PLAYGROUND_TYPE_ROLES.forEach((role) => {
    fonts[role] = familyFromStack(declarations.get(`font-${role}`) ?? "");
  });

  return { colors, on, fonts };
}
