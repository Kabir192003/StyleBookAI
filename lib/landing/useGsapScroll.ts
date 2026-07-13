"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export type GsapScrollBuildArgs<T> = { root: T; reducedMotion: boolean };

/**
 * Every landing scene needs the same boilerplate: scope a GSAP context to a
 * ref, build ScrollTrigger-driven animations inside it, and revert on
 * unmount so triggers don't leak across route changes. Wrapping with
 * gsap.matchMedia() means prefers-reduced-motion is handled once, here,
 * instead of every scene re-implementing it — the CSS-level reduced-motion
 * rule in globals.css only catches CSS transitions, not these GSAP tweens,
 * so scenes must branch on `reducedMotion` and skip/shorten their timeline.
 */
export function useGsapScroll<T extends HTMLElement>(
  build: (args: GsapScrollBuildArgs<T>) => void,
  deps: unknown[] = []
) {
  const ref = useRef<T | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const mm = gsap.matchMedia();
    mm.add({ reducedMotion: "(prefers-reduced-motion: reduce)" }, (context) => {
      const { reducedMotion } = (context as gsap.Context & { conditions: { reducedMotion: boolean } }).conditions;
      build({ root: ref.current as T, reducedMotion });
    }, ref.current);
    return () => mm.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
