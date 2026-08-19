"use client";

// Signature cursor: a small ring by default, expands and absorbs the exact
// color of whatever it's hovering via `data-cursor-color`, and shows a
// contextual label from `data-cursor`. Desktop + fine-pointer only — see
// the (pointer: coarse) rule in globals.css that restores the native cursor.
import { motion, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { usePointer } from "./PointerProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice";

export function CustomCursor() {
  const { x, y } = usePointer();
  const reducedMotion = useReducedMotion();
  const isTouch = useIsTouchDevice();
  const springX = useSpring(x, { damping: 28, stiffness: 380, mass: 0.4 });
  const springY = useSpring(y, { damping: 28, stiffness: 380, mass: 0.4 });
  const [label, setLabel] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);

  useEffect(() => {
    if (isTouch) return;
    function onOver(e: PointerEvent) {
      const target = (e.target as HTMLElement)?.closest?.<HTMLElement>("[data-cursor]");
      if (!target) return;
      setLabel(target.dataset.cursor || null);
      setColor(target.dataset.cursorColor || null);
    }
    function onOut(e: PointerEvent) {
      const target = (e.target as HTMLElement)?.closest?.<HTMLElement>("[data-cursor]");
      if (!target) return;
      setLabel(null);
      setColor(null);
    }
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
    };
  }, [isTouch]);

  if (isTouch) return null;

  const active = Boolean(label || color);
  const size = color ? 52 : active ? 44 : 14;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[100] hidden md:flex items-center justify-center rounded-full border border-[var(--cursor-color)]"
      style={{
        x: reducedMotion ? x : springX,
        y: reducedMotion ? y : springY,
        translateX: "-50%",
        translateY: "-50%",
        width: size,
        height: size,
        backgroundColor: color ?? "transparent",
        borderWidth: color ? 0 : 1,
        transition: "width 0.2s ease, height 0.2s ease, background-color 0.2s ease",
      }}
    >
      {label && (
        <span className="whitespace-nowrap text-[9px] font-semibold uppercase tracking-widest text-sb-ink">
          {label}
        </span>
      )}
      {color && !label && (
        <span className="whitespace-nowrap rounded-full bg-sb-ink/80 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-widest text-sb-ivory">
          {color}
        </span>
      )}
    </motion.div>
  );
}
