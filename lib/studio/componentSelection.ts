// Maps a clicked canvas node back to its design-system component via its
// .pg-* CSS class, not a data-* tag, so renaming a class in
// components/system/styles.ts silently breaks selection for it.
import type { ComponentName } from "@/types/designSystem";
import type { NonDefaultState } from "@/components/design-system/ComponentEditor";

// Ordered most-specific-first; order is load-bearing twice over: (1)
// `.pg-btn--secondary` must precede `.pg-btn`, or a secondary button resolves
// to `button` and edits the wrong token set — a mistake invisible on screen;
// (2) structural containers (`.pg-card`, `.pg-modal`, `.pg-navbar`) come
// last, since `closest()` walks up the tree and an early card entry would
// swallow every control nested inside one.
const SELECTORS: Array<{ selector: string; name: ComponentName }> = [
  { selector: ".pg-btn--secondary", name: "buttonSecondary" },
  { selector: ".pg-btn", name: "button" },
  { selector: ".pg-badge", name: "badge" },
  { selector: ".pg-select, .pg-select-wrap", name: "dropdown" },
  { selector: ".pg-input, .pg-textarea", name: "input" },
  { selector: ".pg-alert", name: "alert" },
  { selector: ".pg-table, .pg-table-wrap", name: "table" },
  { selector: ".pg-navbar, .pg-tablist, .pg-crumbs", name: "navigation" },
  { selector: ".pg-modal", name: "modal" },
  { selector: ".pg-card", name: "card" },
];

/**
 * Text is selectable too, and maps to a *type role* rather than a component:
 * headings and body copy have no `ComponentTokenSet`, they have a typeface.
 * Clicking a headline therefore opens the font controls, not a background
 * colour picker — which is what a designer means when they click a heading.
 *
 * Tested before the component selectors so a heading *inside* a card selects
 * the heading; a click anywhere else in the card still selects the card.
 */
const TYPE_SELECTORS: Array<{ selector: string; role: TypeRole }> = [
  { selector: ".pg-display", role: "display" },
  { selector: ".pg-h1, .pg-h2, .pg-h3, .pg-modal__title, .pg-navbar__brand", role: "heading" },
  { selector: ".pg-body, .pg-caption", role: "body" },
];

/** The three faces the system actually has. Deliberately not one per heading
 *  level: `StudioState` carries a display face and a body face (plus an
 *  optional accent), and offering seven would promise distinctions no export
 *  could reproduce. */
export type TypeRole = "display" | "heading" | "body";

export type Selection =
  | { kind: "component"; name: ComponentName; variant?: string }
  | { kind: "type"; role: TypeRole };

export type SelectionHit = { selection: Selection; element: HTMLElement };

// A handful of components collapse several visually distinct instances into
// one editable slot (see COMPONENT_SCOPE_NOTES) — badge and alert most
// visibly, since their tone classes are the whole point of clicking one.
// Without this, the inspector says "Badge" for every one of them and there's
// no way to tell a Success badge from an Error badge short of counting
// pixels. Checked in order so the most specific class wins (a badge is never
// both --soft and --error, but check order still matters for readability).
const VARIANT_CLASSES: Partial<Record<ComponentName, Array<{ cls: string; label: string }>>> = {
  badge: [
    { cls: "pg-badge--success", label: "Success" },
    { cls: "pg-badge--warning", label: "Warning" },
    { cls: "pg-badge--error", label: "Error" },
    { cls: "pg-badge--outline", label: "Outline" },
    { cls: "pg-badge--soft", label: "Neutral (soft)" },
  ],
  alert: [
    { cls: "pg-alert--success", label: "Success" },
    { cls: "pg-alert--warning", label: "Warning" },
    { cls: "pg-alert--error", label: "Error" },
    { cls: "pg-alert--info", label: "Neutral (info)" },
  ],
  button: [
    { cls: "pg-btn--danger", label: "Danger" },
    { cls: "pg-btn--outline", label: "Outline" },
    { cls: "pg-btn--ghost", label: "Ghost" },
    { cls: "pg-btn--primary", label: "Primary" },
  ],
};

function describeVariant(name: ComponentName, element: HTMLElement): string | undefined {
  const rules = VARIANT_CLASSES[name];
  if (!rules) return undefined;
  return rules.find((r) => element.classList.contains(r.cls))?.label;
}

/**
 * The nearest selectable thing at or above `target`, or null if the click
 * landed on canvas background.
 *
 * Returns the element as well as the selection so the caller can mark it;
 * finding it twice with a second query would risk marking a *different*
 * instance than the one clicked.
 */
export function findComponentAt(target: EventTarget | null, root: HTMLElement): SelectionHit | null {
  if (!(target instanceof Element)) return null;

  for (const { selector, role } of TYPE_SELECTORS) {
    const match = target.closest<HTMLElement>(selector);
    if (match && root.contains(match)) return { selection: { kind: "type", role }, element: match };
  }

  for (const { selector, name } of SELECTORS) {
    const match = target.closest<HTMLElement>(selector);
    // The containment check matters: `closest()` is happy to walk out of the
    // canvas entirely and match Studio's own chrome if it ever grows a
    // colliding class name.
    if (match && root.contains(match)) {
      const variant = describeVariant(name, match);
      return { selection: { kind: "component", name, ...(variant ? { variant } : {}) }, element: match };
    }
  }
  return null;
}

export const TYPE_ROLE_LABELS: Record<TypeRole, string> = {
  display: "Display text",
  heading: "Heading",
  body: "Body text",
};

/** Human labels for the inspector header. Separate from
 *  DesignSystemGallery's COMPONENT_LABELS only because that file's copy is
 *  local to it; if a third consumer appears, hoist one of them. */
export const COMPONENT_LABELS: Record<ComponentName, string> = {
  button: "Primary button",
  buttonSecondary: "Secondary button",
  input: "Input",
  dropdown: "Dropdown",
  card: "Card",
  navigation: "Navigation",
  table: "Table",
  modal: "Modal",
  alert: "Alert",
  badge: "Badge",
};

// Which of the four non-default states actually has a real CSS rule behind it
// for this component (see components/system/styles.ts). Every component CAN
// carry any of the four in a saved/exported ComponentTokenSet — this only
// controls which state buttons the inspector offers, so it never presents a
// control with nothing on canvas to back it. Add a state here only once the
// CSS backing it exists.
export const APPLICABLE_STATES: Record<ComponentName, readonly NonDefaultState[]> = {
  button: ["hover", "active", "disabled", "focus"],
  buttonSecondary: ["hover", "active", "disabled", "focus"],
  input: ["focus", "disabled"],
  dropdown: ["focus", "disabled"],
  navigation: ["hover"],
  table: ["hover"],
  card: [],
  modal: [],
  alert: [],
  badge: [],
};

/**
 * Short, factual note shown under the inspector's "This component" header
 * when one editable slot intentionally drives more than one visual variant
 * on canvas — so a shared value is never mistaken for an independent one.
 * Absent entries mean the component maps one-to-one with what's on canvas.
 */
export const COMPONENT_SCOPE_NOTES: Partial<Record<ComponentName, string>> = {
  button: "Also affects outline and ghost buttons on canvas — Danger keeps its own semantic colour.",
  navigation: "Affects the nav bar, tabs, and breadcrumbs together.",
  alert: "Only affects the neutral alert — Success/Warning/Error keep their own status colour so it stays meaningful.",
  badge: "Only affects the neutral (soft) and outline badges — Success/Warning/Error keep their own status colour.",
};
