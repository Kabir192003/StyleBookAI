// Request/response shapes for POST /api/ai/generate. Keep in sync with the
// zod schema in app/api/ai/generate/route.ts.
import { ColorStyle } from "./color";
import type { AIUiStructure } from "@/lib/ai/schema";
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

// QA found the generator shipping body text at 1.02:1 contrast, plus a
// button claimed (in AI-written prose) to hit 4.5:1 when it didn't. Model
// prose about numbers it never computed can't be trusted, so
// lib/ai/validateTokens.ts measures every pair itself and returns the real
// numbers here — the UI should render these, never the model's claims.

export type ContrastCheck = {
  // Stable id, e.g. "light.text-on-surface" or "dark.button.text".
  id: string;
  variant: "light" | "dark";
  // Human label for the UI, e.g. "Body text on surface".
  label: string;
  foreground: string;
  background: string;
  // Measured WCAG 2.x ratio of the final tokens, rounded to 2dp.
  ratio: number;
  // Threshold this pair is held to: 4.5 for text, 3 for non-text UI.
  required: number;
  level: "AAA" | "AA" | "Fail";
  passes: boolean;
  // Reported but never failed or repaired — disabled controls (exempt
  // under WCAG 1.4.3) and decorative surface-on-surface pairs.
  informational?: boolean;
  // Present when validateTokens had to move a token to reach `required`.
  repaired?: { from: string; to: string; originalRatio: number };
};

export type ContrastReport = {
  // The level actually achieved across all enforced pairs, not a claim.
  level: "AAA" | "AA" | "Fail";
  checks: ContrastCheck[];
  passCount: number;
  failCount: number;
  repairedCount: number;
  notes: string[];
};

// Anything the pipeline changed or couldn't honor. QA asked for "hard 0px
// corners" and silently got 4px; asked for a specific accent and got another
// color; asked for no stock photography and got Unsplash architecture. A
// substitution that's never surfaced reads as the tool ignoring the brief —
// so every substitution now has to declare itself here.
export type AIDeviation = {
  kind: "unhonoured-constraint" | "auto-correction";
  subject: string; // e.g. "cornerRadius", "contrast", "bodyFont"
  requested: string;
  applied: string;
  reason: string; // always a concrete reason, never "for accessibility"
};

// Named corner-radius scale, additive to CornerRadiusScale (types/designTokens.ts)
// which is just `{ options, recommended }` with no names. The numeric ramp
// still gets written into `cornerRadius.options` for existing consumers
// (lib/export/generators.ts, Studio); this rides alongside for UIs that
// want small/medium/large/pill semantics.
export type NamedRadiusScale = {
  none: number;
  sm: number;
  md: number;
  lg: number;
  full: number;
  base: "sm" | "md" | "lg"; // which named step the brand's base value maps to
};

export type AIGeneratedProject = Omit<Project, "id" | "userId" | "createdAt" | "updatedAt"> & {
  mockup?: MockupSpec;
  // The generated screen: an ordered list of sections from the fixed
  // vocabulary in lib/ai/schema.ts, filled with content for this brand. The
  // Studio canvas renders it through the same component library and tokens
  // as the default showcase, so it's editable the same way.
  uiStructure?: AIUiStructure;
  // mockup/uiStructure/contrastReport/deviations/radiusScale are all
  // display-only: ProjectInputSchema (lib/validation/project.ts) doesn't
  // know these keys, so they're dropped if this object is POSTed to
  // /api/projects — correct, since they're re-derived on every generation
  // and would go stale the moment a user edits a token in Studio.
  contrastReport?: ContrastReport;
  deviations?: AIDeviation[];
  radiusScale?: NamedRadiusScale;
};
