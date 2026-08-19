// Every form control here is a native element with appearance:none rather
// than a div wearing a role — fiddlier to style (the checkbox tick has to be
// a ::before, since an <input> can't have children) but label association,
// space-bar toggle, focus ring, :checked and form value all come free. The
// two exceptions: the toggle is a real <button role="switch"> because a
// checkbox can't express on/off wording to a screen reader, and the tooltip
// is CSS-only (:hover, :focus-within) so it's keyboard-reachable without a
// JS onMouseEnter implementation.
"use client";

import { cloneElement, useCallback, useEffect, useId, useRef, useState, type ReactElement } from "react";
import { ChevronDown, HelpCircle, Minus, Plus } from "lucide-react";

export function CheckboxSet() {
  const id = useId();
  const [checked, setChecked] = useState({ weekly: true, product: false, research: false });
  const allRef = useRef<HTMLInputElement | null>(null);
  const values = Object.values(checked);
  const all = values.every(Boolean);
  const some = values.some(Boolean) && !all;

  // `indeterminate` has no HTML attribute or React prop, only a DOM
  // property, so it must be set imperatively.
  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = some;
  }, [some]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label className="pg-choice" htmlFor={`${id}-all`}>
        <input
          ref={allRef}
          id={`${id}-all`}
          type="checkbox"
          className="pg-checkbox"
          checked={all}
          onChange={(e) => {
            const v = e.target.checked;
            setChecked({ weekly: v, product: v, research: v });
          }}
        />
        <span className="pg-choice__text">
          <span style={{ fontWeight: 600 }}>All email from Northwind</span>
          <span className="pg-choice__desc">Toggle every list at once.</span>
        </span>
      </label>
      {(
        [
          ["weekly", "Weekly digest", "A summary of what changed in your systems."],
          ["product", "Product updates", "New generators, exports and integrations."],
          ["research", "Research invitations", "Occasional 30-minute sessions. Paid."],
        ] as const
      ).map(([key, title, desc]) => (
        <label key={key} className="pg-choice" htmlFor={`${id}-${key}`}>
          <input
            id={`${id}-${key}`}
            type="checkbox"
            className="pg-checkbox"
            checked={checked[key]}
            onChange={(e) => setChecked((c) => ({ ...c, [key]: e.target.checked }))}
          />
          <span className="pg-choice__text">
            <span>{title}</span>
            <span className="pg-choice__desc">{desc}</span>
          </span>
        </label>
      ))}
      <label className="pg-choice pg-choice--disabled" htmlFor={`${id}-legal`}>
        <input id={`${id}-legal`} type="checkbox" className="pg-checkbox" checked readOnly disabled />
        <span className="pg-choice__text">
          <span>Security and billing notices</span>
          <span className="pg-choice__desc">Required — cannot be turned off.</span>
        </span>
      </label>
    </div>
  );
}

export function RadioSet() {
  const id = useId();
  const [plan, setPlan] = useState("team");
  return (
    // role="radiogroup" + aria-labelledby is a <fieldset>/<legend> without
    // the legend's layout quirks inside a flex container.
    <div role="radiogroup" aria-labelledby={`${id}-legend`} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <span id={`${id}-legend`} className="pg-label">
        Billing cadence
      </span>
      {(
        [
          ["monthly", "Monthly", "£18 per seat, cancel any time."],
          ["team", "Annual", "£15 per seat, billed once a year."],
          ["invoice", "Invoice", "Net-30, minimum 20 seats."],
        ] as const
      ).map(([value, title, desc]) => (
        <label key={value} className="pg-choice" htmlFor={`${id}-${value}`}>
          <input
            id={`${id}-${value}`}
            type="radio"
            className="pg-radio"
            name={`${id}-plan`}
            value={value}
            checked={plan === value}
            onChange={() => setPlan(value)}
          />
          <span className="pg-choice__text">
            <span>{title}</span>
            <span className="pg-choice__desc">{desc}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

export function Switch({ label, desc, defaultOn = false, disabled = false }: { label: string; desc: string; defaultOn?: boolean; disabled?: boolean }) {
  const id = useId();
  const [on, setOn] = useState(defaultOn);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button
        type="button"
        role="switch"
        className="pg-switch"
        aria-checked={on}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-desc`}
        disabled={disabled}
        onClick={() => setOn((v) => !v)}
      />
      <span className="pg-choice__text">
        <span id={`${id}-label`}>{label}</span>
        <span id={`${id}-desc`} className="pg-choice__desc">
          {desc}
        </span>
      </span>
    </div>
  );
}

export function SelectField() {
  const id = useId();
  const [value, setValue] = useState("perfect-fourth");
  return (
    <div className="pg-field" style={{ maxWidth: 300 }}>
      <label className="pg-label" htmlFor={`${id}-scale`}>
        Type scale ratio
      </label>
      <div className="pg-select-wrap">
        {/* Real <select> — a custom listbox never gets the native popup right on touch. */}
        <select id={`${id}-scale`} className="pg-select" value={value} onChange={(e) => setValue(e.target.value)}>
          <option value="minor-third">Minor third — 1.200</option>
          <option value="major-third">Major third — 1.250</option>
          <option value="perfect-fourth">Perfect fourth — 1.333</option>
          <option value="golden">Golden ratio — 1.618</option>
        </select>
        <span className="pg-select-wrap__chevron">
          <ChevronDown size={15} aria-hidden="true" />
        </span>
      </div>
      <p className="pg-hint">Drives every `--text-*` step in the export.</p>
    </div>
  );
}

export function ProgressDemo() {
  const id = useId();
  const [value, setValue] = useState(45);
  const step = (delta: number) => setValue((v) => Math.min(100, Math.max(0, v + delta)));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 340 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span className="pg-label" id={`${id}-label`}>
          Migrating components
        </span>
        <span className="pg-hint">{value}%</span>
      </div>
      {/* The bar is a styled div; without role="progressbar" + aria-value* it's invisible to assistive tech. */}
      <div
        className={value === 100 ? "pg-progress pg-progress--success" : "pg-progress"}
        role="progressbar"
        aria-labelledby={`${id}-label`}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="pg-progress__bar" style={{ width: `${value}%` }} />
      </div>
      <div className="pg-row" style={{ gap: 6 }}>
        <button type="button" className="pg-btn pg-btn--outline pg-btn--icon pg-btn--sm" aria-label="Decrease progress" onClick={() => step(-15)}>
          <Minus size={13} aria-hidden="true" />
        </button>
        <button type="button" className="pg-btn pg-btn--outline pg-btn--icon pg-btn--sm" aria-label="Increase progress" onClick={() => step(15)}>
          <Plus size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// Show/hide is pure CSS (:hover, :focus-within in styles.ts); this wrapper
// just generates a unique id and hangs aria-describedby off the trigger,
// which CSS can't do. Has to be per-instance or duplicate ids would point
// every trigger at the first card's bubble.
export function Tooltip({ tip, children }: { tip: string; children: ReactElement }) {
  const id = useId();
  return (
    <span className="pg-tooltip">
      {cloneElement(children, { "aria-describedby": id })}
      <span className="pg-tooltip__bubble" role="tooltip" id={id}>
        {tip}
      </span>
    </span>
  );
}

// Rendered absolute inside .pg-stage, not fixed and not a portal, so it stays
// inside its own token scope — a portalled modal would leave [data-sb-canvas]
// and lose every token it's demonstrating.
//
// `inline` drops the dashed specimen stage so the trigger sits in a real page
// next to other buttons. The backdrop is position:absolute, so inline mode
// relies on an ancestor for a containing block — the Studio canvas sets
// position:relative for exactly this, which also keeps the overlay inside
// the mockup instead of covering the app's own chrome.
export function ModalDemo({ inline = false }: { inline?: boolean }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();

  // Escape and the close buttons share one exit path so focus restore always
  // runs — skipping it on Escape would leave a keyboard user's focus on a
  // node that no longer exists.
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const body = (
    <>
      <button ref={triggerRef} type="button" className="pg-btn pg-btn--danger" onClick={() => setOpen(true)}>
        Delete design system
      </button>
      {open && (
        <div className="pg-modal-backdrop" onClick={close}>
          <div
            ref={dialogRef}
            className="pg-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            // Stops the backdrop's onClick from firing when the click originates inside the dialog.
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="pg-modal__title" id={titleId}>
              Delete “Northwind v3”?
            </h3>
            <p className="pg-modal__text">
              This removes the system from all 3 workspaces that reference it. Exports already downloaded are not
              affected.
            </p>
            <div className="pg-modal__actions">
              <button type="button" className="pg-btn pg-btn--ghost" onClick={close}>
                Keep it
              </button>
              <button type="button" className="pg-btn pg-btn--danger" onClick={close}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (inline) return body;

  return (
    <div
      className="pg-stage"
      style={{
        minHeight: 210,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px dashed var(--pgc-border)",
      }}
    >
      {body}
    </div>
  );
}
