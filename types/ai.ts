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
export type AIGeneratedProject = Omit<Project, "id" | "userId" | "createdAt" | "updatedAt"> & {
  mockup?: MockupSpec;
};
