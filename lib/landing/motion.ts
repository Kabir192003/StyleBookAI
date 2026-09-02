/**
 * Shared motion utilities for the landing page's scroll scenes.
 *
 * Every scene component checks `prefersReducedMotion()` before building its
 * GSAP timeline: when reduced motion is requested we skip the timeline
 * entirely and snap elements to their *final* states, so the page reads as a
 * complete static document rather than a frozen first frame.
 */

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  // Two independent sources: the OS-level media query, and the app's own
  // account-page "Reduce motion" toggle (lib/a11y/preferences.ts), which
  // sets data-a11y-reduce-motion on <html> for people whose OS setting
  // doesn't reflect what they want. Checking only the media query meant
  // turning that toggle on didn't skip this page's Lenis/GSAP scroll
  // choreography at all — it only added globals.css's blanket
  // animation-duration override on top of the full animation still
  // running, which is what made the page feel broken rather than calmer.
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.hasAttribute("data-a11y-reduce-motion")
  );
}

/**
 * Deterministic PRNG (mulberry32). Scene layouts that look "scattered" must
 * be seeded so the server and client render identical markup — Math.random()
 * in render/module scope causes React hydration mismatches.
 */
export function seededRandom(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
