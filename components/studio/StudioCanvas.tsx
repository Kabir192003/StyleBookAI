/**
 * The one Studio canvas. Replaces the three preview surfaces that used to
 * overlap here (a hardcoded inline-styled mock, LivePreviewSection's block
 * canvas of static HTML strings, and DesignSystemGallery's hand-drawn shapes).
 *
 * It has exactly two content states — the default showcase, or the
 * AI-generated contextual UI — and they are *content*, not modes. Both render
 * inside the same `[data-sb-canvas]` token scope, from the same component
 * library, under the same click handler. That is what makes "the same editor
 * works on both" true structurally: there is no second code path for one to
 * drift away from.
 *
 * Selection is one delegated listener rather than a handler per component.
 * The components are props-free by contract (components/system/index.ts) and
 * the generated sections are built from the same classes, so a listener at the
 * root is the only mechanism that can cover both without touching either.
 * Crucially it never calls preventDefault: clicking a button must still run
 * the button, because half the point of the canvas is trying the real states.
 */
"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { canvasCss } from "@/lib/studio/roleProperties";
import { findComponentAt } from "@/lib/studio/componentSelection";
import type { StudioExportTokens } from "@/lib/studio/exportCode";
import type { ComponentName } from "@/types/designSystem";

const SCOPE_ATTR = "data-sb-canvas";
const SCOPE_SELECTOR = `[${SCOPE_ATTR}]`;
/** Set on the selected element so the outline can be drawn without React
 *  having to own a ref to a node it did not render. */
const SELECTED_ATTR = "data-sb-selected";

/** Scoped to the canvas so the outline cannot leak onto Studio's own chrome,
 *  and `outline` rather than `border` so it never shifts layout. */
const SELECTION_CSS = `
${SCOPE_SELECTOR} [${SELECTED_ATTR}] {
  outline: 2px solid #222D52;
  outline-offset: 2px;
}
`;

export function StudioCanvas({
  tokens,
  theme,
  selected,
  onSelect,
  children,
}: {
  tokens: StudioExportTokens;
  theme: "light" | "dark";
  selected: ComponentName | null;
  onSelect: (name: ComponentName | null) => void;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Regenerated only when the tokens change — the CSS string is the expensive
  // part of a canvas render and is fully determined by them.
  const css = useMemo(() => canvasCss(SCOPE_SELECTOR, tokens), [tokens]);

  // Clearing the mark is done here, not in the click handler, because the
  // selected element can be unmounted by a content switch or a token change
  // while still carrying the attribute.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (selected === null) {
      root.querySelectorAll(`[${SELECTED_ATTR}]`).forEach((el) => el.removeAttribute(SELECTED_ATTR));
    }
  }, [selected]);

  useEffect(() => {
    if (selected === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onSelect(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, onSelect]);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const root = rootRef.current;
    if (!root) return;
    const hit = findComponentAt(e.target, root);

    root.querySelectorAll(`[${SELECTED_ATTR}]`).forEach((el) => el.removeAttribute(SELECTED_ATTR));
    if (!hit) {
      // A click on canvas background is a deselect. Without this the panel
      // is only closable from its own X, which reads as stuck.
      onSelect(null);
      return;
    }
    hit.element.setAttribute(SELECTED_ATTR, "true");
    onSelect(hit.name);
  }

  return (
    <>
      {/* dangerouslySetInnerHTML, not a text child: a <style> text child is
          HTML-entity-escaped differently between the server render and
          hydration and trips a mismatch. Safe — `css` is our own generated
          token CSS and interpolates no user text. */}
      <style dangerouslySetInnerHTML={{ __html: `${css}\n${SELECTION_CSS}` }} />
      <div
        ref={rootRef}
        {...{ [SCOPE_ATTR]: "true" }}
        data-theme={theme}
        onClick={handleClick}
        // `relative` is load-bearing, not cosmetic: the library's modal and toast
        // overlays are position:absolute, and without a containing block here they
        // would escape the mockup and cover Studio's own sidebar and inspector.
        className="relative min-h-[400px] overflow-hidden rounded-[14px] border border-black/[0.08] shadow-[0_30px_70px_-30px_rgba(20,17,12,0.5)]"
        style={{ background: "var(--pg-background)", color: "var(--pg-text)", fontFamily: "var(--pg-font-body)" }}
      >
        {children}
      </div>
    </>
  );
}
