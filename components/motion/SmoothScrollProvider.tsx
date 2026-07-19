"use client";

/**
 * Lenis smooth scroll, wired to GSAP's ticker + ScrollTrigger per the
 * official integration recipe. Skipped entirely on touch devices (native
 * touch scrolling feels better than a lerped scroll there) and under
 * prefers-reduced-motion (scroll-jacking is exactly what that preference
 * asks us to avoid).
 */
import { ReactNode, useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const isTouch = useIsTouchDevice();

  useEffect(() => {
    if (reducedMotion || isTouch) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);

    function onTick(time: number) {
      lenis.raf(time * 1000);
    }
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    }

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, [reducedMotion, isTouch]);

  return <>{children}</>;
}
