// The one Studio canvas. Exactly two content states — the default showcase,
// or the AI-generated contextual UI — as content, not modes: both render
// inside the same [data-sb-canvas] token scope, from the same component
// library, under the same click handler, so there's no second code path for
// one to drift away from. Selection is one delegated listener rather than a
// handler per component, since the components are props-free by contract and
// the generated sections use the same classes — a root listener is the only
// mechanism that covers both without touching either. It never calls
// preventDefault: clicking a button must still run it, since trying the real
// states is half the point of the canvas.
"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { canvasCss } from "@/lib/studio/roleProperties";
import { findComponentAt } from "@/lib/studio/componentSelection";
import type { StudioExportTokens } from "@/lib/studio/exportCode";
import type { Selection } from "@/lib/studio/componentSelection";
import type { NonDefaultState } from "@/components/design-system/ComponentEditor";

const SCOPE_ATTR = "data-sb-canvas";
const SCOPE_SELECTOR = `[${SCOPE_ATTR}]`;
// Set on the selected element so the outline can be drawn without React
// owning a ref to a node it didn't render.
const SELECTED_ATTR = "data-sb-selected";
// Set on the previewed element(s) so real :hover/:active CSS rules
// (components/system/styles.ts) apply via this attribute as an alternate
// selector — see the Preview effect below.
const PREVIEW_ATTR = "data-sb-preview";

// Shown once per browser, not once per session, and dismissed for good the
// moment someone actually selects something.
const HINT_DISMISSED_KEY = "sb-studio-canvas-hint-dismissed";

// Scoped to the canvas so the outline can't leak onto Studio's own chrome;
// outline rather than border so it never shifts layout.
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
  previewState,
  children,
}: {
  tokens: StudioExportTokens;
  theme: "light" | "dark";
  selected: Selection | null;
  onSelect: (selection: Selection | null) => void;
  // Which non-default state the inspector wants forced onto the selected
  // instance right now. Null means "show it normally."
  previewState?: NonDefaultState | null;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(false);

  // Read from localStorage in an effect, not the useState initializer — the
  // initializer also runs during server render, where localStorage doesn't
  // exist, and reading it there would trip a hydration mismatch.
  useEffect(() => {
    setShowHint(localStorage.getItem(HINT_DISMISSED_KEY) !== "1");
  }, []);

  function dismissHint() {
    localStorage.setItem(HINT_DISMISSED_KEY, "1");
    setShowHint(false);
  }

  // Regenerated only when tokens change — the CSS string is the expensive
  // part of a canvas render and is fully determined by them.
  const css = useMemo(() => canvasCss(SCOPE_SELECTOR, tokens), [tokens]);

  // Rewriting the <style> above updates the --pg-*/--pgc-* values, but the
  // browser does not always re-resolve properties that read them through
  // var(), so the canvas can keep painting the previous value. box-shadow was
  // the visible case: switching Shadow between none/subtle/dramatic changed
  // --pgc-shadow while every card carried on rendering the old shadow, which
  // read as "the control does nothing". Forcing a style recalculation after
  // the CSS changes fixes it for every property at once, not just shadows.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const previous = root.style.display;
    root.style.display = "none";
    void root.offsetHeight;
    root.style.display = previous;
  }, [css]);

  // Done here, not in the click handler, because the selected element can be
  // unmounted by a content switch or token change while still carrying the attribute.
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

  // Triggers the REAL state, not a color approximation of it. focus/disabled
  // have real DOM mechanisms (.focus(), the disabled property), so using
  // them is simpler and more correct than faking it. hover/active have no
  // DOM API to force them, so PREVIEW_ATTR is added as an alternate selector
  // on the same CSS rule as the real :hover/:active (styles.ts) rather than
  // a hand-copied subset — preview shows the exact real hover, shadow and
  // transform included.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const el = root.querySelector<HTMLElement>(`[${SELECTED_ATTR}]`);
    if (!el) return;

    // navigation's editable slot spans three descendant families
    // (links/tabs/crumbs), and table's spans its rows — previewing has to
    // reach those descendants or nothing visibly changes, since the
    // container itself carries none of that color.
    const previewTargets: HTMLElement[] =
      selected?.kind === "component" && selected.name === "navigation"
        ? [...el.querySelectorAll<HTMLElement>(".pg-navlink, .pg-tab, .pg-crumb")]
        : selected?.kind === "component" && selected.name === "table"
          ? [...el.querySelectorAll<HTMLElement>("tbody tr")]
          : [el];

    function isFormControl(node: HTMLElement): node is HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
      return (
        node instanceof HTMLButtonElement ||
        node instanceof HTMLInputElement ||
        node instanceof HTMLSelectElement ||
        node instanceof HTMLTextAreaElement
      );
    }

    function clear() {
      previewTargets.forEach((t) => {
        t.removeAttribute(PREVIEW_ATTR);
        if (isFormControl(t)) t.disabled = false;
      });
      if (document.activeElement === el) (el as HTMLElement).blur?.();
    }

    if (!previewState || selected?.kind !== "component") {
      clear();
      return;
    }

    if (previewState === "focus") {
      el.focus();
    } else if (previewState === "disabled") {
      if (isFormControl(el)) el.disabled = true;
    } else {
      previewTargets.forEach((t) => t.setAttribute(PREVIEW_ATTR, previewState));
    }

    return clear;
  }, [selected, previewState]);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const root = rootRef.current;
    if (!root) return;
    const hit = findComponentAt(e.target, root);

    root.querySelectorAll(`[${SELECTED_ATTR}]`).forEach((el) => el.removeAttribute(SELECTED_ATTR));
    if (!hit) {
      // A click on canvas background is a deselect, so the panel isn't only closable from its own X.
      onSelect(null);
      return;
    }
    hit.element.setAttribute(SELECTED_ATTR, "true");
    onSelect(hit.selection);
    if (showHint) dismissHint();
  }

  return (
    <>
      {/* dangerouslySetInnerHTML, not a text child — a <style> text child is HTML-entity-escaped differently between server and client and trips a hydration mismatch. Safe: `css` is our own generated token CSS, no user text. */}
      <style dangerouslySetInnerHTML={{ __html: `${css}\n${SELECTION_CSS}` }} />
      <div
        ref={rootRef}
        {...{ [SCOPE_ATTR]: "true" }}
        data-theme={theme}
        onClick={handleClick}
        // relative is load-bearing, not cosmetic — the library's modal/toast overlays are absolute and need this containing block or they'd escape the mockup.
        className="relative min-h-[400px] overflow-hidden rounded-[14px] border border-black/[0.08] shadow-[0_30px_70px_-30px_rgba(20,17,12,0.5)]"
        style={{ background: "var(--pg-background)", color: "var(--pg-text)", fontFamily: "var(--pg-font-body)" }}
      >
        {children}
        {showHint && (
          <div className="pointer-events-none absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#211E18] px-4 py-2 text-[12px] text-[#F2EBE0] shadow-[0_10px_30px_-10px_rgba(20,17,12,0.6)]">
            <span aria-hidden="true">✦</span>
            <span>Click anything below to edit it</span>
            <button
              type="button"
              onClick={dismissHint}
              aria-label="Dismiss hint"
              className="pointer-events-auto ml-1 text-[#F2EBE0]/70 hover:text-[#F2EBE0]"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </>
  );
}
