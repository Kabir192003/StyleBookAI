/**
 * Navigation — navbar, tabs, breadcrumbs.
 *
 * The tabs are the accessibility-load-bearing component in the whole
 * library, so they implement the WAI-ARIA tabs pattern properly rather than
 * approximately: a roving tabindex (exactly one tab is in the tab order, so
 * Tab moves *past* the tablist instead of through every tab), Arrow keys to
 * move selection, Home/End to jump, and `aria-controls`/`aria-labelledby`
 * tying each tab to its panel. Requirement: "the tabs must be keyboard-
 * operable" (docs/DESIGN_PLAYGROUND.md, P2).
 *
 * All ids come from `useId()` because the canvas can render this
 * component once per experiment — hard-coded ids would collide across cards
 * and `aria-controls` would resolve to the wrong panel in every card but the
 * first.
 */
"use client";

import { useId, useRef, useState } from "react";
import { Bell, ChevronRight, Layers, Menu, Search } from "lucide-react";

const NAV_ITEMS = ["Overview", "Library", "Studio", "Team"];

export function Navbar() {
  const [active, setActive] = useState("Library");
  return (
    <nav className="pg-navbar" aria-label="Primary">
      <span className="pg-navbar__brand">
        <span className="pg-navbar__mark" aria-hidden="true">
          <Layers size={14} />
        </span>
        Northwind
      </span>
      <div className="pg-navbar__links">
        {NAV_ITEMS.map((item) => (
          <button
            key={item}
            type="button"
            className="pg-navlink"
            // aria-current="page" is both the a11y signal and the CSS hook for
            // the active pill — one source of truth, so they cannot disagree.
            aria-current={active === item ? "page" : undefined}
            onClick={() => setActive(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="pg-row" style={{ gap: 4 }}>
        <button type="button" className="pg-btn pg-btn--ghost pg-btn--icon pg-btn--sm" aria-label="Search">
          <Search size={15} aria-hidden="true" />
        </button>
        <button type="button" className="pg-btn pg-btn--ghost pg-btn--icon pg-btn--sm" aria-label="Notifications">
          <Bell size={15} aria-hidden="true" />
        </button>
        <button type="button" className="pg-btn pg-btn--primary pg-btn--sm">
          Invite
        </button>
        <button type="button" className="pg-btn pg-btn--ghost pg-btn--icon pg-btn--sm" aria-label="Open menu">
          <Menu size={15} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

const TABS = [
  { label: "Palette", body: "Five roles — accent, support, surface, ink and muted — plus the derived dark variant." },
  { label: "Typography", body: "A display face, a body face, and a modular scale from 12px through to the hero size." },
  { label: "Components", body: "Every token above, resolved on the real controls you are looking at right now." },
  { label: "Export", body: "CSS custom properties, a Tailwind config, DTCG tokens, SwiftUI and Flutter." },
];

export function Tabs() {
  const id = useId();
  const [selected, setSelected] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const last = TABS.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = selected === last ? 0 : selected + 1;
    else if (e.key === "ArrowLeft") next = selected === 0 ? last : selected - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    setSelected(next);
    // Automatic activation (selection follows focus) is the correct choice
    // here: the panels are already rendered and cheap, so there is nothing
    // to defer, and it saves the extra Enter press.
    tabRefs.current[next]?.focus();
  }

  return (
    <div>
      <div className="pg-tablist" role="tablist" aria-label="Design system sections" onKeyDown={onKeyDown}>
        {TABS.map((tab, i) => (
          <button
            key={tab.label}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            className="pg-tab"
            aria-selected={selected === i}
            aria-controls={`${id}-panel-${i}`}
            // Roving tabindex: only the selected tab is reachable with Tab.
            tabIndex={selected === i ? 0 : -1}
            onClick={() => setSelected(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel-${selected}`}
        aria-labelledby={`${id}-tab-${selected}`}
        className="pg-tabpanel"
        // The panel itself is focusable so that Tab out of the tablist lands
        // on the content it just revealed, per the ARIA authoring practice.
        tabIndex={0}
      >
        {TABS[selected].body}
      </div>
    </div>
  );
}

export function Breadcrumbs() {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="pg-crumbs" style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {["Workspace", "Northwind", "Design system"].map((crumb) => (
          <li key={crumb} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <a className="pg-crumb" href="#">
              {crumb}
            </a>
            <span className="pg-crumbs__sep" aria-hidden="true">
              <ChevronRight size={13} />
            </span>
          </li>
        ))}
        <li>
          {/* The current page is not a link. aria-current="page" is what tells
              assistive tech where you are; the styling follows from it. */}
          <span className="pg-crumb" aria-current="page">
            Components
          </span>
        </li>
      </ol>
    </nav>
  );
}
