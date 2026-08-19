"use client";

import { useEffect } from "react";
import { SYSTEM_COMPONENT_CSS, SYSTEM_STYLE_ELEMENT_ID } from "./styles";

// Injects the stylesheet into document.head exactly once, not as a rendered
// <style> tag. Two reasons: a rendered tag would ship the whole sheet once
// per mounted group, and module-level dedup state would be wrong under SSR
// (shared across requests, so request #2 gets no stylesheet). It also
// sidesteps <style> hydration mismatches, since a tag created after mount
// never participates in hydration. Trade-off is the sheet lands one frame
// after first paint, fine here since the canvas is client-only with no SSR
// content. Never removed on unmount — ref-counting would just trade a flash
// of unstyled components for a few kB.
export function useSystemStyles(): void {
  useEffect(() => {
    if (document.getElementById(SYSTEM_STYLE_ELEMENT_ID)) return;
    const el = document.createElement("style");
    el.id = SYSTEM_STYLE_ELEMENT_ID;
    el.textContent = SYSTEM_COMPONENT_CSS;
    document.head.appendChild(el);
  }, []);
}
