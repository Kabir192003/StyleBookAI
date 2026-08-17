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

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { canvasCss } from "@/lib/studio/roleProperties";
import { findComponentAt } from "@/lib/studio/componentSelection";
import type { StudioExportTokens } from "@/lib/studio/exportCode";
import type { Selection } from "@/lib/studio/componentSelection";
import type { NonDefaultState } from "@/components/design-system/ComponentEditor";

const SCOPE_ATTR = "data-sb-canvas";
const SCOPE_SELECTOR = `[${SCOPE_ATTR}]`;
/** Set on the selected element so the outline can be drawn without React
 *  having to own a ref to a node it did not render. */
const SELECTED_ATTR = "data-sb-selected";
/** Set on the previewed element(s) so real `:hover`/`:active` CSS rules
 *  (components/system/styles.ts) apply via this attribute as an alternate
 *  selector — see the Preview effect below for why. */
const PREVIEW_ATTR = "data-sb-preview";

/** Click-to-edit is the canvas's whole premise, but nothing about a button or
 *  a heading visually signals "this is clickable" — a first-time visitor has
 *  no way to discover it except by accident. Shown once per browser (not
 *  once per session) and dismissed for good the moment someone actually
 *  selects something, so it never nags a user who already gets it. */
const HINT_DISMISSED_KEY = "sb-studio-canvas-hint-dismissed";

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
  previewState,
  children,
}: {
  tokens: StudioExportTokens;
  theme: "light" | "dark";
  selected: Selection | null;
  onSelect: (selection: Selection | null) => void;
  /** Which non-default state the inspector wants forced onto the selected
   *  instance right now. Null means "show it normally." Doesn't need the
   *  instance's own tokens — the real CSS (components/system/styles.ts)
   *  already reads whatever override is stored, the same way real
   *  hover/focus/disabled does. */
  previewState?: NonDefaultState | null;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(false);

  // Read from localStorage in an effect, not the useState initializer —
  // the initializer runs during the server render too, where localStorage
  // doesn't exist, and reading it there would hydrate ahead of the server
  // and trip a hydration-mismatch warning (same pattern as PromptInput's
  // sessionStorage hydration).
  useEffect(() => {
    setShowHint(localStorage.getItem(HINT_DISMISSED_KEY) !== "1");
  }, []);

  function dismissHint() {
    localStorage.setItem(HINT_DISMISSED_KEY, "1");
    setShowHint(false);
  }

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

  // Triggers the REAL state, not a colour approximation of it. `focus` and
  // `disabled` have real DOM mechanisms (.focus(), the `disabled` property)
  // that only ever apply to button/input/select/textarea — exactly the
  // components APPLICABLE_STATES offers those two for (componentSelection.ts)
  // — so using them is both more correct and simpler than faking it. `hover`
  // and `active` have no DOM API to force them (no `el.hover()` exists), so
  // PREVIEW_ATTR is added as an alternate selector on the *same* CSS rule as
  // the real `:hover`/`:active` (components/system/styles.ts) rather than a
  // hand-copied subset of it — so preview shows the exact real hover,
  // shadow/transform included, never a background-only stand-in for it.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const el = root.querySelector<HTMLElement>(`[${SELECTED_ATTR}]`);
    if (!el) return;

    // navigation's editable slot spans three descendant families
    // (links/tabs/crumbs) inside whichever container got selected, and
    // table's spans its rows — previewing has to reach those descendants or
    // nothing visibly changes, since the container itself carries none of
    // that colour.
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
      // A click on canvas background is a deselect. Without this the panel
      // is only closable from its own X, which reads as stuck.
      onSelect(null);
      return;
    }
    hit.element.setAttribute(SELECTED_ATTR, "true");
    onSelect(hit.selection);
    if (showHint) dismissHint();
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
