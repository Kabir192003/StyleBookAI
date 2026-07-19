/**
 * Shared motion utilities for the landing page's scroll scenes.
 *
 * Every scene component checks `prefersReducedMotion()` before building its
 * GSAP timeline: when reduced motion is requested we skip the timeline
 * entirely and snap elements to their *final* states, so the page reads as a
 * complete static document rather than a frozen first frame.
 */

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
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
