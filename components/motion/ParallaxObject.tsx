"use client";

/**
 * Depth-based pointer parallax for the hero's floating design objects.
 * `depth` 0 = far/still, 1 = near/most movement — compose several of these
 * at different depths so the object cluster reads as one 3D scene rather
 * than a flat sticker sheet.
 */
import { motion, useTransform } from "framer-motion";
import { ReactNode } from "react";
import { usePointer } from "./PointerProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function ParallaxObject({
  children,
  depth = 1,
  className,
  range = 18,
}: {
  children: ReactNode;
  depth?: number;
  className?: string;
  range?: number;
}) {
  const { nx, ny } = usePointer();
  const reducedMotion = useReducedMotion();
  const x = useTransform(nx, [-1, 1], [-range * depth, range * depth]);
  const y = useTransform(ny, [-1, 1], [-range * depth, range * depth]);

  return (
    <motion.div
      style={{ x: reducedMotion ? 0 : x, y: reducedMotion ? 0 : y }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
