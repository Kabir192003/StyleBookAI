/**
 * Code-side font-role sanity checks.
 *
 * The generator's three font slots are heading (`primary`), body
 * (`secondary`, which is what components/ai/PromptInput.tsx passes to Studio
 * as `body`) and an optional accent. Nothing enforced what those roles mean,
 * so one QA run assigned Roboto Mono as the body face for all prose —
 * monospace is a data/log/ID/numeral face, not a reading face, and long-form
 * copy set in it is materially harder to read.
 *
 * The prompt now states the roles explicitly (lib/ai/prompt.ts), but prompts
 * are advisory and this is cheap to guarantee, so it is guaranteed here: a
 * disqualified body face is swapped for the best available reading face from
 * the same candidate pool the model chose from, and the rejected face is
 * promoted into the accent/data slot where it actually belongs — then the
 * swap is reported as an AIDeviation so the substitution is never silent.
 */
import { Font } from "@/types/font";
import { AIDeviation } from "@/types/ai";

// Categories that disqualify a face from carrying body prose. Display and
// handwriting faces fail for the same reason as monospace: they're designed
// for a line or two at large sizes, not paragraphs.
const NON_BODY_CATEGORIES: Font["category"][] = ["monospace", "display", "handwriting"];

export type FontRoles = { primary: Font; secondary: Font; accent?: Font };

function isReadableBodyFace(font: Font): boolean {
  return !NON_BODY_CATEGORIES.includes(font.category);
}

/** Prefers a face the catalog explicitly marks as a body face, then any sans/serif. */
function pickBodyReplacement(candidates: Font[], exclude: Set<string>, rejected: Font): Font | undefined {
  const usable = candidates.filter((f) => !exclude.has(f.id) && isReadableBodyFace(f));
  if (usable.length === 0) return undefined;

  const scored = usable.map((font) => {
    let score = 0;
    if (font.useCase.includes("body")) score += 10;
    if (font.category === "sans-serif") score += 3;
    if (font.category === "serif") score += 2;
    // Keep the brand's texture where possible: a face sharing the rejected
    // one's mood tags is a closer stand-in than an arbitrary default.
    score += font.mood.filter((m) => rejected.mood.includes(m)).length;
    score += font.style.filter((s) => rejected.style.includes(s)).length;
    return { font, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].font;
}

export function enforceFontRoles(
  roles: FontRoles,
  candidates: Font[],
  options?: { banMonospace?: boolean }
): { roles: FontRoles; deviations: AIDeviation[] } {
  const deviations: AIDeviation[] = [];
  let { primary, secondary, accent } = roles;

  if (!isReadableBodyFace(secondary)) {
    const replacement = pickBodyReplacement(candidates, new Set([primary.id, secondary.id]), secondary);
    if (replacement) {
      const rejected = secondary;
      secondary = replacement;
      // A monospace face is genuinely useful — as the data/code face. Move
      // it there rather than throwing away a choice the model made for a
      // reason, unless the brief banned monospace outright.
      if (!accent && rejected.category === "monospace" && !options?.banMonospace) {
        accent = rejected;
      }
      deviations.push({
        kind: "auto-correction",
        subject: "fonts.secondary (body)",
        requested: `${rejected.family} (${rejected.category})`,
        applied: `${replacement.family} (${replacement.category})`,
        reason:
          rejected.category === "monospace"
            ? `${rejected.family} is a monospaced face — right for data, IDs and numerals, wrong for paragraphs of prose.${accent?.id === rejected.id ? ` It was kept as the data/accent face.` : ""}`
            : `${rejected.family} is a ${rejected.category} face, designed for headlines rather than body copy.`,
      });
    } else {
      deviations.push({
        kind: "unhonoured-constraint",
        subject: "fonts.secondary (body)",
        requested: "a highly legible body face",
        applied: `${secondary.family} (${secondary.category})`,
        reason: `No suitable reading face was available in the candidate pool, so the ${secondary.category} face was kept — set the body font by hand in Studio.`,
      });
    }
  }

  if (options?.banMonospace && accent?.category === "monospace") {
    deviations.push({
      kind: "auto-correction",
      subject: "fonts.accent",
      requested: "no monospaced type",
      applied: "accent font removed",
      reason: "The brief ruled out monospaced type, so the accent slot was left empty rather than filled with a mono face.",
    });
    accent = undefined;
  }

  // A "pairing" of one font isn't a pairing; this also guards the Studio
  // head/body params, which would otherwise both resolve to the same family.
  if (secondary.id === primary.id) {
    const replacement = pickBodyReplacement(candidates, new Set([primary.id]), secondary);
    if (replacement) {
      deviations.push({
        kind: "auto-correction",
        subject: "fonts.secondary (body)",
        requested: `${secondary.family} (same as the heading face)`,
        applied: `${replacement.family}`,
        reason: "The heading and body slots resolved to the same family, which leaves no typographic contrast between them.",
      });
      secondary = replacement;
    }
  }

  return { roles: { primary, secondary, accent }, deviations };
}
