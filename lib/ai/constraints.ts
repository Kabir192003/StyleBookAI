/**
 * Hard-constraint extraction and enforcement for AI Generate.
 *
 * QA's complaint was not that the model made different choices — it's that it
 * made them *silently*. A prompt asking for "hard 0px corners" got 4px, a
 * prompt banning stock-photo lifestyle imagery got Unsplash architecture
 * shots, and a prompt naming an exact accent hex got a different colour, with
 * nothing anywhere saying so. A design tool that quietly overrules the brief
 * reads as broken even when its output is pretty.
 *
 * So: the few constraints that are unambiguous in plain text are parsed here
 * and enforced in code by lib/ai/generate.ts (not left to the model), and
 * anything that still can't be honoured is emitted as an AIDeviation
 * (types/ai.ts) that the UI can show. Deliberately conservative — it only
 * claims a constraint when the phrasing is explicit, because a false positive
 * (overriding a choice the user never asked for) is worse than a miss.
 */
import { AIDeviation } from "@/types/ai";
import { normalizeHex } from "@/lib/colors/contrast";

export type PromptConstraints = {
  /** An explicitly demanded corner radius in px, e.g. "hard 0px corners". */
  cornerRadius?: { value: number; phrase: string };
  /** Literal hexes named in the brief — these must appear in the palette. */
  requiredHexes: string[];
  /** True when the brief rules out photography/stock imagery. */
  banPhotography: boolean;
  /** True when the brief rules out monospaced type for prose. */
  banMonospace: boolean;
};

// "0px corners", "corner radius of 12px", "radius: 4px" — a number and a
// radius word close enough together to be one statement.
const RADIUS_BEFORE = /(\d{1,3})\s*(?:px)?[^.,;]{0,24}?\b(?:corner|corners|radius|rounding)\b/i;
const RADIUS_AFTER = /\b(?:corner|corners|radius|rounding)\b[^.,;]{0,24}?(\d{1,3})\s*px/i;
// Word-only phrasings that state a radius without a number.
const SQUARE_CORNERS = /\b(?:hard|sharp|square|squared|zero|no)\s+(?:\w+\s+){0,2}?corners?\b|\bno\s+(?:border-)?radius\b|\bnot?\s+rounded\b/i;
const PHOTOGRAPHY_BAN =
  /\b(?:no|without|avoid|zero|skip|never)\b[^.]{0,60}?\b(?:stock\s*(?:photo|photos|photography|imagery)|photograph\w*|photos?|imagery|lifestyle\s+imag\w+)\b/i;
const MONOSPACE_BAN = /\b(?:no|without|avoid|never)\b[^.]{0,40}?\bmono(?:space[d]?|spaced)?\b/i;

export function parsePromptConstraints(prompt: string): PromptConstraints {
  const text = prompt.toLowerCase();

  let cornerRadius: PromptConstraints["cornerRadius"];
  const before = text.match(RADIUS_BEFORE);
  const after = text.match(RADIUS_AFTER);
  const numeric = before ?? after;
  if (numeric) {
    const value = Number(numeric[1]);
    // Above 64px this is almost certainly a size, not a radius ("120px
    // corners" isn't a thing anyone asks for) — better to miss than to
    // override the brand with a parse artefact.
    if (Number.isFinite(value) && value <= 64) {
      cornerRadius = { value, phrase: numeric[0].trim() };
    }
  } else if (SQUARE_CORNERS.test(text)) {
    cornerRadius = { value: 0, phrase: (text.match(SQUARE_CORNERS) ?? ["square corners"])[0].trim() };
  }

  const requiredHexes = Array.from(
    new Set((prompt.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map((hex) => normalizeHex(hex)))
  );

  return {
    cornerRadius,
    requiredHexes,
    banPhotography: PHOTOGRAPHY_BAN.test(text),
    banMonospace: MONOSPACE_BAN.test(text),
  };
}

/**
 * Confirms every hex the user literally typed survived into the final
 * palette. The palette is allowed to have been contrast-repaired
 * (lib/ai/validateTokens.ts), which can legitimately move a user's hex — in
 * that case the user is told, rather than left to spot it themselves.
 */
export function reportMissingHexes(
  constraints: PromptConstraints,
  finalHexes: string[]
): AIDeviation[] {
  if (constraints.requiredHexes.length === 0) return [];
  const present = new Set(finalHexes.map((hex) => normalizeHex(hex)));
  return constraints.requiredHexes
    .filter((hex) => !present.has(hex))
    .map((hex) => ({
      kind: "unhonoured-constraint" as const,
      subject: "colors",
      requested: hex,
      applied: "not present in the final palette",
      reason: `You named ${hex} explicitly but it isn't in the generated palette — either the model substituted a near neighbour, or the contrast pass had to move it to keep text readable. Paste it back into Studio to force it.`,
    }));
}

/**
 * Records the radius outcome. The value is enforced in code by
 * lib/ai/generate.ts, so the normal result here is an "auto-correction" note
 * saying we overrode the model — the deviation exists so an overridden model
 * choice is visible rather than mysterious.
 */
export function reportRadiusConstraint(
  constraints: PromptConstraints,
  modelValue: number,
  appliedValue: number
): AIDeviation[] {
  if (!constraints.cornerRadius) return [];
  const requested = constraints.cornerRadius.value;
  if (appliedValue === requested && modelValue !== requested) {
    return [
      {
        kind: "auto-correction",
        subject: "cornerRadius",
        requested: `${requested}px ("${constraints.cornerRadius.phrase}")`,
        applied: `${appliedValue}px`,
        reason: `The model proposed ${modelValue}px; the brief asked for ${requested}px, so the brief wins. The whole radius ramp was rebuilt from ${appliedValue}px.`,
      },
    ];
  }
  if (appliedValue !== requested) {
    return [
      {
        kind: "unhonoured-constraint",
        subject: "cornerRadius",
        requested: `${requested}px ("${constraints.cornerRadius.phrase}")`,
        applied: `${appliedValue}px`,
        reason: `${requested}px isn't a value this token set can express, so the nearest available step was used.`,
      },
    ];
  }
  return [];
}

/**
 * Photography bans are honoured by dropping the moodboard entirely — the
 * moodboard library (data/moodboards.ts) is Unsplash photography, so there is
 * no compliant subset to fall back to. Saying so is the point.
 */
export function reportPhotographyBan(constraints: PromptConstraints, droppedCount: number): AIDeviation[] {
  if (!constraints.banPhotography || droppedCount === 0) return [];
  return [
    {
      kind: "auto-correction",
      subject: "moodboard",
      requested: "no stock photography",
      applied: `${droppedCount} moodboard image${droppedCount === 1 ? "" : "s"} removed`,
      reason:
        "The moodboard library is entirely Unsplash photography, so the brief's ban on stock imagery is honoured by shipping no moodboard rather than by substituting different photos.",
    },
  ];
}
