/**
 * Maps a clicked DOM node in the Studio canvas back to the design-system
 * component it is an instance of, so the inspector knows which token set to
 * open.
 *
 * Selection is resolved by CSS class rather than by a `data-*` attribute on
 * every component. That choice is worth explaining, because the attribute
 * approach is the more obvious one:
 *
 *   - The components in components/system are props-free by contract, and the
 *     AI-generated sections build their markup from the same `.pg-*` classes.
 *     Matching on class therefore covers *both* canvas content states with one
 *     mechanism and zero edits to the component files — the requirement that
 *     the default showcase and the generated UI share one editor is satisfied
 *     structurally rather than by remembering to tag each new element.
 *   - The cost is a coupling: renaming a class in
 *     components/system/styles.ts silently stops selection working for that
 *     component. If that ever bites, the fix is explicit `data-sb-component`
 *     attributes on the components — a mechanical change, not a redesign.
 *
 * `ComponentName` is the existing ten-value union from types/designSystem.ts —
 * the same set the AI authors, the exports write, and DesignSystemGallery
 * edits. Nothing here invents a component vocabulary of its own.
 */
import type { ComponentName } from "@/types/designSystem";

/**
 * Ordered most-specific-first, and `closest()` is called against each entry in
 * turn. Order is load-bearing twice over:
 *
 *   1. `.pg-btn--secondary` must be tested before `.pg-btn`, or a secondary
 *      button resolves to `button` and edits the wrong token set — the two
 *      look near-identical on screen, so the mistake would be invisible.
 *   2. Structural containers (`.pg-card`, `.pg-modal`, `.pg-navbar`) come last,
 *      because a button inside a card must select the button. `closest()`
 *      walks *up* the tree, so an early card entry would swallow every control
 *      nested inside one.
 */
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
  { selector: ".pg-body, .pg-caption, .pg-specimen__label", role: "body" },
];

/** The three faces the system actually has. Deliberately not one per heading
 *  level: `StudioState` carries a display face and a body face (plus an
 *  optional accent), and offering seven would promise distinctions no export
 *  could reproduce. */
export type TypeRole = "display" | "heading" | "body";

export type Selection =
  | { kind: "component"; name: ComponentName }
  | { kind: "type"; role: TypeRole };

export type SelectionHit = { selection: Selection; element: HTMLElement };

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
    if (match && root.contains(match)) return { selection: { kind: "component", name }, element: match };
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
