/**
 * Shared scaffolding for the StyleBook component library: the stylesheet
 * injector. Nothing here is token-aware — the tokens are resolved by the CSS
 * in ./styles.ts against whichever scope the markup sits in.
 */
"use client";

import { useEffect } from "react";
import { SYSTEM_COMPONENT_CSS, SYSTEM_STYLE_ELEMENT_ID } from "./styles";

/**
 * Puts the component stylesheet in the document exactly once, no matter how
 * many groups are on screen.
 *
 * Why `document.head` and not a rendered `<style>` element:
 *
 * 1. *Once* is the requirement. The canvas mounts every group, so a rendered
 *    `<style>` would ship the whole 900-line sheet once per group. Deduping a
 *    rendered tag would need module-level "have I already emitted this"
 *    state, which is wrong under SSR: the module is shared across requests,
 *    so request #2 would render no stylesheet at all.
 * 2. It sidesteps the `<style>` hydration trap entirely. A `<style>` text
 *    child is HTML-entity-escaped differently on the server and the client
 *    (which is why StudioCanvas injects its token CSS with
 *    dangerouslySetInnerHTML). An element created after mount never
 *    participates in hydration, so there is nothing to mismatch.
 *
 * The trade-off is that the sheet lands one frame after first paint. That is
 * acceptable here and only here: the canvas is a client-only Studio surface
 * with no SSR content story, and the un-styled frame is a plain document flow
 * rather than a broken layout.
 *
 * It is deliberately never removed on unmount — ref-counting a global
 * stylesheet buys a few kB back in exchange for a flash of unstyled
 * components every time the canvas swaps content.
 */
export function useSystemStyles(): void {
  useEffect(() => {
    if (document.getElementById(SYSTEM_STYLE_ELEMENT_ID)) return;
    const el = document.createElement("style");
    el.id = SYSTEM_STYLE_ELEMENT_ID;
    el.textContent = SYSTEM_COMPONENT_CSS;
    document.head.appendChild(el);
  }, []);
}
