// Grounds the model's written rationale in the tokens that actually shipped.
// The model writes its reasoning before contrast repair (lib/ai/validateTokens.ts)
// runs, so its prose can drift from — or make unverifiable accessibility
// claims about — the final result. Two rules, called from lib/ai/generate.ts
// as the last step: (1) strip every unverified compliance claim from the
// model's text — only the measured ContrastReport may talk about ratios; (2)
// append one code-generated sentence per field, built from the final values.
import { AIReasoning } from "@/types/project";
import { ContrastReport } from "@/types/ai";

// Sentences making claims only a measurement can support. Deliberately broad:
// a lost adjective costs nothing, a surviving false compliance claim is the
// whole defect.
const COMPLIANCE_CLAIM =
  /\b(wcag|contrast(ing)?\s+ratio|contrast\s+(?:of|is|exceeds?|meets?|passes?)|\d+(?:\.\d+)?\s*:\s*1|\baa\b|\baaa\b|accessib\w*|legibilit\w*\s+(?:standard|requirement)|section\s*508)\b/i;

/** Splits on sentence boundaries while keeping the terminator attached. */
function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function stripComplianceClaims(text: string): string {
  const kept = sentences(text).filter((s) => !COMPLIANCE_CLAIM.test(s));
  return kept.join(" ").trim();
}

export type ReasoningFacts = {
  brandName: string;
  /** Final, post-repair palette entries in role order. */
  colors: Array<{ role?: string; name: string; hex: string }>;
  fonts: { heading: string; body: string; accent?: string; headingCategory: string; bodyCategory: string };
  typeScale: { ratioName: string; baseSize: number; steps: number };
  radius: { base: number; sm: number; lg: number };
  spacingBase: number;
  shadowLevel: string;
  report?: ContrastReport;
  repairedCount: number;
};

function describeRole(entry: { role?: string; name: string; hex: string }): string {
  return entry.role ? `${entry.role} ${entry.hex}` : entry.hex;
}

/**
 * Rebuilds the four reasoning strings so each one ends with a factual summary
 * of the tokens as shipped. The model's own (claim-free) prose is kept in
 * front of it — it's the part that explains *why*, which is the product's
 * whole point; the appended sentence is the part that can be checked.
 */
export function groundReasoning(raw: AIReasoning, facts: ReasoningFacts): AIReasoning {
  const brand = facts.brandName;

  const paletteFacts = `As shipped, ${brand} uses ${facts.colors.length} colours: ${facts.colors
    .map(describeRole)
    .join(", ")}.${
    facts.repairedCount > 0
      ? ` ${facts.repairedCount} value${facts.repairedCount === 1 ? " was" : "s were"} adjusted for contrast after generation — hue preserved.`
      : ""
  }`;

  const fontFacts = `${brand} sets headings in ${facts.fonts.heading} (${facts.fonts.headingCategory}) and body copy in ${facts.fonts.body} (${facts.fonts.bodyCategory})${
    facts.fonts.accent ? `, with ${facts.fonts.accent} reserved for data and numerals` : ""
  }.`;

  const typeFacts = `The scale is ${facts.typeScale.ratioName} from a ${facts.typeScale.baseSize}px base, ${facts.typeScale.steps} steps.`;

  const accessibilityLine = facts.report
    ? facts.report.failCount > 0
      ? ` Measured contrast: ${facts.report.passCount} of ${facts.report.passCount + facts.report.failCount} enforced pairs pass, ${facts.report.failCount} still fail and need a manual pass.`
      : ` Measured contrast: all ${facts.report.passCount} enforced pairs pass WCAG ${facts.report.level}.`
    : "";

  const radiusFacts =
    facts.radius.base === 0
      ? "square corners throughout (0px at every step)"
      : `a base corner radius of ${facts.radius.base}px (${facts.radius.sm}px on controls, ${facts.radius.lg}px on modals)`;
  const overallFacts = `Concretely, ${brand} ships ${radiusFacts}, a ${facts.spacingBase}px spacing base, and ${facts.shadowLevel} elevation.${accessibilityLine}`;

  const join = (modelText: string, generated: string) => {
    const cleaned = stripComplianceClaims(modelText);
    return cleaned ? `${cleaned} ${generated}` : generated;
  };

  return {
    palette: join(raw.palette, paletteFacts),
    fonts: join(raw.fonts, fontFacts),
    typeScale: join(raw.typeScale, typeFacts),
    overall: join(raw.overall, overallFacts),
  };
}
