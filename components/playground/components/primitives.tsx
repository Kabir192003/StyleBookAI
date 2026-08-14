/**
 * Shared scaffolding for the Design Playground component library: the
 * stylesheet injector and the two layout wrappers every group is built out
 * of. Nothing here is token-aware beyond passing the `pg-scope` class along
 * — the tokens are resolved by the CSS in ./styles.ts.
 */
"use client";

import { useEffect, type ReactNode } from "react";
import { PLAYGROUND_COMPONENT_CSS, PLAYGROUND_STYLE_ELEMENT_ID } from "./styles";

/**
 * Puts the component stylesheet in the document exactly once, no matter how
 * many groups or how many experiments are on screen.
 *
 * Why `document.head` and not a rendered `<style>` element:
 *
 * 1. *Once* is the requirement. The playground canvas mounts every group
 *    inside every experiment card, so a rendered `<style>` would ship the
 *    whole sheet 6x per experiment — ~30 copies on a four-experiment board.
 *    Deduping a rendered tag would need module-level "have I already
 *    emitted this" state, which is wrong under SSR: the module is shared
 *    across requests, so request #2 would render no stylesheet at all.
 * 2. It sidesteps the `<style>` hydration trap entirely. A `<style>` text
 *    child is HTML-entity-escaped differently on the server and the client
 *    (see the comment in components/studio/LivePreviewSection.tsx, which
 *    works around it with dangerouslySetInnerHTML). An element created
 *    after mount never participates in hydration, so there is nothing to
 *    mismatch.
 *
 * The trade-off is that the sheet lands one frame after first paint. That
 * is acceptable here and only here: the playground is a client-only Studio
 * surface with no SSR content story, and the un-styled frame is a plain
 * document flow rather than a broken layout.
 *
 * It is deliberately never removed on unmount — ref-counting a global
 * stylesheet across N independently-unmounting experiment cards buys a few
 * kB back in exchange for a flash of unstyled components every time a user
 * deletes an experiment.
 */
export function usePlaygroundStyles(): void {
  useEffect(() => {
    if (document.getElementById(PLAYGROUND_STYLE_ELEMENT_ID)) return;
    const el = document.createElement("style");
    el.id = PLAYGROUND_STYLE_ELEMENT_ID;
    el.textContent = PLAYGROUND_COMPONENT_CSS;
    document.head.appendChild(el);
  }, []);
}

/**
 * Root of every group. `pg-scope` is where the `--pgc-*` alias layer is
 * declared, so it must wrap the markup — a component rendered outside it
 * resolves every alias to nothing and paints unstyled.
 */
export function GroupShell({ children }: { children: ReactNode }) {
  usePlaygroundStyles();
  return (
    <div className="pg-scope">
      <div className="pg-stack">{children}</div>
    </div>
  );
}

/**
 * One labelled specimen. The caption is part of the token scope on purpose:
 * a label printed in a colour the experiment never chose would sit next to
 * the components being judged and misrepresent the palette.
 */
export function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="pg-specimen">
      <h4 className="pg-specimen__label">{label}</h4>
      {children}
    </section>
  );
}
