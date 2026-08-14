/**
 * The contrast pairs worth measuring inside one experiment
 * (docs/DESIGN_PLAYGROUND.md §13).
 *
 * Pure: takes resolved role values, returns numbers. The maths itself is
 * `getContrastRatio` from lib/colors/colorUtils.ts — the same WCAG 2.x
 * implementation the theme pages, Preview Lab and the AI generator's
 * verification panel already quote, so a ratio a user reads here is
 * bit-identical to the one they read there. There is deliberately no second
 * contrast function in this codebase.
 *
 * **These results inform, they never block.** The playground exists to let
 * someone try a combination that might be wrong; a control that refused a
 * failing pair would be refusing the entire point of the surface. Every
 * check therefore carries a plain-language `note` explaining what the number
 * means for the pair in question, and the UI's job is to say so clearly, not
 * to prevent it.
 */
import { getContrastRatio, getWcagLevel } from "@/lib/colors/colorUtils";
import type { ResolvedRoleValues } from "./roleValues";
import type { Experiment } from "./types";

export type PlaygroundContrastCheck = {
  id: string;
  label: string;
  foreground: string;
  background: string;
  /** Rounded to 2dp for display; comparisons use the unrounded value. */
  ratio: number;
  /** The threshold this pair is held to: 4.5 for body text, 3 for non-text. */
  required: number;
  /** AAA / AA / Fail against the *text* thresholds, for the badge. */
  level: "AAA" | "AA" | "Fail";
  passes: boolean;
  /** True for pairs measured against the 3:1 non-text rule (WCAG 1.4.11)
   *  rather than the 4.5:1 body-text rule — a border or a status dot is not
   *  held to a reading threshold, and scoring it as a text failure would be
   *  simply incorrect. */
  nonText: boolean;
  note: string;
};

const BODY_TEXT_MIN = 4.5;
// WCAG 1.4.11 Non-text Contrast: UI component boundaries and meaningful
// graphics need 3:1, not 4.5:1.
const NON_TEXT_MIN = 3;

// `hexToRgb` parses with `parseInt(…, 16)`, which quietly returns NaN for a
// non-hex string — a colour that somehow arrived as `rgb(…)` or empty would
// produce a NaN ratio and render as "NaN:1" rather than an error. Filter at
// the boundary instead.
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function isMeasurable(hex: string): boolean {
  return HEX_RE.test(hex.trim());
}

function check(
  id: string,
  label: string,
  foreground: string,
  background: string,
  required: number,
  note: string
): PlaygroundContrastCheck | null {
  const fg = foreground.trim();
  const bg = background.trim();
  if (!isMeasurable(fg) || !isMeasurable(bg)) return null;
  const raw = getContrastRatio(fg, bg);
  return {
    id,
    label,
    foreground: fg,
    background: bg,
    ratio: Math.round(raw * 100) / 100,
    required,
    level: getWcagLevel(raw),
    passes: raw >= required,
    nonText: required === NON_TEXT_MIN,
    note,
  };
}

/**
 * The meaningful pairs for one experiment. Status hues are only measured
 * when the experiment actually assigns them: the three defaults in
 * PLAYGROUND_STATUS_DEFAULTS are the same in every card, so reporting them
 * unassigned would put three identical rows under every experiment on the
 * board and bury the pairs the user is actually changing.
 */
export function experimentContrastChecks(
  values: ResolvedRoleValues,
  experiment: Experiment
): PlaygroundContrastCheck[] {
  const { colors, on } = values;

  const checks: Array<PlaygroundContrastCheck | null> = [
    check(
      "text-on-background",
      "Body text on page",
      colors.text,
      colors.background,
      BODY_TEXT_MIN,
      "The pair every paragraph on the page is read at. Below 4.5:1 the copy is hard work at normal sizes."
    ),
    check(
      "text-on-surface",
      "Body text on card",
      colors.text,
      colors.surface,
      BODY_TEXT_MIN,
      "Card and panel copy. Fails here usually mean surface has drifted too close to the text colour."
    ),
    check(
      "muted-on-surface",
      "Muted text on card",
      colors.muted,
      colors.surface,
      BODY_TEXT_MIN,
      "Captions, helper text and metadata. Muted greys fail this far more often than designers expect."
    ),
    check(
      "on-primary",
      "Button label on primary",
      on.primary,
      colors.primary,
      BODY_TEXT_MIN,
      "The label colour is picked automatically for whichever of light or dark reads better on your primary."
    ),
    check(
      "on-secondary",
      "Label on secondary",
      on.secondary,
      colors.secondary,
      BODY_TEXT_MIN,
      "Same automatic pick, applied to the secondary button fill."
    ),
    check(
      "border-on-surface",
      "Border against card",
      colors.border,
      colors.surface,
      NON_TEXT_MIN,
      "Non-text rule (WCAG 1.4.11). Under 3:1 the edges of inputs and cards stop being visible to some users."
    ),
  ];

  (["success", "warning", "error"] as const).forEach((role) => {
    if (!experiment.colors[role]) return;
    checks.push(
      check(
        `${role}-on-surface`,
        `${role[0].toUpperCase()}${role.slice(1)} against card`,
        colors[role],
        colors.surface,
        NON_TEXT_MIN,
        "A status colour has to be distinguishable from the surface it sits on to carry any meaning at all."
      )
    );
  });

  return checks.filter((c): c is PlaygroundContrastCheck => c !== null);
}

export type ContrastSummary = {
  total: number;
  failures: number;
  /** Worst measured ratio, for the one-glance badge. */
  lowest: number | null;
};

export function summariseChecks(checks: PlaygroundContrastCheck[]): ContrastSummary {
  return {
    total: checks.length,
    failures: checks.filter((c) => !c.passes).length,
    lowest: checks.length ? Math.min(...checks.map((c) => c.ratio)) : null,
  };
}
