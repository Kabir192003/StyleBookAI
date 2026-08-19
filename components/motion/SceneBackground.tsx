"use client";

// The living background: interpolates base + glow colors across the whole
// page's scroll range using chroma-js ("lab" mode, so transitions never pass
// through a muddy grey). Writes straight to CSS custom properties on <html>
// from one whole-document ScrollTrigger, so every scene reads the same
// source of truth with no React state on the scroll path.
import { useEffect } from "react";
import chroma from "chroma-js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { sceneStops } from "@/lib/landing/sceneStops";
import { AuroraMesh } from "./AuroraMesh";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function SceneBackground() {
  useEffect(() => {
    const domain = sceneStops.map((s) => s.progress);
    const baseScale = chroma.scale(sceneStops.map((s) => s.base)).domain(domain).mode("lab");
    const glow1Scale = chroma.scale(sceneStops.map((s) => s.glow1)).domain(domain).mode("lab");
    const glow2Scale = chroma.scale(sceneStops.map((s) => s.glow2)).domain(domain).mode("lab");
    const glow3Scale = chroma.scale(sceneStops.map((s) => s.glow3)).domain(domain).mode("lab");

    const trigger = ScrollTrigger.create({
      trigger: document.documentElement,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        const root = document.documentElement.style;
        root.setProperty("--scene-bg", baseScale(p).hex());
        root.setProperty("--scene-glow-1-color", glow1Scale(p).hex());
        root.setProperty("--scene-glow-2-color", glow2Scale(p).hex());
        root.setProperty("--scene-glow-3-color", glow3Scale(p).hex());
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-0"
      style={{ backgroundColor: "var(--scene-bg)" }}
    >
      <AuroraMesh />
      <div className="sb-grain" />
    </div>
  );
}
