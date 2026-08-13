/**
 * Deterministic post-generation contrast validation and repair.
 *
 * Runs in lib/ai/generate.ts after the model responds and before the result
 * is returned to /api/ai/generate. It exists because two independent QA
 * passes caught the same class of failure:
 *
 *   - a generated brand shipped body text #f8fafc on background #f8f7f7 —
 *     1.02:1, unreadable, with nothing in the pipeline measuring it;
 *   - a generated primary button measured 4.1:1 (a fail) while the model's
 *     own accessibility note asserted "all text and interactive states
 *     exceed 4.5:1".
 *
 * The model was never computing these numbers, so the numbers were fiction.
 * Here they are measured with getContrastRatio() (lib/colors/colorUtils.ts,
 * the same WCAG 2.x implementation ContrastBadge renders), repaired
 * hue-preservingly via ensureContrast() (lib/colors/contrast.ts), and
 * returned as structured ContrastChecks (types/ai.ts) so the UI can render
 * measurements instead of claims. lib/ai/reasoning.ts then overwrites the
 * model's accessibility prose with sentences built from these same numbers.
 *
 * Everything in this file is pure — same input, same output — so it can be
 * exercised against fixture data (including the exact failing values above)
 * without an API key or a live model call.
 */
import { ComponentName, ComponentTokenSet, DesignSystem, ThemeVariantTokens } from "@/types/designSystem";
import { ContrastCheck, ContrastReport, AIDeviation } from "@/types/ai";
import { getWcagLevel } from "@/lib/colors/colorUtils";
import {
  AA_LARGE_TEXT,
  AA_NORMAL_TEXT,
  AAA_NORMAL_TEXT,
  contrast,
  ensureContrast,
  hueOf,
  normalizeHex,
  roundRatio,
  saturationOf,
  withSaturation,
} from "@/lib/colors/contrast";

type Variant = "light" | "dark";

// Components whose background is a deliberate, pressable fill. Their fill has
// to be distinguishable from the page (WCAG SC 1.4.11, 3:1) — this is the
// check that catches a near-white "primary" like the #f0f0ef QA found, which
// cannot carry a primary action no matter what the prose says.
const FILLED_COMPONENTS: ComponentName[] = ["button", "buttonSecondary", "badge", "alert"];

// Components whose border *is* the control's boundary — a text input with an
// invisible border is an invisible control, so its border is held to 3:1.
// Everything else's border is decorative chrome and only needs to be visible
// at all (see DECORATIVE_BORDER_FLOOR), because forcing 3:1 on every hairline
// divider would flatten exactly the quiet, layered surfaces good design tools
// are supposed to produce.
const BORDER_CRITICAL_COMPONENTS: ComponentName[] = ["input", "dropdown"];
const DECORATIVE_BORDER_FLOOR = 1.5;

/**
 * Repairs aim slightly above the bar rather than exactly at it. Landing a
 * body-text pair on 4.50:1 technically passes and then fails the moment a
 * user nudges the token by one step in Studio — and a value that reads
 * "4.5:1" in the report looks like it was reverse-engineered from the
 * threshold, because it was. 5% of headroom costs nothing visually.
 */
const REPAIR_HEADROOM = 1.05;
const repairTarget = (required: number) => required * REPAIR_HEADROOM;

const COMPONENT_LABELS: Record<ComponentName, string> = {
  button: "Primary button",
  buttonSecondary: "Secondary button",
  input: "Text input",
  dropdown: "Dropdown",
  card: "Card",
  navigation: "Navigation",
  table: "Table",
  modal: "Modal",
  alert: "Alert",
  badge: "Badge",
};

function check(args: {
  id: string;
  variant: Variant;
  label: string;
  foreground: string;
  background: string;
  required: number;
  informational?: boolean;
  repairedFrom?: { from: string; originalRatio: number };
}): ContrastCheck {
  const ratio = contrast(args.foreground, args.background);
  return {
    id: args.id,
    variant: args.variant,
    label: args.label,
    foreground: normalizeHex(args.foreground),
    background: normalizeHex(args.background),
    ratio: roundRatio(ratio),
    required: args.required,
    level: getWcagLevel(ratio),
    passes: ratio >= args.required,
    ...(args.informational ? { informational: true } : {}),
    ...(args.repairedFrom && normalizeHex(args.repairedFrom.from) !== normalizeHex(args.foreground)
      ? {
          repaired: {
            from: normalizeHex(args.repairedFrom.from),
            to: normalizeHex(args.foreground),
            originalRatio: roundRatio(args.repairedFrom.originalRatio),
          },
        }
      : {}),
  };
}

/**
 * Fixes `foreground` so it clears `target` against *every* background it will
 * appear on. Body text sits on both `background` and `surface`, and repairing
 * against one alone can quietly break the other — so this repairs against
 * whichever pair is currently worst and re-measures, up to a bounded number
 * of passes (each pass strictly improves the worst ratio, so it converges;
 * the bound is belt-and-braces against a pathological palette).
 */
function ensureContrastAgainstAll(
  foreground: string,
  backgrounds: string[],
  target: number
): { hex: string; unresolved: boolean } {
  let current = normalizeHex(foreground);
  let unresolved = false;

  for (let pass = 0; pass < 8; pass++) {
    let worstBackground: string | null = null;
    let worstRatio = Infinity;
    for (const bg of backgrounds) {
      const ratio = contrast(current, bg);
      if (ratio < worstRatio) {
        worstRatio = ratio;
        worstBackground = bg;
      }
    }
    if (!worstBackground || worstRatio >= target) return { hex: current, unresolved: false };

    const repair = ensureContrast(current, worstBackground, target);
    unresolved = repair.unresolved;
    if (repair.hex === current) break; // no further movement possible
    current = repair.hex;
  }

  return { hex: current, unresolved: unresolved || backgrounds.some((bg) => contrast(current, bg) < target) };
}

function validateVariant(
  variant: Variant,
  tokens: ThemeVariantTokens
): { tokens: ThemeVariantTokens; checks: ContrastCheck[]; deviations: AIDeviation[] } {
  const checks: ContrastCheck[] = [];
  const deviations: AIDeviation[] = [];
  const roles = { ...tokens.colorRoles };
  const label = variant === "light" ? "Light" : "Dark";

  const surfaces = [roles.background, roles.surface];

  // --- Body text -----------------------------------------------------------
  // The 1.02:1 defect (#f8fafc body text on a #f8f7f7 background) lands here.
  const originalText = normalizeHex(roles.text);
  const textFix = ensureContrastAgainstAll(originalText, surfaces, repairTarget(AA_NORMAL_TEXT));
  roles.text = textFix.hex;
  const textOriginalRatio = Math.min(...surfaces.map((bg) => contrast(originalText, bg)));
  checks.push(
    check({
      id: `${variant}.text-on-background`,
      variant,
      label: `${label} · body text on background`,
      foreground: roles.text,
      background: roles.background,
      required: AA_NORMAL_TEXT,
      repairedFrom: { from: originalText, originalRatio: textOriginalRatio },
    }),
    check({
      id: `${variant}.text-on-surface`,
      variant,
      label: `${label} · body text on surface`,
      foreground: roles.text,
      background: roles.surface,
      required: AA_NORMAL_TEXT,
      repairedFrom: { from: originalText, originalRatio: textOriginalRatio },
    })
  );
  if (roles.text !== originalText) {
    deviations.push({
      kind: "auto-correction",
      subject: `${variant}.colorRoles.text`,
      requested: originalText,
      applied: roles.text,
      reason: `Body text measured ${roundRatio(textOriginalRatio)}:1 against the ${variant} surfaces — below the 4.5:1 WCAG AA minimum. Lightness was adjusted; hue and saturation are unchanged.`,
    });
  }

  // --- Muted text ----------------------------------------------------------
  const originalMuted = normalizeHex(roles.textMuted);
  const mutedOriginalRatio = Math.min(...surfaces.map((bg) => contrast(originalMuted, bg)));
  const mutedFix = ensureContrastAgainstAll(originalMuted, surfaces, repairTarget(AA_NORMAL_TEXT));
  roles.textMuted = mutedFix.hex;
  checks.push(
    check({
      id: `${variant}.muted-on-surface`,
      variant,
      label: `${label} · muted text on surface`,
      foreground: roles.textMuted,
      background: roles.surface,
      required: AA_NORMAL_TEXT,
      repairedFrom: { from: originalMuted, originalRatio: mutedOriginalRatio },
    })
  );
  if (roles.textMuted !== originalMuted) {
    deviations.push({
      kind: "auto-correction",
      subject: `${variant}.colorRoles.textMuted`,
      requested: originalMuted,
      applied: roles.textMuted,
      reason: `Muted text measured ${roundRatio(mutedOriginalRatio)}:1 — secondary copy is still copy and is held to the same 4.5:1 AA bar.`,
    });
  }

  // --- Page border ---------------------------------------------------------
  // Reported against the 3:1 non-text bar but only *repaired* up to a
  // visibility floor: a page-level hairline is rarely the sole indicator of
  // anything, and slamming it to 3:1 would turn every calm layout harsh.
  const originalBorder = normalizeHex(roles.border);
  const borderFix = ensureContrast(originalBorder, roles.background, DECORATIVE_BORDER_FLOOR);
  roles.border = borderFix.hex;
  checks.push(
    check({
      id: `${variant}.border-on-background`,
      variant,
      label: `${label} · border on background`,
      foreground: roles.border,
      background: roles.background,
      required: AA_LARGE_TEXT,
      informational: true,
      repairedFrom: { from: originalBorder, originalRatio: contrast(originalBorder, roles.background) },
    })
  );

  // --- Components ----------------------------------------------------------
  const components: ThemeVariantTokens["components"] = {};
  (Object.keys(tokens.components) as ComponentName[]).forEach((name) => {
    const set = tokens.components[name];
    if (!set) return;
    const result = validateComponent(variant, name, set, roles.surface);
    components[name] = result.set;
    checks.push(...result.checks);
    deviations.push(...result.deviations);
  });

  return { tokens: { colorRoles: roles, components }, checks, deviations };
}

function validateComponent(
  variant: Variant,
  name: ComponentName,
  input: ComponentTokenSet,
  variantSurface: string
): { set: ComponentTokenSet; checks: ContrastCheck[]; deviations: AIDeviation[] } {
  const checks: ContrastCheck[] = [];
  const deviations: AIDeviation[] = [];
  // Prefixed with the variant because both variants' checks end up in one
  // flat list (and one flat notes array) — "Primary button label" appearing
  // twice with different numbers would be unreadable.
  const label = `${variant === "light" ? "Light" : "Dark"} · ${COMPONENT_LABELS[name]}`;

  // 1. Fill against the page, for pressable components only. Order matters:
  //    the fill is repaired first because the label's repair depends on it.
  let background = normalizeHex(input.background);
  const originalBackground = background;
  if (FILLED_COMPONENTS.includes(name)) {
    const fillRatio = contrast(background, variantSurface);
    const fillFix = ensureContrast(background, variantSurface, repairTarget(AA_LARGE_TEXT));
    background = fillFix.hex;
    checks.push(
      check({
        id: `${variant}.${name}.fill-on-surface`,
        variant,
        label: `${label} fill on surface`,
        foreground: background,
        background: variantSurface,
        required: AA_LARGE_TEXT,
        repairedFrom: { from: originalBackground, originalRatio: fillRatio },
      })
    );
    if (background !== originalBackground) {
      deviations.push({
        kind: "auto-correction",
        subject: `${variant}.components.${name}.background`,
        requested: originalBackground,
        applied: background,
        reason: `${label} fill measured ${roundRatio(fillRatio)}:1 against the page — an action surface that close to the background reads as disabled. Lifted to the 3:1 non-text minimum (WCAG SC 1.4.11) at the same hue.`,
      });
    }
  } else {
    // Card/modal/table/nav fills are *meant* to sit quietly against the page;
    // measured and reported, never failed.
    checks.push(
      check({
        id: `${variant}.${name}.fill-on-surface`,
        variant,
        label: `${label} fill on surface`,
        foreground: background,
        background: variantSurface,
        required: AA_LARGE_TEXT,
        informational: true,
      })
    );
  }

  // 2. Label on the (possibly repaired) fill. This is the 4.1:1 primary
  //    button QA measured while the prose claimed 4.5:1+.
  const originalText = normalizeHex(input.text);
  const textRatio = contrast(originalText, background);
  const textFix = ensureContrast(originalText, background, repairTarget(AA_NORMAL_TEXT));
  const text = textFix.hex;
  checks.push(
    check({
      id: `${variant}.${name}.text`,
      variant,
      label: `${label} label on its own fill`,
      foreground: text,
      background,
      required: AA_NORMAL_TEXT,
      repairedFrom: { from: originalText, originalRatio: textRatio },
    })
  );
  if (text !== originalText) {
    deviations.push({
      kind: "auto-correction",
      subject: `${variant}.components.${name}.text`,
      requested: originalText,
      applied: text,
      reason: `${label} label measured ${roundRatio(textRatio)}:1 on its own fill — below AA. Adjusted to ${roundRatio(contrast(text, background))}:1 at the same hue.`,
    });
  }

  // 3. Border. Form controls get the real 3:1 bar; everything else a
  //    visibility floor (see BORDER_CRITICAL_COMPONENTS above).
  let border = input.border ? normalizeHex(input.border) : undefined;
  if (border) {
    const isCritical = BORDER_CRITICAL_COMPONENTS.includes(name);
    const target = isCritical ? AA_LARGE_TEXT : DECORATIVE_BORDER_FLOOR;
    const originalBorder = border;
    const borderRatio = contrast(border, variantSurface);
    border = ensureContrast(border, variantSurface, isCritical ? repairTarget(target) : target).hex;
    checks.push(
      check({
        id: `${variant}.${name}.border`,
        variant,
        label: `${label} border on surface`,
        foreground: border,
        background: variantSurface,
        required: AA_LARGE_TEXT,
        informational: !isCritical,
        repairedFrom: { from: originalBorder, originalRatio: borderRatio },
      })
    );
    if (isCritical && border !== originalBorder) {
      deviations.push({
        kind: "auto-correction",
        subject: `${variant}.components.${name}.border`,
        requested: originalBorder,
        applied: border,
        reason: `A ${label.toLowerCase()}'s border is the only cue that the control exists, so it is held to 3:1 (WCAG SC 1.4.11); it measured ${roundRatio(borderRatio)}:1.`,
      });
    }
  }

  // 4. States. Each state resolves against the repaired base, so a state that
  //    only overrides the background still gets its inherited label checked.
  let states = input.states;
  if (states) {
    const nextStates: NonNullable<ComponentTokenSet["states"]> = {};
    (Object.keys(states) as Array<keyof NonNullable<ComponentTokenSet["states"]>>).forEach((stateName) => {
      const override = states![stateName];
      if (!override) return;
      const stateBackground = override.background ? normalizeHex(override.background) : background;
      const stateTextInput = override.text ? normalizeHex(override.text) : text;
      // WCAG 1.4.3 explicitly exempts disabled controls — measured and shown,
      // never repaired, because "disabled" is *supposed* to read as inactive.
      const informational = stateName === "disabled";
      const stateRatio = contrast(stateTextInput, stateBackground);
      const stateText = informational
        ? stateTextInput
        : ensureContrast(stateTextInput, stateBackground, repairTarget(AA_NORMAL_TEXT)).hex;

      checks.push(
        check({
          id: `${variant}.${name}.${stateName}`,
          variant,
          label: `${label} · ${stateName} state`,
          foreground: stateText,
          background: stateBackground,
          required: AA_NORMAL_TEXT,
          informational,
          repairedFrom: { from: stateTextInput, originalRatio: stateRatio },
        })
      );

      nextStates[stateName] = {
        ...override,
        ...(override.background ? { background: stateBackground } : {}),
        ...(override.text || stateText !== text ? { text: stateText } : {}),
      };
    });
    states = nextStates;
  }

  return {
    set: { background, text, ...(border ? { border } : {}), ...(states ? { states } : {}) },
    checks,
    deviations,
  };
}

/**
 * Builds the accessibility prose from the measurements. Nothing here is
 * copied from the model — the whole reason this function exists is that the
 * model's own notes claimed compliance the tokens didn't have. Anything that
 * could not be repaired is stated plainly rather than omitted.
 */
function buildNotes(checks: ContrastCheck[]): string[] {
  const enforced = checks.filter((c) => !c.informational);
  const failures = enforced.filter((c) => !c.passes);
  const repaired = checks.filter((c) => c.repaired);
  const notes: string[] = [];

  const headline = (id: string) => enforced.find((c) => c.id === id);
  const lightBody = headline("light.text-on-surface");
  const darkBody = headline("dark.text-on-surface");
  const lightButton = headline("light.button.text");
  const darkButton = headline("dark.button.text");

  for (const c of [lightBody, darkBody, lightButton, darkButton]) {
    if (!c) continue;
    const verdict =
      c.ratio >= AAA_NORMAL_TEXT
        ? "passes AA and AAA"
        : c.ratio >= AA_NORMAL_TEXT
          ? "passes AA"
          : `fails AA (needs ${c.required}:1)`;
    notes.push(`${c.label}: ${c.ratio}:1 — ${verdict}.`);
  }

  const worst = enforced.slice().sort((a, b) => a.ratio - b.ratio)[0];
  if (worst) {
    notes.push(
      `Lowest enforced pair across light and dark: ${worst.label} at ${worst.ratio}:1 (minimum ${worst.required}:1).`
    );
  }

  if (repaired.length > 0) {
    notes.push(
      `${repaired.length} token${repaired.length === 1 ? " was" : "s were"} adjusted after generation to reach these ratios — hue preserved, lightness moved. See the deviations list for each one.`
    );
  }

  if (failures.length > 0) {
    notes.push(
      `${failures.length} pair${failures.length === 1 ? "" : "s"} could NOT be brought to the minimum automatically and still fail: ${failures
        .map((f) => `${f.label} (${f.ratio}:1)`)
        .join(", ")}. Adjust these by hand before shipping.`
    );
  } else {
    notes.push(
      "Every enforced pair listed above was measured with WCAG 2.x relative luminance after the final tokens were fixed — these are computed values, not estimates."
    );
  }

  notes.push(
    "Disabled states and decorative surface-on-surface pairs are reported for information only: WCAG 1.4.3 exempts disabled controls, and a card is meant to sit quietly against the page."
  );

  return notes.slice(0, 14);
}

export type DesignSystemValidation = {
  designSystem: DesignSystem;
  report: ContrastReport;
  deviations: AIDeviation[];
};

/**
 * Entry point used by lib/ai/generate.ts. Takes whatever the model produced
 * (plus the deterministically derived dark variant) and returns a design
 * system whose numbers are true, together with the measurements that make
 * them checkable.
 */
export function validateDesignSystem(designSystem: DesignSystem): DesignSystemValidation {
  const light = validateVariant("light", designSystem.light);
  const dark = designSystem.dark ? validateVariant("dark", designSystem.dark) : null;

  const checks = [...light.checks, ...(dark?.checks ?? [])];
  const deviations = [...light.deviations, ...(dark?.deviations ?? [])];
  const enforced = checks.filter((c) => !c.informational);
  const failCount = enforced.filter((c) => !c.passes).length;
  const level: ContrastReport["level"] =
    failCount > 0 ? "Fail" : enforced.every((c) => c.ratio >= AAA_NORMAL_TEXT) ? "AAA" : "AA";

  const report: ContrastReport = {
    level,
    checks,
    passCount: enforced.length - failCount,
    failCount,
    repairedCount: checks.filter((c) => c.repaired).length,
    notes: buildNotes(checks),
  };

  return {
    designSystem: {
      ...designSystem,
      light: light.tokens,
      ...(dark ? { dark: dark.tokens } : {}),
      accessibility: {
        // "AA"/"AAA" is all types/designSystem.ts's AccessibilityNotes can
        // hold, so a Fail is surfaced as "the AA target, with these specific
        // pairs still failing" in the notes rather than being rounded away.
        level: level === "AAA" ? "AAA" : "AA",
        notes: report.notes,
      },
    },
    report,
    deviations,
  };
}

/**
 * The same guarantee for the flat palette a plain (non-design-system)
 * generation returns: role-tagged colors where `text` has to be readable on
 * `background`/`surface`. This is the path the #f8fafc-on-#f8f7f7 result came
 * back through, so it gets validated even when includeDesignSystem is off.
 */
/**
 * The "primary" role has a job: it is the colour actions are made of. One QA
 * run returned #f0f0ef as primary — a near-white with essentially no chroma,
 * which cannot read as a button against a light page and cannot be told apart
 * from the surface at all. Two properties are enforced here:
 *
 *   - enough chroma to register as a colour rather than a shade of paper;
 *   - at least 3:1 against the palette's own background (WCAG SC 1.4.11, the
 *     same bar the filled-component check uses above).
 *
 * Hue is preserved, so a brand that genuinely wants a pale warm-grey primary
 * gets a *usable* pale warm-grey, not a different colour. A colour with no
 * hue at all can't be saved this way, and says so.
 */
export function ensureActionablePrimary<T extends { hex: string; role?: string }>(
  colors: T[]
): { colors: T[]; checks: ContrastCheck[]; deviations: AIDeviation[] } {
  const primary = colors.find((c) => c.role?.toLowerCase() === "primary");
  const background =
    colors.find((c) => c.role?.toLowerCase() === "background")?.hex ??
    colors.find((c) => c.role?.toLowerCase() === "surface")?.hex;
  if (!primary || !background) return { colors, checks: [], deviations: [] };

  const original = normalizeHex(primary.hex);
  const originalRatio = contrast(original, background);
  const hue = hueOf(original);
  const saturation = saturationOf(original);

  const MIN_ACTION_SATURATION = 0.15;
  let candidate = original;
  const reasons: string[] = [];

  if (saturation < MIN_ACTION_SATURATION && hue !== null) {
    candidate = withSaturation(candidate, 0.34);
    reasons.push(`its saturation was ${Math.round(saturation * 100)}% — too washed out to read as an action colour`);
  }
  if (contrast(candidate, background) < AA_LARGE_TEXT) {
    candidate = ensureContrast(candidate, background, repairTarget(AA_LARGE_TEXT)).hex;
    reasons.push(`it measured ${roundRatio(originalRatio)}:1 against the palette background, below the 3:1 minimum for a UI fill`);
  }

  const checks: ContrastCheck[] = [
    check({
      id: "palette.primary-on-background",
      variant: "light",
      label: "Primary action colour on background",
      foreground: candidate,
      background,
      required: AA_LARGE_TEXT,
      repairedFrom: { from: original, originalRatio },
    }),
  ];

  if (candidate === original) return { colors, checks, deviations: [] };

  const deviations: AIDeviation[] = [
    hue === null && saturation < MIN_ACTION_SATURATION
      ? {
          kind: "unhonoured-constraint",
          subject: "colors.primary",
          requested: original,
          applied: candidate,
          reason:
            "The primary colour is a pure neutral with no hue to preserve, so it could only be darkened, not made into a real action colour. Pick a branded primary in Studio.",
        }
      : {
          kind: "auto-correction",
          subject: "colors.primary",
          requested: original,
          applied: candidate,
          reason: `Primary carries the main call to action, and ${reasons.join(" and ")}. Hue kept; saturation and lightness adjusted.`,
        },
  ];

  return {
    colors: colors.map((c) => (c === primary ? { ...c, hex: candidate } : c)),
    checks,
    deviations,
  };
}

export function validatePaletteRoles<T extends { hex: string; role?: string }>(
  colors: T[]
): { colors: T[]; checks: ContrastCheck[]; deviations: AIDeviation[] } {
  const byRole = (role: string) => colors.find((c) => c.role?.toLowerCase() === role);
  const background = byRole("background")?.hex;
  const surface = byRole("surface")?.hex ?? background;
  const backgrounds = [background, surface].filter((hex): hex is string => Boolean(hex));
  if (backgrounds.length === 0) return { colors, checks: [], deviations: [] };

  const checks: ContrastCheck[] = [];
  const deviations: AIDeviation[] = [];

  const next = colors.map((color) => {
    const role = color.role?.toLowerCase();
    if (role !== "text" && role !== "muted") return color;

    const original = normalizeHex(color.hex);
    const originalRatio = Math.min(...backgrounds.map((bg) => contrast(original, bg)));
    const fixed = ensureContrastAgainstAll(original, backgrounds, repairTarget(AA_NORMAL_TEXT)).hex;

    checks.push(
      check({
        id: `palette.${role}-on-background`,
        variant: "light",
        label: role === "text" ? "Palette body text on background" : "Palette muted text on background",
        foreground: fixed,
        background: backgrounds[0],
        required: AA_NORMAL_TEXT,
        repairedFrom: { from: original, originalRatio },
      })
    );

    if (fixed !== original) {
      deviations.push({
        kind: "auto-correction",
        subject: `colors.${role}`,
        requested: original,
        applied: fixed,
        reason: `The ${role} colour measured ${roundRatio(originalRatio)}:1 against the palette's own background — unreadable. Lightness adjusted to reach 4.5:1; hue kept.`,
      });
      return { ...color, hex: fixed };
    }
    return color;
  });

  return { colors: next, checks, deviations };
}
