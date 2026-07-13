/**
 * Keyframes for the living background system (components/motion/SceneBackground).
 * `progress` is 0..1 across the *entire* page scroll — SceneBackground
 * interpolates base/glow colors between these stops with chroma-js so the
 * atmosphere shifts continuously instead of hard-cutting at scene edges.
 * Kept in one place because the narrative arc (see the build prompt) is
 * defined by this progression, not by any single scene component.
 */
export type SceneStop = {
  progress: number;
  base: string;
  glow1: string;
  glow2: string;
  glow3: string;
};

export const sceneStops: SceneStop[] = [
  { progress: 0.0, base: "#FBF6EC", glow1: "#C9A9E8", glow2: "#FFB086", glow3: "#2A4CE0" }, // hero
  { progress: 0.08, base: "#F7EEDD", glow1: "#FF6B57", glow2: "#2A4CE0", glow3: "#C9A9E8" }, // fragmentation
  { progress: 0.15, base: "#E8DFCF", glow1: "#AFA0AC", glow2: "#8B93B0", glow3: "#AFA0AC" }, // breaking point
  { progress: 0.22, base: "#2B1830", glow1: "#7C3AED", glow2: "#3A2140", glow3: "#150F1C" }, // unification
  { progress: 0.3, base: "#2B1830", glow1: "#7C3AED", glow2: "#C9A9E8", glow3: "#2A4CE0" }, // ecosystem
  { progress: 0.38, base: "#3A2140", glow1: "#C9A9E8", glow2: "#FFB086", glow3: "#2A4CE0" }, // AI mode
  { progress: 0.47, base: "#FBF6EC", glow1: "#FF6B57", glow2: "#7C3AED", glow3: "#2A4CE0" }, // human control
  { progress: 0.56, base: "#FBF6EC", glow1: "#FF6B57", glow2: "#F6D658", glow3: "#7FE0C0" }, // browse
  { progress: 0.64, base: "#F3ECDD", glow1: "#7C3AED", glow2: "#FF6B57", glow3: "#7FE0C0" }, // typography
  { progress: 0.72, base: "#150F1C", glow1: "#7C3AED", glow2: "#2A4CE0", glow3: "#150F1C" }, // studio
  { progress: 0.8, base: "#FBF6EC", glow1: "#7FE0C0", glow2: "#C9A9E8", glow3: "#F6D658" }, // accessibility
  { progress: 0.9, base: "#2B1830", glow1: "#2A4CE0", glow2: "#7C3AED", glow3: "#150F1C" }, // scale + export
  { progress: 1.0, base: "#FBF6EC", glow1: "#C9A9E8", glow2: "#FFB086", glow3: "#2A4CE0" }, // final CTA
];
