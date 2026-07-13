"use client";

/**
 * Single shared pointer listener for the whole landing page. Every scene
 * that wants pointer-parallax (ParallaxObject, AuroraMesh, CustomCursor)
 * reads from these motion values instead of attaching its own mousemove
 * listener — motion values don't trigger React re-renders, and one rAF-
 * throttled listener beats a dozen independent ones.
 */
import { createContext, useContext, useEffect, useRef, ReactNode } from "react";
import { useMotionValue, MotionValue } from "framer-motion";

type PointerContextValue = {
  x: MotionValue<number>;
  y: MotionValue<number>;
  nx: MotionValue<number>;
  ny: MotionValue<number>;
};

const PointerContext = createContext<PointerContextValue | null>(null);

export function PointerProvider({ children }: { children: ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const nx = useMotionValue(0);
  const ny = useMotionValue(0);
  const frame = useRef<number | null>(null);
  const latest = useRef({ x: 0, y: 0 });

  useEffect(() => {
    function onMove(e: PointerEvent) {
      latest.current = { x: e.clientX, y: e.clientY };
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        x.set(latest.current.x);
        y.set(latest.current.y);
        nx.set((latest.current.x / window.innerWidth) * 2 - 1);
        ny.set((latest.current.y / window.innerHeight) * 2 - 1);
      });
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [x, y, nx, ny]);

  return (
    <PointerContext.Provider value={{ x, y, nx, ny }}>
      {children}
    </PointerContext.Provider>
  );
}

export function usePointer() {
  const ctx = useContext(PointerContext);
  if (!ctx) {
    throw new Error("usePointer must be used within a PointerProvider");
  }
  return ctx;
}
