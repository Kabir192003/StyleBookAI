/**
 * Request/response shapes for POST /api/ai/generate.
 *
 * `style`, `colorPreferences`, and `avoid` are optional refinements the
 * user can pass alongside the free-text prompt — the quick-pick chips in
 * <PromptInput /> populate these. Keep this type in sync with the zod
 * schema in app/api/ai/generate/route.ts.
 */
import { ColorStyle } from "./color";
import { Project } from "./project";

// Content for the live mock preview on /studio/ai — written by the model
// to actually fit the described business (a car dealership brief gets
// inventory-style cards and "Schedule a test drive", not generic SaaS
// copy). Display-only: never persisted with a saved Project, see
// AIGeneratedProject below. components/ai/LivePreviewMock.tsx is the only
// consumer.
export type MockupCard = {
  title: string;
  subtitle: string;
  meta?: string; // short — a price, date, location, stat
  cta: string;
};

export type MockupSpec = {
  siteLabel: string; // e.g. "Car dealership", "Boutique hotel", "Law firm"
  navItems: string[]; // 3-5 short labels
  hero: {
    eyebrow?: string;
    headline: string;
    subheadline: string;
    primaryCta: string;
    secondaryCta?: string;
  };
  cards: MockupCard[]; // 2-4 entries
  footerNote?: string;
};

export type AIGenerateRequest = {
  prompt: string;
  style?: ColorStyle[];
  colorPreferences?: string[];
  avoid?: string[];
  // Opts into the full design-system contract (component tokens/states,
  // light+dark, accessibility, icon style, grid, breakpoints) — off by
  // default so a plain "give me a palette" prompt stays fast/cheap.
  includeDesignSystem?: boolean;
};

// What POST /api/ai/generate actually returns — a draft Project, not yet
// saved (no id/userId/timestamps until the user chooses to save it), plus
// the display-only mockup content. `mockup` intentionally isn't part of
// Project itself — ProjectInputSchema (lib/validation/project.ts) doesn't
// know about it, so it's silently dropped if this object is ever POSTed
// to /api/projects, which is exactly right: it's regenerated fresh next
// time, never stored.
// ---------------------------------------------------------------------------
// Verification data attached to a generated result
// ---------------------------------------------------------------------------
// QA found the generator shipping body text at 1.02:1 (#f8fafc on #f8f7f7)
// and, separately, a 4.1:1 button under an AI-written note claiming "all text
// and interactive states exceed 4.5:1". Prose from the model can't be trusted
// about numbers it never computed, so lib/ai/validateTokens.ts measures every
// pair itself, repairs what it can, and returns the measurements as data. The
// UI should render *these* numbers, never the model's claims.

export type ContrastCheck = {
  /** Stable id, e.g. "light.text-on-surface" or "dark.button.text". */
  id: string;
  variant: "light" | "dark";
  /** Human label for the UI, e.g. "Body text on surface". */
  label: string;
  foreground: string;
  background: string;
  /** Measured WCAG 2.x ratio of the FINAL tokens, rounded to 2dp. */
  ratio: number;
  /** Threshold this pair is held to: 4.5 for text, 3 for non-text UI. */
  required: number;
  level: "AAA" | "AA" | "Fail";
  passes: boolean;
  /**
   * Reported but never failed or repaired — disabled controls (exempt under
   * WCAG 1.4.3) and decorative surface-on-surface relationships (a card is
   * *meant* to sit quietly against the page).
   */
  informational?: boolean;
  /** Present when validateTokens had to move a token to reach `required`. */
  repaired?: { from: string; to: string; originalRatio: number };
};

export type ContrastReport = {
  /** The level actually achieved across all enforced pairs, not a claim. */
  level: "AAA" | "AA" | "Fail";
  checks: ContrastCheck[];
  passCount: number;
  failCount: number;
  repairedCount: number;
  /** Code-generated, measurement-backed sentences for the UI/export. */
  notes: string[];
};

/**
 * Anything the pipeline changed or could not honour. QA asked for "hard 0px
 * corners" and silently got 4px; asked for a specific accent and got another
 * colour; asked for no stock photography and got Unsplash architecture. A
 * substitution that is never surfaced reads as the tool ignoring the brief —
 * so every substitution now has to declare itself here.
 */
export type AIDeviation = {
  kind: "unhonoured-constraint" | "auto-correction";
  /** What the deviation is about, e.g. "cornerRadius", "contrast", "bodyFont". */
  subject: string;
  /** What was asked for (or what the model returned). */
  requested: string;
  /** What actually shipped. */
  applied: string;
  /** Why — always a concrete reason, never "for accessibility". */
  reason: string;
};

/**
 * Named corner-radius scale. `CornerRadiusScale` in types/designTokens.ts is
 * `{ options, recommended }` with no names, so radius shipped as one flat
 * number while spacing got a full progressive scale. This is additive: the
 * numeric ramp is still written into `cornerRadius.options` for existing
 * consumers (lib/export/generators.ts, Studio), and the named mapping rides
 * alongside for UIs that want small/medium/large/pill semantics.
 */
export type NamedRadiusScale = {
  none: number;
  sm: number;
  md: number;
  lg: number;
  full: number;
  /** Which named step the brand's base value corresponds to. */
  base: "sm" | "md" | "lg";
};

export type AIGeneratedProject = Omit<Project, "id" | "userId" | "createdAt" | "updatedAt"> & {
  mockup?: MockupSpec;
  // Display-only, like `mockup`: ProjectInputSchema (lib/validation/project.ts)
  // doesn't know these keys, so they're dropped if this object is POSTed to
  // /api/projects — correct, since they're re-derived on every generation and
  // would go stale the moment a user edits a token in Studio.
  contrastReport?: ContrastReport;
  deviations?: AIDeviation[];
  radiusScale?: NamedRadiusScale;
};
