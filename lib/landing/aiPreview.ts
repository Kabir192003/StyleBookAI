/**
 * Shared state shape for the landing page's live AI generator, which now
 * renders twice on the same page — once in the new top-of-page product
 * hero, once in the "Three ways to build" panel further down the scroll
 * story — both driven by the same lifted state in LandingExperience, so
 * generating in one place shows up in the other. See
 * components/landing/LandingGeneratePanel.tsx for the shared UI and
 * components/landing/LandingExperience.tsx for the fetch/fallback logic.
 */
export const DEFAULT_LANDING_PROMPT =
  "A calm, premium skincare brand for Gen Z that feels trustworthy, not clinical.";

export type LandingPreview = {
  name: string;
  swatches: string[];
  fontFamily: string;
  fontLabel: string;
  contrastFg: string;
  contrastBg: string;
  contrastLabel: string;
};

// Shown before the visitor generates anything.
export const STARTER_PREVIEW: LandingPreview = {
  name: "Aurelia",
  swatches: ["#E8D6C8", "#D9B8A6", "#B98A6E", "#6E5646", "#2C2320"],
  fontFamily: "var(--font-geometric-sans),sans-serif",
  fontLabel: "Sora · display",
  contrastFg: "#F2EBE0",
  contrastBg: "#2C2320",
  contrastLabel: "radius 12 · space 8 · soft shadow",
};

// Shown when the live call fails (offline, rate-limited, cold start) —
// deliberately uses only fonts already loaded via next/font (see
// lib/landing/fonts.ts) so the fallback itself can never fail to render.
export const FALLBACK_PREVIEW: LandingPreview = {
  name: "Northline",
  swatches: ["#EFF6FF", "#BFDBFE", "#3B82F6", "#1E3A8A", "#0F172A"],
  fontFamily: "var(--font-humanist-sans),sans-serif",
  fontLabel: "Inter · display",
  contrastFg: "#F8FAFC",
  contrastBg: "#0F172A",
  contrastLabel: "a saved example — live generation is resting",
};

export const FALLBACK_STUDIO_PALETTE = {
  accent: "#222D52",
  support: "#C36B3E",
  surface: "#F5F1E8",
  ink: "#211E18",
  muted: "#8A8477",
};
