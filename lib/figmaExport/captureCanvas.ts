// Captures the live Studio canvas — the whole page, and each component in
// each of its real states — as Figma payload nodes. States are captured by
// driving the same mechanism Studio's own inspector Preview toggle uses (the
// `data-sb-preview` attribute in components/system/styles.ts, plus real
// `.focus()`/`.disabled`), so a Hover variant in Figma is the browser's own
// `:hover` rule output, not a guessed colour formula. Light/dark works the
// same way: flip `data-theme`, let the cascade recompute, read it back.
// Everything restores in a `finally` so an export can't leave the canvas
// stuck in a previewed state.
"use client";

import type { ComponentName } from "@/types/designSystem";
import { APPLICABLE_STATES, COMPONENT_LABELS } from "@/lib/studio/componentSelection";
import { serializeElement } from "./domSerializer";
import type { FigmaComponentSet, FigmaComponentState, FigmaFrameNode } from "./types";

const CANVAS_SELECTOR = "[data-sb-canvas]";
const PREVIEW_ATTR = "data-sb-preview";

/**
 * Which rendered element best represents each component. Ordered — the first
 * match wins — and deliberately prefers the *wrapper* over the bare control
 * for `dropdown` (`.pg-select-wrap` carries the chevron; the bare `.pg-select`
 * alone exported as a rounded box with no affordance) and for `table`
 * (`.pg-table-wrap` is the real bordered table, not a lone `<table>`).
 */
const REPRESENTATIVE: Record<ComponentName, string[]> = {
  button: [".pg-btn--primary", ".pg-btn"],
  buttonSecondary: [".pg-btn--secondary"],
  input: [".pg-field", ".pg-input"],
  dropdown: [".pg-select-wrap", ".pg-select"],
  card: [".pg-card"],
  navigation: [".pg-navbar", ".pg-tablist"],
  table: [".pg-table-wrap", ".pg-table"],
  modal: [".pg-modal"],
  alert: [".pg-alert"],
  badge: [".pg-badge"],
};

/** Mirrors StudioCanvas's own preview targeting: navigation and table map to
 *  a container, but the colour that changes on hover lives on descendants. */
const PREVIEW_DESCENDANTS: Partial<Record<ComponentName, string>> = {
  navigation: ".pg-navlink, .pg-tab, .pg-crumb",
  table: "tbody tr",
};

const STATE_KEY: Record<Exclude<FigmaComponentState, "Default">, "hover" | "active" | "disabled" | "focus"> = {
  Hover: "hover",
  Active: "active",
  Disabled: "disabled",
  Focus: "focus",
};

function isFormControl(node: Element): node is HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return (
    node instanceof HTMLButtonElement ||
    node instanceof HTMLInputElement ||
    node instanceof HTMLSelectElement ||
    node instanceof HTMLTextAreaElement
  );
}

// Forces a real style recalculation. offsetHeight alone doesn't clear a
// stale getComputedStyle() cache after a CSS-variable rewrite, detaching
// and reattaching the root does.
function flush(root: HTMLElement): void {
  const previous = root.style.display;
  root.style.display = "none";
  void root.offsetHeight;
  root.style.display = previous;
  void root.offsetHeight;
}

function findCanvas(): HTMLElement | null {
  return document.querySelector<HTMLElement>(CANVAS_SELECTOR);
}

function findRepresentative(canvas: HTMLElement, name: ComponentName): HTMLElement | null {
  for (const selector of REPRESENTATIVE[name]) {
    const found = canvas.querySelector<HTMLElement>(selector);
    if (found) return found;
  }
  return null;
}

function captureStates(canvas: HTMLElement, name: ComponentName, variant: "light" | "dark"): FigmaComponentSet | null {
  const el = findRepresentative(canvas, name);
  if (!el) return null;
  // Every flush below invalidates from the canvas root, never from `el` —
  // a state rule can repaint descendants (nav links, table rows) that a
  // narrower invalidation would leave holding stale values.

  const targets: HTMLElement[] = PREVIEW_DESCENDANTS[name]
    ? [...el.querySelectorAll<HTMLElement>(PREVIEW_DESCENDANTS[name]!)]
    : [el];
  if (targets.length === 0) targets.push(el);

  const label = COMPONENT_LABELS[name];
  const states: FigmaComponentSet["states"] = [];

  const base = serializeElement(el, label);
  if (!base) return null;
  states.push({ state: "Default", node: base });

  for (const state of ["Hover", "Active", "Disabled", "Focus"] as const) {
    if (!APPLICABLE_STATES[name].includes(STATE_KEY[state])) continue;
    const previouslyFocused = document.activeElement;
    try {
      if (state === "Focus") {
        el.focus({ preventScroll: true });
      } else if (state === "Disabled") {
        targets.forEach((t) => {
          if (isFormControl(t)) t.disabled = true;
        });
      } else {
        targets.forEach((t) => t.setAttribute(PREVIEW_ATTR, STATE_KEY[state]));
      }
      flush(canvas);
      const node = serializeElement(el, label);
      if (node) states.push({ state, node });
    } finally {
      targets.forEach((t) => {
        t.removeAttribute(PREVIEW_ATTR);
        if (isFormControl(t)) t.disabled = false;
      });
      if (state === "Focus") {
        (el as HTMLElement).blur?.();
        if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus({ preventScroll: true });
      }
      flush(canvas);
    }
  }

  return { componentName: name, label, variant, states };
}

export type CanvasCapture = {
  canvas?: FigmaFrameNode;
  componentLibrary?: FigmaComponentSet[];
  /** Components with no instance on the current canvas — surfaced to the
   *  user rather than silently dropped, since "some components sometimes
   *  don't export" is otherwise indistinguishable from a bug. */
  missing: string[];
};

export function captureFromCanvas(options: { canvas: boolean; componentLibrary: boolean }): CanvasCapture {
  const root = findCanvas();
  if (!root) throw new Error("Studio canvas isn't on screen — open the Builder tab and try again.");

  const originalTheme = root.getAttribute("data-theme");
  const missing: string[] = [];

  try {
    const result: CanvasCapture = { missing };

    if (options.canvas) {
      // The page capture needs the same invalidation as the state captures —
      // without it the very first read of the session can hand back the stale
      // pre-token-change values for the whole tree.
      flush(root);
      const node = serializeElement(root, "Canvas");
      if (node) result.canvas = node;
    }

    if (options.componentLibrary) {
      const sets: FigmaComponentSet[] = [];
      const names = Object.keys(COMPONENT_LABELS) as ComponentName[];

      for (const variant of ["light", "dark"] as const) {
        root.setAttribute("data-theme", variant);
        flush(root);
        for (const name of names) {
          const set = captureStates(root, name, variant);
          if (set) sets.push(set);
          else if (variant === "light") missing.push(COMPONENT_LABELS[name]);
        }
      }
      result.componentLibrary = sets;
    }

    return result;
  } finally {
    if (originalTheme === null) root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", originalTheme);
    flush(root);
  }
}
