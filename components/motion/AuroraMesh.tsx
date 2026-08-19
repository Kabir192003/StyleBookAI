"use client";

// Coloured studio-lighting effect: a few large blurred fields that breathe
// and drift slowly, with a small pointer-parallax offset per field. Colors
// come from CSS custom properties written by SceneBackground, so the mesh
// itself never re-renders on scroll — only the variables it reads change.
import { motion, useTransform } from "framer-motion";
import { usePointer } from "./PointerProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { MotionValue } from "framer-motion";

const fields = [
  { key: "glow-1", top: "20%", left: "22%", vw: 46, depth: 0.4, duration: 24 },
  { key: "glow-2", top: "82%", left: "18%", vw: 40, depth: 0.25, duration: 30 },
  { key: "glow-3", top: "12%", left: "82%", vw: 38, depth: 0.55, duration: 27 },
];

export function AuroraMesh() {
  const { nx, ny } = usePointer();
  const reducedMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden">
      {fields.map((field) => (
        <Field key={field.key} field={field} nx={nx} ny={ny} reducedMotion={reducedMotion} />
      ))}
    </div>
  );
}

function Field({
  field,
  nx,
  ny,
  reducedMotion,
}: {
  field: (typeof fields)[number];
  nx: MotionValue<number>;
  ny: MotionValue<number>;
  reducedMotion: boolean;
}) {
  const x = useTransform(nx, [-1, 1], [-40 * field.depth, 40 * field.depth]);
  const y = useTransform(ny, [-1, 1], [-40 * field.depth, 40 * field.depth]);

  return (
    <motion.div
      className="absolute rounded-full blur-[90px]"
      style={{
        top: field.top,
        left: field.left,
        width: `${field.vw}vw`,
        height: `${field.vw}vw`,
        marginLeft: `-${field.vw / 2}vw`,
        marginTop: `-${field.vw / 2}vw`,
        background: `var(--scene-${field.key}-color)`,
        opacity: "var(--scene-glow-opacity)",
        x: reducedMotion ? 0 : x,
        y: reducedMotion ? 0 : y,
      }}
      animate={
        reducedMotion
          ? undefined
          : { scale: [1, 1.08, 0.96, 1] }
      }
      transition={
        reducedMotion
          ? undefined
          : { duration: field.duration, repeat: Infinity, ease: "easeInOut" }
      }
    />
  );
}
